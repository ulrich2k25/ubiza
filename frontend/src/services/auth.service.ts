import { api } from "@/services/api";

export const authService = {
  verifyEmail(token: string): Promise<{ message: string }> {
    return api(`/auth/verify-email/${token}`, {
      method: "POST",
    });
  },
};
