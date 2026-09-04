"use client";

import React from "react";
import { useRouter } from "@/i18n/navigation";
import { AppRoutes } from "@/app/paths";
import Loading from "@/app/loading";
import { usePatientSession } from "../../provider";
import { PatientSessionStatus } from "../../type";

const Layout: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { status } = usePatientSession();
  const router = useRouter();

  React.useEffect(() => {
    if (status === PatientSessionStatus.Authenticated) {
      router.replace(AppRoutes.PATIENT_RECORDS);
    }
  }, [status, router]);

  // Anything other than a settled "no session" would either flash the form at
  // a signed-in patient or race the redirect.
  if (status !== PatientSessionStatus.Unauthenticated) {
    return <Loading />;
  }

  return <>{children}</>;
};

export default Layout;
