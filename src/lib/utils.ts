import { digitsEnToFa, digitsFaToEn } from "@persian-tools/persian-tools";
import { clsx, type ClassValue } from "clsx"
import { format } from "date-fns-jalali";
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const localeDigits = (value: string, locale: string) => {
  return locale === "fa" ? digitsEnToFa(value) : digitsFaToEn(value);
};

export const formatNumber = (num: number, locale: string): string => {
  return locale === "fa"
    ? digitsEnToFa(num.toString())
    : digitsFaToEn(num.toString());
};

export const formatCellValue = (value: string | number, locale: string): string => {
  if(value === null || value === undefined) return "";
  return locale === "fa"
    ? digitsEnToFa(value.toString())
    : digitsFaToEn(value.toString());
};


export const formatDate = (date: Date, locale: string) => {
  return locale === "fa" ? format(date, "dd MMMM yyyy") : format(date, "yyyy MMMM dd");
};