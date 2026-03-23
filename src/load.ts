import fs from "node:fs";
import { Preset } from "../schemas/Preset";

fs.readFile(
	"/Users/wisnie/WebstormProjects/traffic-lights/presets/sample.json",
	"utf8",
	(err, data) => {
		if (err) {
			console.error(err);
			return;
		}

		const json = JSON.parse(data);
		const preset: Preset = Preset.parse(json);

		console.log(preset);
	},
);
