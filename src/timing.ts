// API does not determine exact timing of the approaching
// cars, therefore here are two approaches used in simulation

// 1. Uniform timing -- each car arrives at some constant interval
//  - not a realistic approach, however easy to implement and test

// 2. Timing due to Poisson distribution - an approach based on statistics
//  - given that we know the number of cars passing during some time unit,
//  we can calculate lambda parameter. In fact, Exponential distribution
//  is going to be used, since it represents a distance between events.

export const CARS_PASSING_INTERSECTION_PER_HOUR = 1100;
export const HOUR_TO_SECONDS = 3600;

export function uniformDistance() {
    return HOUR_TO_SECONDS / CARS_PASSING_INTERSECTION_PER_HOUR;
}

const LAMBDA = CARS_PASSING_INTERSECTION_PER_HOUR / HOUR_TO_SECONDS;

// Exponential distribution CDF: 1 - e^(-lambda * t)
// first we draw CDF value [0..1], then we rearrange equation to calculate t
export function poissonDistributionDistance() {
    const x = Math.random();
    return -Math.log(1 - x) / LAMBDA;
}