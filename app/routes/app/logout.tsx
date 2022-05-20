import { ActionFunction, redirect } from "@remix-run/node";
import { destroyUserSession, getUserId } from "~/utils/session.server";

export const action: ActionFunction = async ({ request }) => {
  const user = await getUserId(request);
  if (!user) return redirect(request.url);

  return await destroyUserSession(request);
};
