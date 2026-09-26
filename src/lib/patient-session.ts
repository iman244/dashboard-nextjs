/** Patient credentials never use the staff localStorage keys. */
const KEY = "patient_jwt_session_v1";
export type PatientTokens = { access: string; refresh: string };
export type PatientSession = PatientTokens & { nationalId: string; id: string };
const listeners = new Set<() => void>();
export const subscribePatientSession = (listener: () => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};
const emit = () => listeners.forEach(listener => listener());
export const patientSnapshot = () => sessionStorage.getItem(KEY);
export function parsePatientSession(raw: string | null): PatientSession | null {
  try {
    const value = JSON.parse(raw ?? "null");
    return value && [value.access, value.refresh, value.nationalId, value.id].every(v => typeof v === "string" && v.length > 0) ? value : null;
  } catch { return null; }
}
export const readPatientSession = () => parsePatientSession(patientSnapshot());
export function savePatientSession(tokens: PatientTokens, nationalId: string) {
  sessionStorage.setItem(KEY, JSON.stringify({ ...tokens, nationalId, id: crypto.randomUUID() }));
  emit();
}
export function clearPatientSession() {
  sessionStorage.removeItem(KEY);
  sessionStorage.removeItem("patient_national_id");
  emit();
}
export class PatientRequestError extends Error {
  status: number;
  constructor(status: number) { super("Patient request failed"); this.status = status; }
}
export async function authenticatePatient(base: string, nationalId: string, password: string): Promise<PatientTokens> {
  const response = await fetch(`${base}/auth/patient/jwt/create/`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ national_id: nationalId, password }), cache: "no-store",
  });
  if (!response.ok) throw new PatientRequestError(response.status);
  const tokens = await response.json();
  if (typeof tokens.access !== "string" || typeof tokens.refresh !== "string") throw new PatientRequestError(502);
  return tokens;
}
let refreshing: { id: string; promise: Promise<PatientSession> } | null = null;
async function refreshSession(base: string, original: PatientSession): Promise<PatientSession> {
  if (refreshing?.id === original.id) return refreshing.promise;
  const promise = (async () => {
    const response = await fetch(`${base}/auth/jwt/refresh/`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: original.refresh }), cache: "no-store",
    });
    if (readPatientSession()?.id !== original.id) throw new PatientRequestError(401);
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) clearPatientSession();
      throw new PatientRequestError(response.status);
    }
    const tokens = await response.json();
    if (readPatientSession()?.id !== original.id) throw new PatientRequestError(401);
    if (typeof tokens.access !== "string") throw new PatientRequestError(502);
    const next = { ...original, access: tokens.access, refresh: tokens.refresh ?? original.refresh };
    sessionStorage.setItem(KEY, JSON.stringify(next)); emit();
    return next;
  })();
  refreshing = { id: original.id, promise };
  try { return await promise; } finally { if (refreshing?.promise === promise) refreshing = null; }
}
export async function fetchPatientRecords(base: string, signal?: AbortSignal) {
  let session = readPatientSession();
  if (!session) throw new PatientRequestError(401);
  const request = (access: string) => fetch(`${base}/saderat-bank-health-monitoring/patient-records/me/`, {
    headers: { Authorization: `JWT ${access}` }, cache: "no-store", signal,
  });
  let response = await request(session.access);
  if (response.status === 401) {
    session = await refreshSession(base, session);
    response = await request(session.access);
  }
  if (readPatientSession()?.id !== session.id) throw new PatientRequestError(401);
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) clearPatientSession();
    throw new PatientRequestError(response.status);
  }
  const records = await response.json();
  if (readPatientSession()?.id !== session.id) throw new PatientRequestError(401);
  return records;
}
