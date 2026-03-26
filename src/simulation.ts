import {poissonDistributionDistance, uniformDistance} from "./timing";
import {SimulationOutput, StepStatus} from "../types/simulation";
import {Preset} from "../schemas/Preset";
import {decomposeMovement, MOVEMENTS, Phase, PHASE_TO_MOVEMENTS, stringifyMovement} from "./webster/phase";
import {createFixedTimeMachine, FixedTimeMachineConfig, prepareCriticalVolumes} from "./webster/fixed-time-plan";
import {createActor, SimulatedClock} from "xstate";
import {setInterval} from "node:timers";
import {CAR_IN_QUEUE_DELAY_IN_MS, MIN_GREEN_TIME_IN_SECONDS} from "./traffic-constants";
import {calculateWebsterEquation, WEBSTER_PARAMS} from "./webster/webster";
import {logCarArrival, logCarDeparture, logLightPhase} from "./display";

export type SimulationType = 'real time' | 'fast forward';
type CarId = string;

const normaliseDelay = (seconds: number) => {
    return Math.max(MIN_GREEN_TIME_IN_SECONDS, seconds) * 1000;
}

const id = (x: number) => x;
const FAST_FORWARD_FACTOR = 5;
const fastForwardDelay = (delay: number) =>
    delay / FAST_FORWARD_FACTOR;

const delaySeconds = (seconds: number) =>
    new Promise(resolve => setTimeout(resolve, seconds * 1000));

// The "type": "step" is a little bit enigmatic to me, because my
// system simulates real time, continuous action. Examples provided to
// `step` indicate discrete operation. Therefore, to fulfil the API contract,
// and to be consistent with Stream-like operation of this simulation,
// when system receives `step` command, it is going to display the vehicles
// that left *so far* during the last light phase.
export async function simulateTraffic(preset: Preset, type: SimulationType, log = true): Promise<SimulationOutput> {
    const ff =
        type === 'fast forward' ? fastForwardDelay : id;

    const simulationSteps: StepStatus[] = [];
    const lanesQueue: Record<string, CarId[]> = {}
    for (let movement of MOVEMENTS) {
        lanesQueue[movement] = [];
    }

    const criticalVolumes = prepareCriticalVolumes(preset);
    // xState machine uses milliseconds, Webster formula returns in seconds.
    const optimalCycleLengths = calculateWebsterEquation(criticalVolumes)
        .map(normaliseDelay)
        .map(ff);

    const machineConfig: FixedTimeMachineConfig = {
        dYellow: ff(WEBSTER_PARAMS.tLInSeconds * (3/4) * 1000),
        dRed: ff(WEBSTER_PARAMS.tLInSeconds * (1/4) * 1000)
    };
    const fixedTimePlanMachine = createFixedTimeMachine(optimalCycleLengths, machineConfig);
    const trafficLightActor = createActor(fixedTimePlanMachine);

    let phaseIntervalId: NodeJS.Timeout | null = null;
    let phaseCars: CarId[] = [];
    trafficLightActor.subscribe((state) => {
        if (log) { logLightPhase(trafficLightActor.getSnapshot().value) }
        if (phaseIntervalId) {
            clearInterval(phaseIntervalId);
        }

        phaseCars = [];
        const activePhase = state.value;

        const moveCars = () => {
            const openTrafficMovements = PHASE_TO_MOVEMENTS[activePhase as Phase] ?? [];
            for (const trafficMovement of openTrafficMovements) {
                const carWaiting = lanesQueue[trafficMovement].length > 0;
                if (carWaiting) {
                    const carId = lanesQueue[trafficMovement].shift() as CarId;
                    phaseCars.push(carId)
                    if (log) {
                        const [movementFrom, movementTo] = decomposeMovement(trafficMovement);
                        logCarDeparture({vehicleId: carId, startRoad: movementFrom, endRoad: movementTo})
                    }
                }
            }
        };

        moveCars();
        phaseIntervalId = setInterval(moveCars, ff(CAR_IN_QUEUE_DELAY_IN_MS))
    });

    trafficLightActor.start();

    for (const command of preset.commands) {
        await delaySeconds(ff(poissonDistributionDistance()));
        if (command.type === 'addVehicle') {

            const laneKey = stringifyMovement([command.startRoad, command.endRoad]);
            lanesQueue[laneKey].push(command.vehicleId);
            if (log) { logCarArrival(command) }
        } else if (command.type == 'step') {
            simulationSteps.push({ leftVehicles: phaseCars });
            // might as well clear phaseCars, so not to see the same vehicle
            // twice in the result.
            phaseCars = [];
        }
    }

    trafficLightActor.stop();
    if (phaseIntervalId) {
        clearInterval(phaseIntervalId);
    }

    return {stepStatuses: simulationSteps};
}

const TICK = 1;
// Although my simulation was not built for discrete systems, there
// is an option to make it into one using SimulatedClock.
// For simplicity delay will be set to seconds time result of
// Webster algorithm.
export function simulateDiscreteTraffic(preset: Preset): SimulationOutput {
    const clock = new SimulatedClock();

    const simulationSteps: StepStatus[] = [];
    const lanesQueue: Record<string, CarId[]> = {}
    for (let movement of MOVEMENTS) {
        lanesQueue[movement] = [];
    }

    const criticalVolumes = prepareCriticalVolumes(preset);
    // for discrete simulation, integer steps are adopted
    const optimalCycleLengths =
        calculateWebsterEquation(criticalVolumes).map((l) => Math.ceil(l));

    const [dEastWest, dLeftTurnsEastWest, dSouthWest, dLeftTurnSouthWest]
        = optimalCycleLengths;

    const machineConfig: FixedTimeMachineConfig = {
        dYellow: TICK,
        dRed: TICK
    };
    const fixedTimePlanMachine = createFixedTimeMachine(optimalCycleLengths, machineConfig);
    const trafficLightActor = createActor(fixedTimePlanMachine, { clock });

    trafficLightActor.start();

    for (const command of preset.commands) {
        clock.increment(TICK);

        if (command.type === 'addVehicle') {
            const laneKey = stringifyMovement([command.startRoad, command.endRoad]);
            lanesQueue[laneKey].push(command.vehicleId);
        } else if (command.type == 'step') {
            const activePhase = trafficLightActor.getSnapshot().value;
            const openTrafficMovements = PHASE_TO_MOVEMENTS[activePhase as Phase] ?? [];

            const phaseCars: CarId[] = [];
            for (const trafficMovement of openTrafficMovements) {
                const carWaiting = lanesQueue[trafficMovement].length > 0;
                if (carWaiting) {
                    const carId = lanesQueue[trafficMovement].shift() as CarId;
                    phaseCars.push(carId)
                }
            }

            if (phaseCars.length > 0) {
                simulationSteps.push({ leftVehicles: phaseCars });
            } else {
                simulationSteps.push({ leftVehicles: [] });
                // Sort of intelligently skip to next-phase
                while (trafficLightActor.getSnapshot().value == activePhase) {
                    clock.increment(TICK);
                }
            }
        }
    }

    trafficLightActor.stop();

    return { stepStatuses: simulationSteps };
}