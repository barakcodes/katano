import { currentPrice } from "~/utils/api.server";
import { getUserDetails, setResult } from "~/utils/dynamo.server";
import { throwIfError } from "~/utils/misc.server";
import { ChoiceEvent, publish } from "~/utils/sqs.server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const handler = async (event: { Records: any[] }) => {
    const [record] = event.Records;
    const body = JSON.parse(record.body) as ChoiceEvent;
    const diff = Date.now() - body.data.time;
    const minute = 50 * 1000;
    if (diff >= minute) {
        const priceDetails = throwIfError(await currentPrice("BTC"));
        const priceDiff = priceDetails.bpi.USD.rate_float - body.data.price;
        if (priceDiff === 0) {
            await publish({
                type: "choice_created",
                data: {
                    userId: body.data.userId,
                    move: body.data.move,
                    time: Date.now(),
                    price: body.data.price,
                },
            });
        }

        const outcome = priceDiff > 0 ? "high" : "low";
        const isCorrect = body.data.move === outcome;
        const userDetails = throwIfError(
            await getUserDetails(body.data.userId),
        );
        if (!userDetails) {
            throw new Error("User not found");
        }
        const newScore = isCorrect
            ? userDetails.score + 1
            : userDetails.score - 1;
        throwIfError(
            await setResult(body.data.userId, {
                current_move_outcome: outcome,
                score: Math.max(0, newScore),
            }),
        );

        return;
    }
    await publish(body);
};
