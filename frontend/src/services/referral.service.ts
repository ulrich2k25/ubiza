import { api } from "@/services/api";

export type ReferralStatus = "REGISTERED" | "REWARDED";

export interface Referral {
  id: string;
  username: string | null;
  displayName: string | null;
  createdAt: string;

  listingStatus: string | null;
  publishedAt: string | null;

  rewardGranted: boolean;
  rewardGrantedAt: string | null;

  status: ReferralStatus;
}

export interface ReferralDashboard {
  referralCode: string;
  boostCredits: number;

  totalReferrals: number;
  rewardedReferrals: number;
  pendingReferrals: number;

  referrals: Referral[];
}

export const referralService = {
  getMine(): Promise<ReferralDashboard> {
    return api("/referrals/me");
  },
};
