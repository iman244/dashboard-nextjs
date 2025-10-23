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

const PATIENT_TYPE_OPTIONS: PatientTypeOption[] = [
  { value: "1", label: "اطلاعات بستري" },
  { value: "2", label: "آزمايشگاه" },
  { value: "3", label: "تصويربرداري" },
  { value: "4", label: "پاتولوژي" },
  { value: "5", label: "درمانگاه" },
  { value: "6", label: "اورژانس" },
  { value: "7", label: "نسخ دارو و تجهيزات" },
  { value: "25", label: "بيماران ژاراكلينيك" },
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
          <Select
            onValueChange={field.onChange}
            defaultValue={field.value}
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
