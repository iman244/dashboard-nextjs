export enum PatientSessionStatus {
  Loading = "loading",
  Authenticated = "authenticated",
  Unauthenticated = "unauthenticated",
}

export type PatientSessionContextType = {
  status: PatientSessionStatus;
  nationalId: string | null;
  sessionId: string | null;
  signIn: (tokens: { access: string; refresh: string }, nationalId: string) => void;
  signOut: () => void;
};
