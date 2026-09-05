"use client";

import React from "react";
import { useLocale, useTranslations } from "next-intl";
import { AlertCircle, Inbox } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/page-header";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "@/components/ui/breadcrumb";
import { Link } from "@/i18n/navigation";
import { localeDigits, formatDate } from "@/lib/utils";
import { useRetrieve_SBHM_API } from "@/data/saderat-bank-health-monitoring/api/retrieve";
import {
  SBHM_DETAIL_PATH,
  type SBHM_Step2Record,
} from "@/data/saderat-bank-health-monitoring/types";
import { STEP2_CHART_SECTIONS } from "./_charts/config";
import { DistributionChart } from "./_charts/distribution-chart";
import { useStep2Report } from "./_data/use-step2-report";
import {
  SearchPersonnelSheet,
  type PersonnelFilter,
} from "./_search-personnel-sheet/sheet";

const Step2MonitoringPage = (
  props: PageProps<"/[locale]/console/saderat-bank-health-monitoring/step-2/[id]">
) => {
  const { id } = React.use(props.params);
  const t = useTranslations(
    "/console/saderat-bank-health-monitoring.SaderatBankHealthMonitoringPage"
  );
  const tReport = useTranslations(
    "/console/saderat-bank-health-monitoring.Step2Report"
  );
  const locale = useLocale();

  const { data, isPending, error } = useRetrieve_SBHM_API({
    input: { pathVariables: { id: parseInt(id) } },
  });

  // SBHM_RetrieveSerializer still types `json` as step_1 rows (see the note in
  // types.ts). The `data.type` check below is what makes this reinterpretation
  // safe; it disappears once that type becomes SBHM_Retrieve_ByType.
  const records = React.useMemo(
    () =>
      data?.type === "step_2"
        ? (data.json as unknown as SBHM_Step2Record[])
        : undefined,
    [data]
  );

  const report = useStep2Report(records);

  // Clicking a bar drills into the people behind it, matching step-1.
  const [activeFilter, setActiveFilter] = React.useState<PersonnelFilter>();
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);

  const showPersonnelFor = React.useCallback(
    (field: keyof SBHM_Step2Record, value: string, chartTitle: string) => {
      setActiveFilter({
        // the chart counts String(record[field]), so match the same way
        filterFn: (record) => String(record[field] ?? "") === value,
        description: `${chartTitle}: ${value}`,
      });
      setIsSheetOpen(true);
    },
    []
  );

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px]">
        <div className="flex items-center flex-col gap-3">
          <Spinner className="h-8 w-8" />
          <span className="text-muted-foreground">{t("Loading")}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg border border-destructive/50 bg-destructive/10">
        <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
        <div className="flex flex-col gap-1">
          <p className="font-semibold text-destructive">{t("ErrorTitle")}</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  // The retrieve endpoint is shared between steps, so a step_1 id resolves here
  // happily and would render nothing recognisable. Point it at the right view.
  if (data.type !== "step_2") {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <AlertCircle className="h-10 w-10 text-muted-foreground" />
        <p className="text-lg font-semibold">{t("WrongStepTitle")}</p>
        <Button asChild variant="outline">
          <Link href={SBHM_DETAIL_PATH(data.type, data.id)}>
            {t("WrongStepAction")}
          </Link>
        </Button>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Inbox className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-semibold">{t("EmptyStateTitle")}</p>
        <p className="text-sm text-muted-foreground">
          {t("EmptyStateDescriptionDetail")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Was a bare h2 with a sibling p: no h1 on the page at all, and the
          section headings below jumped from h2 straight to h3. Routed through
          PageHeader so this reads as a sibling of step-1 rather than a second
          way of titling the same kind of page. */}
      <PageHeader
        breadcrumbs={
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/console/saderat-bank-health-monitoring">
                    {t("PageTitle")}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        }
        title={localeDigits(data.name, locale)}
        description={
          <>
            {localeDigits(formatDate(new Date(data.created_at), locale), locale)}
            {" · "}
            {tReport("recordCount", {
              count: localeDigits(report.totalRecords, locale),
            })}
          </>
        }
      />

      {STEP2_CHART_SECTIONS.map((section) => (
        <section key={section.titleKey} className="space-y-3">
          {/* h2, not h3: PageHeader now owns the page h1, so sections sit one level
              below it rather than skipping a level (#39). */}
          <h2 className="text-lg font-semibold">{tReport(section.titleKey)}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {section.charts.map((chart) => (
              <DistributionChart
                key={chart.field}
                title={tReport(chart.titleKey)}
                data={report.distributions[chart.field] ?? []}
                onBarClick={(name) =>
                  showPersonnelFor(chart.field, name, tReport(chart.titleKey))
                }
              />
            ))}
          </div>
        </section>
      ))}

      <SearchPersonnelSheet
        open={isSheetOpen}
        onOpenChange={(open) => {
          setIsSheetOpen(open);
          if (!open) setActiveFilter(undefined);
        }}
        data={records ?? []}
        monitoringId={data.id}
        filter={activeFilter}
      />
    </div>
  );
};

export default Step2MonitoringPage;
