import * as z from "zod";
import { MapDirection } from "./MapDirection";

export const Command = z.discriminatedUnion("type", [
	z.object({
		type: z.literal("addVehicle"),
		vehicleId: z.string(),
		startRoad: MapDirection,
		endRoad: MapDirection,
	}),

	z.object({ type: z.literal("step") }),
]);

export type Command = z.infer<typeof Command>;
export type AddVehicleCommand = Extract<Command, { type: "addVehicle" }>;
