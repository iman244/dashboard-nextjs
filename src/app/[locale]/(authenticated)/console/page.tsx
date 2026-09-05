import React from "react";
import Client from "./client";
import { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, "console");
}

const Page = (props: PageProps<"/[locale]/console">) => {
    return <Client />;
};

export default Page;
