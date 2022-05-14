import { CogIcon } from "@heroicons/react/outline";
import Dialog from "@reach/dialog";
import type { MetaFunction } from "@remix-run/node";
import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration } from "@remix-run/react";
import styles from "./styles/app.css";
import dialogStyles from "@reach/dialog/styles.css";
import { createContext, FormEvent, ReactNode, useContext, useState } from "react";

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

type UserPreferences = {
  studyTime: number;
  breakTime: number;
};

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const closeDialog = () => setIsOpen(false);
  const openDialog = () => setIsOpen(true);
  const { updatePreferences, preferences } = usePreferences();

  const submitHandler = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const studyTime = Number(formData.get("study_time"));
    const breakTime = Number(formData.get("break_time"));
    updatePreferences({ studyTime, breakTime });
    closeDialog();
  };

  return (
    <header className='mx-auto flex max-w-lg  justify-between pt-8 pb-12 '>
      <h1 className='text-lg font-bold text-white'>POMER</h1>
      <div className='flex items-center gap-4'>
        <button className='rounded-md bg-[#3C7AAE] px-3 py-1 text-white' type='button'>
          Login
        </button>
        <button className='p-1 text-white' type='button' onClick={openDialog}>
          <CogIcon aria-hidden='true' className='h-6' />
        </button>
      </div>
      {isOpen ? (
        <Dialog isOpen={isOpen} onDismiss={closeDialog} className='space-y-8 rounded-md'>
          <h2 className='text-xl font-bold'>Settings</h2>
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
                />
              </li>
            </ul>
            <div className='flex items-center gap-2 self-end pt-8'>
              <button onClick={closeDialog} className='px-3 py-1'>
                cancel
              </button>
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

const getPreferences = (): UserPreferences => {
  const item = typeof window !== "undefined" && localStorage.getItem("preferences");
  return item ? (JSON.parse(item) as UserPreferences) : { studyTime: 20, breakTime: 10 };
};

const preferencesCtx = createContext<{
  preferences: UserPreferences;
  updatePreferences: (val: UserPreferences) => void;
} | null>(null);
const PreferencesProvider = ({ children }: { children: ReactNode }) => {
  const [preferences, setPreferences] = useState<UserPreferences>({
    studyTime: getPreferences().studyTime,
    breakTime: getPreferences().breakTime
  });

  const updatePreferences = (updatedPreferences: UserPreferences) => {
    typeof window !== "undefined" && localStorage.setItem("preferences", JSON.stringify(updatedPreferences));
    setPreferences(updatedPreferences);
  };

  return (
    <preferencesCtx.Provider
      value={{
        preferences,
        updatePreferences
      }}
    >
      {children}
    </preferencesCtx.Provider>
  );
};
export const usePreferences = () => {
  const ctx = useContext(preferencesCtx);
  if (!ctx) throw Error("Context should be used inside a provider");
  return ctx;
};
