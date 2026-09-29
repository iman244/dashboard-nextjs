import { isAxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios";

declare module "axios" {
  export interface AxiosRequestConfig {
    /** Set on the one retry after a refresh, so a second 401 is final. */
    refreshedAfter401?: boolean;
  }
}

type Options = {
  /** The refresh endpoint, relative to the instance's baseURL. */
  path: string;
  getRefresh: () => string | null;
  setAccess: (access: string) => void;
};

/**
 * Refreshes an expired access token and retries the request, once.
 *
 * The app's other refresh path only sees requests made through React Query
 * (it listens to the query and mutation caches). Anything called directly --
 * the image uploads' presign, one per file, in a loop -- used to show
 * "Given token not valid for any token type" as soon as the access token
 * expired mid-form. Here every authorized request gets the same treatment.
 *
 * Requests that fail together share one refresh: several uploads, or a page's
 * parallel queries, must not each spend the refresh token. If the refresh
 * fails, the original 401 is returned, and the React Query path signs the
 * user out as before.
 */
export const refreshOn401 = (instance: AxiosInstance, options: Options) => {
  let inFlight: Promise<void> | null = null;

  const refresh = () => {
    inFlight ??= (async () => {
      const token = options.getRefresh();
      if (!token) throw new Error("no refresh token");
      const response = await instance.post<{ access: string }>(options.path, {
        refresh: token,
      });
      options.setAccess(response.data.access);
    })().finally(() => {
      inFlight = null;
    });
    return inFlight;
  };

  instance.interceptors.response.use(undefined, async (error) => {
    const config = (isAxiosError(error) ? error.config : undefined) as
      | InternalAxiosRequestConfig
      | undefined;
    if (
      !isAxiosError(error) ||
      error.response?.status !== 401 ||
      !config?.withAuthorization ||
      config.refreshedAfter401
    ) {
      throw error;
    }
    try {
      await refresh();
    } catch {
      throw error;
    }
    // The request interceptor reads the new access token as it re-sends.
    return instance({ ...config, refreshedAfter401: true });
  });
};
