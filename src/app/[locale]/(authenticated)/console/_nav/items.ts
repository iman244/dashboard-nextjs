import {
  BarChart,
  ClipboardList,
  FileText,
  SquareActivity,
  Tags,
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
  /**
   * Hide from the sidebar and the console home unless the user is staff.
   *
   * Not a security boundary — the backend decides that, and it lets any
   * signed-in user read this one. It keeps a page whose every control is
   * disabled for most users out of everyone else's way.
   */
  staffOnly?: boolean;
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
    titleKey: "monitorings",
    descriptionKey: "monitorings",
    url: "/console/monitorings",
    icon: Tags,
    // NOT staffOnly, though it once was: records now live under a monitoring,
    // and recording is an operator's job. The page gates its own create, edit
    // and delete controls on `isStaff`; reaching the list is not gated.
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
