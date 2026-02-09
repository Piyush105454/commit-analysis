import axios from 'axios';

// Direct connection to Python FastAPI server
const PYTHON_API_BASE_URL = 'http://localhost:8000';

const pythonAPI = axios.create({
  baseURL: PYTHON_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30s timeout
});

// -----------------------------
// Request Interceptor for Debugging
// -----------------------------
pythonAPI.interceptors.request.use((config) => {
  console.log('🔄 Python API Request:', config.method?.toUpperCase(), config.url);
  return config;
});

// -----------------------------
// Response Interceptor for Debugging
// -----------------------------
pythonAPI.interceptors.response.use(
  (response) => {
    console.log('✅ Python API Response:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('❌ Python API Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('🚫 Python FastAPI server is not running on port 8000');
    }
    return Promise.reject(error);
  }
);

// -----------------------------
// Python YouTube API Methods
// -----------------------------
export const pythonYouTubeAPI = {
  // Health check endpoint
  checkHealth: async () => {
    return pythonAPI.get('/health');
  },

  // Video analysis endpoint
  analyzeVideo: async (data: {
    video_url: string;
    analyze_comments?: boolean;
    max_comments?: number;
  }) => {
    return pythonAPI.post('/analyze/video', data);
  },

  // Channel analysis endpoint
  analyzeChannel: async (data: {
    channel_name?: string;
    channel_id?: string;
    max_videos?: number;
  }) => {
    const payload = {
      channel_name: data.channel_name || data.channel_id,
      channel_id: data.channel_id,
      max_videos: data.max_videos || 50,
    };
    return pythonAPI.post('/analyze/channel', payload);
  },

  // Text sentiment analysis endpoint
  analyzeText: async (text: string) => {
    return pythonAPI.post('/analyze/text', { text });
  },

  // Batch comment analysis endpoint
  analyzeBatchComments: async (comments: any[]) => {
    return pythonAPI.post('/analyze/comments/batch', { comments });
  },

  searchChannels: async (query: string, maxResults = 10) => {
    const response = await pythonAPI.get('/search/channels', {
      params: { q: query, max_results: maxResults },
    });
    return response.data;
  },

  testConnection: async () => {
    try {
      const response = await pythonAPI.get('/');
      console.log('🎯 Python Backend Connection Test:', response.data);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      const err = error as { code?: string; message: string };
      console.error('❌ Python Backend Connection Failed:', err.message);
      return {
        success: false,
        error: err.message,
        suggestion:
          err.code === 'ECONNREFUSED'
            ? 'Start Python FastAPI server: python fastapi_server.py'
            : 'Check Python backend configuration',
      };
    }
  },

  // Commit Analysis endpoints
  analyzeCommit: async (message: string) => {
    return pythonAPI.post('/analyze/commit', { message });
  },

  analyzeCommitsBatch: async (commits: string[]) => {
    return pythonAPI.post('/analyze/commits/batch', { commits });
  },

  analyzeSentiment: async (text: string) => {
    return pythonAPI.post('/analyze/sentiment', { text });
  },
};

export default pythonYouTubeAPI;
