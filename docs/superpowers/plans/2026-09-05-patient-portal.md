# Patient Portal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a patient sign in with their national ID and see only their own electronic health records.

**Architecture:** A new `(patient)` route group holds a `sessionStorage`-backed session context and two routes. `/patient/sign-in` probes `/EHRByNationalNumber` over a 10-year range; a non-empty response stores the ID and admits them. `/patient/records` re-uses the shared EHR API modules, the shared `DataTable`/`TablePagination`, and the shared `EHRDetailModal`, but with the national ID pinned to the session instead of being a filter.

**Tech Stack:** Next.js (app router, `--turbopack`), next-intl, TanStack Query + Table, react-hook-form + zod, shadcn/ui, tailwind, date-fns-jalali, `@persian-tools/persian-tools`.

**Spec:** `docs/superpowers/specs/2026-09-05-patient-portal-design.md`

## Global Constraints

- **No test framework exists in this repo.** No `test` script, no vitest/jest/testing-library in `devDependencies`. Installing one is out of scope for this plan. Every task therefore substitutes a *type + lint + build + browser* gate for the red/green cycle. This is a real deviation from TDD and is called out here rather than faked.
- **Lint baseline is exactly `✖ 81 problems (33 errors, 48 warnings)`.** Verified on this branch at `9f0cf2a`. New code must add **zero**. Notably this means: no `setState` inside `useEffect` (`react-hooks/set-state-in-effect`) and no component declarations inside components (`react-hooks/static-components`).
- **`npx tsc --noEmit` baseline is 0 errors** — but only after `npm run build` has generated `.next/types`. On a cold tree, `PageProps`-related errors appear and are unrelated to this work.
- All user-facing copy goes through next-intl. **Zero literal Persian or English strings in JSX.**
- Route-scoped namespaces only: `/patient/sign-in` and `/patient/records`. `messages/en.json` and `messages/fa.json` must stay at exact key parity.
- Logical CSS properties only: `ps-*`, `pe-*`, `ms-*`, `me-*`, `start-*`, `end-*`. Never `pl-*`, `ml-*`, `left-*`.
- Persian field keys from `src/data/electronic health record/type.ts` use Arabic `ي`/`ك`. **Copy them byte for byte.** `"نام پزشك معالج"`, `"تاريخ"`, `"مكان"`, `"كدملي"`. Never "correct" the spelling.
- `dir` is already set on `<html>` by `src/app/layout.tsx` from the locale. Do not set `dir` on page wrappers.

---

### Task 1: Patient session context

**Files:**
- Modify: `src/settings.ts` (append)
- Modify: `src/app/paths.ts:1-5` (`AppRoutes` enum)
- Create: `src/app/[locale]/(patient)/type.ts`
- Create: `src/app/[locale]/(patient)/session-store.ts`
- Create: `src/app/[locale]/(patient)/provider.tsx`
- Create: `src/app/[locale]/(patient)/layout.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `PatientSessionStatus` enum (`Loading | Authenticated | Unauthenticated`)
  - `usePatientSession(): { status: PatientSessionStatus; nationalId: string | null; signIn: (id: string) => void; signOut: () => void }`
  - `AppRoutes.PATIENT_SIGN_IN` = `"/patient/sign-in"`, `AppRoutes.PATIENT_RECORDS` = `"/patient/records"`

**Why `useSyncExternalStore` and not `useState` + `useEffect`:** the obvious implementation reads `sessionStorage` in an effect and calls `setState`, which trips `react-hooks/set-state-in-effect` and would push the warning count above the frozen baseline. `useSyncExternalStore` reads the store during render, needs no effect, and gives a real hydration-safe `Loading` state for free.

- [ ] **Step 1: Add the storage key to settings**

Append to `src/settings.ts`, before the `console.log`:

```ts
export const PATIENT_SESSION_KEY =
  process.env.NEXT_PUBLIC_PATIENT_SESSION_KEY || "patient_national_id";
```

- [ ] **Step 2: Add the two routes**

In `src/app/paths.ts`, add to the `AppRoutes` enum (leave `PROTECTED_ROUTES` / `AUTH_FLOW_ROUTES` / `PUBLIC_ROUTES` alone — those arrays and their helper functions have zero call sites in this codebase; guarding is done by layout components):

```ts
export enum AppRoutes {
  AUTHENTICATION = "/authentication",
  CONSOLE = "/console",
  LOADING = "/loading",
  PATIENT_SIGN_IN = "/patient/sign-in",
  PATIENT_RECORDS = "/patient/records",
}
```

- [ ] **Step 3: Write the session types**

Create `src/app/[locale]/(patient)/type.ts`:

```ts
export enum PatientSessionStatus {
  Loading = "loading",
  Authenticated = "authenticated",
  Unauthenticated = "unauthenticated",
}

export type PatientSessionContextType = {
  status: PatientSessionStatus;
  nationalId: string | null;
  signIn: (nationalId: string) => void;
  signOut: () => void;
};
```

- [ ] **Step 4: Write the external store**

Create `src/app/[locale]/(patient)/session-store.ts`:

```ts
import { PATIENT_SESSION_KEY } from "@/settings";

type Listener = () => void;

const listeners = new Set<Listener>();

const emit = () => {
  listeners.forEach((listener) => listener());
};

/**
 * `storage` only fires for *other* tabs, so same-tab writes have to notify the
 * listener set by hand. Both are wired up here so a sign-out in one tab also
 * drops the other tab's session.
 */
export const subscribe = (listener: Listener) => {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
};

export const getSnapshot = () => sessionStorage.getItem(PATIENT_SESSION_KEY);

export const getServerSnapshot = () => null;

export const setStoredNationalId = (nationalId: string) => {
  sessionStorage.setItem(PATIENT_SESSION_KEY, nationalId);
  emit();
};

export const clearStoredNationalId = () => {
  sessionStorage.removeItem(PATIENT_SESSION_KEY);
  emit();
};

/**
 * A store that never changes, used only to tell a hydrated render from a server
 * one. Without it an unauthenticated snapshot on the server is indistinguishable
 * from a real "no session", and the guards redirect before the store is readable.
 */
const noopSubscribe = () => () => {};
export const hydrationStore = {
  subscribe: noopSubscribe,
  getSnapshot: () => true,
  getServerSnapshot: () => false,
};
```

- [ ] **Step 5: Write the provider**

Create `src/app/[locale]/(patient)/provider.tsx`:

```tsx
"use client";

import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { PatientSessionContextType, PatientSessionStatus } from "./type";
import {
  clearStoredNationalId,
  getServerSnapshot,
  getSnapshot,
  hydrationStore,
  setStoredNationalId,
  subscribe,
} from "./session-store";

