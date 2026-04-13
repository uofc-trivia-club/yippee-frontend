const backendTarget = (process.env.REACT_APP_BACKEND_TARGET || "local").toLowerCase();

const isProductionTarget = backendTarget === "production" || backendTarget === "railway";

const requireEnv = (value: string | undefined, keyName: string) => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${keyName}`);
  }
  return value;
};

export const backendUrl = isProductionTarget
  ? requireEnv(
      process.env.REACT_APP_BACKEND_URL_PRODUCTION || process.env.REACT_APP_BACKEND_URL,
      "REACT_APP_BACKEND_URL_PRODUCTION"
    )
  : requireEnv(
      process.env.REACT_APP_BACKEND_URL_LOCAL || process.env.REACT_APP_BACKEND_URL,
      "REACT_APP_BACKEND_URL_LOCAL"
    );

export const wsUrl = isProductionTarget
  ? requireEnv(
      process.env.REACT_APP_WS_URL_PRODUCTION || process.env.REACT_APP_WS_URL,
      "REACT_APP_WS_URL_PRODUCTION"
    )
  : requireEnv(
      process.env.REACT_APP_WS_URL_LOCAL || process.env.REACT_APP_WS_URL,
      "REACT_APP_WS_URL_LOCAL"
    );
