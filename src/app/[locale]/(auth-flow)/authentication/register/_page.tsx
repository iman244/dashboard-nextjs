import { Metadata } from "next";
import Client from "./client";

export const metadata: Metadata = {
  title: "Register",
  description: "Register",
}

export default function Page() {
  return <Client />;
}
