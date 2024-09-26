const info = (message: string, args?: object) => {
    if (process.env.NODE_ENV !== "test") {
        console.log({ ...args, message });
    }
};

const error = (message: string, args?: object | Error) => {
    if (process.env.NODE_ENV !== "test") {
        console.error({ ...args, message });
    }
};
export const logger = { info, error };

export type Result<T> = { value: T } | { error: unknown };

export const throwIfError = <T>(result: Result<T>): T => {
    if ("error" in result) {
        throw result.error;
    }
    return result.value;
};
