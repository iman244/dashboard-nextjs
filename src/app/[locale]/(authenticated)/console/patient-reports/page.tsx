import { redirect } from "@/i18n/navigation";
import { fullNationalId, isNationalId } from "@/lib/national-id";

/**
 * The patient-reports page is retired: its EHR tables and charts moved to
 * the patient page's EHR tabs. Bookmarks and old links still carry a
 * `nationalNumber`, so they land on the same patient there instead of a
 * dead end.
 */
export default async function Page(
  props: PageProps<"/[locale]/console/patient-reports">
) {
  const { locale } = await props.params;
  const raw = (await props.searchParams).nationalNumber;
  const id = fullNationalId(Array.isArray(raw) ? raw[0] : raw);
  redirect({
    href: isNationalId(id)
      ? `/console/patients/${id}`
      : "/console/electronic-health-record",
    locale,
  });
}
