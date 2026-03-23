import * as z from "zod";
import { Direction } from "./Direction";

export const Command = z.discriminatedUnion("type", [
	z.object({
		type: z.literal("addVehicle"),
		vehicleId: z.string(),
		startRoad: Direction,
		endRoad: Direction,
	}),

	z.object({ type: z.literal("step") }),
]);

export type Command = z.infer<typeof Command>;
