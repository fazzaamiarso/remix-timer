import { CogIcon, XIcon } from "@heroicons/react/outline";
import Dialog from "@reach/dialog";
import { MetaFunction } from "@remix-run/node";
import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration, useNavigate } from "@remix-run/react";
import styles from "./styles/app.css";
import dialogStyles from "@reach/dialog/styles.css";
import { FormEvent, useState } from "react";
import { PreferencesProvider, usePreferences } from "./utils/preferences-provider";

export function links() {
  return [
    { rel: "stylesheet", href: styles },
    { rel: "stylesheet", href: dialogStyles }
  ];
}
export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "Remix Timer",
  viewport: "width=device-width,initial-scale=1"
});

export default function App() {
  return (
    <html lang='en'>
      <head>
        <Meta />
        <Links />
      </head>
      <body className='bg-primary font-rubik'>
        <PreferencesProvider>
          <Header />
          <Outlet />
        </PreferencesProvider>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}

const Header = () => {
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
        <button className='rounded-md bg-[#3C7AAE] px-3 py-1 text-white' type='button' onClick={openLogin}>
          Login
        </button>
        <button className='p-1 text-white' type='button' onClick={openDialog} aria-label='open settings'>
          <CogIcon aria-hidden='true' className='h-6' />
        </button>
      </div>
      {isOpen ? (
        <Dialog
          aria-labelledby='dialog-title'
          isOpen={isOpen}
          onDismiss={closeDialog}
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
        </Dialog>
      ) : null}
    </header>
  );
};
