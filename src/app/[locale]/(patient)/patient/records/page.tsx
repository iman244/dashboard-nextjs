import { Metadata } from "next";
import React from "react";
import Client from "./client";

export const metadata: Metadata = {
  title: "My health records",
  description: "Your own electronic health records",
};

const Page = () => {
  return <Client />;
};

export default Page;
