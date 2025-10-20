import { format } from "date-fns-jalali";

export const formatDate = (date: Date, locale: string) => {
  return locale === "fa" ? format(date, "dd MMMM yyyy") : format(date, "yyyy MMMM dd");
};