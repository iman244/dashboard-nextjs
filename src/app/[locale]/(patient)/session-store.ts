export const getServerSnapshot = () => null;

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
