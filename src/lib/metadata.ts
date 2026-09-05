import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

/**
 * Localised page metadata, in one place.
 *
 * Every title and description in this app used to be a hardcoded English
 * literal, so a Persian page's browser tab read "Console" and its meta
 * description just repeated the product name. Both now come from the `metadata`
 * namespace in the catalogues.
 *
 * The `locale` is passed in and forwarded to `getTranslations` rather than being
 * read ambiently, which is what next-intl requires for the metadata to stay
 * statically renderable.
 */

/** A leaf route. The root layout's template supplies the product name. */
export async function pageMetadata(
  locale: string,
  key: string
): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: `metadata.${key}` });

  return {
    title: t("title"),
    description: t("description"),
  };
}

/**
 * A layout that has both a title of its own and nested routes with titles.
 *
 * Next resolves this differently from a leaf, and the difference is easy to
 * miss: "templates only apply to child route segments", and a layout that sets
 * a plain string title becomes the new fallback for everything beneath it
 * *without* carrying a template. The monitoring section did exactly that, and
 * the step-1, step-2 and person pages under it silently lost the product suffix
 * their siblings had.
 *
 * So the template is re-declared here, and only the template. `default` stays
 * the bare title: the *parent's* template still applies to it, so spelling the
 * product name into it as well renders "Step 1 | App | App".
 */
export async function sectionMetadata(
  locale: string,
  key: string
): Promise<Metadata> {
  const [t, app] = await Promise.all([
    getTranslations({ locale, namespace: `metadata.${key}` }),
    getTranslations({ locale, namespace: "metadata.app" }),
  ]);

  return {
    title: {
      default: t("title"),
      template: `%s | ${app("name")}`,
    },
    description: t("description"),
  };
}
