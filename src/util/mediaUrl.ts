import { backendUrl } from "./backendConfig";

export const resolveMediaUrl = (input?: string): string => {
  if (!input) return "";
  if (/^https?:\/\//i.test(input)) return input;
  if (/^\/\//.test(input)) return `https:${input}`;

  const base = backendUrl.endsWith("/") ? backendUrl : `${backendUrl}/`;
  const relative = input.startsWith("/") ? input.slice(1) : input;

  try {
    return new URL(relative, base).toString();
  } catch {
    return input;
  }
};
