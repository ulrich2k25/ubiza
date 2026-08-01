export interface CamPayCollectRequest {
  amount: string;
  currency: 'XAF';
  from: string;
  description: string;
  external_reference: string;
}

export interface CamPayCollectResponse {
  reference: string;
  external_reference?: string;
  status: string;
  amount?: number | string;
  currency?: string;
  operator?: string;
  code?: string;
  message?: string;
  ussd_code?: string;
  signature?: string;
}

export interface CamPayTransactionStatusResponse {
  reference: string;
  external_reference?: string;
  status: string;
  amount?: number | string;
  currency?: string;
  operator?: string;
  code?: string;
  message?: string;
  signature?: string;
}

export interface CamPayWebhookPayload {
  reference?: string;
  external_reference?: string;
  status?: string;
  amount?: number | string;
  currency?: string;
  operator?: string;
  code?: string;
  message?: string;
  signature?: string;
}