const PatientSessionContext = React.createContext<
  PatientSessionContextType | undefined
>(undefined);

export const PatientSessionProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const queryClient = useQueryClient();

  const isHydrated = React.useSyncExternalStore(
    hydrationStore.subscribe,
    hydrationStore.getSnapshot,
    hydrationStore.getServerSnapshot
  );

  const nationalId = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  const status = !isHydrated
    ? PatientSessionStatus.Loading
    : nationalId
    ? PatientSessionStatus.Authenticated
    : PatientSessionStatus.Unauthenticated;

  const signIn = React.useCallback((id: string) => {
    setStoredNationalId(id);
  }, []);

  const signOut = React.useCallback(() => {
    clearStoredNationalId();
    // A second patient on the same device must not inherit the first one's
    // rows. Mirrors `unauthenticateUser` in src/app/_auth/useJwtToken.ts.
    queryClient.clear();
    queryClient.getMutationCache().clear();
  }, [queryClient]);

  const value = React.useMemo(
    () => ({ status, nationalId, signIn, signOut }),
    [status, nationalId, signIn, signOut]
  );

  return (
    <PatientSessionContext.Provider value={value}>
      {children}
    </PatientSessionContext.Provider>
  );
};

export const usePatientSession = () => {
  const context = React.useContext(PatientSessionContext);
  if (!context) {
    throw new Error(
      "usePatientSession must be used within a PatientSessionProvider"
    );
  }
  return context;
};
```

- [ ] **Step 6: Mount the provider on the route group**

Create `src/app/[locale]/(patient)/layout.tsx` (server component, same shape as `(authenticated)/console/electronic-health-record/layout.tsx`):

```tsx
import React from "react";
import { PatientSessionProvider } from "./provider";

const Layout: React.FC<React.PropsWithChildren> = ({ children }) => {
  return <PatientSessionProvider>{children}</PatientSessionProvider>;
};

export default Layout;
```

- [ ] **Step 7: Verify types and lint are unmoved**

```bash
npx tsc --noEmit
npm run lint 2>&1 | tail -1
```

Expected: tsc prints nothing. Lint prints exactly `✖ 81 problems (33 errors, 48 warnings)`.

- [ ] **Step 8: Commit**

```bash
git add src/settings.ts src/app/paths.ts "src/app/[locale]/(patient)"
git commit -m "feat(patient): add a sessionStorage-backed patient session

Read through useSyncExternalStore rather than an effect, so the status has a
real pre-hydration Loading state and no setState-in-effect warning."
```

---

### Task 2: Shared EHR request parameters

**Files:**
- Create: `src/app/[locale]/(patient)/_data/ehr-params.ts`

**Interfaces:**
- Consumes: `PatientType` from `@/components/app/patient-type-selector`.
- Produces:
  - `PATIENT_LOOKBACK_YEARS: number` (10)
  - `PATIENT_DEFAULT_PATIENT_TYPE: string` (`"25"`)
  - `toJalali(date: Date): string`
  - `defaultDateRange(): { from: Date; to: Date }`
  - `signInProbeParams(nationalId: string): { nationalNumber: string; fromDate: string; toDate: string; patientType: string }`

The sign-in probe and the records page's landing query must agree, or a patient gets admitted and then lands on an empty table. One module owns both.

- [ ] **Step 1: Write the module**

Create `src/app/[locale]/(patient)/_data/ehr-params.ts`:

```ts
import { format, subYears } from "date-fns-jalali";
import { digitsFaToEn } from "@persian-tools/persian-tools";
import { PatientType } from "@/components/app/patient-type-selector";

/**
 * How far back both the sign-in probe and the records page look by default.
 * Deliberately generous: the probe is what decides whether a patient can get
 * in at all, so a narrow window would lock out anyone whose last visit was a
 * while ago.
 */
export const PATIENT_LOOKBACK_YEARS = 10;

export const PATIENT_DEFAULT_PATIENT_TYPE: string = PatientType.PARACLINICAL;

/** The upstream expects Jalali dates, which is why this is date-fns-jalali. */
export const toJalali = (date: Date) => format(date, "yyyy/MM/dd");

export const defaultDateRange = () => {
  const now = new Date();
  return { from: subYears(now, PATIENT_LOOKBACK_YEARS), to: now };
};

/**
 * A Persian keyboard produces ۰۱۲ and the upstream wants 012, so every national
 * id crossing the network goes through digitsFaToEn first.
 */
export const signInProbeParams = (nationalId: string) => {
  const { from, to } = defaultDateRange();
  return {
    nationalNumber: digitsFaToEn(nationalId),
    fromDate: toJalali(from),
    toDate: toJalali(to),
    patientType: PATIENT_DEFAULT_PATIENT_TYPE,
  };
};
```

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit
npm run lint 2>&1 | tail -1
```

Expected: tsc silent; lint `✖ 81 problems (33 errors, 48 warnings)`.

- [ ] **Step 3: Commit**

```bash
git add "src/app/[locale]/(patient)/_data/ehr-params.ts"
git commit -m "feat(patient): share the EHR lookback window between probe and table"
```

---

### Task 3: Translations for both screens

**Files:**
- Modify: `messages/en.json`
- Modify: `messages/fa.json`

**Interfaces:**
- Produces: namespaces `/patient/sign-in.SignInPage` and `/patient/records.PatientRecords`, consumed by Tasks 4, 5 and 6.

Add both namespaces as **top-level keys**, after the existing `/authentication/register` entry. Keep the two files at identical key structure.

- [ ] **Step 1: Add the English namespaces**

Add to `messages/en.json` at the top level:

```json
"/patient/sign-in": {
  "SignInPage": {
    "title": "Patient sign in",
    "description": "Enter your national ID to see your own health records.",
    "notice": "Your password is your national ID.",
    "form": {
      "nationalId": {
        "label": "National ID",
        "placeholder": "10-digit national ID"
      },
      "password": {
        "label": "Password",
        "placeholder": "Enter your national ID again"
      }
    },
    "errors": {
      "nationalIdRequired": "National ID is required",
      "passwordRequired": "Password is required",
      "passwordMismatch": "Your password must be the same as your national ID",
      "noRecords": "No records were found for this national ID",
      "requestFailed": "Could not reach the records service. Please try again."
    },
    "buttons": {
      "signIn": "Sign in",
      "signingIn": "Checking…"
    }
  }
},
"/patient/records": {
  "PatientRecords": {
    "title": "My health records",
    "subtitle": "National ID: {nationalId}",
    "refresh": "Refresh",
    "signOut": "Sign out",
    "filter": {
      "title": "Filters",
      "description": "Choose a date range and a record type.",
      "dateRange": "Date range",
      "selectDateRange": "Select a date range",
      "patientType": "Record type",
      "selectPatientType": "Select a record type",
      "clear": "Reset",
      "search": "Apply"
    },
    "activeFilters": {
      "label": "Active filters",
      "dateRange": "Date range:",
      "patientType": "Record type:"
    },
    "columns": {
      "date": "Date",
      "service": "Service",
      "doctor": "Doctor",
      "place": "Location",
      "patientType": "Record type",
      "actions": "Actions"
    },
    "actions": {
      "openMenu": "Open menu",
      "viewDetails": "View details"
    },
    "table": {
      "error": "Could not load your records: {message}",
      "retry": "Try again",
      "noData": "No records in this date range"
    }
  }
}
```

