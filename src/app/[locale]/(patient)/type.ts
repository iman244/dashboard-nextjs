export enum PatientSessionStatus {
  Loading = "loading",
  Authenticated = "authenticated",
  Unauthenticated = "unauthenticated",
}

export type PatientSessionContextType = {
  status: PatientSessionStatus;
  nationalId: string | null;
  signIn: (nationalId: string) => void;
  signOut: () => void;
};
