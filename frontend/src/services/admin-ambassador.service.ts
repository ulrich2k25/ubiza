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

export interface AdminAmbassador extends Ambassador {
  pendingBalance: number;
  availableBalance: number;
  paidBalance: number;
  totalEarnings: number;

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
      status: string;
      createdAt: string;
      paidAt: string | null;
    };
  }>;
}

interface AdminAmbassadorsApiResponse {
  value?: AdminAmbassador[];
  Count?: number;
}

interface AdminPayoutsApiResponse {
  value?: AdminAmbassadorPayout[];
  Count?: number;
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
};
