import apiClient from '../api';
import {
  ApiResponse,
  Transaction,
  PaginatedResponse,
} from '../../types';

export interface Plan {
  _id: string;
  plan: 'free' | 'basic' | 'premium';
  name: string;
  price: number;
  duration: number;
  features: string[];
  isActive: boolean;
  priceHistory: Array<{
    price: number;
    changedAt: string;
    changedBy: string;
    reason: string;
  }>;
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
}

export interface PromoCode {
  _id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  applicablePlans: string[];
  maxUsageCount: number;
  maxUsagePerUser: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ValidatePromoResponse {
  isValid: boolean;
  promoCode?: PromoCode;
  pricing?: {
    originalPrice: number;
    discountAmount: number;
    finalAmount: number;
    savingsPercentage: number;
  };
  code?: string;
  originalPrice?: number;
  discountAmount?: number;
  finalAmount?: number;
  savingsPercentage?: number;
}

export interface InitializePaymentRequest {
  plan: 'basic' | 'premium';
  promoCode?: string;
}

export interface InitializePaymentResponse {
  authorization_url: string;
  access_code?: string;
  reference?: string;
  pricing: {
    originalPrice: number;
    discountAmount?: number;
    finalAmount: number;
    savingsPercentage?: number;
  };
}

export interface VerifyPaymentResponse {
  transaction: Transaction & {
    status: 'success' | 'failed' | 'pending';
  };
  updatedUserPlan?: string;
  planExpiresAt?: string;
}

export interface PaymentStatusResponse {
  reference: string;
  status: 'success' | 'failed' | 'pending';
  amount: number;
  paidAt?: string;
  plan: 'basic' | 'premium';
}

const unwrapPayload = <T = any>(payload: any): T => {
  if (payload && typeof payload === 'object') {
    if ('data' in payload && payload.data !== undefined) {
      return unwrapPayload<T>(payload.data);
    }
    if ('result' in payload && payload.result !== undefined) {
      return unwrapPayload<T>(payload.result);
    }
  }
  return payload as T;
};

const normalizePlanType = (value: unknown): 'free' | 'basic' | 'premium' => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'premium') return 'premium';
  if (normalized === 'basic') return 'basic';
  return 'free';
};

const extractArray = (payload: any): any[] => {
  const resolved = unwrapPayload<any>(payload);
  if (Array.isArray(resolved)) return resolved;
  if (!resolved || typeof resolved !== 'object') return [];
  if (Array.isArray(resolved.data)) return resolved.data;
  if (Array.isArray(resolved.items)) return resolved.items;
  if (Array.isArray(resolved.results)) return resolved.results;
  if (Array.isArray(resolved.plans)) return resolved.plans;
  return [];
};

