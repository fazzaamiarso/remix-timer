import { db } from "~/utils/prisma.server";
import { createCookieSessionStorage, redirect } from "@remix-run/node";
import { compare } from "bcryptjs";

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) throw Error("Please set a session secret");

const WEEK_IN_SECONDS = 60 * 60 * 7;

const { commitSession, destroySession, getSession } = createCookieSessionStorage({
  cookie: {
    name: "auth_session",
    secrets: [sessionSecret],
    sameSite: "lax",
    secure: true,
    httpOnly: true,
    maxAge: WEEK_IN_SECONDS
  }
});

export const getUserSession = async (request: Request) => {
  return await getSession(request.headers.get("Cookie"));
};

type SessionData = { userId: string; isAnonymous: boolean };
export const createUserSession = async ({ userId, isAnonymous }: SessionData, request: Request) => {
  const session = (await getUserSession(request)) ?? (await getSession());
  session.set("userId", userId);
  session.set("isAnonymous", isAnonymous);
  return { headers: { "Set-Cookie": await commitSession(session) } } as ResponseInit;
};

export const destroyUserSession = async (request: Request) => {
  const session = await getUserSession(request);
  return redirect("/app", { headers: { "Set-Cookie": await destroySession(session) } });
};

export const getUserId = async (request: Request) => {
  const session = await getUserSession(request);
  const userId = session.get("userId");
  const isAnonymous = JSON.parse(session.get("isAnonymous") ?? "false");
  if (typeof userId !== "string" || !userId || typeof isAnonymous !== "boolean") return null;

  return { userId, isAnonymous };
};

type LoginData = {
  username: string;
  password: string;
};

export const login = async ({ username, password }: LoginData) => {
  const user = await db.user.findUnique({ where: { username } });
  if (!user) return null;

  const isPasswordMatched = await compare(password, user.passwordHash);
  if (!isPasswordMatched) return null;

  return { id: user.id, username };
};

export const deleteUser = async (userId: string) => {
  return db.user.delete({ where: { id: userId } });
};

export const createAnonymousUser = async (userId: string) => {
  const anonymousUser = await db.user.create({
    data: {
      id: userId,
      username: `anon-${userId}`,
      passwordHash: "anonymous"
    }
  });

  return { id: anonymousUser.id };
};

export function generateRandomString() {
  const ALPHABET = "abcdefghijklmnopqrstuvwxyz";
  const NUMBERS = "0123456789";
  let randomString = "";
  for (let i = 0; i < 8; i++) {
    if (Math.random() > 0.45) randomString += ALPHABET[Math.floor(Math.random() * 25)];
    else randomString += NUMBERS[Math.floor(Math.random() * 9)];
  }
  return randomString;
}
