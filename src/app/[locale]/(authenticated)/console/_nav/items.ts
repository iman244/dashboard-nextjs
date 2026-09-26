import {
  BarChart,
  ClipboardList,
  FileText,
  House,
  Search,
  SquareActivity,
  Tags,
  User,
  type LucideIcon,
} from "lucide-react";

export type ConsoleNavGroup = "home" | "find" | "record" | "review" | "administration";

export type ConsoleNavItem = {
  titleKey: string;
  descriptionKey: string;
  url: string;
  icon: LucideIcon;
  group: ConsoleNavGroup;
  /** Extra route prefixes owned by this task. */
  activePrefixes?: readonly string[];
  staffOnly?: boolean;
  primary?: boolean;
};

/** Ordered once for the sidebar and the console home. */
export const CONSOLE_NAV_ITEMS: ConsoleNavItem[] = [
  {
    titleKey: "home",
    descriptionKey: "home",
    url: "/console",
    icon: House,
    group: "home",
  },
  {
    titleKey: "findPatient",
    descriptionKey: "findPatient",
    url: "/console/electronic-health-record",
    icon: Search,
    group: "find",
    primary: true,
  },
  {
    titleKey: "recordMonitoring",
    descriptionKey: "recordMonitoring",
    url: "/console/record-monitoring",
    icon: ClipboardList,
    group: "record",
    activePrefixes: ["/console/monitorings/*/records"],
    staffOnly: true,
  },
  {
    titleKey: "formSabtPayesh",
    descriptionKey: "formSabtPayesh",
    url: "/console/form-sabt-payesh",
    icon: FileText,
    group: "record",
  },
  {
    titleKey: "periodicalReports",
    descriptionKey: "periodicalReports",
    url: "/console/periodical-reports",
    icon: BarChart,
    group: "review",
  },
  {
    titleKey: "patientReports",
    descriptionKey: "patientReports",
    url: "/console/patient-reports",
    icon: User,
    group: "review",
  },
  {
    titleKey: "saderatBankHealthMonitoring",
    descriptionKey: "saderatBankHealthMonitoring",
    url: "/console/saderat-bank-health-monitoring",
    icon: SquareActivity,
    group: "review",
    staffOnly: true,
  },
  {
    titleKey: "monitorings",
    descriptionKey: "monitorings",
    url: "/console/monitorings",
    icon: Tags,
    group: "administration",
    staffOnly: true,
  },
];

const ownsPath = (prefix: string, pathname: string) => {
  const parts = prefix.split("/");
  const pathParts = pathname.split("/");
  return parts.length <= pathParts.length && parts.every((part, index) =>
    part === "*" || part === pathParts[index]
  );
};

export const isConsoleNavItemActive = (item: ConsoleNavItem, pathname: string) => {
  if (item.url === "/console") return pathname === item.url;
  if (item.activePrefixes?.some((prefix) => ownsPath(prefix, pathname))) return true;
  if (item.url === "/console/monitorings") {
    return pathname === item.url ||
      (pathname.startsWith(`${item.url}/`) && !ownsPath("/console/monitorings/*/records", pathname));
  }
  return pathname === item.url || pathname.startsWith(`${item.url}/`);
};

export const CONSOLE_NAV_GROUPS: ConsoleNavGroup[] = [
  "home", "find", "record", "review", "administration",
];
