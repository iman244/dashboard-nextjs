import React, { use } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./_sidebar/sidebar";

const Layout: React.FC<React.PropsWithChildren<{ params: Promise<{ locale: string }> }>> = ({ children, params }) => {
  const {locale} = use(params);
  const dir = locale === "fa" ? "rtl" : "ltr";
  return (
    <SidebarProvider dir={dir}>
      <AppSidebar />
      <main className="flex flex-col flex-1 p-4 min-h-[100dvh]" dir={dir}>
        <SidebarTrigger  />
        {children}
      </main>
    </SidebarProvider>
  );
};

export default Layout;
