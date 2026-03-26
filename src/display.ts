import { styleText } from 'node:util';
import {AddVehicleCommand} from "../schemas/Command";
import {Phase, PHASE_TO_MOVEMENTS, TransitionalPhase} from "./webster/phase";

const logTimestamp = (...args: any[]) => {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    console.log(`[${timestamp}]`, ...args);
};

export type Car = Pick<AddVehicleCommand, 'vehicleId' | 'startRoad' | 'endRoad'>

const CAR_ARRIVING = "🚙";
const CAR_DEPARTING = "🚗💨";

export function logCarArrival(car: Car) {
    logTimestamp(`${CAR_ARRIVING} A ${car.vehicleId} car has arrived at ${car.startRoad} with destination at ${car.endRoad}.`)
}

export function logCarDeparture(car: Car) {
    logTimestamp(`${CAR_DEPARTING} The car ${car.vehicleId} has just left the intersection.`)
}

type Light = 'green' | 'yellow' | 'red';

const TRAFFIC_SIGNALS: Record<Light, string> = {
    green: `${styleText("bgGreen","[*]")}[ ][ ]`,
    yellow: `[ ]${styleText("bgYellow","[*]")}[ ]`,
    red: `[ ][ ]${styleText("bgRed","[*]")}`
}

export function logLightPhase(phase: Phase | TransitionalPhase) {
    const logMessage =
        (light: Light, phase: Phase | TransitionalPhase) => {
            const openRoutesMessage = light === 'green'
                ? 'with open routes:' : 'with all routes closed!';

            const signal = TRAFFIC_SIGNALS[light];
            logTimestamp(`${signal} a phase changed to ${phase} ${openRoutesMessage}`)
            if (light === 'green') {
                const movements = PHASE_TO_MOVEMENTS[phase as Phase] ?? [];
                const routesMessage = movements.map((movement) =>
                    movement.replace('.', ' -> ')).join(', ');

                console.log(`- Routes: ${routesMessage}`);
            }
        };

    switch (phase) {
        case "EAST_WEST":
        case "LEFT_TURNS_EAST_WEST":
        case "SOUTH_NORTH":
        case "LEFT_TURNS_SOUTH_NORTH":
            logMessage('green', phase);
            break;

        case "EAST_WEST_YELLOW":
        case "LEFT_TURNS_EAST_WEST_YELLOW":
        case "SOUTH_NORTH_YELLOW":
        case "LEFT_TURNS_SOUTH_NORTH_YELLOW":
            logMessage('yellow', phase);
            break;

        case "LEFT_TURNS_SOUTH_NORTH_RED":
        case "EAST_WEST_RED":
        case "LEFT_TURNS_EAST_WEST_RED":
        case "SOUTH_NORTH_RED":
            logMessage('red', phase);
            break;

    }
}