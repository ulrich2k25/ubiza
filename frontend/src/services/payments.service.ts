import { api } from "@/services/api";

export type PremiumPlan = "DAY_1" | "DAYS_7" | "DAYS_30";
export type BoostDuration = "MINUTES_60";
export type CheckoutProvider = "FAPSHI" | "SASPAY";

export type PaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "SUCCESS"
  | "FAILED"
  | "CANCELLED"
  | "EXPIRED";

export type PaymentProvider = "CAMPAY" | "MANUAL" | "PAYMENT_PLATFORM";

export interface Payment {
  id: string;
  provider: PaymentProvider;
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
  checkoutUrl?: string | null;
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

export interface AdminPayment extends Payment {
  providerData: {
    description?: string;
    premiumPlan?: PremiumPlan | null;
    boostDurationMinutes?: number | null;

    paymentPlatform?: {
      paymentId?: string | null;
      provider?: string | null;
      providerReference?: string | null;
      checkoutUrl?: string | null;
      status?: string | null;
    };

    manualPayment?: {
      operator?: string;
      payerPhone?: string;
      transactionReference?: string;
      submittedAt?: string;
    };
  } | null;

  createdAt: string;

  user: {
    id: string;
    email: string;
  };
}

export const paymentsService = {
  createPremium(
    premiumPlan: PremiumPlan,
    customerPhone?: string,
    provider: CheckoutProvider = "FAPSHI",
  ): Promise<PaymentResponse> {
    return api("/payments", {
      method: "POST",
      body: JSON.stringify({
        purpose: "PREMIUM",
        premiumPlan,
        customerPhone: customerPhone?.trim() || undefined,
        provider,
      }),
    });
  },

  createBoost(
    boostDuration: BoostDuration,
    customerPhone?: string,
    provider: CheckoutProvider = "FAPSHI",
  ): Promise<PaymentResponse> {
    return api("/payments", {
      method: "POST",
      body: JSON.stringify({
        purpose: "BOOST",
        boostDuration,
        customerPhone: customerPhone?.trim() || undefined,
        provider,
      }),
    });
  },
  getPaymentsForAdmin(status?: PaymentStatus): Promise<AdminPayment[]> {
    const query = status ? `?status=${encodeURIComponent(status)}` : "";

    return api(`/admin/payments${query}`);
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
