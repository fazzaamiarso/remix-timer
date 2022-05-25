import { XIcon } from "@heroicons/react/outline";
import Dialog from "@reach/dialog";
import type { ActionFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useNavigate } from "@remix-run/react";
import { createUserSession, deleteUser, getUserId, register } from "~/utils/session.server";

type LoginError = { message: string };
export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const username = formData.get("username");
  const password = formData.get("password");

  if (typeof username !== "string") return json({ message: "username is not string!" });
  if (typeof password !== "string") return json({ message: "password is not string!" });

  const user = await register({ username, password });
  if (!user) return json({ message: "User already exist!" });

  const anonymousUser = await getUserId(request);
  if (!anonymousUser) throw Error("Anonymous user should be set!");
  await deleteUser(anonymousUser.userId);
  const headers = await createUserSession({ userId: user.id, isAnonymous: false }, request);
  return redirect("/app", headers);
};

export default function Login() {
  const actionData = useActionData<LoginError>();
  const navigate = useNavigate();
  const closeDialog = () => navigate("/app");

  return (
    <Dialog
      aria-labelledby='dialog-title'
      isOpen={true}
      onDismiss={closeDialog}
      className='!w-10/12 space-y-8 rounded-md sm:max-w-lg'
    >
      <div className='flex w-full items-center'>
        <div className='flex flex-col'>
          <h2 className='text-2xl font-bold' id='dialog-title'>
            Register
          </h2>
          <h3 className='space-x-2'>
            Already have an account?{" "}
            <Link to='/app/login' prefetch='intent' className=' text-blue-500 underline hover:no-underline'>
              login
            </Link>
          </h3>
        </div>
        <button className='ml-auto p-1' type='button' onClick={closeDialog} aria-label='close settings'>
          <XIcon aria-hidden='true' className='h-6' />
        </button>
      </div>
      <Form className='flex flex-col gap-6' method='post'>
        {actionData?.message ? (
          <div className='rounded-md bg-red-100 px-4 py-3 text-red-500  '>{actionData.message}</div>
        ) : null}
        <div className='flex flex-col '>
          <label htmlFor='username' className='font-semibold'>
            username
          </label>
          <input type='text' name='username' id='username' required className='w-full rounded-md' />
        </div>
        <div className='flex flex-col'>
          <label htmlFor='password ' className='font-semibold'>
            password
          </label>
          <input type='password' name='password' id='password' required className='w-full rounded-md' />
        </div>
        <button type='submit' className='mt-4 rounded-md bg-[#3C7AAE] px-3 py-2 text-white'>
          Register
        </button>
      </Form>
    </Dialog>
  );
}
