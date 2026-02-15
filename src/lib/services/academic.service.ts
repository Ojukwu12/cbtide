import apiClient from '../api';
import {
  ApiResponse,
  University,
  Department,
  Course,
  Topic,
} from '../../types';

export const academicService = {
  // GET /universities
  async getUniversities(): Promise<University[]> {
    const response = await apiClient.get<ApiResponse<University[]>>(
      '/api/universities'
    );
    return response.data.data;
  },

  // GET /universities/:id
  async getUniversity(id: string): Promise<University & { departments: Department[] }> {
    const response = await apiClient.get<ApiResponse<University & { departments: Department[] }>>(
      `/api/universities/${id}`
    );
    return response.data.data;
  },

  // POST /universities (admin only)
  async createUniversity(data: Omit<University, 'id' | 'createdAt' | 'updatedAt'>): Promise<University> {
    const response = await apiClient.post<ApiResponse<University>>(
      '/api/universities',
      data
    );
    return response.data.data;
  },

  // GET /universities/:universityId/departments
  async getDepartments(universityId: string): Promise<Department[]> {
    const response = await apiClient.get<ApiResponse<Department[]>>(
      `/api/universities/${universityId}/departments`
    );
    return response.data.data;
  },

  // GET /universities/:universityId/departments/:id
  async getDepartment(universityId: string, id: string): Promise<Department & { courses: Course[] }> {
    const response = await apiClient.get<ApiResponse<Department & { courses: Course[] }>>(
      `/api/universities/${universityId}/departments/${id}`
    );
    return response.data.data;
  },

  // POST /universities/:universityId/departments (admin only)
  async createDepartment(
    universityId: string,
    data: Omit<Department, 'id' | 'universityId' | 'createdAt' | 'updatedAt'>
  ): Promise<Department> {
    const response = await apiClient.post<ApiResponse<Department>>(
      `/api/universities/${universityId}/departments`,
      data
    );
    return response.data.data;
  },

  // GET /departments/:departmentId/courses
  async getCourses(departmentId: string): Promise<Course[]> {
    const response = await apiClient.get<ApiResponse<Course[]>>(
      `/api/departments/${departmentId}/courses`
    );
    return response.data.data;
  },

  // GET /departments/:departmentId/courses/:id
  async getCourse(departmentId: string, id: string): Promise<Course & { topics: Topic[] }> {
    const response = await apiClient.get<ApiResponse<Course & { topics: Topic[] }>>(
      `/api/departments/${departmentId}/courses/${id}`
    );
    return response.data.data;
  },

  // POST /departments/:departmentId/courses (admin only)
  async createCourse(
    departmentId: string,
    data: Omit<Course, 'id' | 'departmentId' | 'createdAt' | 'updatedAt'>
  ): Promise<Course> {
    const response = await apiClient.post<ApiResponse<Course>>(
      `/api/departments/${departmentId}/courses`,
      data
    );
    return response.data.data;
  },

  // GET /courses/:courseId/topics
  async getTopics(courseId: string): Promise<Topic[]> {
    const response = await apiClient.get<ApiResponse<Topic[]>>(
      `/api/courses/${courseId}/topics`
    );
    return response.data.data;
  },

  // GET /courses/:courseId/topics/:id
  async getTopic(courseId: string, id: string): Promise<Topic> {
    const response = await apiClient.get<ApiResponse<Topic>>(
      `/api/courses/${courseId}/topics/${id}`
    );
    return response.data.data;
  },

  // POST /courses/:courseId/topics (admin only)
  async createTopic(
    courseId: string,
    data: Omit<Topic, 'id' | 'courseId' | 'createdAt' | 'updatedAt'>
  ): Promise<Topic> {
    const response = await apiClient.post<ApiResponse<Topic>>(
      `/api/courses/${courseId}/topics`,
      data
    );
    return response.data.data;
  },
};
