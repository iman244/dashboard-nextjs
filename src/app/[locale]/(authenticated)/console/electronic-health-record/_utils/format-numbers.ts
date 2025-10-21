import { digitsEnToFa, digitsFaToEn } from "@persian-tools/persian-tools";

/**
 * Format a number based on the current locale
 * @param num - The number to format
 * @param locale - The current locale ('fa' for Persian, 'en' for English)
 * @returns Formatted number string
 */
export const formatNumber = (num: number, locale: string): string => {
  return locale === "fa"
    ? digitsEnToFa(num.toString())
    : digitsFaToEn(num.toString());
};

/**
 * Format a cell value based on the current locale
 * @param value - The value to format (string or number)
 * @param locale - The current locale ('fa' for Persian, 'en' for English)
 * @returns Formatted value string
 */
export const formatCellValue = (value: string | number, locale: string): string => {
  if(value === null || value === undefined) return "";
  return locale === "fa"
    ? digitsEnToFa(value.toString())
    : digitsFaToEn(value.toString());
};
