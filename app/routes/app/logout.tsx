import { ActionFunction } from "@remix-run/node";
import { destroyUserSession, getUserId } from "~/utils/session.server";

export const action: ActionFunction = async ({ request }) => {
  const user = await getUserId(request);
  if (!user) return null;

  return await destroyUserSession(request);
};
