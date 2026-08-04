import { api } from "@/services/api";

export type AmbassadorStatus = "PENDING" | "ACTIVE" | "REJECTED" | "SUSPENDED";

export interface Ambassador {
  id: string;
  userId: string;
  referralCode: string;
  status: AmbassadorStatus;

  fullName: string | null;
  mobileMoneyNumber: string | null;
  whatsappNumber: string | null;
  identityNumber: string | null;
  country: string | null;

  termsAcceptedAt: string | null;
  identityVerifiedAt: string | null;
  identityVerificationRequestedAt: string | null;

  approvedAt: string | null;
  rejectedAt: string | null;
  suspendedAt: string | null;
  rejectionReason: string | null;

  minimumPayout: string;

  pendingBalance?: number;
  availableBalance?: number;
  processingBalance?: number;
  paidBalance?: number;
  totalEarnings: number;

  createdAt: string;
  updatedAt: string;

  _count?: {
    referrals: number;
    commissions: number;
  };
}

export interface AmbassadorMeResponse {
  hasApplied: boolean;
  ambassador: Ambassador | null;
}

export interface Payout {
  id: string;
  amount: string;
  status: "PENDING" | "PROCESSING" | "PAID" | "FAILED" | "CANCELLED";

  paymentMethod: string | null;
  paymentReference: string | null;
  failureReason: string | null;

  requestedAt: string;
  processedAt: string | null;
  paidAt: string | null;
}

export interface ApplyAmbassadorPayload {
  fullName: string;
  mobileMoneyNumber: string;
  whatsappNumber: string;
  identityNumber: string;
  country: string;
  acceptTerms: boolean;
}

export const ambassadorService = {
  getMine(): Promise<AmbassadorMeResponse> {
    return api("/ambassadors/me");
  },

  apply(payload: ApplyAmbassadorPayload): Promise<Ambassador> {
    return api("/ambassadors/apply", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  requestIdentityVerification() {
    return api("/ambassadors/me/request-identity-verification", {
      method: "POST",
    });
  },

  requestPayout() {
    return api("/ambassadors/request-payout", {
      method: "POST",
    });
  },

  getMyPayouts(): Promise<Payout[]> {
    return api("/ambassadors/payouts");
  },
};
