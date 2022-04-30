import type { MetaFunction } from "@remix-run/node";
import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration } from "@remix-run/react";
import styles from "./styles/app.css";

export function links() {
  return [{ rel: "stylesheet", href: styles }];
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
        <header className='mx-auto flex max-w-lg  justify-between pt-8 pb-12 '>
          <h1 className='text-lg font-bold text-white'>POMER</h1>
          <button className='rounded-md bg-[#3C7AAE] px-3 py-1 text-white' type='button'>
            Login
          </button>
        </header>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
