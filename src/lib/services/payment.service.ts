import apiClient from '../api';
import {
  ApiResponse,
  Transaction,
  InitiatePaymentRequest,
  InitiatePaymentResponse,
  VerifyPaymentRequest,
  PaginatedResponse,
} from '../../types';

export const paymentService = {
  async initiatePayment(data: InitiatePaymentRequest): Promise<InitiatePaymentResponse> {
    const response = await apiClient.post<ApiResponse<InitiatePaymentResponse>>(
      '/api/payments/init',
      data
    );
    return response.data.data;
  },

  async verifyPayment(data: VerifyPaymentRequest): Promise<Transaction> {
    const response = await apiClient.post<ApiResponse<Transaction>>(
      '/api/payments/verify',
      data
    );
    return response.data.data;
  },

  async getTransactions(page = 1, limit = 10): Promise<PaginatedResponse<Transaction>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Transaction>>>(
      '/api/payments/transactions',
      { params: { page, limit } }
    );
    return response.data.data;
  },

  async getTransaction(transactionId: string): Promise<Transaction> {
    const response = await apiClient.get<ApiResponse<Transaction>>(
      `/api/payments/transactions/${transactionId}`
    );
    return response.data.data;
  },
};
