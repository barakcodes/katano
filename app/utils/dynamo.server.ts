import { Resource } from "sst";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
    DynamoDBDocumentClient,
    QueryCommand,
    UpdateCommand,
    PutCommand,
} from "@aws-sdk/lib-dynamodb";
import { logger, Result } from "./misc.server";
const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export type UserDetails = {
    user_id: string;
    score: number;
    current_move: "low" | "high" | null;
    current_move_outcome: null | "low" | "high";
    last_move_at?: number;
    status?: "evaluating" | "evaluated" | "waiting";
};

export const getUserDetails = async (
    userId: string,
): Promise<Result<UserDetails | null>> => {
    try {
        const command = new QueryCommand({
            TableName: Resource.MyTable.name,
            KeyConditionExpression: "pk = :user_id",
            ExpressionAttributeValues: {
                ":user_id": userId,
            },
        });

        const response = await client.send(command);
        const item = response.Items?.[0];
        if (!item) {
            return {
                value: null,
            };
        }

        return {
            value: {
                user_id: item.pk,
                score: item.score,
                current_move: item.current_move,
                current_move_outcome: item.current_move_outcome,
                last_move_at: item.last_move_at,
                status: item.status,
            } as UserDetails,
        };
    } catch (error) {
        logger.error("getUserDetails:failed", {
            error,
        });

        return {
            value: null,
        };
    }
};

export const insertUserDetails = async (
    data: Partial<UserDetails>,
): Promise<Result<UserDetails>> => {
    try {
        const command = new PutCommand({
            TableName: Resource.MyTable.name,
            Item: {
                pk: data.user_id,
                score: data.score,
                current_move: data.current_move,
            },
        });
        await client.send(command);

        return {
            value: {
                user_id: data.user_id,
                score: data.score || 0,
                current_move: null,
                current_move_outcome: null,
            } as UserDetails,
        };
    } catch (error) {
        logger.error("insertUserDetails:failed", {
            error,
        });

        return {
            error,
        };
    }
};

export const setCurrentMove = async (
    userId: string,
    move: "low" | "high",
): Promise<Result<UserDetails>> => {
    try {
        const command = new UpdateCommand({
            TableName: Resource.MyTable.name,
            Key: {
                pk: userId,
            },
            UpdateExpression:
                "SET #current_move = :current_move , #last_move_at = :last_move_at, #status = :waiting",
            ExpressionAttributeNames: {
                "#current_move": "current_move",
                "#last_move_at": "last_move_at",
                "#status": "status",
            },
            ExpressionAttributeValues: {
                ":current_move": move,
                ":last_move_at": Date.now(),
                ":waiting": "evaluating",
            },
            ConditionExpression: "#status <> :waiting",
            ReturnValues: "ALL_NEW",
        });
        const result = await client.send(command);
        const item = result.Attributes;
        if (!item) {
            return {
                error: new Error(
                    "User not found or  has not been evaluated yet",
                ),
            };
        }

        return {
            value: {
                user_id: userId,
                score: item.score,
                current_move: item.current_move,
                current_move_outcome: item.current_move_outcome,
                last_move_at: item.last_move_at,
                status: item.status,
            } as UserDetails,
        };
    } catch (error) {
        logger.error("setCurrentMove:failed", {
            error,
        });

        return {
            error,
        };
    }
};

export const setResult = async (
    userId: string,
    data: Pick<UserDetails, "current_move_outcome" | "score">,
): Promise<Result<UserDetails>> => {
    try {
        const command = new UpdateCommand({
            TableName: Resource.MyTable.name,
            Key: {
                pk: userId,
            },
            UpdateExpression:
                "SET #current_move_outcome = :current_move_outcome, #score = :score, #status = :done, #current_move = :current_move",
            ExpressionAttributeNames: {
                "#current_move": "current_move",
                "#current_move_outcome": "current_move_outcome",
                "#score": "score",
                "#status": "status",
            },
            ExpressionAttributeValues: {
                ":current_move": null,
                ":current_move_outcome": data.current_move_outcome,
                ":score": data.score,
                ":done": "evaluated",
            },
            ReturnValues: "ALL_NEW",
        });
        await client.send(command);

        return {
            value: {
                user_id: userId,
                score: data.score,
                current_move: null,
                current_move_outcome: data.current_move_outcome,
            } as UserDetails,
        };
    } catch (error) {
        logger.error("setResult:failed", {
            error,
        });
        return {
            error,
        };
    }
};
