import {getTranslations} from 'next-intl/server';
import Client from "./client";
 
export async function generateMetadata({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Metadata"});

  return {
    title: t("title"),
  };
}

export default function LandingPage(props: PageProps<"/[locale]">) {
  return (
    <Client />
  );
}
