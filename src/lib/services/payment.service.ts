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

export interface PaymentStatusResponse {
  reference: string;
  status: 'success' | 'failed' | 'pending';
  amount: number;
  paidAt?: string;
  plan: 'basic' | 'premium';
}

export const paymentService = {
  // Get all available plans
  async getPlans(): Promise<Plan[]> {
    try {
      console.log('[payment.service] Fetching plans from /api/payments/plans');
      const response = await apiClient.get<ApiResponse<Plan[]>>(
        '/api/payments/plans'
      );
      console.log('[payment.service] Plans response:', response.data);
      const plans = response.data.data;
      console.log('[payment.service] Plans data:', plans);
      console.log('[payment.service] Plans array length:', Array.isArray(plans) ? plans.length : 'not an array');
      
      if (!Array.isArray(plans)) {
        console.error('[payment.service] Plans is not an array:', typeof plans);
        return [];
      }
      
      // Log each plan's isActive status
      plans.forEach((plan, index) => {
        console.log(`[payment.service] Plan ${index}:`, {
          _id: plan._id,
          plan: plan.plan,
          name: plan.name,
          isActive: plan.isActive,
          price: plan.price,
        });
      });
      
      return plans;
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

  // POST /payments/verify
  async verifyPayment(reference: string): Promise<VerifyPaymentResponse> {
    const response = await apiClient.post<ApiResponse<VerifyPaymentResponse>>(
      '/api/payments/verify',
      { reference }
    );
    return response.data.data;
  },

  // GET /payments/status/:reference
  async checkPaymentStatus(reference: string): Promise<PaymentStatusResponse> {
    const response = await apiClient.get<ApiResponse<PaymentStatusResponse>>(
      `/api/payments/status/${reference}`
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
