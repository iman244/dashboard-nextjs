"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { localeDigits } from "@/lib/utils";
import {
  digitStringProblem,
  labelOf,
  toDigits,
  type SchemaField,
} from "./types";

/**
 * A digits-only text input.
 *
 * Deliberately `type="text"`, not `type="number"`. A number input strips the
 * leading zero from 0012345678, offers a spinner nobody wants on an identity
 * code, and lets `e`, `+` and `-` through. The value is a string here and a
 * string all the way into Postgres.
 */
export const DigitStringField = ({
  field,
  value,
  onChange,
  disabled,
  showErrors,
}: {
  field: SchemaField;
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  /** Set after a submit attempt, so untouched required fields speak up too. */
  showErrors?: boolean;
}) => {
  const t = useTranslations("common.SchemaForm");
  const locale = useLocale();
  const [touched, setTouched] = React.useState(false);

  const problem = digitStringProblem(field, value);
  const showProblem = (touched || showErrors) && problem;
  const describedBy = showProblem ? `${field.key}-error` : undefined;

  return (
    <div className="space-y-2">
      <Label htmlFor={field.key}>
        {labelOf(field, locale)}
        {field.required ? (
          <span className="text-destructive ms-1" aria-hidden="true">
            *
          </span>
        ) : null}
      </Label>

      <Input
        id={field.key}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        dir="ltr"
        className="text-start"
        value={localeDigits(value, locale)}
        disabled={disabled}
        aria-invalid={showProblem ? true : undefined}
        aria-describedby={describedBy}
        onBlur={() => setTouched(true)}
        // Folded and filtered on the way in, so a Persian keyboard and a
        // pasted "۱۲۰-۸۰" both end up as digits and nothing else.
        onChange={(event) => onChange(toDigits(event.target.value))}
      />

      {field.min_length || field.max_length ? (
        <p className="text-muted-foreground text-xs">
          {field.min_length === field.max_length && field.min_length
            ? t("ExactlyNDigits", {
                n: localeDigits(field.min_length, locale),
              })
            : t("BetweenNDigits", {
                min: localeDigits(field.min_length ?? 1, locale),
                max: localeDigits(field.max_length ?? 99, locale),
              })}
        </p>
      ) : null}

      {showProblem ? (
        <p id={describedBy} className="text-destructive text-xs" role="alert">
          {t(problem.key, {
            n: localeDigits(problem.params?.n ?? "", locale),
          })}
        </p>
      ) : null}
    </div>
  );
};
