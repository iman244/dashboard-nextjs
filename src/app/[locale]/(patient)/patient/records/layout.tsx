"use client";

import React from "react";
import { useRouter } from "@/i18n/navigation";
import { AppRoutes } from "@/app/paths";
import Loading from "@/app/loading";
import { usePatientSession } from "../../provider";
import { PatientSessionStatus } from "../../type";
import Provider from "./provider";

const Layout: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { status } = usePatientSession();
  const router = useRouter();

  React.useEffect(() => {
    if (status === PatientSessionStatus.Unauthenticated) {
      router.replace(AppRoutes.PATIENT_SIGN_IN);
    }
  }, [status, router]);

  // The provider is mounted inside the guard on purpose: it fires the records
  // request on mount, and there is no national id to request with until the
  // session has settled.
  if (status !== PatientSessionStatus.Authenticated) {
    return <Loading />;
  }

  return <Provider>{children}</Provider>;
};

export default Layout;
