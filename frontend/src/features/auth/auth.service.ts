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
  referralCode?: string;
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

    if (response.access_token) {
      localStorage.setItem("token", response.access_token);
    }

    return response;
  },

  async me() {
    return api("/auth/me");
  },

  logout() {
    localStorage.removeItem("token");
  },
};
