import { CogIcon, XIcon } from "@heroicons/react/outline";
import { DialogContent, DialogOverlay } from "@reach/dialog";
import type { LoaderFunction, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useNavigate
} from "@remix-run/react";
import styles from "./styles/app.css";
import dialogStyles from "@reach/dialog/styles.css";
import type { FormEvent } from "react";
import { useState } from "react";
import { PreferencesProvider, usePreferences } from "./utils/preferences-provider";
import {
  createAnonymousUser,
  createUserSession,
  findUser,
  generateRandomString,
  getUserId
} from "./utils/session.server";
import { AnimatePresence, motion } from "framer-motion";

export function links() {
  return [
    { rel: "stylesheet", href: styles },
    { rel: "stylesheet", href: dialogStyles }
  ];
}
export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "POMER | Remix Timer",
  viewport: "width=device-width,initial-scale=1"
});

export const loader: LoaderFunction = async ({ request }) => {
  const userData = await getUserId(request);
  if (!userData) {
    const randomString = generateRandomString();
    await createAnonymousUser(randomString);
    const headers = await createUserSession({ userId: randomString, isAnonymous: true }, request);
    return redirect(request.url, headers);
  }
  const username = (await findUser(userData.userId))?.username;
  return json({ username, isAnonymous: userData.isAnonymous });
};

export default function App() {
  const { isAnonymous, username } = useLoaderData<{ username: string; isAnonymous: boolean }>();
  return (
    <html lang='en'>
      <head>
        <Meta />
        <Links />
      </head>
      <body className='bg-primary font-rubik'>
        <PreferencesProvider>
          <Header isAnonymous={isAnonymous} username={username} />
          <Outlet />
        </PreferencesProvider>
        <ScrollRestoration />
        <Scripts />
        <LiveReload port={8002} />
      </body>
    </html>
  );
}

const dropIn = {
  hidden: {
    y: "-100vh",
    opacity: 0
  },
  visible: {
    y: "0",
    opacity: 1,
    transition: {
      duration: 0.1,
      type: "spring",
      damping: 25,
      stiffness: 500
    }
  },
  exit: {
    y: "100vh",
    opacity: 0,
    transition: {
      duration: 0.1
    }
  }
};
const overlay = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.1
    }
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.1
    }
  }
};
const Header = ({ isAnonymous, username }: { isAnonymous: boolean; username: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const closeDialog = () => setIsOpen(false);
  const openDialog = () => setIsOpen(true);
  const { updatePreferences, preferences } = usePreferences();
  const navigate = useNavigate();

  const openLogin = () => navigate("app/login");

  const submitHandler = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const studyTime = Number(formData.get("study_time"));
    const breakTime = Number(formData.get("break_time"));
    updatePreferences({ studyTime, breakTime });
    closeDialog();
  };

  return (
    <header className='mx-auto flex w-10/12 justify-between  pt-8 pb-12 sm:max-w-lg '>
      <h1 className='text-lg font-bold text-white'>POMER</h1>
      <div className='flex items-center gap-4'>
        {isAnonymous ? null : <div className='text-white '>Hello, {username}!</div>}
        {isAnonymous ? (
          <button className='rounded-md bg-[#3C7AAE] px-3 py-1 text-white' type='button' onClick={openLogin}>
            Login
          </button>
        ) : (
          <Form action='/app/logout' method='post'>
            <button className='rounded-md bg-[#3C7AAE] px-3 py-1 text-white' type='submit'>
              Logout
            </button>
          </Form>
        )}
        <button className='p-1 text-white' type='button' onClick={openDialog} aria-label='open settings'>
          <CogIcon aria-hidden='true' className='h-6' />
        </button>
      </div>
      <AnimatePresence initial={false} exitBeforeEnter>
        {isOpen ? (
          <DialogOverlay
            as={motion.div}
            variants={overlay}
            initial='hidden'
            animate='visible'
            exit='exit'
            aria-labelledby='dialog-title'
            isOpen={isOpen}
            onDismiss={closeDialog}
          >
            <DialogContent
              as={motion.div}
              initial='hidden'
              animate='visible'
              exit='exit'
              variants={dropIn}
              className='!w-10/12 space-y-8 rounded-md sm:max-w-lg'
            >
              <div className='flex w-full items-center'>
                <h2 className='text-2xl font-bold' id='dialog-title'>
                  Settings
                </h2>
                <button className='ml-auto p-1' type='button' onClick={closeDialog} aria-label='close settings'>
                  <XIcon aria-hidden='true' className='h-6' />
                </button>
              </div>
              <form onSubmit={submitHandler} className='flex flex-col'>
                <ul className='flex flex-col gap-4'>
                  <li className='flex w-full items-center justify-between'>
                    <label htmlFor='study-time' className='font-semibold'>
                      Study Time (in minutes)
                    </label>
                    <input
                      id='study-time'
                      type='number'
                      name='study_time'
                      defaultValue={preferences.studyTime}
                      className='w-24'
                      min={1}
                    />
                  </li>
                  <li className='flex w-full items-center justify-between'>
                    <label htmlFor='break-time' className='font-semibold'>
                      Break Time (in minutes)
                    </label>
                    <input
                      id='break-time'
                      type='number'
                      name='break_time'
                      defaultValue={preferences.breakTime}
                      className='w-24'
                      min={1}
                    />
                  </li>
                </ul>
                <div className='flex items-center gap-2 self-end pt-8'>
                  <button type='submit' className='bg-[#3C7AAE] px-3 py-1 text-white'>
                    save
                  </button>
                </div>
              </form>
            </DialogContent>
          </DialogOverlay>
        ) : null}
      </AnimatePresence>
    </header>
  );
};
