import { api } from "@/services/api";

export type PremiumPlan = "DAY_1" | "DAYS_7" | "DAYS_30";
export type BoostDuration = "MINUTES_60";

export interface Payment {
  id: string;
  provider: string;
  purpose: "PREMIUM" | "BOOST";
  status:
    | "PENDING"
    | "PROCESSING"
    | "SUCCESS"
    | "FAILED"
    | "CANCELLED"
    | "EXPIRED";
  amount: string;
  externalReference: string;
  customerPhone: string | null;
  expiresAt: string;
  initiatedAt: string;
  currency: {
    code: string;
    symbol: string;
  };
}

export interface PaymentResponse {
  message: string;
  payment: Payment;
}

export interface ManualConfirmationResponse {
  message: string;
  alreadyConfirmed: boolean;

  payment: {
    id: string;
    status: string;
    paidAt: string;
    providerTransactionId: string;
  };

  premiumSubscription: {
    id: string;
    plan: string;
    status: string;
    startsAt: string;
    endsAt: string;
    amount: string;
  } | null;

  boost: {
    id: string;
    status: string;
    durationMinutes: number;
    startsAt: string;
    endsAt: string;
    amount: string;
  } | null;
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

  confirm(paymentId: string): Promise<ManualConfirmationResponse> {
    return api(`/payments/${paymentId}/manual-confirm`, {
      method: "POST",
      headers: {
        "x-manual-payment-secret": "ubiza-local-payment-secret-2026",
      },
    });
  },

  getPricing(): Promise<PricingResponse> {
    return api("/payments/pricing");
  },

  getOne(paymentId: string) {
    return api(`/payments/${paymentId}`);
  },

  getMine() {
    return api("/payments/me");
  },
};
