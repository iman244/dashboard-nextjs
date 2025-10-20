"use client";
import { AppRoutes } from '@/app/paths';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import React from 'react'

const AuthAuthenticated = () => {
    const searchParams = useSearchParams();
    const nextPath = searchParams.get("next");
    const href = nextPath || AppRoutes.CONSOLE;
    const t = useTranslations("AuthAuthenticated");

  return (
    <div className="flex flex-col items-center! justify-center gap-4 h-screen max-w-lg mx-auto">
        <p className="text-center! text-lg font-medium text-muted-foreground">
          {t("description")}
        </p>
        <Button asChild>
          <Link href={href}>{t("redirect")}</Link>
        </Button>
      </div>
  )
}

export default AuthAuthenticated