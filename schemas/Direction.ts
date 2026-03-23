import * as z from "zod";

export const Direction = z.literal(["north", "south", "east", "west"]);

export type Direction = z.infer<typeof Direction>;
