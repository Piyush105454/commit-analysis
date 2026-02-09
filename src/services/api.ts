import axios from 'axios';
import { pythonYouTubeAPI } from './pythonAPI';

// API Base URL from environment or default
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// YouTube API client
export const youtubeAPI = {
  healthCheck: pythonYouTubeAPI.checkHealth,

  getChannelData: async (channelId: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/youtube/channel/${channelId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching channel data:', error);
      throw error;
    }
  },
  
  getVideoData: async (videoId: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/youtube/video/${videoId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching video data:', error);
      throw error;
    }
  },
  
  searchVideos: async (query: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/youtube/search?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error('Error searching videos:', error);
      throw error;
    }
  },
  
  // Re-export Python API methods for convenience, adapt payload shape
  analyzeChannel: pythonYouTubeAPI.analyzeChannel,
  analyzeVideo: async (opts: { videoId?: string; video_url?: string; analyzeComments?: boolean }) => {
    const videoUrl =
      opts.video_url ||
      (opts.videoId ? `https://www.youtube.com/watch?v=${opts.videoId}` : undefined);
    return pythonYouTubeAPI.analyzeVideo({
      video_url: videoUrl as string,
      analyze_comments: !!opts.analyzeComments,
    });
  },
  analyzeText: pythonYouTubeAPI.analyzeText
};

// Commit Analysis API client
export const commitAPI = {
  analyzeCommit: async (message: string) => {
    return pythonYouTubeAPI.analyzeCommit(message);
  },

  analyzeCommitsBatch: async (commits: string[]) => {
    return pythonYouTubeAPI.analyzeCommitsBatch(commits);
  },

  analyzeSentiment: async (text: string) => {
    return pythonYouTubeAPI.analyzeSentiment(text);
  },
};

// Auth API client
export const authAPI = {
  login: async (email: string, password: string) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password });
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  register: async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
    youtubeChannel?: string;
  }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/register`, userData);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },
  
  logout: async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/logout`);
      return response.data;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },
  
  getCurrentUser: async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await axios.get(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw error;
    }
  }
};

// Export default API object
export default {
  youtube: youtubeAPI,
  auth: authAPI,
  commit: commitAPI
};