import { api } from "@/services/api";

import type {
  Ambassador,
  AmbassadorStatus,
} from "@/services/ambassador.service";

export type AdminPayoutStatus =
  | "PENDING"
  | "PROCESSING"
  | "PAID"
  | "FAILED"
  | "CANCELLED";

export type AdminCommissionStatus =
  | "PENDING"
  | "APPROVED"
  | "PAID"
  | "CANCELLED";

export interface AdminAmbassador extends Ambassador {
  pendingBalance: number;
  availableBalance: number;
  paidBalance: number;
  totalEarnings: number;
  activePayoutStatus: "PENDING" | "PROCESSING" | null;
  user: {
    id: string;
    email: string;
    status: string;
    createdAt: string;

    profile: {
      username: string | null;
      displayName: string | null;
    } | null;
  };

  _count: {
    referrals: number;
    commissions: number;
    payouts: number;
  };
}

export interface AdminAmbassadorPayout {
  id: string;
  ambassadorId: string;
  currencyId: string;

  amount: number | string;
  status: AdminPayoutStatus;

  paymentReference: string | null;

  requestedAt: string;
  processedAt: string | null;
  paidAt: string | null;

  createdAt?: string;
  updatedAt?: string;

  ambassador: {
    id: string;
    fullName: string;
    country: string;
    mobileMoneyNumber: string;
    referralCode: string | null;
    identityVerifiedAt: string | null;

    user: {
      id: string;
      email: string;

      profile: {
        username: string | null;
        displayName: string | null;
      } | null;
    };
  };

  currency: {
    id: string;
    code: string;
    name?: string;
    symbol?: string | null;
  };

  items: Array<{
    id: string;
    payoutId: string;
    commissionId: string;

    commission: {
      id: string;
      amount: number | string;
      status: AdminCommissionStatus;
      createdAt: string;
      paidAt: string | null;
    };
  }>;
}

export interface AdminCommission {
  id: string;
  ambassadorId?: string;
  referralId?: string;
  paymentId?: string;
  currencyId?: string;

  amount: number | string;
  status: AdminCommissionStatus;

  createdAt: string;
  updatedAt?: string;

  approvedAt: string | null;
  paidAt: string | null;

  cancelledAt: string | null;
  cancellationReason: string | null;
  cancelledByAdminId: string | null;

  ambassador: {
    id: string;
    fullName: string;
    referralCode: string | null;
  };

  referral: {
    id: string;

    referredUser: {
      id: string;
      email: string;

      profile: {
        username: string | null;
        displayName: string | null;
      } | null;
    };
  };

  payment: {
    id: string;
    amount: number | string;
    purpose: string;
    status: string;
    paidAt: string | null;
  };

  currency: {
    id: string;
    code: string;
    symbol: string | null;
  };
}

interface AdminCommissionsApiResponse {
  value?: AdminCommission[];
}

interface AdminAmbassadorsApiResponse {
  value?: AdminAmbassador[];
  Count?: number;
}

interface AdminPayoutsApiResponse {
  value?: AdminAmbassadorPayout[];
  Count?: number;
}

export interface ApproveEligibleCommissionsResponse {
  message: string;
  approvedCount: number;
  approvedAmount: number;
  approvalDelayDays: number;
}

export const adminAmbassadorService = {
  async getAll(status?: AmbassadorStatus): Promise<AdminAmbassador[]> {
    const query = status ? `?status=${encodeURIComponent(status)}` : "";

    const response = (await api(`/admin/ambassadors${query}`)) as
      | AdminAmbassadorsApiResponse
      | AdminAmbassador[];

    if (Array.isArray(response)) {
      return response;
    }

    return Array.isArray(response.value) ? response.value : [];
  },

  getOne(id: string): Promise<AdminAmbassador> {
    return api(`/admin/ambassadors/${id}`);
  },

  approve(id: string): Promise<AdminAmbassador> {
    return api(`/admin/ambassadors/${id}/approve`, {
      method: "PATCH",
    });
  },

  reject(id: string, reason: string): Promise<AdminAmbassador> {
    return api(`/admin/ambassadors/${id}/reject`, {
      method: "PATCH",
      body: JSON.stringify({
        reason,
      }),
    });
  },

  suspend(id: string): Promise<AdminAmbassador> {
    return api(`/admin/ambassadors/${id}/suspend`, {
      method: "PATCH",
    });
  },

  reactivate(id: string): Promise<AdminAmbassador> {
    return api(`/admin/ambassadors/${id}/reactivate`, {
      method: "PATCH",
    });
  },

  verifyIdentity(id: string): Promise<AdminAmbassador> {
    return api(`/admin/ambassadors/${id}/verify-identity`, {
      method: "PATCH",
    });
  },

  async getAllPayouts(
    status?: AdminPayoutStatus,
  ): Promise<AdminAmbassadorPayout[]> {
    const query = status ? `?status=${encodeURIComponent(status)}` : "";

    const response = (await api(`/admin/ambassadors/payouts/all${query}`)) as
      | AdminPayoutsApiResponse
      | AdminAmbassadorPayout[];

    if (Array.isArray(response)) {
      return response;
    }

    return Array.isArray(response.value) ? response.value : [];
  },

  startPayout(payoutId: string): Promise<AdminAmbassadorPayout> {
    return api(`/admin/ambassadors/payouts/${payoutId}/start`, {
      method: "PATCH",
    });
  },

  markPayoutAsPaid(
    payoutId: string,
    paymentReference?: string,
  ): Promise<AdminAmbassadorPayout> {
    return api(`/admin/ambassadors/payouts/${payoutId}/paid`, {
      method: "PATCH",
      body: JSON.stringify({
        paymentReference: paymentReference?.trim() || undefined,
      }),
    });
  },

  rejectPayout(
    payoutId: string,
    reason: string,
  ): Promise<AdminAmbassadorPayout> {
    return api(`/admin/ambassadors/payouts/${payoutId}/reject`, {
      method: "PATCH",
      body: JSON.stringify({
        reason: reason.trim(),
      }),
    });
  },

  async getAllCommissions(): Promise<AdminCommission[]> {
    const response = (await api("/admin/ambassadors/commissions")) as
      | AdminCommission[]
      | AdminCommissionsApiResponse;

    if (Array.isArray(response)) {
      return response;
    }

    return Array.isArray(response.value) ? response.value : [];
  },

  approveEligibleCommissions(): Promise<ApproveEligibleCommissionsResponse> {
    return api("/admin/ambassadors/commissions/approve-eligible", {
      method: "PATCH",
    });
  },

  approveCommission(commissionId: string): Promise<AdminCommission> {
    return api(`/admin/ambassadors/commissions/${commissionId}/approve`, {
      method: "PATCH",
    });
  },

  cancelCommission(
    commissionId: string,
    reason: string,
  ): Promise<AdminCommission> {
    return api(`/admin/ambassadors/commissions/${commissionId}/cancel`, {
      method: "PATCH",
      body: JSON.stringify({
        reason: reason.trim(),
      }),
    });
  },
};
