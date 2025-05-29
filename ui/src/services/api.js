import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const healthCheck = () => {
  return axios.get(`${API_BASE_URL}/health`);
};

export const uploadFiles = (files) => {
  const formData = new FormData();
  // Ensure 'files' is the key, even for a single file, as per backend requirements
  for (let i = 0; i < files.length; i++) {
    formData.append('files', files[i]);
  }
  return axios.post(`${API_BASE_URL}/api/analyze`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const getTaskStatus = (taskId) => {
  return axios.get(`${API_BASE_URL}/api/tasks/${taskId}/status`);
};
