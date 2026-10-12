import { api } from "@/services/api";

export type AdminUserStatus =
  | "ACTIVE"
  | "PENDING_VERIFICATION"
  | "SUSPENDED"
  | "DELETED";
export type AdminUserRole = "USER" | "ADMIN";

export interface AdminUser {
  id: string;
  email: string;
  role: AdminUserRole;
  status: AdminUserStatus;
  emailVerifiedAt: string | null;
  phoneVerifiedAt: string | null;
  lastLoginAt: string | null;
  deletedAt: string | null;
  premiumActiveUntil: string | null;
  trustScore: number | null;
  trustLevel: string | null;
  createdAt: string;
  updatedAt: string;
  profile: {
    id: string;
    username: string | null;
    displayName: string | null;
    avatarUrl: string | null;
  } | null;
  ambassador: { id: string; status: string } | null;
}

export interface AdminUserListResponse {
  value: AdminUser[];
  Count: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminUserStatistics {
  total: number;
  active: number;
  suspended: number;
  pendingVerification: number;
  deleted: number;
  premiumActive: number;
  ambassadors: number;
}

interface AdminUserQuery {
  page: number;
  limit?: number;
  search?: string;
  status?: AdminUserStatus;
  role?: AdminUserRole;
}

export const adminUserService = {
  list(query: AdminUserQuery): Promise<AdminUserListResponse> {
    const params = new URLSearchParams({
      page: String(query.page),
      limit: String(query.limit ?? 20),
    });
    if (query.search?.trim()) params.set("search", query.search.trim());
    if (query.status) params.set("status", query.status);
    if (query.role) params.set("role", query.role);
    return api(`/admin/users?${params.toString()}`) as Promise<AdminUserListResponse>;
  },
  statistics(): Promise<AdminUserStatistics> {
    return api("/admin/users/statistics") as Promise<AdminUserStatistics>;
  },
  get(id: string): Promise<AdminUser> {
    return api(`/admin/users/${encodeURIComponent(id)}`) as Promise<AdminUser>;
  },
  suspend(id: string): Promise<AdminUser> {
    return api(`/admin/users/${encodeURIComponent(id)}/suspend`, {
      method: "PATCH",
    }) as Promise<AdminUser>;
  },
  reactivate(id: string): Promise<AdminUser> {
    return api(`/admin/users/${encodeURIComponent(id)}/reactivate`, {
      method: "PATCH",
    }) as Promise<AdminUser>;
  },
};
