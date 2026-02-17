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
    const response = await apiClient.get<ApiResponse<any[]>>(
      `/api/departments/${departmentId}/courses`
    );
    // Map API response to Course interface
    // API returns: { _id, code, title, creditUnits, level, description, ... }
    // We need: { _id?, id, code, title, credits?, description, ... }
    const mappedCourses = (response.data.data || []).map((course: any) => ({
      _id: course._id,
      id: course._id || course.id, // Use _id if available, fall back to id
      code: course.code,
      title: course.title,
      credits: course.creditUnits || course.credits, // Map creditUnits to credits
      departmentId: departmentId,
      description: course.description,
      accessLevel: course.accessLevel || 'free',
      createdAt: course.createdAt || new Date().toISOString(),
      updatedAt: course.updatedAt || new Date().toISOString(),
    } as Course));
    return mappedCourses;
  },

  // GET /departments/:departmentId/courses/:id
  async getCourse(departmentId: string, id: string): Promise<Course & { topics: Topic[] }> {
    const response = await apiClient.get<ApiResponse<any>>(
      `/api/departments/${departmentId}/courses/${id}`
    );
    const data = response.data.data;
    // Map API response to Course interface
    const mappedCourse = {
      _id: data._id,
      id: data._id || data.id,
      code: data.code,
      title: data.title,
      credits: data.creditUnits || data.credits,
      departmentId: departmentId,
      description: data.description,
      accessLevel: data.accessLevel || 'free',
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
      topics: data.topics || [],
    } as Course & { topics: Topic[] };
    return mappedCourse;
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
