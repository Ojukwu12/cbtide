import apiClient from '../api';
import {
  ApiResponse,
  University,
  Faculty,
  Department,
  Course,
  Topic,
} from '../../types';

export const academicService = {
  // Universities
  async getUniversities(): Promise<University[]> {
    const response = await apiClient.get<ApiResponse<University[]>>(
      '/api/universities'
    );
    return response.data.data;
  },

  async createUniversity(data: Omit<University, 'id' | 'createdAt' | 'updatedAt'>): Promise<University> {
    const response = await apiClient.post<ApiResponse<University>>(
      '/api/universities',
      data
    );
    return response.data.data;
  },

  // Faculties
  async getFaculties(universityId: string): Promise<Faculty[]> {
    const response = await apiClient.get<ApiResponse<Faculty[]>>(
      `/api/universities/${universityId}/faculties`
    );
    return response.data.data;
  },

  async createFaculty(
    universityId: string,
    data: Omit<Faculty, 'id' | 'universityId' | 'createdAt' | 'updatedAt'>
  ): Promise<Faculty> {
    const response = await apiClient.post<ApiResponse<Faculty>>(
      `/api/universities/${universityId}/faculties`,
      data
    );
    return response.data.data;
  },

  // Departments
  async getDepartments(facultyId: string): Promise<Department[]> {
    const response = await apiClient.get<ApiResponse<Department[]>>(
      `/api/faculties/${facultyId}/departments`
    );
    return response.data.data;
  },

  async createDepartment(
    facultyId: string,
    data: Omit<Department, 'id' | 'facultyId' | 'createdAt' | 'updatedAt'>
  ): Promise<Department> {
    const response = await apiClient.post<ApiResponse<Department>>(
      `/api/faculties/${facultyId}/departments`,
      data
    );
    return response.data.data;
  },

  // Courses
  async getCourses(departmentId: string): Promise<Course[]> {
    const response = await apiClient.get<ApiResponse<Course[]>>(
      `/api/departments/${departmentId}/courses`
    );
    return response.data.data;
  },

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

  // Topics
  async getTopics(courseId: string): Promise<Topic[]> {
    const response = await apiClient.get<ApiResponse<Topic[]>>(
      `/api/courses/${courseId}/topics`
    );
    return response.data.data;
  },

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
