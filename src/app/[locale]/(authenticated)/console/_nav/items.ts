import {
  BarChart,
  ClipboardList,
  FileText,
  House,
  Plus,
  Search,
  Tags,
  Upload,
  type LucideIcon,
} from "lucide-react";

export type ConsoleNavGroup = "home" | "health" | "monitorings";

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
    group: "health",
    primary: true,
    // A patient opens from search, so it sits under this task rather than
    // in the sidebar.
    activePrefixes: ["/console/patients"],
  },
  {
    titleKey: "periodicalReports",
    descriptionKey: "periodicalReports",
    url: "/console/periodical-reports",
    icon: BarChart,
    group: "health",
  },
  {
    titleKey: "campaigns",
    descriptionKey: "campaigns",
    url: "/console/monitorings",
    icon: Tags,
    group: "monitorings",
  },
  {
    titleKey: "formSabtPayesh",
    descriptionKey: "formSabtPayesh",
    url: "/form-sabt-payesh",
    icon: FileText,
    group: "monitorings",
  },
  {
    titleKey: "recordMonitoring",
    descriptionKey: "recordMonitoring",
    url: "/console/record-monitoring",
    icon: ClipboardList,
    group: "monitorings",
    activePrefixes: ["/console/monitorings/*/records"],
    staffOnly: true,
  },
  {
    titleKey: "uploadExcel",
    descriptionKey: "uploadExcel",
    url: "/console/monitorings/upload",
    icon: Upload,
    group: "monitorings",
    staffOnly: true,
  },
  {
    titleKey: "defineCampaign",
    descriptionKey: "defineCampaign",
    url: "/console/monitorings/new",
    icon: Plus,
    group: "monitorings",
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

/**
 * The most specific item wins: a longer URL or prefix that also owns the
 * path beats a shorter one, so `/console/monitorings/upload` activates
 * "uploadExcel" and not the "campaigns" item that owns every other
 * `/console/monitorings/...` path.
 */
export const isConsoleNavItemActive = (item: ConsoleNavItem, pathname: string) => {
  if (item.url === "/console") return pathname === item.url;
  if (item.activePrefixes?.some((prefix) => ownsPath(prefix, pathname))) return true;
  const owns = pathname === item.url || pathname.startsWith(`${item.url}/`);
  if (!owns) return false;
  // A longer item URL or prefix that also owns the path wins.
  return !CONSOLE_NAV_ITEMS.some((other) =>
    other !== item &&
    ((other.url.length > item.url.length &&
      (pathname === other.url || pathname.startsWith(`${other.url}/`))) ||
      other.activePrefixes?.some((prefix) => ownsPath(prefix, pathname)))
  );
};

export const CONSOLE_NAV_GROUPS: ConsoleNavGroup[] = ["home", "health", "monitorings"];
