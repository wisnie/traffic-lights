import fs from "node:fs/promises";
import {Preset} from "../schemas/Preset";
import {simulateTraffic, SimulationType} from "./simulation";


async function interactive() {
    const programArgs = process.argv.slice(2);
    const simulationTypeArgument = programArgs[0];
    const presetFile = programArgs[1];

    if (programArgs.length != 2) {
        console.error('usage: tsx src/interactive.ts f|r output-file');
    }

    const simulationType: SimulationType =
        simulationTypeArgument === 'f' ? 'fast forward' : 'real time';

    try {
        const presetData = await fs.readFile(presetFile, "utf8");
        const json = JSON.parse(presetData);
        const preset: Preset = Preset.parse(json);

        await simulateTraffic(preset, simulationType);

        console.log("\nSimulation ended successfully!")
    } catch (error) {
        console.error('An error occurred: ', String(error));
    }
}

interactive();