import { LoaderFunction, redirect } from "@remix-run/node";

export const loader: LoaderFunction = async () => {
  return redirect("/app");
};

export default function Index() {
  return null;
}
