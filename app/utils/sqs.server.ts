import {
    SQSClient,
    SendMessageCommand,
    SendMessageCommandInput,
} from "@aws-sdk/client-sqs";
import { Resource } from "sst";

export type BaseEvent<Type, Data> = {
    type: Type;
    data: Data;
};

const ChoiceEventType = ["choice_created"] as const;
export type ChoiceEvent = BaseEvent<
    (typeof ChoiceEventType)[number],
    {
        userId: string;
        move: "low" | "high";
        time: number;
        price: number;
    }
>;

type Event = ChoiceEvent;

type ExtractEvent<E extends Event> = Extract<E, { type: E["type"] }>;

const client = new SQSClient();

export const publish = async (
    payload: ExtractEvent<Event>,
    opts?: Omit<Partial<SendMessageCommandInput>, "MessageBody">,
) => {
    try {
        const res = await client.send(
            new SendMessageCommand({
                MessageBody: JSON.stringify(payload),
                QueueUrl: Resource.Queue.url,
                DelaySeconds: 60,
                ...opts,
            }),
        );

        if (res.$metadata.httpStatusCode !== 200) {
            throw new Error("Failed to send message");
        }
    } catch (e) {
        console.error(e);
        throw e;
    }
};
