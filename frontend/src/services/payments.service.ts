import { api } from "@/services/api";

export type PremiumPlan = "DAY_1" | "DAYS_7" | "DAYS_30";
export type BoostDuration = "MINUTES_60";
export type ManualPaymentOperator = "MTN" | "ORANGE";

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

export interface AdminManualPayment extends Payment {
  providerData: {
    description?: string;
    premiumPlan?: PremiumPlan | null;
    boostDurationMinutes?: number | null;
    manualPayment?: {
      operator?: ManualPaymentOperator;
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

export interface RejectManualPaymentResponse {
  message: string;
  paymentId: string;
  status: "FAILED";
  failureReason: string;
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

  createManualPremium(
    premiumPlan: PremiumPlan,
    operator: ManualPaymentOperator,
    payerPhone: string,
    transactionReference: string,
  ): Promise<PaymentResponse> {
    return api("/payments/manual", {
      method: "POST",
      body: JSON.stringify({
        purpose: "PREMIUM",
        premiumPlan,
        operator,
        payerPhone,
        transactionReference,
      }),
    });
  },

  createManualBoost(
    boostDuration: BoostDuration,
    operator: ManualPaymentOperator,
    payerPhone: string,
    transactionReference: string,
  ): Promise<PaymentResponse> {
    return api("/payments/manual", {
      method: "POST",
      body: JSON.stringify({
        purpose: "BOOST",
        boostDuration,
        operator,
        payerPhone,
        transactionReference,
      }),
    });
  },

  getManualPaymentsForAdmin(
    status?: PaymentStatus,
  ): Promise<AdminManualPayment[]> {
    const query = status ? `?status=${encodeURIComponent(status)}` : "";

    return api(`/admin/payments${query}`);
  },

  approveManualPayment(paymentId: string) {
    return api(`/admin/payments/${paymentId}/approve`, {
      method: "PATCH",
    });
  },

  rejectManualPayment(
    paymentId: string,
    reason: string,
  ): Promise<RejectManualPaymentResponse> {
    return api(`/admin/payments/${paymentId}/reject`, {
      method: "PATCH",
      body: JSON.stringify({
        reason,
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
