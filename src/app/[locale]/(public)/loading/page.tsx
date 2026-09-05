import Loading from '../../../loading'
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";

export default Loading;export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, "loading");
}

