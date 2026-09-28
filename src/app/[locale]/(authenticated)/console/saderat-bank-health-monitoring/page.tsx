import { redirect } from "@/i18n/navigation";

/** The Excel reports list now lives at /console/monitorings. */
export default async function Page(
  props: PageProps<"/[locale]/console/saderat-bank-health-monitoring">
) {
  const { locale } = await props.params;
  redirect({ href: "/console/monitorings", locale });
}
