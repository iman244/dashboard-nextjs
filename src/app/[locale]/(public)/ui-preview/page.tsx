"use client";

/**
 * TEMPORARY design preview. Not linked from anywhere, not part of the product.
 * It exists because the real console sits behind a Django login, so the shell
 * cannot be iterated on visually without one. Delete this route once the
 * decisions here are ported into the real console layout and table.
 */

import * as React from "react";
import {
  BarChart,
  FileText,
  SquareActivity,
  User,
  Download,
  SlidersHorizontal,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const NAV = [
  { title: "پرونده الکترونیک سلامت", icon: FileText, active: false },
  { title: "گزارش‌های دوره‌ای", icon: BarChart, active: false },
  { title: "گزارش‌های بیمار", icon: User, active: true },
  { title: "پایش سلامت بانک صادرات", icon: SquareActivity, active: false },
];

const ROWS = [
  { name: "زهرا محمدی", id: "۰۰۷۹۱۲۳۴۵۶", service: "شمارش کامل خون", date: "۱۴۰۴/۰۵/۱۲", value: "۱۳٫۲", status: "normal" },
  { name: "علی رضایی", id: "۰۰۸۲۴۴۱۹۰۳", service: "قند خون ناشتا", date: "۱۴۰۴/۰۵/۱۲", value: "۱۴۶", status: "high" },
  { name: "مریم حسینی", id: "۰۰۶۵۹۹۸۷۱۲", service: "ویتامین D", date: "۱۴۰۴/۰۵/۱۱", value: "۱۸", status: "low" },
  { name: "محمد کریمی", id: "۰۰۹۱۲۳۷۷۴۵", service: "کلسترول کل", date: "۱۴۰۴/۰۵/۱۱", value: "۱۹۴", status: "normal" },
  { name: "فاطمه نوری", id: "۰۰۴۴۸۸۲۳۹۰", service: "هموگلوبین A1C", date: "۱۴۰۴/۰۵/۱۰", value: "۸٫۴", status: "high" },
];

/** Page shell the console currently lacks: title, context, and an action slot. */
function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-[-0.01em]">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "normal")
    return (
      <Badge className="border-0 bg-success/15 text-success-foreground dark:text-success">
        طبیعی
      </Badge>
    );
  const high = status === "high";
  return (
    <Badge className="border-0 bg-destructive/12 text-destructive">
      <span aria-hidden="true" className="me-1">{high ? "↑" : "↓"}</span>
      {high ? "بالا" : "پایین"}
    </Badge>
  );
}

export default function UiPreviewPage() {
  return (
    <SidebarProvider dir="rtl">
      <Sidebar side="right">
        <SidebarContent dir="rtl">
          <SidebarGroup>
            <SidebarGroupLabel className="px-2 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              داشبورد
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {NAV.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={item.active}
                      className="h-9 gap-3 rounded-lg text-[13.5px] transition-colors duration-150 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium"
                    >
                      <item.icon className="size-4 opacity-80" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter dir="rtl">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <div className="flex size-8 items-center justify-center rounded-full bg-primary/12 text-[13px] font-medium text-primary">
              ا
            </div>
            <div className="min-w-0 flex-1 text-start">
              <div className="truncate text-[13px] font-medium">ایمان</div>
              <div className="truncate text-[11px] text-muted-foreground">
                مدیر سیستم
              </div>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>

      <main dir="rtl" className="flex min-h-dvh flex-1 flex-col bg-background">
        <div className="flex items-center gap-2 border-b border-border px-6 py-3">
          <SidebarTrigger />
        </div>

        <div className="flex-1 space-y-6 px-6 py-6">
          <PageHeader
            title="گزارش‌های بیمار"
            description="نتایج آزمایش‌ها بر اساس کد ملی و بازه زمانی"
          >
            <Button variant="outline" size="sm" className="gap-2">
              <SlidersHorizontal className="size-3.5" />
              فیلترها
            </Button>
            <Button size="sm" className="gap-2">
              <Download className="size-3.5" />
              خروجی اکسل
            </Button>
          </PageHeader>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="rounded-full font-normal">
              کد ملی: ۰۰۷۹۱۲۳۴۵۶
            </Badge>
            <Badge variant="secondary" className="rounded-full font-normal">
              ۱۴۰۴/۰۵/۰۱ — ۱۴۰۴/۰۵/۳۱
            </Badge>
            <Badge variant="secondary" className="rounded-full font-normal">
              آزمایشگاه
            </Badge>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="h-10 text-start text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      نام بیمار
                    </TableHead>
                    <TableHead className="h-10 text-start text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      کد ملی
                    </TableHead>
                    <TableHead className="h-10 text-start text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      نام خدمت
                    </TableHead>
                    <TableHead className="h-10 text-start text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      تاریخ
                    </TableHead>
                    <TableHead className="h-10 text-end text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      نتیجه
                    </TableHead>
                    <TableHead className="h-10 text-end text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      وضعیت
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ROWS.map((row) => (
                    <TableRow
                      key={row.id}
                      className="border-border transition-colors duration-100 hover:bg-muted/50"
                    >
                      <TableCell className="py-3 text-[13.5px] font-medium">
                        {row.name}
                      </TableCell>
                      <TableCell className="py-3 text-[13.5px] tabular-nums text-muted-foreground">
                        {row.id}
                      </TableCell>
                      <TableCell className="py-3 text-[13.5px]">
                        {row.service}
                      </TableCell>
                      <TableCell className="py-3 text-[13.5px] tabular-nums text-muted-foreground">
                        {row.date}
                      </TableCell>
                      <TableCell className="py-3 text-end text-[13.5px] font-medium tabular-nums">
                        {row.value}
                      </TableCell>
                      <TableCell className="py-3 text-end">
                        <StatusBadge status={row.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between border-t border-border px-4 py-3 text-[12.5px] text-muted-foreground">
              <span className="tabular-nums">نمایش ۱ تا ۵ از ۵ رکورد</span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled className="h-7 px-2">
                  قبلی
                </Button>
                <Button variant="outline" size="sm" disabled className="h-7 px-2">
                  بعدی
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </SidebarProvider>
  );
}