- [ ] **Step 2: Add the Persian namespaces**

Add to `messages/fa.json` at the top level, same key structure:

```json
"/patient/sign-in": {
  "SignInPage": {
    "title": "ورود بیمار",
    "description": "برای مشاهده سوابق سلامت خود، کد ملی را وارد کنید.",
    "notice": "رمز عبور شما همان کد ملی شماست.",
    "form": {
      "nationalId": {
        "label": "کد ملی",
        "placeholder": "کد ملی ۱۰ رقمی"
      },
      "password": {
        "label": "رمز عبور",
        "placeholder": "کد ملی خود را دوباره وارد کنید"
      }
    },
    "errors": {
      "nationalIdRequired": "وارد کردن کد ملی الزامی است",
      "passwordRequired": "وارد کردن رمز عبور الزامی است",
      "passwordMismatch": "رمز عبور باید همان کد ملی باشد",
      "noRecords": "برای این کد ملی سابقه‌ای یافت نشد",
      "requestFailed": "ارتباط با سامانه سوابق برقرار نشد. دوباره تلاش کنید."
    },
    "buttons": {
      "signIn": "ورود",
      "signingIn": "در حال بررسی…"
    }
  }
},
"/patient/records": {
  "PatientRecords": {
    "title": "سوابق سلامت من",
    "subtitle": "کد ملی: {nationalId}",
    "refresh": "بروزرسانی",
    "signOut": "خروج",
    "filter": {
      "title": "فیلترها",
      "description": "بازه تاریخ و نوع سابقه را انتخاب کنید.",
      "dateRange": "بازه تاریخ",
      "selectDateRange": "انتخاب بازه تاریخ",
      "patientType": "نوع سابقه",
      "selectPatientType": "انتخاب نوع سابقه",
      "clear": "بازنشانی",
      "search": "اعمال"
    },
    "activeFilters": {
      "label": "فیلترهای فعال",
      "dateRange": "بازه تاریخ:",
      "patientType": "نوع سابقه:"
    },
    "columns": {
      "date": "تاریخ",
      "service": "نام خدمت",
      "doctor": "پزشک معالج",
      "place": "مکان",
      "patientType": "نوع سابقه",
      "actions": "عملیات"
    },
    "actions": {
      "openMenu": "باز کردن منو",
      "viewDetails": "مشاهده جزئیات"
    },
    "table": {
      "error": "بارگذاری سوابق ناموفق بود: {message}",
      "retry": "تلاش دوباره",
      "noData": "در این بازه سابقه‌ای یافت نشد"
    }
  }
}
```

- [ ] **Step 3: Verify both files parse and are at key parity**

```bash
python3 -c "
import json
en = json.load(open('messages/en.json'))
fa = json.load(open('messages/fa.json'))

def keys(d, prefix=''):
    out = set()
    for k, v in d.items():
        p = f'{prefix}.{k}' if prefix else k
        out.add(p)
        if isinstance(v, dict):
            out |= keys(v, p)
    return out

e, f = keys(en), keys(fa)
print('only in en:', sorted(e - f))
print('only in fa:', sorted(f - e))
print('patient namespaces present:', [k for k in en if k.startswith('/patient')])
"
```

Expected: both "only in" lists empty, and `['/patient/sign-in', '/patient/records']` present.

- [ ] **Step 4: Commit**

```bash
git add messages/en.json messages/fa.json
git commit -m "i18n(patient): add the sign-in and records namespaces"
```

---

### Task 4: Sign-in screen

**Files:**
- Create: `src/app/[locale]/(patient)/patient/sign-in/layout.tsx`
- Create: `src/app/[locale]/(patient)/patient/sign-in/page.tsx`
- Create: `src/app/[locale]/(patient)/patient/sign-in/client.tsx`

**Interfaces:**
- Consumes: `usePatientSession`, `PatientSessionStatus` (Task 1); `signInProbeParams` (Task 2); `/patient/sign-in.SignInPage` messages (Task 3); `ehr_by_national_number`, `EHR_BY_NATIONAL_NUMBER_KEY` from `@/data/electronic health record/api/EHR-by-national-number`.
- Produces: a working `/{locale}/patient/sign-in` route. Nothing imports from it.

- [ ] **Step 1: Write the reverse guard layout**

Create `src/app/[locale]/(patient)/patient/sign-in/layout.tsx`:

```tsx
"use client";

import React from "react";
import { useRouter } from "@/i18n/navigation";
import { AppRoutes } from "@/app/paths";
import Loading from "@/app/loading";
import { usePatientSession } from "../../provider";
import { PatientSessionStatus } from "../../type";

const Layout: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { status } = usePatientSession();
  const router = useRouter();

  React.useEffect(() => {
    if (status === PatientSessionStatus.Authenticated) {
      router.replace(AppRoutes.PATIENT_RECORDS);
    }
  }, [status, router]);

  // Anything other than a settled "no session" would either flash the form at
  // a signed-in patient or race the redirect.
  if (status !== PatientSessionStatus.Unauthenticated) {
    return <Loading />;
  }

  return <>{children}</>;
};

export default Layout;
```

- [ ] **Step 2: Write the page**

Create `src/app/[locale]/(patient)/patient/sign-in/page.tsx`:

```tsx
import { Metadata } from "next";
import React from "react";
import { Client } from "./client";

export const metadata: Metadata = {
  title: "Patient sign in",
  description: "Sign in with your national ID to see your health records",
};

const Page = () => {
  return <Client />;
};

export default Page;
```

- [ ] **Step 3: Write the form**

Create `src/app/[locale]/(patient)/patient/sign-in/client.tsx`:

