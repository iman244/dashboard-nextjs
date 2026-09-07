"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Control, FieldPath, FieldValues } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface PatientTypeSelectorProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  control: Control<TFieldValues>;
  name: TName;
  /** Supplied by the caller from its own route namespace. */
  label?: string;
  placeholder?: string;
  className?: string;
}

export enum PatientType {
  INFORMATION = "1",
  LAB = "2",
  IMAGE = "3",
  PATHOLOGY = "4",  
  HOSPITAL = "5",
  ORTHOPEDIC = "6",
  DRUG = "7",  
  PARACLINICAL = "25",
}

/**
 * Render order. The names themselves come from `common.PatientTypes`, keyed by
 * these same ids.
 *
 * They used to be an array of hardcoded Persian labels here, which meant the
 * eight names existed twice: once in this file and once in the message
 * bundles, where they were already translated into English. The bundle copy
 * was the one nobody rendered — this selector appears on four routes, so every
 * one of them showed Persian in the English UI.
 */
const PATIENT_TYPE_ORDER: PatientType[] = [
  PatientType.INFORMATION,
  PatientType.LAB,
  PatientType.IMAGE,
  PatientType.PATHOLOGY,
  PatientType.HOSPITAL,
  PatientType.ORTHOPEDIC,
  PatientType.DRUG,
  PatientType.PARACLINICAL,
];

export function PatientTypeSelector<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  control,
  name,
  label,
  placeholder,
  className,
}: PatientTypeSelectorProps<TFieldValues, TName>) {
  // No Persian fallbacks for `label`/`placeholder`: all four call sites pass
  // their own translated strings, so the defaults only ever shipped an
  // untranslatable copy waiting to be rendered by mistake.
  const tTypes = useTranslations("common.PatientTypes");

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {label && <FormLabel>{label}</FormLabel>}
          {/*
            Controlled on purpose: `defaultValue` would leave the trigger
            showing a stale option after the form is reset (e.g. the filter
            dialog's "Clear"). `?? ""` keeps the Select controlled while still
            letting Radix render the placeholder for an empty value.
          */}
          <Select
            onValueChange={field.onChange}
            value={field.value ?? ""}
          >
            <FormControl>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {PATIENT_TYPE_ORDER.map((value) => (
                <SelectItem key={value} value={value}>
                  {tTypes(value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
