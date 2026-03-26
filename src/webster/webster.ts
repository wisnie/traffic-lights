// Webster method is used for calculating optimal pre-time cycle
// lengths. The Webster formula splits out optimal cycle length and
// time for each specific phase (at single intersection).

// A complete formula is described in A Survey on Traffic Signal Control Methods
// paper (page 9), here's the overview of the used parameters:

// N - number of phases,
// tL - total loss time per phase,
// h - saturation headway time (seconds/vehicle) - smallest time interval between
//  distinct parts passing a point,
// PHF - peak hour factor, basically represents traffic fluctuations during peak hour,
// v/c - volume-to-capacity ratio, a safety measure that adds buffer, which accounts
//  for real drivers.

export const WEBSTER_PARAMS = {
    N: 4,
    tLInSeconds: 4,
    hInSeconds: 2,
    PHF: 0.92,

    // 0.85–0.95 (from FHWA chapter 3.3)
    // Intersection is operating near its capacity. Higher delays may be expected,
    // but continuously increasing queues should not occur.
    vToC: 0.90
} as const;

// Function takes critical volume for each phase and
// returns optimal phase time in seconds.
type CriticalVolumes = number[];
export function calculateWebsterEquation(criticalVolumes: CriticalVolumes, params = WEBSTER_PARAMS): number[] {
    const criticalVolume =
        criticalVolumes.reduce((a, b) => a + b);

    const totalLoss = params.N * params.tLInSeconds;
    const desiredCycleNumerator = totalLoss;
    const desiredCycleDenominator = (1 - (criticalVolume /
        ((3600 / params.hInSeconds) * params.PHF * params.vToC)));

    const desiredCycleLength =
        Math.ceil(desiredCycleNumerator / desiredCycleDenominator);

    return criticalVolumes
        .map(vol => (vol / criticalVolume) * (desiredCycleLength - totalLoss));
}
