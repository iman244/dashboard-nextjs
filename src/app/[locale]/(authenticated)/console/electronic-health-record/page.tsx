import { Metadata } from 'next'
import Client from './client'
import React from 'react'
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, "electronicHealthRecord");
}

const Page = () => {
  return (
    <Client />
  )
}

export default Page