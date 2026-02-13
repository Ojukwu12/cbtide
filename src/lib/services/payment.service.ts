import apiClient from '../api';
import {
  ApiResponse,
  Transaction,
  PaginatedResponse,
} from '../../types';

export interface Plan {
  _id: string;
  plan: 'basic' | 'premium';
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
}

export interface InitializePaymentRequest {
  plan: 'basic' | 'premium';
  promoCode?: string;
}

export interface InitializePaymentResponse {
  authorization_url: string;
  access_code: string;
  reference: string;
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

export const paymentService = {
  // Get all available plans
  async getPlans(): Promise<Plan[]> {
    const response = await apiClient.get<ApiResponse<Plan[]>>(
      '/api/payments/plans'
    );
    return response.data.data;
  },

  // Validate promo code before payment
  async validatePromo(promoCode: string, plan: 'basic' | 'premium'): Promise<ValidatePromoResponse> {
    const response = await apiClient.post<ApiResponse<ValidatePromoResponse>>(
      '/api/payments/validate-promo',
      { promoCode, plan }
    );
    return response.data.data;
  },

  // Initialize payment (get Paystack URL)
  async initializePayment(data: InitializePaymentRequest): Promise<InitializePaymentResponse> {
    const response = await apiClient.post<ApiResponse<InitializePaymentResponse>>(
      '/api/payments/initialize',
      data
    );
    return response.data.data;
  },

  // Verify payment after redirect
  async verifyPayment(reference: string): Promise<VerifyPaymentResponse> {
    const response = await apiClient.get<ApiResponse<VerifyPaymentResponse>>(
      `/api/payments/verify/${reference}`
    );
    return response.data.data;
  },

  // Get transaction history
  async getTransactions(page = 1, limit = 10): Promise<PaginatedResponse<Transaction>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Transaction>>>(
      '/api/payments/transactions',
      { params: { page, limit } }
    );
    return response.data.data;
  },

  // Get single transaction
  async getTransaction(transactionId: string): Promise<Transaction> {
    const response = await apiClient.get<ApiResponse<Transaction>>(
      `/api/payments/transactions/${transactionId}`
    );
    return response.data.data;
  },
};
