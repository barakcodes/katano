import {
    ActionFunctionArgs,
    json,
    LoaderFunctionArgs,
    type MetaFunction,
} from "@remix-run/node";
import { Form, useLoaderData, useRevalidator } from "@remix-run/react";
import { useEffect } from "react";
import { Button } from "~/componets/ui/button";
import { Field, Fieldset, Label } from "~/componets/ui/fieldset";
import { Select } from "~/componets/ui/select";
import { Spinner } from "~/componets/ui/spinner";
import { H2, Strong, Text } from "~/componets/ui/Text";
import { currentPrice } from "~/utils/api.server";
import { useIsPending } from "~/utils/misc";
import * as v from "valibot";
import {
    getUserDetails,
    insertUserDetails,
    setCurrentMove,
} from "~/utils/dynamo.server";
import { throwIfError } from "~/utils/misc.server";
import { publish } from "~/utils/sqs.server";
import { getSession, commitSession } from "~/utils/session.server";
import { randomUUID } from "node:crypto";

type SessionValues = {
    user_id: string;
    score: number;
    current_move: "low" | "high" | null;
};

export const meta: MetaFunction = () => {
    return [{ title: "Guess my Bitcoin" }];
};

const formSchema = v.object({
    guess: v.picklist(["low", "high"] as const),
    price: v.pipe(v.string(), v.decimal()),
});

export async function loader({ request }: LoaderFunctionArgs) {
    const session = await getSession(request.headers.get("Cookie"));

    if (!session.has("userId")) {
        const tempUser: SessionValues = {
            user_id: randomUUID(),
            score: 0,
            current_move: null,
        };
        session.set("userId", tempUser.user_id);
        session.set("score", 0);
        session.set("current_move", null);
    }

    const userId = session.get("userId") as string;

    const priceDetails = throwIfError(await currentPrice("BTC"));
    let userDetails = throwIfError(await getUserDetails(userId));
    if (!userDetails) {
        userDetails = throwIfError(
            await insertUserDetails({
                user_id: userId,
                score: 0,
                current_move: null,
            }),
        );
    }
    return json(
        {
            priceDetails: priceDetails,
            userDetails: userDetails,
        },
        {
            headers: {
                "Set-Cookie": await commitSession(session),
            },
        },
    );
}

export async function action({ request }: ActionFunctionArgs) {
    const session = await getSession(request.headers.get("Cookie"));
    const body = await request.formData();

    const parsedBody = v.safeParse(
        formSchema,
        Object.fromEntries(body.entries()),
    );
    if (parsedBody.issues) {
        return json({
            error: parsedBody.issues,
        });
    }
    const userId = session.get("userId");
    if (!userId) {
        throw new Error("User not found");
    }
    throwIfError(await setCurrentMove(userId, parsedBody.output.guess));
    await publish({
        type: "choice_created",
        data: {
            userId,
            move: parsedBody.output.guess,
            time: Date.now(),
            price: Number(parsedBody.output.price),
        },
    });

    return json(
        {
            guess: parsedBody.output.guess,
        },
        {
            headers: {
                "Set-Cookie": await commitSession(session),
            },
        },
    );
}

export default function Index() {
    const data = useLoaderData<typeof loader>();
    const isPending = useIsPending();
    const revalidator = useRevalidator();

    useEffect(() => {
        const intervalId = setInterval(() => {
            if (revalidator.state === "idle") {
                revalidator.revalidate();
            }
        }, 30_000);

        return () => clearInterval(intervalId);
    }, [revalidator]);

    return (
        <div className="mx-auto w-full max-w-sm sm:px-6 lg:px-8 space-y-4">
            <H2>
                <span className="text-zinc-400 dark:text-zinc-600">
                    Score:{" "}
                </span>
                {data.userDetails?.score ?? 0}
            </H2>
            <div>
                <Text>The price of BTC is currently</Text>
                <Strong>
                    {data.priceDetails?.bpi.USD.rate_float ?? "UNKOWN"}
                </Strong>
            </div>
            <div className="max-w-sm w-2/3 ">
                {data.userDetails.current_move === null ||
                data.userDetails.status !== "evaluating" ? (
                    <Form className="mt-4" method="POST">
                        <input
                            type="hidden"
                            name="price"
                            value={data.priceDetails?.bpi.USD.rate_float}
                        />
                        <Fieldset aria-label="Make a guess">
                            <Field>
                                <Label>Where do we go from here?</Label>
                                <Select name="guess">
                                    <option value={"low"}>Lower</option>
                                    <option value={"high"}>Higher</option>
                                </Select>
                            </Field>
                        </Fieldset>
                        <Button
                            type="submit"
                            className="mt-4"
                            disabled={isPending}
                            color="amber"
                        >
                            Take a guess
                            {isPending ? <Spinner /> : null}
                        </Button>
                    </Form>
                ) : (
                    <div>
                        <div className="mt-4 inline-flex gap-x-4 items-center">
                            <Text>Analyzing your move...</Text>
                            <Spinner className="text-zinc-400 dark:text-zinc-600" />
                        </div>
                        <Text>
                            While we wait, get yourself some coffee{" "}
                            <span
                                aria-label="coffee"
                                aria-hidden="true"
                                role="img"
                            >
                                ☕
                            </span>
                        </Text>
                    </div>
                )}
            </div>
        </div>
    );
}
