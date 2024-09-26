import { createCookieSessionStorage } from "@remix-run/node";
import { Resource } from "sst";

type SessionData = {
    userId: string;
    score: number;
    current_move: "low" | "high" | null;
};

type SessionFlashData = {
    error: string;
};

const { getSession, commitSession, destroySession } =
    createCookieSessionStorage<SessionData, SessionFlashData>({
        cookie: {
            name: "__session",
            httpOnly: true,
            maxAge: 30 * 24 * 60 * 60 * 1000,
            path: "/",
            sameSite: "lax",
            secrets: [Resource.SessionSecret.value],
            secure: process.env.NODE_ENV === "production",
        },
    });

export { getSession, commitSession, destroySession };
