const backendTarget = (
  process.env.REACT_APP_BACKEND_TARGET || "local"
).toLowerCase();

const isProductionTarget =
  backendTarget === "production" || backendTarget === "railway";

const requireEnv = (value: string | undefined, keyName: string) => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${keyName}`);
  }
  return value;
};

export const backendUrl = isProductionTarget
  ? requireEnv(
      process.env.REACT_APP_BACKEND_URL_PRODUCTION ||
        process.env.REACT_APP_BACKEND_URL,
      "REACT_APP_BACKEND_URL_PRODUCTION",
    )
  : requireEnv(
      process.env.REACT_APP_BACKEND_URL_LOCAL ||
        process.env.REACT_APP_BACKEND_URL,
      "REACT_APP_BACKEND_URL_LOCAL",
    );

const deriveWsUrl = (httpUrl: string): string => {
  const wsProtocol = httpUrl.startsWith("https") ? "wss" : "ws";
  const base = httpUrl.replace(/^https?:\/\//, "");
  return `${wsProtocol}://${base}/ws`;
};

export const wsUrl = deriveWsUrl(backendUrl);
