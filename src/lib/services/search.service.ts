import apiClient from '../api';
import {
  ApiResponse,
  Question,
  Topic,
  Course,
  Department,
  University,
} from '../../types';

export interface AdvancedSearchParams {
  q?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  courseId?: string;
  topicId?: string;
  departmentId?: string;
  universityId?: string;
  questionType?: 'mcq' | 'essay' | 'short-answer';
  page?: number;
  limit?: number;
}

export interface AdvancedSearchResponse {
  data: (Question & {
    courseId: string;
    universityName: string;
    departmentName: string;
  })[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface TopicSearchResponse {
  data: (Topic & {
    courseId: string;
    courseName: string;
    questionsCount: number;
  })[];
}

export interface GlobalSearchResult {
  universities: University[];
  departments: Department[];
  courses: Course[];
  topics: Topic[];
  questions: Question[];
}

export const searchService = {
  // GET /search/questions
  async searchQuestions(query: string, params?: any): Promise<Question[]> {
    const response = await apiClient.get<ApiResponse<Question[]>>(
      '/api/search/questions',
      { params: { q: query, ...params } }
    );
    return response.data.data;
  },

  // GET /search/advanced
  async advancedSearch(params: AdvancedSearchParams): Promise<AdvancedSearchResponse> {
    const response = await apiClient.get<ApiResponse<AdvancedSearchResponse>>(
      '/api/search/advanced',
      { params }
    );
    return response.data.data;
  },

  // GET /search/topics
  async searchTopics(params?: {
    q?: string;
    courseId?: string;
    departmentId?: string;
    universityId?: string;
  }): Promise<TopicSearchResponse> {
    const response = await apiClient.get<ApiResponse<TopicSearchResponse>>(
      '/api/search/topics',
      { params }
    );
    return response.data.data;
  },

  // GET /search/global
  async globalSearch(query: string, params?: { limit?: number }): Promise<GlobalSearchResult> {
    const response = await apiClient.get<ApiResponse<GlobalSearchResult>>(
      '/api/search/global',
      { params: { q: query, ...params } }
    );
    return response.data.data;
  },
};
