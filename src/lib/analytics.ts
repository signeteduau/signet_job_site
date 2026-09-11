type AnalyticsParams = Record<string, string | number | boolean | undefined>;

type AnalyticsApi = {
  logEvent: (
    instance: unknown,
    name: string,
    params?: AnalyticsParams
  ) => void;
  setUserId: (instance: unknown, uid: string | null) => void;
  setUserProperties: (
    instance: unknown,
    properties: Record<string, string>
  ) => void;
};

let analytics: unknown = null;
let api: AnalyticsApi | null = null;
let initPromise: Promise<unknown | null> | null = null;

function enableDebugOnLocalhost() {
  if (typeof window === "undefined") return;
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") {
    (window as Window & { FIREBASE_ANALYTICS_DEBUG_MODE?: boolean }).FIREBASE_ANALYTICS_DEBUG_MODE =
      true;
  }
}

export function initFirebaseAnalytics(): Promise<unknown | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (analytics) return Promise.resolve(analytics);
  if (!initPromise) {
    initPromise = (async () => {
      enableDebugOnLocalhost();
      const analyticsMod = await import("firebase/analytics");
      const { default: app } = await import("@/lib/firebase");
      if (!(await analyticsMod.isSupported())) return null;
      analytics = analyticsMod.getAnalytics(app);
      api = {
        logEvent: analyticsMod.logEvent as AnalyticsApi["logEvent"],
        setUserId: analyticsMod.setUserId as AnalyticsApi["setUserId"],
        setUserProperties:
          analyticsMod.setUserProperties as AnalyticsApi["setUserProperties"],
      };
      return analytics;
    })().catch((err) => {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Firebase Analytics failed to start", err);
      }
      return null;
    });
  }
  return initPromise;
}

export async function logAnalyticsEvent(
  name: string,
  params?: AnalyticsParams
): Promise<void> {
  const instance = await initFirebaseAnalytics();
  if (!instance || !api) return;
  try {
    api.logEvent(instance, name, params);
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Firebase Analytics event failed", name, err);
    }
  }
}

export async function setAnalyticsUser(
  uid: string | null,
  properties?: Record<string, string>
): Promise<void> {
  const instance = await initFirebaseAnalytics();
  if (!instance || !api) return;
  try {
    api.setUserId(instance, uid);
    if (properties) api.setUserProperties(instance, properties);
  } catch {
    /* ignore */
  }
}
