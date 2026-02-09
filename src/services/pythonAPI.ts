
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Common interface for response
interface APIResponse<T = unknown> {
  success?: boolean;
  data?: T;
  message?: string;
  [key: string]: unknown;
}

// Low level wrapper for Python endpoints
export const pythonYouTubeAPI = {
  checkHealth: async (): Promise<APIResponse> => {
    const response = await axios.get(`${API_BASE_URL}/api/py/health`);
    return response.data;
  },

  analyzeVideo: async (data: { video_url: string; analyze_comments?: boolean; max_comments?: number }): Promise<APIResponse> => {
    const response = await axios.post(`${API_BASE_URL}/api/py/analyze/video`, data);
    return response.data;
  },

  analyzeChannel: async (data: { channel_url: string; max_videos?: number }): Promise<APIResponse> => {
    // Mapped to /youtube/channel
    const response = await axios.post(`${API_BASE_URL}/api/py/youtube/channel`, data);
    return response.data;
  },

  analyzeCommit: async (message: string): Promise<APIResponse> => {
    const response = await axios.post(`${API_BASE_URL}/api/py/analyze/commit`, { message });
    return response.data;
  },

  analyzeCommitsBatch: async (commits: string[]): Promise<APIResponse> => {
    const response = await axios.post(`${API_BASE_URL}/api/py/analyze/commits/batch`, { commits });
    return response.data;
  },

  analyzeSentiment: async (text: string): Promise<APIResponse> => {
    const response = await axios.post(`${API_BASE_URL}/api/py/analyze/sentiment`, { text });
    return response.data;
  }
};
