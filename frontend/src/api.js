import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect to login if:
    // 1. We get a 401 error
    // 2. We're NOT on the login or register pages
    // 3. We're NOT calling public endpoints (like /streams)
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      const isAuthPage = currentPath === '/login' || currentPath === '/register';
      const isPublicEndpoint = error.config?.url?.includes('/streams');
      
      // Only redirect if not on auth pages and not a public endpoint
      if (!isAuthPage && !isPublicEndpoint) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  changePassword: (passwords) => api.patch('/auth/change-password', passwords),
  logout: () => api.post('/auth/logout'),
};

// Users endpoints
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  getByRole: (role) => api.get(`/users/role/${role}`),
  getByStream: (streamId) => api.get(`/users/stream/${streamId}`),
};

// Streams endpoints
export const streamsAPI = {
  getAll: () => api.get('/streams'),
  getById: (id) => api.get(`/streams/${id}`),
  create: (data) => api.post('/streams', data),
  update: (id, data) => api.put(`/streams/${id}`, data),
  delete: (id) => api.delete(`/streams/${id}`),
};

// Courses endpoints
export const coursesAPI = {
  getAll: (params) => api.get('/courses', { params }),
  getById: (id) => api.get(`/courses/${id}`),
  create: (data) => api.post('/courses', data),
  update: (id, data) => api.put(`/courses/${id}`, data),
  delete: (id) => api.delete(`/courses/${id}`),
  getByStream: (streamId) => api.get(`/courses/stream/${streamId}`),
  assignLecturer: (id, lecturerId) => api.patch(`/courses/${id}/assign`, { lecturer_id: lecturerId }),
};

// Classes endpoints
export const classesAPI = {
  getAll: (params) => api.get('/classes', { params }),
  getById: (id) => api.get(`/classes/${id}`),
  create: (data) => api.post('/classes', data),
  update: (id, data) => api.put(`/classes/${id}`, data),
  delete: (id) => api.delete(`/classes/${id}`),
  getByStream: (streamId) => api.get(`/classes/stream/${streamId}`),
  getCourses: (id) => api.get(`/classes/${id}/courses`),
  assignCourse: (id, courseId) => api.post(`/classes/${id}/courses`, { course_id: courseId }),
  removeCourse: (id, courseId) => api.delete(`/classes/${id}/courses/${courseId}`),
};

// Reports endpoints
export const reportsAPI = {
  getAll: (params) => api.get('/reports', { params }),
  getById: (id) => api.get(`/reports/${id}`),
  create: (data) => api.post('/reports', data),
  update: (id, data) => api.put(`/reports/${id}`, data),
  delete: (id) => api.delete(`/reports/${id}`),
  getMyReports: () => api.get('/reports/my/reports'),  // Fixed: was /my-reports
  getForReview: () => api.get('/reports/for-review'),
  addFeedback: (id, feedback) => api.post(`/reports/${id}/feedback`, feedback),
  updateStatus: (id, status) => api.patch(`/reports/${id}/status`, { status }),
  exportToExcel: (params) => api.get('/reports/export/excel', { 
    params, 
    responseType: 'blob' 
  }),
  getRecent: (limit) => api.get('/reports/recent', { params: { limit } }),
};

// Dashboard endpoints
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getStudentDashboard: () => api.get('/dashboard/student'),
  getLecturerDashboard: () => api.get('/dashboard/lecturer'),
  getPRLDashboard: () => api.get('/dashboard/principal-lecturer'),
  getProgramLeaderDashboard: () => api.get('/dashboard/program-leader'),
};

export default api;