```tsx
"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { digitsEnToFa, digitsFaToEn } from "@persian-tools/persian-tools";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ehr_by_national_number,
  EHR_BY_NATIONAL_NUMBER_KEY,
} from "@/data/electronic health record/api/EHR-by-national-number";
import { useRouter } from "@/i18n/navigation";
import { AppRoutes } from "@/app/paths";
import { usePatientSession } from "../../provider";
import { signInProbeParams } from "../../_data/ehr-params";

export function Client() {
  const t = useTranslations("/patient/sign-in.SignInPage");
  const router = useRouter();
  const { signIn } = usePatientSession();
  const [formError, setFormError] = React.useState<string | null>(null);

  // Built inside the component so the messages are the translated ones.
  const schema = React.useMemo(
    () =>
      z
        .object({
          nationalId: z.string().min(1, t("errors.nationalIdRequired")),
          password: z.string().min(1, t("errors.passwordRequired")),
        })
        .refine(
          (data) => digitsFaToEn(data.nationalId) === digitsFaToEn(data.password),
          {
            message: t("errors.passwordMismatch"),
            path: ["password"],
          }
        ),
    [t]
  );

  type FormData = z.infer<typeof schema>;

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nationalId: "", password: "" },
  });

  const { mutate, isPending } = useMutation({
    mutationKey: [EHR_BY_NATIONAL_NUMBER_KEY, "patient-sign-in"],
    mutationFn: ehr_by_national_number,
  });

  const onSubmit = React.useCallback(
    (data: FormData) => {
      setFormError(null);
      const nationalId = digitsFaToEn(data.nationalId);

      mutate(
        { params: signInProbeParams(nationalId) },
        {
          onSuccess: (records) => {
            // An empty array is a real answer ("no such patient"), not a
            // failure. Collapsing the two would tell someone their id was
            // wrong when the service was simply down.
            if (records.length === 0) {
              setFormError(t("errors.noRecords"));
              return;
            }
            signIn(nationalId);
            router.replace(AppRoutes.PATIENT_RECORDS);
          },
          onError: (error) => {
            console.error("patient sign-in probe failed:", error);
            setFormError(t("errors.requestFailed"));
          },
        }
      );
    },
    [mutate, router, signIn, t]
  );

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nationalId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.nationalId.label")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        inputMode="numeric"
                        autoComplete="username"
                        placeholder={t("form.nationalId.placeholder")}
                        disabled={isPending}
                        value={digitsEnToFa(field.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.password.label")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        autoComplete="current-password"
                        placeholder={t("form.password.placeholder")}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <p className="text-xs text-muted-foreground">{t("notice")}</p>

              {formError && (
                <p
                  role="alert"
                  className="text-destructive text-sm text-center"
                >
                  {formError}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? t("buttons.signingIn") : t("buttons.signIn")}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}
```

- [ ] **Step 4: Verify types, lint and build**

```bash
npx tsc --noEmit
npm run lint 2>&1 | tail -1
npm run build 2>&1 | tail -25
```

Expected: tsc silent; lint `✖ 81 problems (33 errors, 48 warnings)`; build lists `/[locale]/patient/sign-in` among the routes.

- [ ] **Step 5: Verify in a browser**

```bash
npm run dev
```

Check, at both 1440px and 390px:
1. `http://localhost:3000/fa/patient/sign-in` renders RTL with Persian copy.
2. `http://localhost:3000/en/patient/sign-in` renders LTR with English copy.
3. Submitting empty shows both required errors.
4. Entering mismatched values shows the mismatch error under the password field **and sends no network request** (check the Network tab).
5. Entering a national ID with no records shows the "no records" message, not the network-failure one.

- [ ] **Step 6: Commit**

```bash
git add "src/app/[locale]/(patient)/patient/sign-in"
git commit -m "feat(patient): add the national-ID sign-in screen

The password must equal the national id, checked before any request. An empty
result and a failed request are reported as two different things."
```

---

### Task 5: Records provider and columns

**Files:**
- Create: `src/app/[locale]/(patient)/patient/records/provider.tsx`
- Create: `src/app/[locale]/(patient)/patient/records/_columns/index.tsx`

**Interfaces:**
- Consumes: `usePatientSession` (Task 1); `defaultDateRange`, `PATIENT_DEFAULT_PATIENT_TYPE`, `toJalali` (Task 2); `/patient/records.PatientRecords` messages (Task 3).
- Produces:
  - `PatientRecordsFilters = { dateRange: { from?: Date; to?: Date } | null; patientType: string }`
  - `usePatientRecords()` returning `{ nationalId, filters, setFilters, records_m, loadRecords, selectedRecord, isDetailModalOpen, openDetail, closeDetail, mobileLaboratoryByNationalNumber_m, mobileXRayByNationalNumber_m }`
  - `usePatientRecordColumns({ onViewDetails })`

Note the deliberate omissions: there is **no** `nationalNumber` in `PatientRecordsFilters` (it comes from the session and must not be reachable from the UI), and **no** `mobileNumberByNationalNumber_m` (Task 7 makes that prop optional on the modal).

- [ ] **Step 1: Write the provider**

Create `src/app/[locale]/(patient)/patient/records/provider.tsx`:

