import * as z from "zod";
import { Command } from "./Command";

export const Preset = z.object({
	commands: z.array(Command),
});

export type Preset = z.infer<typeof Preset>;
