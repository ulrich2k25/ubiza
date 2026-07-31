import { api } from "@/services/api";

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

interface AuthMeResponse {
  message: string;
  user: AuthUser;
}

export const authService = {
  verifyEmail(token: string): Promise<{ message: string }> {
    return api(`/auth/verify-email/${token}`, {
      method: "POST",
    });
  },

  async me(): Promise<AuthUser> {
    const response = (await api("/auth/me")) as AuthMeResponse;

    return response.user;
  },
};
