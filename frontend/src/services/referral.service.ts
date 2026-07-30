import { api } from "@/services/api";

export interface Referral {
  id: string;
  username: string | null;
  displayName: string | null;
  createdAt: string;
}

export interface ReferralDashboard {
  referralCode: string;
  boostCredits: number;
  totalReferrals: number;
  referrals: Referral[];
}

export const referralService = {
  getMine(): Promise<ReferralDashboard> {
    return api("/referrals/me");
  },
};

