import type { Metadata } from "next";
import React, { use } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./_sidebar/sidebar";
import { directionOf } from "@/lib/direction";

/**
 * Everything below this point sits behind authentication, so none of it should
 * be indexed. Declared once here rather than repeated on every page: Next
 * merges metadata down the tree, and a page that sets only a title and
 * description inherits this untouched.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const Layout: React.FC<React.PropsWithChildren<{ params: Promise<{ locale: string }> }>> = ({ children, params }) => {
  const {locale} = use(params);
  const dir = directionOf(locale);
  return (
    <SidebarProvider dir={dir}>
      <AppSidebar />
      {/* min-w-0 is load-bearing: a flex item defaults to min-width:auto, so
          this <main> could not shrink below the intrinsic width of whatever it
          held. On a 390px phone that made the EHR route 696px wide and scrolled
          the whole page sideways, header and all. With it, main stays at the
          viewport and the wide children scroll inside their own
          overflow-x-auto containers, which is where the scrolling belongs. */}
      <main className="flex flex-col flex-1 min-w-0 p-4 min-h-[100dvh]" dir={dir}>
        <SidebarTrigger  />
        {children}
      </main>
    </SidebarProvider>
  );
};

export default Layout;
