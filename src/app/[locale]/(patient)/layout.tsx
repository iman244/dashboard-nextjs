import type { Metadata } from "next";
import React from "react";
import { PatientSessionProvider } from "./provider";

/**
 * Everything below this point sits behind authentication, so none of it should
 * be indexed. Declared once here rather than repeated on every page: Next
 * merges metadata down the tree, and a page that sets only a title and
 * description inherits this untouched.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const Layout: React.FC<React.PropsWithChildren> = ({ children }) => {
  return <PatientSessionProvider>{children}</PatientSessionProvider>;
};

export default Layout;
