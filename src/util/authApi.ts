import { backendUrl } from "./backendConfig";

export interface SignUpPayload {
  name: string;
  lastName: string;
  email: string;
  password: string;
}

export interface SignInPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    lastName?: string;
    email: string;
  };
  token: string;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

export const authApi = {
  signup: async (payload: SignUpPayload): Promise<AuthResponse> => {
    const res = await fetch(`${backendUrl}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.text().catch(() => "Sign up failed");
      throw new Error(err || "Sign up failed");
    }
    return res.json();
  },

  signin: async (payload: SignInPayload): Promise<AuthResponse> => {
    const res = await fetch(`${backendUrl}/api/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.text().catch(() => "Sign in failed");
      throw new Error(err || "Sign in failed");
    }
    return res.json();
  },

  getMe: async (): Promise<AuthResponse["user"]> => {
    const res = await fetch(`${backendUrl}/api/auth/me`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.text().catch(() => "Not authenticated");
      throw new Error(err || "Not authenticated");
    }
    return res.json();
  },

  logout: async (): Promise<void> => {
    const res = await fetch(`${backendUrl}/api/auth/logout`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.text().catch(() => "Logout failed");
      throw new Error(err || "Logout failed");
    }
  },
};