```tsx
"use client";

import React from "react";
import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { digitsFaToEn } from "@persian-tools/persian-tools";
import {
  ehr_by_national_number,
  EHR_BY_NATIONAL_NUMBER_KEY,
  EHRByNationalNumberApiResponse,
} from "@/data/electronic health record/api/EHR-by-national-number";
import {
  mobile_laboratory_by_national_number,
  MobileLaboratoryByNationalNumberApiResponse,
  PDD_MOBILE_LABORATORY_BY_NATIONAL_NUMBER_KEY,
} from "@/data/electronic health record/api/mobile-laboratory-by-national-number";
import {
  mobile_xray_by_national_number,
  MobileXRayByNationalNumberApiResponse,
  PDD_MOBILE_XRAY_BY_NATIONAL_NUMBER_KEY,
} from "@/data/electronic health record/api/mobile-xray-by-national-number";
import { ElectronicHealthRecord } from "@/data/electronic health record/type";
import { usePatientSession } from "../../provider";
import {
  defaultDateRange,
  PATIENT_DEFAULT_PATIENT_TYPE,
  toJalali,
} from "../../_data/ehr-params";

export type PatientRecordsFilters = {
  dateRange: { from?: Date; to?: Date } | null;
  patientType: string;
};

export type PatientRecordsContextType = {
  nationalId: string | null;
  filters: PatientRecordsFilters;
  setFilters: (filters: PatientRecordsFilters) => void;
  resetFilters: () => void;
  loadRecords: () => void;
  records_m: UseMutationResult<
    EHRByNationalNumberApiResponse,
    Error,
    {
      params: {
        nationalNumber: string;
        fromDate: string;
        toDate: string;
        patientType: string;
      };
    }
  >;
  mobileLaboratoryByNationalNumber_m: UseMutationResult<
    MobileLaboratoryByNationalNumberApiResponse,
    Error,
    { params: { nationalNumber: string; receptionID: string } }
  >;
  mobileXRayByNationalNumber_m: UseMutationResult<
    MobileXRayByNationalNumberApiResponse,
    Error,
    { params: { nationalNumber: string; receptionID: string } }
  >;
  selectedRecord: ElectronicHealthRecord | null;
  isDetailModalOpen: boolean;
  openDetail: (record: ElectronicHealthRecord) => void;
  closeDetail: () => void;
};

const PatientRecordsContext = React.createContext<
  PatientRecordsContextType | undefined
>(undefined);

const buildDefaultFilters = (): PatientRecordsFilters => ({
  dateRange: defaultDateRange(),
  patientType: PATIENT_DEFAULT_PATIENT_TYPE,
});

const Provider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { nationalId } = usePatientSession();
  const [filters, setFilters] = React.useState<PatientRecordsFilters>(
    buildDefaultFilters
  );
  const [selectedRecord, setSelectedRecord] =
    React.useState<ElectronicHealthRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false);

  const records_m = useMutation({
    mutationKey: [EHR_BY_NATIONAL_NUMBER_KEY, "patient", nationalId],
    mutationFn: ehr_by_national_number,
  });

  const mobileLaboratoryByNationalNumber_m = useMutation({
    mutationKey: [PDD_MOBILE_LABORATORY_BY_NATIONAL_NUMBER_KEY],
    mutationFn: mobile_laboratory_by_national_number,
  });

  const mobileXRayByNationalNumber_m = useMutation({
    mutationKey: [PDD_MOBILE_XRAY_BY_NATIONAL_NUMBER_KEY],
    mutationFn: mobile_xray_by_national_number,
  });

  const { mutate } = records_m;

  /**
   * The single place the records call is made. The console page has this same
   * body twice — once in an effect and once in its refresh handler — which is
   * exactly how the two drift apart.
   */
  const loadRecords = React.useCallback(() => {
    if (!nationalId) return;
    mutate({
      params: {
        nationalNumber: digitsFaToEn(nationalId),
        fromDate: filters.dateRange?.from ? toJalali(filters.dateRange.from) : "",
        toDate: filters.dateRange?.to ? toJalali(filters.dateRange.to) : "",
        patientType: filters.patientType,
      },
    });
  }, [mutate, nationalId, filters]);

  React.useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const resetFilters = React.useCallback(() => {
    setFilters(buildDefaultFilters());
  }, []);

  const openDetail = React.useCallback((record: ElectronicHealthRecord) => {
    setSelectedRecord(record);
    setIsDetailModalOpen(true);
  }, []);

  const closeDetail = React.useCallback(() => {
    setIsDetailModalOpen(false);
    setSelectedRecord(null);
  }, []);

  const value = React.useMemo(
    () => ({
      nationalId,
      filters,
      setFilters,
      resetFilters,
      loadRecords,
      records_m,
      mobileLaboratoryByNationalNumber_m,
      mobileXRayByNationalNumber_m,
      selectedRecord,
      isDetailModalOpen,
      openDetail,
      closeDetail,
    }),
    [
      nationalId,
      filters,
      resetFilters,
      loadRecords,
      records_m,
      mobileLaboratoryByNationalNumber_m,
      mobileXRayByNationalNumber_m,
      selectedRecord,
      isDetailModalOpen,
      openDetail,
      closeDetail,
    ]
  );

  return (
    <PatientRecordsContext.Provider value={value}>
      {children}
    </PatientRecordsContext.Provider>
  );
};

export default Provider;

export const usePatientRecords = () => {
  const context = React.useContext(PatientRecordsContext);
  if (!context) {
    throw new Error("usePatientRecords must be used within its Provider");
  }
  return context;
};
```

- [ ] **Step 2: Write the columns**

Create `src/app/[locale]/(patient)/patient/records/_columns/index.tsx`.

The patient's own name and national ID are **not** columns — every row is the same person, so they would be pure repetition. Field keys are copied byte for byte from `src/data/electronic health record/type.ts` (Arabic `ي`/`ك`):

```tsx
"use client";

import React from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { type AppTableFeatures } from "@/components/app/table-features";
import { ElectronicHealthRecord } from "@/data/electronic health record/type";
import { formatCellValue } from "@/lib/utils";
import { Eye, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocale, useTranslations } from "next-intl";

const columnHelper = createColumnHelper<
  AppTableFeatures,
  ElectronicHealthRecord
>();

export const usePatientRecordColumns = ({
  onViewDetails,
}: {
  onViewDetails: (record: ElectronicHealthRecord) => void;
}) => {
  const t = useTranslations("/patient/records.PatientRecords");
  const locale = useLocale();
  const isRtl = locale === "fa";

  return React.useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor("تاريخ", {
          header: t("columns.date"),
          cell: (info) => formatCellValue(info.getValue(), locale),
          enableSorting: true,
        }),
        columnHelper.accessor("نام خدمت", {
          header: t("columns.service"),
          cell: (info) => (
            <div className="whitespace-normal break-words max-w-xs">
              {formatCellValue(info.getValue(), locale)}
            </div>
          ),
        }),
        columnHelper.accessor("نام پزشك معالج", {
          header: t("columns.doctor"),
          cell: (info) => formatCellValue(info.getValue(), locale),
        }),
        columnHelper.accessor("مكان", {
          header: t("columns.place"),
          cell: (info) => formatCellValue(info.getValue(), locale),
        }),
        columnHelper.accessor("PatientType", {
          header: t("columns.patientType"),
          cell: (info) => formatCellValue(info.getValue(), locale),
        }),
        columnHelper.display({
          id: "actions",
          header: t("columns.actions"),
          cell: ({ row }) => (
            <DropdownMenu dir={isRtl ? "rtl" : "ltr"}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">{t("actions.openMenu")}</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() => onViewDetails(row.original)}
                  className="cursor-pointer"
                >
                  <Eye className="me-2 h-4 w-4" />
                  {t("actions.viewDetails")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ),
        }),
      ]),
    [t, locale, isRtl, onViewDetails]
  );
};
```

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit
npm run lint 2>&1 | tail -1
```

Expected: tsc silent; lint `✖ 81 problems (33 errors, 48 warnings)`.

- [ ] **Step 4: Commit**

```bash
git add "src/app/[locale]/(patient)/patient/records/provider.tsx" "src/app/[locale]/(patient)/patient/records/_columns"
git commit -m "feat(patient): records provider with the national id pinned to the session

