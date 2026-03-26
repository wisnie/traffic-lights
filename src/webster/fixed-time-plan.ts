import assert from "node:assert";
import { setup } from 'xstate';

import {Preset} from "../../schemas/Preset";
import {AddVehicleCommand} from "../../schemas/Command";
import {Phase, PHASE_TO_MOVEMENTS, PHASES, stringifyMovement, TrafficMovement, TRANSITIONAL_PHASES} from "./phase";
import {CARS_PASSING_INTERSECTION_PER_HOUR} from "../timing";

// `prepareCriticalVolumes` function is heuristic for simulating
// traffic control on fixed plan (in Webster method). The following
// implementation is not meant for optimisation, but rather
// written in quick, functional fashion.
export function prepareCriticalVolumes(preset: Preset): number[] {
    const trafficCounts =
        preset.commands
            .filter((comm): comm is AddVehicleCommand => comm.type == 'addVehicle')
            .map(({startRoad, endRoad}) =>
                [startRoad, endRoad] as TrafficMovement)
            .reduce<Record<string, number>>((acc, movement) => {
                const key = stringifyMovement(movement);
                acc[key] = (acc[key] || 0) + 1;

                return acc;
            }, {});

    // Webster formula works for traffic passing in hour window, but because
    // Preset data could be anything, we scale by constant factor defined as how
    // many cars should generally pass in one hour.
    const carsTotal =
        Object.values(trafficCounts).reduce((a, b) => a + b, 0);

    assert.notStrictEqual(carsTotal, 0);
    const scaleBy = CARS_PASSING_INTERSECTION_PER_HOUR / carsTotal;
    // Volumes can obviously be non-integer, like 34.5 vehicle/hour
    const trafficVolumes = Object.fromEntries(Object.entries(trafficCounts)
        .map(([movement, count]) => [movement, count * scaleBy]));

    // Since the `prepareCriticalVolumes` functions is just a heuristic,
    // the handling of small data sets (small enough not to contain traffic patterns
    // or empty phases), this could split 0 seconds cycles (if no cars were detected).
    // This could be mitigated by checking cycle length by some constant MIN_GREEN_TIME.
    const phasesCriticalVolumes = Object.fromEntries(
        Object.entries(PHASE_TO_MOVEMENTS).map(([phase, movements]) => [phase,
            Math.max(...movements.map((movement) => trafficVolumes[movement] ?? 0))])) as Record<Phase, number>;


    // To define explicit order
    const phasesInOrder: Phase[] = ['EAST_WEST', 'LEFT_TURNS_EAST_WEST', 'SOUTH_NORTH', 'LEFT_TURNS_SOUTH_NORTH'];
    return phasesInOrder.map(phase => phasesCriticalVolumes[phase]);
}

export type Delays = number[];
export type FixedTimeMachineConfig = { dYellow: number, dRed: number};

export function createFixedTimeMachine(delays: Delays, config: FixedTimeMachineConfig) {
    const [dEastWest, dLeftTurnsEastWest, dSouthWest, dLeftTurnSouthWest]
        = delays;

    const { dRed, dYellow } = config;

    // Probably the simplest, most tedious, but at the same time reliable
    // approach to state management on fixed-time plan - using 12 separate states.
    return setup({
        delays: {
            dEastWest,
            dLeftTurnsEastWest,
            dSouthWest,
            dLeftTurnSouthWest,
            dYellow,
            dRed
        }
    }).createMachine({
        id: 'fixed-time-plan-machine',
        initial: PHASES.EAST_WEST,
        states: {
            // EAST_WEST
            [PHASES.EAST_WEST]: {
                after: {
                    dEastWest: { target: TRANSITIONAL_PHASES.EAST_WEST_YELLOW }
                }
            },

            [TRANSITIONAL_PHASES.EAST_WEST_YELLOW]: {
                after: {
                    dYellow: { target: TRANSITIONAL_PHASES.EAST_WEST_RED }
                }
            },

            [TRANSITIONAL_PHASES.EAST_WEST_RED]: {
                after: {
                    dRed: { target: PHASES.LEFT_TURNS_EAST_WEST }
                }
            },

            // EAST_WEST_LEFT_TURNS
            [PHASES.LEFT_TURNS_EAST_WEST]: {
                after: {
                    dLeftTurnsEastWest: { target: TRANSITIONAL_PHASES.LEFT_TURNS_EAST_WEST_YELLOW }
                }
            },

            [TRANSITIONAL_PHASES.LEFT_TURNS_EAST_WEST_YELLOW]: {
                after: {
                    dYellow: { target: TRANSITIONAL_PHASES.LEFT_TURNS_EAST_WEST_RED }
                }
            },

            [TRANSITIONAL_PHASES.LEFT_TURNS_EAST_WEST_RED]: {
                after: {
                    dRed: { target: PHASES.SOUTH_NORTH }
                }
            },

            // SOUTH_NORTH
            [PHASES.SOUTH_NORTH]: {
                after: {
                    dSouthWest: { target: TRANSITIONAL_PHASES.SOUTH_NORTH_YELLOW}
                }
            },

            [TRANSITIONAL_PHASES.SOUTH_NORTH_YELLOW]: {
                after: {
                    dYellow: { target: TRANSITIONAL_PHASES.SOUTH_NORTH_RED }
                }
            },

            [TRANSITIONAL_PHASES.SOUTH_NORTH_RED]: {
                after: {
                    dRed: { target: PHASES.LEFT_TURNS_SOUTH_NORTH }
                }
            },

            // LEFT_TURNS_SOUTH_NORTH
            [PHASES.LEFT_TURNS_SOUTH_NORTH]: {
                after: {
                    dLeftTurnSouthWest: { target: TRANSITIONAL_PHASES.LEFT_TURNS_SOUTH_NORTH_YELLOW}
                }
            },

            [TRANSITIONAL_PHASES.LEFT_TURNS_SOUTH_NORTH_YELLOW]: {
                after: {
                    dYellow: { target: TRANSITIONAL_PHASES.LEFT_TURNS_SOUTH_NORTH_RED }
                }
            },

            [TRANSITIONAL_PHASES.LEFT_TURNS_SOUTH_NORTH_RED]: {
                after: {
                    dRed: { target: PHASES.EAST_WEST }
                }
            },
        }
    });
}
