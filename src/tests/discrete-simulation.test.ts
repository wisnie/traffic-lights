import { test } from 'node:test';
import {simulateDiscreteTraffic} from "../simulation";

import manyCarsDataset from '../../presets/many-cars.json' with { type: 'json' };
import longQueues from '../../presets/long-queues.json' with { type: 'json' };
import randomMovement from '../../presets/random.json' with { type: 'json' };

import {SimulationOutput} from "../../types/simulation";
import {Preset} from "../../schemas/Preset";

// Snapshot testing guarantees that the output does not change
// between versions of the program.

test('Snapshot tests a many cars preset.', async (t) => {
    const simulationOutput: SimulationOutput =
        simulateDiscreteTraffic(manyCarsDataset as Preset);

    t.assert.snapshot(simulationOutput);
});

test('Snapshot tests long queues.', async (t) => {
    const simulationOutput: SimulationOutput =
        simulateDiscreteTraffic(longQueues as Preset);

    t.assert.snapshot(simulationOutput);
});


test('Snapshot tests random movement of cars.', async (t) => {
    const simulationOutput: SimulationOutput =
        simulateDiscreteTraffic(randomMovement as Preset);

    t.assert.snapshot(simulationOutput);
});