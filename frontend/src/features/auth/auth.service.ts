import { api } from "@/services/api";

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username: string;
  referralCode?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: "USER" | "ADMIN";
}

interface AuthMeResponse {
  message: string;
  user: AuthUser;
}

export const authService = {
  async register(data: RegisterData) {
    return api("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async login(data: LoginData) {
    const response = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (response.accessToken) {
      localStorage.setItem("token", response.accessToken);
    }

    return response;
  },

  async me(): Promise<AuthUser> {
    const response = (await api("/auth/me")) as AuthMeResponse;

    return response.user;
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    return api("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({
        email,
      }),
    });
  },

  async resetPassword(
    token: string,
    password: string,
  ): Promise<{ message: string }> {
    return api("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({
        token,
        password,
      }),
    });
  },

  logout() {
    localStorage.removeItem("token");
  },
};
