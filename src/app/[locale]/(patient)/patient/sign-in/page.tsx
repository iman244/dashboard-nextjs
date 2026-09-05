import { Metadata } from "next";
import React from "react";
import { Client } from "./client";

export const metadata: Metadata = {
  title: "Patient sign in",
  description: "Sign in with your national ID to see your health records",
};

const Page = () => {
  return <Client />;
};

export default Page;
