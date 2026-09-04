import { PATIENT_SESSION_KEY } from "@/settings";

type Listener = () => void;

const listeners = new Set<Listener>();

const emit = () => {
  listeners.forEach((listener) => listener());
};

/**
 * `storage` only fires for *other* tabs, so same-tab writes have to notify the
 * listener set by hand. Both are wired up here so a sign-out in one tab also
 * drops the other tab's session.
 */
export const subscribe = (listener: Listener) => {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
};

export const getSnapshot = () => sessionStorage.getItem(PATIENT_SESSION_KEY);

export const getServerSnapshot = () => null;

export const setStoredNationalId = (nationalId: string) => {
  sessionStorage.setItem(PATIENT_SESSION_KEY, nationalId);
  emit();
};

export const clearStoredNationalId = () => {
  sessionStorage.removeItem(PATIENT_SESSION_KEY);
  emit();
};

/**
 * A store that never changes, used only to tell a hydrated render from a server
 * one. Without it an unauthenticated snapshot on the server is indistinguishable
 * from a real "no session", and the guards redirect before the store is readable.
 */
const noopSubscribe = () => () => {};

export const hydrationStore = {
  subscribe: noopSubscribe,
  getSnapshot: () => true,
  getServerSnapshot: () => false,
};
