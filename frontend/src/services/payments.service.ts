import { api } from "@/services/api";

export type PremiumPlan = "DAY_1" | "DAYS_7" | "DAYS_30";
export type BoostDuration = "MINUTES_60";

export type PaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "SUCCESS"
  | "FAILED"
  | "CANCELLED"
  | "EXPIRED";

export interface Payment {
  id: string;
  provider: "CAMPAY" | "MANUAL";
  purpose: "PREMIUM" | "BOOST";
  status: PaymentStatus;
  amount: string;
  externalReference: string | null;
  providerTransactionId?: string | null;
  customerPhone: string | null;
  failureReason?: string | null;
  paidAt?: string | null;
  failedAt?: string | null;
  cancelledAt?: string | null;
  expiresAt: string | null;
  initiatedAt: string;
  currency: {
    code: string;
    symbol: string;
  };
}

export interface CamPayInitiation {
  reference: string;
  status?: string | null;
  operator?: string | null;
  ussdCode?: string | null;
}

export interface PaymentResponse {
  message: string;
  payment: Payment;
  campay?: CamPayInitiation;
}

export interface PricingResponse {
  premium: {
    plan: PremiumPlan;
    amount: number;
  }[];

  boost: {
    duration: BoostDuration;
    amount: number;
  }[];
}

export const paymentsService = {
  createPremium(
    premiumPlan: PremiumPlan,
    customerPhone: string,
  ): Promise<PaymentResponse> {
    return api("/payments", {
      method: "POST",
      body: JSON.stringify({
        purpose: "PREMIUM",
        premiumPlan,
        customerPhone,
      }),
    });
  },

  createBoost(
    boostDuration: BoostDuration,
    customerPhone: string,
  ): Promise<PaymentResponse> {
    return api("/payments", {
      method: "POST",
      body: JSON.stringify({
        purpose: "BOOST",
        boostDuration,
        customerPhone,
      }),
    });
  },

  getPricing(): Promise<PricingResponse> {
    return api("/payments/pricing");
  },

  getOne(paymentId: string): Promise<Payment> {
    return api(`/payments/${paymentId}`);
  },

  getMine(): Promise<Payment[]> {
    return api("/payments/me");
  },
};
