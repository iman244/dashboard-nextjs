"use client";

import React from "react";
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

interface PatientTypeOption {
  value: string;
  label: string;
}

interface PatientTypeSelectorProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  control: Control<TFieldValues>;
  name: TName;
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

const PATIENT_TYPE_OPTIONS: PatientTypeOption[] = [
  { value: PatientType.INFORMATION, label: "اطلاعات بستري" },
  { value: PatientType.LAB, label: "آزمايشگاه" },
  { value: PatientType.IMAGE, label: "تصويربرداري" },
  { value: PatientType.PATHOLOGY, label: "پاتولوژي" },
  { value: PatientType.HOSPITAL, label: "درمانگاه" },
  { value: PatientType.ORTHOPEDIC, label: "اورژانس" },
  { value: PatientType.DRUG, label: "نسخ دارو و تجهيزات" },
  { value: PatientType.PARACLINICAL, label: "بيماران پاراكلينيك" },
];

export function PatientTypeSelector<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  control,
  name,
  label = "نوع بیمار",
  placeholder = "انتخاب نوع بیمار",
  className,
}: PatientTypeSelectorProps<TFieldValues, TName>) {
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
              {PATIENT_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
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

// Export the options for use in other components
export { PATIENT_TYPE_OPTIONS };
