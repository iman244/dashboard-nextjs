import {
  BarChart,
  ClipboardList,
  FileText,
  SquareActivity,
  User,
  type LucideIcon,
} from "lucide-react";

/**
 * The console's destinations, defined once.
 *
 * The sidebar and the console home render the same list, and the home page is
 * the only way in on mobile, where the sidebar is behind a trigger. Two copies
 * of this array would drift the moment a section is added — and the copy that
 * gets forgotten is the one nobody on the team uses, which is the mobile one.
 *
 * Titles live under `/console.ConsoleSidebar` because the sidebar already owns
 * them; the descriptions are home-only, so they sit under `/console.ConsoleHome`.
 */
export type ConsoleNavItem = {
  /** key under `/console.ConsoleSidebar` */
  titleKey: string;
  /** key under `/console.ConsoleHome.descriptions` */
  descriptionKey: string;
  url: string;
  icon: LucideIcon;
};

export const CONSOLE_NAV_ITEMS: ConsoleNavItem[] = [
  {
    titleKey: "electronicHealthRecord",
    descriptionKey: "electronicHealthRecord",
    url: "/console/electronic-health-record",
    icon: FileText,
  },
  {
    titleKey: "periodicalReports",
    descriptionKey: "periodicalReports",
    url: "/console/periodical-reports",
    icon: BarChart,
  },
  {
    titleKey: "patientReports",
    descriptionKey: "patientReports",
    url: "/console/patient-reports",
    icon: User,
  },
  {
    titleKey: "saderatBankHealthMonitoring",
    descriptionKey: "saderatBankHealthMonitoring",
    url: "/console/saderat-bank-health-monitoring",
    icon: SquareActivity,
  },
  {
    titleKey: "formSabtPayesh",
    descriptionKey: "formSabtPayesh",
    // Not under /console: it is a standalone embedded form.
    url: "/form-sabt-payesh",
    // Was SquareActivity, the same icon as the monitoring section above it —
    // two identical icons in a list of five is a coin toss, not a signpost.
    icon: ClipboardList,
  },
];
