import {MapDirection} from "../../schemas/MapDirection";

export type TrafficMovement = [MapDirection, MapDirection];

export function stringifyMovement([directionFrom, directionTo]: TrafficMovement): string {
    return `${directionFrom}.${directionTo}`;
}

export function decomposeMovement(movement: string): [MapDirection, MapDirection] {
    return movement.split('.') as [MapDirection, MapDirection];
}

// Predefined constants for sample simulation, adapted from
// A Survey on Traffic Signal Control Methods (page 4, figure 3b).
export const PHASES = {
    EAST_WEST: 'EAST_WEST',
    LEFT_TURNS_EAST_WEST: 'LEFT_TURNS_EAST_WEST',
    SOUTH_NORTH: 'SOUTH_NORTH',
    LEFT_TURNS_SOUTH_NORTH: 'LEFT_TURNS_SOUTH_NORTH'
} as const;

export const TRANSITIONAL_PHASES = {
    // EAST_WEST
    EAST_WEST_YELLOW: 'EAST_WEST_YELLOW',
    EAST_WEST_RED: 'EAST_WEST_RED',

    // LEFT_TURNS_EAST_WEST
    LEFT_TURNS_EAST_WEST_YELLOW: 'LEFT_TURNS_EAST_WEST_YELLOW',
    LEFT_TURNS_EAST_WEST_RED: 'LEFT_TURNS_EAST_WEST_RED',

    // SOUTH_NORTH
    SOUTH_NORTH_YELLOW: 'SOUTH_NORTH_YELLOW',
    SOUTH_NORTH_RED: 'SOUTH_NORTH_RED',

    // LEFT_TURNS_SOUTH_NORTH
    LEFT_TURNS_SOUTH_NORTH_YELLOW: 'LEFT_TURNS_SOUTH_NORTH_YELLOW',
    LEFT_TURNS_SOUTH_NORTH_RED: 'LEFT_TURNS_SOUTH_NORTH_RED'
} as const;

export type Phase = typeof PHASES[keyof typeof PHASES];
export type TransitionalPhase = typeof TRANSITIONAL_PHASES[keyof typeof TRANSITIONAL_PHASES];

// Some authors allow RIGHT turns to pass regardless of the current
// phase, however for the simulation they are going to be assigned
// to some specific phase.
const MOVEMENT_TO_PHASE: Record<string, Phase> = {
    // Movements during EAST_WEST phase
    [stringifyMovement(['east', "west"])]: PHASES.EAST_WEST,
    [stringifyMovement(['west', "east"])]: PHASES.EAST_WEST,
    [stringifyMovement(['east', "north"])]: PHASES.EAST_WEST,
    [stringifyMovement(['west', "south"])]: PHASES.EAST_WEST,

    // Movements during LEFT_TURNS_EAST_WEST phase
    [stringifyMovement(['east', "south"])]: PHASES.LEFT_TURNS_EAST_WEST,
    [stringifyMovement(['west', "north"])]: PHASES.LEFT_TURNS_EAST_WEST,

    // Movements during SOUTH_NORTH phase
    [stringifyMovement(['south', "north"])]: PHASES.SOUTH_NORTH,
    [stringifyMovement(['north', "south"])]: PHASES.SOUTH_NORTH,
    [stringifyMovement(['north', "west"])]: PHASES.SOUTH_NORTH,
    [stringifyMovement(['south', "east"])]: PHASES.SOUTH_NORTH,

    // Movements during LEFT_TURNS_SOUTH_NORTH phase
    [stringifyMovement(['south', "west"])]: PHASES.LEFT_TURNS_SOUTH_NORTH,
    [stringifyMovement(['north', "east"])]: PHASES.LEFT_TURNS_SOUTH_NORTH,
};

export const MOVEMENTS = Object.keys(MOVEMENT_TO_PHASE);

export const PHASE_TO_MOVEMENTS = (() => {
    const phaseToMovements: Record<Phase, string[]> =
        {EAST_WEST: [], LEFT_TURNS_EAST_WEST: [],
        SOUTH_NORTH: [], LEFT_TURNS_SOUTH_NORTH: []};

    for (const [key, value] of Object.entries(MOVEMENT_TO_PHASE)) {
        phaseToMovements[value].push(key);
    }

    return phaseToMovements;
})();