Filters carry date range and type only; the id is never filter state, so there
is no UI path to another patient's rows."
```

---

### Task 6: Records screen

**Files:**
- Create: `src/app/[locale]/(patient)/patient/records/layout.tsx`
- Create: `src/app/[locale]/(patient)/patient/records/page.tsx`
- Create: `src/app/[locale]/(patient)/patient/records/_components/records-filter.tsx`
- Create: `src/app/[locale]/(patient)/patient/records/_components/records-table.tsx`
- Create: `src/app/[locale]/(patient)/patient/records/client.tsx`

**Interfaces:**
- Consumes: everything from Tasks 1-5; shared `DataTable` and `TablePagination` from `@/components/app`; `appTableFeatures` from `@/components/app/table-features`.
- Produces: a working `/{locale}/patient/records` route.

The detail modal is wired in Task 7, once its phone prop is optional.

- [ ] **Step 1: Write the guard layout**

Create `src/app/[locale]/(patient)/patient/records/layout.tsx`:

```tsx
"use client";

import React from "react";
import { useRouter } from "@/i18n/navigation";
import { AppRoutes } from "@/app/paths";
import Loading from "@/app/loading";
import { usePatientSession } from "../../provider";
import { PatientSessionStatus } from "../../type";
import Provider from "./provider";

const Layout: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { status } = usePatientSession();
  const router = useRouter();

  React.useEffect(() => {
    if (status === PatientSessionStatus.Unauthenticated) {
      router.replace(AppRoutes.PATIENT_SIGN_IN);
    }
  }, [status, router]);

  // The provider is mounted inside the guard on purpose: it fires the records
  // request on mount, and there is no national id to request with until the
  // session has settled.
  if (status !== PatientSessionStatus.Authenticated) {
    return <Loading />;
  }

  return <Provider>{children}</Provider>;
};

export default Layout;
```

- [ ] **Step 2: Write the page**

Create `src/app/[locale]/(patient)/patient/records/page.tsx`:

```tsx
import { Metadata } from "next";
import React from "react";
import Client from "./client";

export const metadata: Metadata = {
  title: "My health records",
  description: "Your own electronic health records",
};

const Page = () => {
  return <Client />;
};

export default Page;
```

- [ ] **Step 3: Write the filter dialog**

Create `src/app/[locale]/(patient)/patient/records/_components/records-filter.tsx`. Same shape as the console's `EHRFilter` minus the national-number field:

```tsx
"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Filter, Search, X } from "lucide-react";
import { DateRangePicker } from "@/components/app/date-range-picker";
import { PatientTypeSelector } from "@/components/app/patient-type-selector";
import { usePatientRecords } from "../provider";

const formSchema = z.object({
  patientType: z.string().min(1),
  dateRange: z
    .object({
      from: z.date().optional(),
      to: z.date().optional(),
    })
    .optional()
    .nullable(),
});

type FormValues = z.infer<typeof formSchema>;

