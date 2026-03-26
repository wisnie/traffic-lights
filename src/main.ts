import fs from "node:fs/promises";
import {Preset} from "../schemas/Preset";
import {simulateDiscreteTraffic} from "./simulation";
import {SimulationOutput} from "../types/simulation";


async function main() {
    const programArgs = process.argv.slice(2);
    const presetFile = programArgs[0];
    const outputFile = programArgs[1];

    if (programArgs.length != 2) {
        console.error('usage: tsx src/main.ts input-file output-file');
    }


    try {
        const presetData = await fs.readFile(presetFile, "utf8");
        const json = JSON.parse(presetData);
        const preset: Preset = Preset.parse(json);

        const output: SimulationOutput = simulateDiscreteTraffic(preset);

        await fs.writeFile(outputFile, JSON.stringify(output), 'utf8');

    } catch (error) {
        console.error('An error occurred: ', String(error));
    }
}

main();