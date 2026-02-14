import apiClient from '../api';
import { ApiResponse } from '../../types';

export interface AdminPlan {
  _id: string;
  plan: 'basic' | 'premium' | 'free';
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

export interface CreateOrUpdatePlanRequest {
  name: string;
  price: number;
  duration: number;
  features: string[];
  isActive?: boolean;
  reason?: string; // For price change history
}

export interface PriceHistory {
  price: number;
  changedAt: string;
  changedBy: string;
  reason: string;
}

export const adminService = {
  // Get all plans (admin view)
  async getAllPlans(): Promise<AdminPlan[]> {
    const response = await apiClient.get<ApiResponse<AdminPlan[]>>(
      '/api/admin/pricing'
    );
    return response.data.data;
  },

  // Create or update a plan
  async createOrUpdatePlan(
    planType: 'basic' | 'premium' | 'free',
    data: CreateOrUpdatePlanRequest
  ): Promise<AdminPlan> {
    const response = await apiClient.put<ApiResponse<AdminPlan>>(
      `/api/admin/pricing/${planType}`,
      data
    );
    return response.data.data;
  },

  // Get price history for a plan
  async getPlanPriceHistory(
    planType: 'basic' | 'premium' | 'free'
  ): Promise<PriceHistory[]> {
    const response = await apiClient.get<ApiResponse<PriceHistory[]>>(
      `/api/admin/pricing/${planType}/history`
    );
    return response.data.data;
  },

  // Get a specific plan details
  async getPlanDetails(planType: 'basic' | 'premium' | 'free'): Promise<AdminPlan> {
    const response = await apiClient.get<ApiResponse<AdminPlan>>(
      `/api/admin/pricing/${planType}`
    );
    return response.data.data;
  },
};
