import * as v from "valibot";
import { Result } from "./misc.server";

const dataSchema = v.object({
    bpi: v.object({
        USD: v.object({
            code: v.picklist(["USD"] as const),
            rate: v.string(),
            description: v.string(),
            rate_float: v.number(),
        }),
        BTC: v.object({
            code: v.picklist(["BTC"] as const),
            rate: v.string(),
            description: v.string(),
            rate_float: v.number(),
        }),
    }),
});

export const currentPrice = async (
    coin: "BTC",
): Promise<Result<v.InferInput<typeof dataSchema>>> => {
    try {
        const response = await fetch(
            `https://api.coindesk.com/v1/bpi/currentprice/${coin}.json`,
        );

        if (!response.ok) {
            return {
                error: response,
            };
        }

        const json = await response.json();
        const value = v.safeParse(dataSchema, json);

        if (value.issues) {
            return { error: value.issues };
        }

        return {
            value: value.output,
        };
    } catch (e) {
        return { error: e };
    }
};
