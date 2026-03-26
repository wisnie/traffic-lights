import * as z from "zod";

export const MapDirection = z.literal(["north", "south", "east", "west"]);

export type MapDirection = z.infer<typeof MapDirection>;
