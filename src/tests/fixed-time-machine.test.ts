import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';

import {createFixedTimeMachine} from "../webster/fixed-time-plan";
import {createActor, SimulatedClock} from "xstate";
import {PHASES, TRANSITIONAL_PHASES} from "../webster/phase";

const TEST_TICK = 10;

describe('Traffic fixed-time module', () => {
    it('should cycle over all light phases', () => {
        const clock = new SimulatedClock();
        const delays = [TEST_TICK, TEST_TICK, TEST_TICK, TEST_TICK];
        const fixedTimeMachine =
            createFixedTimeMachine(delays, {dYellow: TEST_TICK, dRed: TEST_TICK});

        const actor = createActor(fixedTimeMachine, { clock });
        actor.start();

        // Starts with default EAST_WEST value
        assert.equal(actor.getSnapshot().value, PHASES.EAST_WEST);

        clock.increment(TEST_TICK);
        assert.equal(actor.getSnapshot().value, TRANSITIONAL_PHASES.EAST_WEST_YELLOW);

        clock.increment(TEST_TICK);
        assert.equal(actor.getSnapshot().value, TRANSITIONAL_PHASES.EAST_WEST_RED);

        clock.increment(TEST_TICK);
        assert.equal(actor.getSnapshot().value, PHASES.LEFT_TURNS_EAST_WEST);

        clock.increment(TEST_TICK);
        assert.equal(actor.getSnapshot().value, TRANSITIONAL_PHASES.LEFT_TURNS_EAST_WEST_YELLOW);

        clock.increment(TEST_TICK);
        assert.equal(actor.getSnapshot().value, TRANSITIONAL_PHASES.LEFT_TURNS_EAST_WEST_RED);

        clock.increment(TEST_TICK);
        assert.equal(actor.getSnapshot().value, PHASES.SOUTH_NORTH);

        clock.increment(TEST_TICK);
        assert.equal(actor.getSnapshot().value, TRANSITIONAL_PHASES.SOUTH_NORTH_YELLOW);

        clock.increment(TEST_TICK);
        assert.equal(actor.getSnapshot().value, TRANSITIONAL_PHASES.SOUTH_NORTH_RED);

        clock.increment(TEST_TICK);
        assert.equal(actor.getSnapshot().value, PHASES.LEFT_TURNS_SOUTH_NORTH);

        clock.increment(TEST_TICK);
        assert.equal(actor.getSnapshot().value, TRANSITIONAL_PHASES.LEFT_TURNS_SOUTH_NORTH_YELLOW);

        clock.increment(TEST_TICK);
        assert.equal(actor.getSnapshot().value, TRANSITIONAL_PHASES.LEFT_TURNS_SOUTH_NORTH_RED);

        // At the end, comes back to EAST_WEST, thus completing the cycle
        clock.increment(TEST_TICK);
        assert.equal(actor.getSnapshot().value, PHASES.EAST_WEST);
    });
});