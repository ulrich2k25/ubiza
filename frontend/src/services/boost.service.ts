import { api } from "@/services/api";

export interface BoostStatus {
  boostCredits: number;
  boostActiveUntil: string | null;
  isBoostActive: boolean;
}

export const boostService = {
  activate(): Promise<{
    message: string;
    remainingCredits: number;
    boostActiveUntil: string;
  }> {
    return api("/boosts/activate", {
      method: "POST",
    });
  },

  getStatus(): Promise<BoostStatus> {
    return api("/boosts/status");
  },
};

