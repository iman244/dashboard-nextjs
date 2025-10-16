import React from "react";
import Client from "./client";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Console",
    description: "Console",
}

const Page = () => {
    return <Client />;
};

export default Page;