export const RecordsFilter = ({ isLoading = false }: { isLoading?: boolean }) => {
  const t = useTranslations("/patient/records.PatientRecords");
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const { filters, setFilters, resetFilters } = usePatientRecords();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: filters,
  });

  const { reset } = form;
  React.useEffect(() => {
    reset(filters);
  }, [reset, filters]);

  const onSubmit = React.useCallback(
    (data: FormValues) => {
      setFilters(data);
      setIsDialogOpen(false);
    },
    [setFilters]
  );

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Filter />
          {t("filter.title")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]" showCloseButton={false}>
        <DialogHeader className="flex flex-row items-center justify-between">
          <div className="flex flex-col gap-2">
            <DialogTitle>{t("filter.title")}</DialogTitle>
            <DialogDescription>{t("filter.description")}</DialogDescription>
          </div>
          <DialogClose asChild>
            <Button variant="outline" size="icon">
              <X />
            </Button>
          </DialogClose>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <PatientTypeSelector
              control={form.control}
              name="patientType"
              label={t("filter.patientType")}
              placeholder={t("filter.selectPatientType")}
              className="w-full"
            />

            <FormField
              control={form.control}
              name="dateRange"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("filter.dateRange")}</FormLabel>
                  <FormControl>
                    <DateRangePicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={t("filter.selectDateRange")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={resetFilters}
                disabled={isLoading}
              >
                {t("filter.clear")}
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                {t("filter.search")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
```

- [ ] **Step 4: Write the table wrapper**

Create `src/app/[locale]/(patient)/patient/records/_components/records-table.tsx`. Loading and error are handled here; the happy path delegates to the shared `DataTable`, which already carries the sorting affordances and the RTL-safe header:

```tsx
"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { ColumnDef, ReactTable } from "@tanstack/react-table";
import { AlertCircle } from "lucide-react";
import { DataTable } from "@/components/app/data-table";
import { type AppTableFeatures } from "@/components/app/table-features";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ElectronicHealthRecord } from "@/data/electronic health record/type";

const SKELETON_ROWS = 5;

interface RecordsTableProps {
  table: ReactTable<AppTableFeatures, ElectronicHealthRecord>;
  columns: ColumnDef<AppTableFeatures, ElectronicHealthRecord>[];
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  onRetry: () => void;
}

export const RecordsTable = ({
  table,
  columns,
  isLoading,
  isError,
  error,
  onRetry,
}: RecordsTableProps) => {
  const t = useTranslations("/patient/records.PatientRecords");

  if (isLoading) {
    return (
      <div className="rounded-md border p-4 space-y-3">
        {Array.from({ length: SKELETON_ROWS }).map((_, index) => (
          <Skeleton key={index} className="h-8 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div
        role="alert"
        className="rounded-md border p-8 flex flex-col items-center gap-3 text-center"
      >
        <AlertCircle className="h-6 w-6 text-destructive" />
        <p className="text-sm text-destructive">
          {t("table.error", { message: error?.message ?? "" })}
        </p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          {t("table.retry")}
        </Button>
      </div>
    );
  }

  return (
    <DataTable
      table={table}
      columns={columns}
      noDataMessage={t("table.noData")}
    />
  );
};
```

**Known typing risk:** `DataTable` declares `columns: ColumnDef<AppTableFeatures, TData, TValue>[]` while the console's own table uses the two-argument `ColumnDef<AppTableFeatures, ElectronicHealthRecord>[]`. If `tsc` rejects the hand-off, do **not** loosen the type with `as` — instead inline the table markup here by copying the body of `src/app/[locale]/(authenticated)/console/electronic-health-record/_components/ehr-table.tsx`, replacing its `useTranslations("/console/electronic-health-record.EHRTable")` with this file's `t` and its hardcoded Persian error string with `t("table.error", ...)`. Note which route you took in the commit message.

- [ ] **Step 5: Write the client**

Create `src/app/[locale]/(patient)/patient/records/client.tsx`:

```tsx
"use client";

import React from "react";
import { useLocale, useTranslations } from "next-intl";
import { useTable } from "@tanstack/react-table";
import { digitsEnToFa } from "@persian-tools/persian-tools";
import { LogOut, RefreshCw, XIcon } from "lucide-react";
import { appTableFeatures } from "@/components/app/table-features";
import { TablePagination } from "@/components/app/table-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { useRouter } from "@/i18n/navigation";
import { AppRoutes } from "@/app/paths";
import { usePatientSession } from "../../provider";
import { usePatientRecords } from "./provider";
import { usePatientRecordColumns } from "./_columns";
import { RecordsFilter } from "./_components/records-filter";
import { RecordsTable } from "./_components/records-table";

const Client = () => {
  const t = useTranslations("/patient/records.PatientRecords");
  const tPatientTypes = useTranslations(
    "/console/electronic-health-record.PatientTypes"
  );
  const locale = useLocale();
  const router = useRouter();
  const { signOut } = usePatientSession();
  const {
    nationalId,
    filters,
    setFilters,
    loadRecords,
    records_m,
    openDetail,
  } = usePatientRecords();

  const columns = usePatientRecordColumns({ onViewDetails: openDetail });

  const table = useTable({
    features: appTableFeatures,
    data: records_m.data || [],
    columns,
    initialState: {
      pagination: { pageIndex: 0, pageSize: 10 },
      sorting: [{ id: "تاريخ", desc: true }],
    },
  });

  const handleSignOut = React.useCallback(() => {
    signOut();
    router.replace(AppRoutes.PATIENT_SIGN_IN);
  }, [router, signOut]);

  return (
    <main className="container mx-auto p-4 space-y-4 min-h-screen flex flex-col">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("subtitle", {
              nationalId: digitsEnToFa(nationalId ?? ""),
            })}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          <LogOut className="me-2 h-4 w-4" />
          {t("signOut")}
        </Button>
      </div>

      <div className="flex items-center justify-between gap-2">
        <RecordsFilter isLoading={records_m.isPending} />
        <Button
          onClick={loadRecords}
          variant="outline"
          size="sm"
          disabled={records_m.isPending}
          className="flex items-center gap-2"
        >
          <RefreshCw
            className={`h-4 w-4 ${records_m.isPending ? "animate-spin" : ""}`}
          />
          <span>{t("refresh")}</span>
        </Button>
      </div>

      {(filters.dateRange?.from || filters.patientType) && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-foreground">
            {t("activeFilters.label")}
          </span>
          {filters.dateRange?.from && filters.dateRange?.to && (
            <Badge variant="secondary">
              <span>{t("activeFilters.dateRange")}</span>
              <span className="ms-1">
                {digitsEnToFa(
                  `${formatDate(filters.dateRange.from, locale)} - ${formatDate(
                    filters.dateRange.to,
                    locale
                  )}`
                )}
              </span>
            </Badge>
          )}
          {filters.patientType && (
            <Badge
              variant="secondary"
              className="cursor-pointer"
              onClick={() => setFilters({ ...filters, patientType: "" })}
            >
              <XIcon className="w-4 h-4" />
              <span>{t("activeFilters.patientType")}</span>
              <span className="ms-1">{tPatientTypes(filters.patientType)}</span>
            </Badge>
          )}
        </div>
      )}

      <div className="flex-1">
        <RecordsTable
          table={table}
          columns={columns}
          isLoading={records_m.isPending}
          isError={records_m.isError}
          error={records_m.error}
          onRetry={loadRecords}
        />
      </div>

      <TablePagination table={table} />
    </main>
  );
};

export default Client;
```

Note: the date-range badge is **not** clearable — clearing it would mean an unbounded query, and the range always has a sensible default. Only the type badge clears.

- [ ] **Step 6: Verify types, lint and build**

```bash
npx tsc --noEmit
npm run lint 2>&1 | tail -1
npm run build 2>&1 | tail -25
```

Expected: tsc silent; lint `✖ 81 problems (33 errors, 48 warnings)`; build lists `/[locale]/patient/records`.

- [ ] **Step 7: Verify in a browser**

With `npm run dev` running:
1. Visit `http://localhost:3000/fa/patient/records` with no session — it redirects to the sign-in page rather than erroring.
2. Sign in with a national ID that has records — the table loads without a second search.
3. Change the record type in the filter — the table refetches.
4. Press "خروج" — you return to sign-in, and going back to `/patient/records` redirects again.
5. Check 390px: the header wraps, the table scrolls horizontally rather than the page.
6. Check `/en/patient/records` in LTR.

- [ ] **Step 8: Commit**

```bash
git add "src/app/[locale]/(patient)/patient/records"
git commit -m "feat(patient): add the patient records screen

Date and type filters only. Re-uses the shared DataTable and TablePagination
instead of copying the console's table chrome."
```

---

### Task 7: Detail dialog without the phone lookup

**Files:**
- Modify: `src/data/electronic health record/components/EHRDetailModal.tsx` (props type ~line 48, `handleGetMobileNumber` ~line 164, the mobile-number block ~line 266)
- Modify: `src/app/[locale]/(patient)/patient/records/client.tsx` (wire the modal in)

**Interfaces:**
- Consumes: `usePatientRecords()` fields `selectedRecord`, `isDetailModalOpen`, `closeDetail`, `mobileLaboratoryByNationalNumber_m`, `mobileXRayByNationalNumber_m` (Task 5).
- Produces: `EHRDetailModalProps["actions"]["mobileNumberByNationalNumber_m"]` becomes optional. The console call site is unchanged and keeps passing it.

Optional rather than a `showMobileNumber` boolean: absence is the signal, so the patient page never constructs an unused mutation, and the compiler enforces the guard instead of a flag being trusted.

- [ ] **Step 1: Make the prop optional**

In `src/data/electronic health record/components/EHRDetailModal.tsx`, in the `actions` block of `EHRDetailModalProps`, change the mobile-number entry to optional:

```ts
    /**
     * Optional: pages that must not expose the patient's phone number (the
     * patient portal) simply omit it, and the lookup disappears from the
     * dialog. Absence is the switch — there is no separate flag to keep in
     * sync.
     */
    mobileNumberByNationalNumber_m?: UseMutationResult<
      MobileNumberByNationalNumberApiResponse,
      Error,
      {
        params: {
          nationalNumber: string;
        };
      }
    >;
```

- [ ] **Step 2: Guard the handler**

Change the body of `handleGetMobileNumber` so it starts with a guard:

```tsx
  const handleGetMobileNumber = React.useCallback(
    (record: ElectronicHealthRecord) => {
      if (!mobileNumberByNationalNumber_m) return;
      mobileNumberByNationalNumber_m.mutate(
```

(the rest of the callback is unchanged)

- [ ] **Step 3: Guard the rendered block**

Wrap the mobile-number field so it renders only when the mutation was supplied, and make the `disabled` read optional-chained:

```tsx
              {mobileNumberByNationalNumber_m && (
                <div key={"mobileNumber"} className="space-y-1 flex flex-col gap-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    {t("fields.mobileNumber")}
                  </label>
                  {mobileNumber ? (
                    <div className="flex items-center gap-1">
                      <div className="text-sm flex-1">
                        {formatCellValue(mobileNumber, locale)}
                      </div>
                      <CopyButton value={String(mobileNumber)} />
                    </div>
                  ) : (
                    <Button
                      variant={"ghost"}
                      size="sm"
                      onClick={() => handleGetMobileNumber(record)}
                      disabled={mobileNumberByNationalNumber_m.isPending}
                      className="w-fit"
                    >
                      {t("getMobileNumber")}
                    </Button>
                  )}
                </div>
              )}
```

- [ ] **Step 4: Wire the modal into the patient page**

In `src/app/[locale]/(patient)/patient/records/client.tsx`, add the import:

```tsx
import { EHRDetailModal } from "@/data/electronic health record/components/EHRDetailModal";
```

extend the destructure from `usePatientRecords()`:

```tsx
  const {
    nationalId,
    filters,
    setFilters,
    loadRecords,
    records_m,
    openDetail,
    closeDetail,
    selectedRecord,
    isDetailModalOpen,
    mobileLaboratoryByNationalNumber_m,
    mobileXRayByNationalNumber_m,
  } = usePatientRecords();
```

and render the modal just before the closing `</main>`:

```tsx
      <EHRDetailModal
        record={selectedRecord}
        isOpen={isDetailModalOpen}
        onClose={closeDetail}
        actions={{
          mobileLaboratoryByNationalNumber_m,
          mobileXRayByNationalNumber_m,
        }}
      />
```

- [ ] **Step 5: Verify types, lint and build**

```bash
npx tsc --noEmit
npm run lint 2>&1 | tail -1
npm run build
```

Expected: tsc silent; lint `✖ 81 problems (33 errors, 48 warnings)`; build succeeds.

- [ ] **Step 6: Verify both call sites in a browser**

1. `/fa/patient/records` → open a row's "مشاهده جزئیات". The dialog shows the patient fields with **no** mobile-number row, and the lab / x-ray download buttons are present.
2. `/fa/console/electronic-health-record` (needs a Django login) → the same dialog **still** shows the mobile-number lookup and it still works. If no Django login is available, say so in the report rather than claiming this was checked.

- [ ] **Step 7: Commit**

```bash
git add "src/data/electronic health record/components/EHRDetailModal.tsx" "src/app/[locale]/(patient)/patient/records/client.tsx"
git commit -m "feat(patient): show record details without the phone lookup

The modal's mobile-number mutation is now optional, so a page that must not
expose a phone number omits it and the control disappears with it."
```

---

### Task 8: Final verification and documentation

**Files:**
- Modify: `README.md` (add a short section on the patient routes)

- [ ] **Step 1: Full clean verification**

```bash
rm -rf .next
npm run build 2>&1 | tail -30
npx tsc --noEmit
npm run lint 2>&1 | tail -1
```

Expected: build succeeds and lists both `/[locale]/patient/sign-in` and `/[locale]/patient/records`; tsc silent; lint exactly `✖ 81 problems (33 errors, 48 warnings)`.

- [ ] **Step 2: End-to-end pass in the browser**

With `npm run dev`, walk the whole flow at 1440px and 390px, in `/fa` and `/en`:

1. `/patient/records` with no session → redirected to sign-in.
2. Mismatched password → error, no request.
3. Unknown national ID → "no records" message.
4. Known national ID → lands on the records table with rows.
5. Filter by type and by date range → table updates.
6. Row → view details → dialog, no phone row, downloads present.
7. Sign out → back to sign-in; refresh `/patient/records` → redirected.
8. Sign in as patient A, sign out, sign in as patient B → B sees only B's rows (this is what the `queryClient.clear()` in `signOut` is for).

Record which of these actually passed. Report any that did not rather than describing the flow as verified.

- [ ] **Step 3: Document the routes**

Add to `README.md`:

```markdown
## Patient portal

Two routes outside the console, at `/{locale}/patient/sign-in` and
`/{locale}/patient/records`. A patient signs in with their national ID as both
username and password; the sign-in probes `/EHRByNationalNumber` over a ten-year
window and admits them if anything comes back. The records page then shows that
one national ID's rows, filterable by date range and record type only.

**This is a UX gate, not a security boundary.** The upstream EHR API takes no
credentials — see `src/lib/api/5.160.115.210/5apiInstance.ts`, which has no
request interceptor. Anyone can query any national ID directly regardless of
this UI. Do not treat these pages as protecting patient data.
```

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: describe the patient portal routes and their limits"
```

---

## Self-Review

**Spec coverage:**

| Spec section | Task |
|---|---|
| Route layout, `(patient)` group | 1, 4, 6 |
| Session (3 states, sessionStorage, signOut clears cache) | 1 |
| Sign-in probe params (10y, type 25, digitsFaToEn) | 2, 4 |
| Password must equal national ID | 4 |
| Empty result vs error distinction | 4 |
| Lean records provider, ID not filter state | 5 |
| Patient column set, no console row action | 5 |
| Filter: date + type only | 6 |
| Detail dialog, phone optional, downloads kept | 7 |
| i18n namespaces at parity, no literals | 3 |
| RTL / logical properties | 4, 6 |
| Verification (build, tsc, lint baseline, browser) | every task, plus 8 |

No spec requirement is unassigned.

**Placeholder scan:** none — every code step carries the actual code. The one conditional instruction (the `DataTable` generic fallback in Task 6 Step 4) names the exact file to copy from and the exact substitutions, rather than saying "handle it".

**Type consistency:** `usePatientSession` returns `{ status, nationalId, signIn, signOut }` in Task 1 and is destructured with those names in Tasks 4, 6 and 7. `usePatientRecords` is defined in Task 5 with `openDetail`/`closeDetail`/`selectedRecord`/`isDetailModalOpen`/`loadRecords`/`resetFilters` and consumed under exactly those names in Task 6 and Task 7. `signInProbeParams`, `defaultDateRange`, `toJalali`, `PATIENT_DEFAULT_PATIENT_TYPE` are defined in Task 2 and used under those names in Tasks 4 and 5. `RecordsFilter` and `RecordsTable` are named consistently between Task 6 steps 3, 4 and 5.