export const paymentService = {
  // Get all available plans
  async getPlans(): Promise<Plan[]> {
    try {
      const response = await apiClient.get<ApiResponse<Plan[] | { plans: Plan[] }>>(
        '/api/payments/plans'
      );
      const plans = extractArray(response.data);

      return plans.map((plan: any) => {
        const planType = normalizePlanType(plan?.plan ?? plan?.slug ?? plan?.type ?? plan?.name);
        const activeState =
          typeof plan?.isActive === 'boolean'
            ? plan.isActive
            : typeof plan?.active === 'boolean'
            ? plan.active
            : String(plan?.status || '').toLowerCase() === 'active';

        return {
          _id: String(plan?._id ?? plan?.id ?? planType),
          plan: planType,
          name: String(plan?.name ?? planType).trim(),
          price: Number(plan?.price ?? plan?.amount ?? 0) || 0,
          duration: Number(plan?.duration ?? plan?.durationInDays ?? 30) || 30,
          features: Array.isArray(plan?.features) ? plan.features : [],
          isActive: activeState || planType !== 'free',
          priceHistory: Array.isArray(plan?.priceHistory) ? plan.priceHistory : [],
          lastUpdated: String(plan?.lastUpdated ?? plan?.updatedAt ?? new Date().toISOString()),
          createdAt: String(plan?.createdAt ?? new Date().toISOString()),
          updatedAt: String(plan?.updatedAt ?? new Date().toISOString()),
        } as Plan;
      });
    } catch (error: any) {
      console.error('[payment.service] Error fetching plans:', {
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message,
      });
      return [];
    }
  },

  // Validate promo code before payment
  async validatePromo(promoCode: string, plan: 'basic' | 'premium'): Promise<ValidatePromoResponse> {
    const response = await apiClient.post<ApiResponse<ValidatePromoResponse>>(
      '/api/payments/validate-promo',
      { promoCode, plan }
    );
    const payload: any = unwrapPayload(response.data) ?? {};
    const pricing = payload?.pricing ?? payload?.price ?? payload?.amounts ?? {};

    return {
      ...payload,
      isValid: Boolean(payload?.isValid ?? true),
      code: payload?.code ?? payload?.promoCode?.code ?? promoCode,
      promoCode: payload?.promoCode,
      pricing: {
        originalPrice: Number(pricing?.originalPrice ?? payload?.originalPrice ?? 0) || 0,
        discountAmount: Number(pricing?.discountAmount ?? payload?.discountAmount ?? 0) || 0,
        finalAmount: Number(pricing?.finalAmount ?? payload?.finalAmount ?? 0) || 0,
        savingsPercentage: Number(pricing?.savingsPercentage ?? payload?.savingsPercentage ?? 0) || 0,
      },
      originalPrice: Number(pricing?.originalPrice ?? payload?.originalPrice ?? 0) || 0,
      discountAmount: Number(pricing?.discountAmount ?? payload?.discountAmount ?? 0) || 0,
      finalAmount: Number(pricing?.finalAmount ?? payload?.finalAmount ?? 0) || 0,
      savingsPercentage: Number(pricing?.savingsPercentage ?? payload?.savingsPercentage ?? 0) || 0,
    };
  },

  // Initialize payment (get Paystack URL)
  async initializePayment(data: InitializePaymentRequest): Promise<InitializePaymentResponse> {
    const response = await apiClient.post<ApiResponse<InitializePaymentResponse>>(
      '/api/payments/initialize',
      data
    );
    const payload: any = unwrapPayload(response.data) ?? {};
    const pricing = payload?.pricing ?? payload?.price ?? payload?.amounts ?? {};
    const authorizationUrl =
      payload?.authorization_url ??
      payload?.authorizationUrl ??
      payload?.checkout_url ??
      payload?.checkoutUrl ??
      payload?.url ??
      '';
    const reference = payload?.reference ?? payload?.paymentReference ?? payload?.tx_ref ?? payload?.txRef;

    return {
      ...payload,
      authorization_url: authorizationUrl,
      reference,
      pricing: {
        originalPrice: Number(pricing?.originalPrice ?? payload?.originalPrice ?? 0) || 0,
        discountAmount: Number(pricing?.discountAmount ?? payload?.discountAmount ?? 0) || 0,
        finalAmount: Number(pricing?.finalAmount ?? payload?.finalAmount ?? 0) || 0,
        savingsPercentage: Number(pricing?.savingsPercentage ?? payload?.savingsPercentage ?? 0) || 0,
      },
    };
  },

  // POST /payments/verify
  async verifyPayment(reference: string): Promise<VerifyPaymentResponse> {
    const response = await apiClient.post<ApiResponse<VerifyPaymentResponse>>(
      '/api/payments/verify',
      { reference }
    );
    return unwrapPayload<VerifyPaymentResponse>(response.data);
  },

  // GET /payments/status/:reference
  async checkPaymentStatus(reference: string): Promise<PaymentStatusResponse> {
    const response = await apiClient.get<ApiResponse<PaymentStatusResponse>>(
      `/api/payments/status/${reference}`
    );
    return unwrapPayload<PaymentStatusResponse>(response.data);
  },

  // Get transaction history
  async getTransactions(page = 1, limit = 10): Promise<PaginatedResponse<Transaction>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Transaction>>>(
      '/api/payments/transactions',
      { params: { page, limit } }
    );
    const payload: any = response.data?.data;

    if (Array.isArray(payload)) {
      return {
        data: payload,
        total: payload.length,
        page,
        limit,
        totalPages: 1,
      };
    }

    const list =
      payload?.data ??
      payload?.transactions ??
      payload?.items ??
      payload?.results ??
      [];

    const normalizedList = Array.isArray(list) ? list : [];

    return {
      data: normalizedList,
      total: Number(payload?.total ?? payload?.count ?? normalizedList.length) || normalizedList.length,
      page: Number(payload?.page ?? payload?.currentPage ?? page) || page,
      limit: Number(payload?.limit ?? payload?.perPage ?? limit) || limit,
      totalPages: Number(payload?.totalPages ?? payload?.pages ?? 1) || 1,
    };
  },

  // Get single transaction
  async getTransaction(transactionId: string): Promise<Transaction> {
    const response = await apiClient.get<ApiResponse<Transaction>>(
      `/api/payments/transactions/${transactionId}`
    );
    return unwrapPayload<Transaction>(response.data);
  },
};
