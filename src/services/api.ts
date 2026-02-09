
import axios from 'axios';
import { pythonYouTubeAPI } from './pythonAPI';

// API Base URL - empty for relative path (proxied by Vercel)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// YouTube API client
export const youtubeAPI = {
  healthCheck: pythonYouTubeAPI.checkHealth,

  getChannelData: async (channelIdOrUrl: string) => {
    try {
      // main.py expects POST to /api/py/youtube/channel with { channel_url: ... }
      // If we have just an ID, we construct a URL or pass it as is if backend handles it (it expects URL)
      // Assuming channelIdOrUrl involves 'youtube.com' or '@handle' or just 'ID'
      let url = channelIdOrUrl;
      if (!url.includes('youtube.com')) {
        if (url.startsWith('UC')) url = `https://www.youtube.com/channel/${url}`;
        else url = `https://www.youtube.com/@${url}`;
      }

      const response = await axios.post(`${API_BASE_URL}/api/py/youtube/channel`, {
        channel_url: url
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching channel data:', error);
      throw error;
    }
  },

  getVideoData: async (videoId: string) => {
    try {
      // main.py has /analyze/video not /youtube/video
      // But maybe we want just stats? main.py has /youtube (GET) for stats
      const response = await axios.get(`${API_BASE_URL}/api/py/youtube`, {
        params: { url: `https://www.youtube.com/watch?v=${videoId}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching video data:', error);
      throw error;
    }
  },

  searchVideos: async (query: string) => {
    // main.py does NOT have search endpoints. 
    // Assuming unimplemented or falling back to some other logic?
    // Or maybe use youtube/channel logic?
    // For now, let's just log or throw not implemented if not in backend
    try {
      // NOTE: Search endpoint is missing in python/main.py. This will 404.
      const response = await axios.get(`${API_BASE_URL}/api/py/youtube/search?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error('Error searching videos:', error);
      throw error;
    }
  },

  // Re-export Python API methods for convenience, adapt payload shape
  analyzeChannel: async (data: { channelName?: string; channel_url?: string; maxVideos?: number }) => {
    let url = data.channel_url || data.channelName || '';
    if (url && !url.includes('youtube.com')) {
      if (url.startsWith('UC')) url = `https://www.youtube.com/channel/${url}`;
      else url = `https://www.youtube.com/@${url}`;
    }
    return pythonYouTubeAPI.analyzeChannel({
      channel_url: url,
      max_videos: data.maxVideos
    });
  },
  analyzeVideo: async (opts: { videoId?: string; video_url?: string; analyzeComments?: boolean }) => {
    const videoUrl =
      opts.video_url ||
      (opts.videoId ? `https://www.youtube.com/watch?v=${opts.videoId}` : undefined);
    return pythonYouTubeAPI.analyzeVideo({
      video_url: videoUrl as string,
      analyze_comments: !!opts.analyzeComments,
    });
  },
  analyzeSentiment: pythonYouTubeAPI.analyzeSentiment
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
      // Auth is likely Next.js API, so use /api/auth/... independent of python prefix
      const response = await axios.post(`/api/auth/login`, { email, password });
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
      const response = await axios.post(`/api/auth/register`, userData);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      const response = await axios.post(`/api/auth/logout`);
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

      const response = await axios.get(`/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw error;
    }
  },

  updateProfile: async (data: { youtubeChannel: string }) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.put(`/api/auth/profile`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  updateChannelData: async (data: { channelId?: string; subscriberCount?: number; videoCount?: number; viewCount?: number; thumbnail?: string }) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(`/api/users/channel-data`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error updating channel data:', error);
      throw error;
    }
  }
};

// Export default API object
// Export default API object
const api = {
  youtube: youtubeAPI,
  auth: authAPI,
  commit: commitAPI
};

export default api;