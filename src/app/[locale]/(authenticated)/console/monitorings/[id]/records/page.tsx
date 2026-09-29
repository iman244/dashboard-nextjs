import { redirect } from "@/i18n/navigation";

/** The records list now lives on the campaign page's records tab. */
export default async function Page(props: PageProps<"/[locale]/console/monitorings/[id]/records">) {
  const { locale, id } = await props.params;
  redirect({ href: `/console/monitorings/${id}?tab=records`, locale });
}
