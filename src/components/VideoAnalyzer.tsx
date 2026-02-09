'use client';

import React, { useState, useCallback } from 'react';
import { youtubeAPI } from '@/services/api';

// Helper to extract video ID from URL
const getYouTubeVideoId = (url: string): string | null => {
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?]+)/,
    /^([\w-]{11})$/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  // Fallback for cases where the full URL might be pasted with other params  dfghjgdhfd
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname.includes('youtube.com')) {
      return urlObj.searchParams.get('v');
    }
    if (urlObj.hostname.includes('youtu.be')) {
      return urlObj.pathname.slice(1);
    }
  } catch (e) {
    // Not a valid URL, but might be a raw ID
  }
  if (url.length === 11) return url; // assume it's an ID
  return null;
};


// Types - Simplified for this component's context
interface VideoAnalysisData {
  id: string;
  title: string;
  description: string;
  channel: string;
  view_count: number;
  like_count: number;
  duration: number;
  thumbnail: string;
  description_sentiment: string;
  description_confidence: number;
  comment_analysis?: {
    total_comments: number;
    sentiment_distribution: {
      counts: { [key: string]: number };
      percentages: { [key: string]: number };
    };
    average_confidence: number;
    comments: {
      id: string;
      author: string;
      sentiment: string;
      confidence: number;
      text: string;
      like_count: number;
      timestamp: number;
    }[];
    model_used: string;
  };
}

interface AnalysisState {
  loading: boolean;
  result: VideoAnalysisData | null;
  error: string | null;
}

interface ConnectionState {
  status: 'unknown' | 'connected' | 'disconnected';
  testing: boolean;
}

// Component
const VideoAnalyzer: React.FC = () => {
  const [videoUrl, setVideoUrl] = useState('');
  const [includeComments, setIncludeComments] = useState(true);
  
  const [analysis, setAnalysis] = useState<AnalysisState>({
    loading: false,
    result: null,
    error: null,
  });

  const [connection, setConnection] = useState<ConnectionState>({
    status: 'unknown',
    testing: false,
  });

  // Test backend connection
  const handleTestConnection = useCallback(async () => {
    setConnection(prev => ({ ...prev, testing: true }));
    try {
      await youtubeAPI.healthCheck();
      setConnection({ status: 'connected', testing: false });
      showNotification('✅ Backend connected successfully!', 'success');
    } catch (error) {
      setConnection({ status: 'disconnected', testing: false });
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showNotification(`❌ Connection failed: ${errorMessage}`, 'error');
    }
  }, []);

  // Analyze video
  const handleAnalyze = useCallback(async () => {
    const videoId = getYouTubeVideoId(videoUrl);

    if (!videoId) {
      setAnalysis(prev => ({ ...prev, error: 'Please enter a valid YouTube URL or Video ID' }));
      return;
    }

    setAnalysis({ loading: true, result: null, error: null });

    try {
      const response = await youtubeAPI.analyzeVideo({
        videoId,
        analyzeComments: includeComments,
      });
      
      // Handle the backend response format (response.data contains the actual video data)
      setAnalysis({
        loading: false,
        result: response.data || response,
        error: null,
      });
      showNotification('✅ Video analyzed successfully!', 'success');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze video';
      setAnalysis({
        loading: false,
        result: null,
        error: errorMessage,
      });
      if (errorMessage.includes('503') || errorMessage.includes('ECONNREFUSED')) {
        setConnection({ status: 'disconnected', testing: false });
      }
    }
  }, [videoUrl, includeComments]);

  // Clear results
  const handleClear = useCallback(() => {
    setAnalysis({ loading: false, result: null, error: null });
    setVideoUrl('');
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          🎥 YouTube Analytics
        </h1>
        <p className="text-lg text-gray-600">
          Professional video analysis with AI-powered sentiment insights
        </p>
      </div>

      {/* Connection Status */}
      <ConnectionStatus 
        connection={connection} 
        onTest={handleTestConnection} 
      />

      {/* Input Form */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="space-y-6">
          {/* URL Input */}
          <div>
            <label htmlFor="videoUrl" className="block text-sm font-semibold text-gray-700 mb-2">
              YouTube Video URL
            </label>
            <input
              id="videoUrl"
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              disabled={analysis.loading}
            />
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center space-x-3">
              <input
                id="includeComments"
                type="checkbox"
                checked={includeComments}
                onChange={(e) => setIncludeComments(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={analysis.loading}
              />
              <label htmlFor="includeComments" className="text-sm font-medium text-gray-700">
                Analyze comments sentiment
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={handleAnalyze}
              disabled={analysis.loading || !videoUrl.trim()}
              className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {analysis.loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing...
                </span>
              ) : (
                '🚀 Analyze Video'
              )}
            </button>

            {(analysis.result || analysis.error) && (
              <button
                onClick={handleClear}
                className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
              >
                🗑️ Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {analysis.error && (
        <ErrorDisplay error={analysis.error} />
      )}

      {/* Results Display */}
      {analysis.result && (
        <ResultsDisplay result={analysis.result} />
      )}
    </div>
  );
};

// Connection Status Component
const ConnectionStatus: React.FC<{
  connection: ConnectionState;
  onTest: () => void;
}> = ({ connection, onTest }) => {
  const getStatusColor = () => {
    switch (connection.status) {
      case 'connected': return 'bg-green-50 border-green-200 text-green-800';
      case 'disconnected': return 'bg-red-50 border-red-200 text-red-800';
      default: return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getStatusIcon = () => {
    switch (connection.status) {
      case 'connected': return '✅';
      case 'disconnected': return '❌';
      default: return '🔍';
    }
  };

  return (
    <div className={`rounded-lg p-4 border ${getStatusColor()}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getStatusIcon()}</span>
          <span className="font-semibold">
            Backend Status: {connection.status === 'unknown' ? 'Unknown' : 
                           connection.status === 'connected' ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <button
          onClick={onTest}
          disabled={connection.testing}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          {connection.testing ? '🔄 Testing...' : '🔍 Test Connection'}
        </button>
      </div>
    </div>
  );
};

// Error Display Component
const ErrorDisplay: React.FC<{ error: string }> = ({ error }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
    <div className="flex items-start">
      <span className="text-red-600 text-lg mr-3">❌</span>
      <div>
        <h3 className="text-red-800 font-semibold">Analysis Error</h3>
        <p className="text-red-700 mt-1">{error}</p>
      </div>
    </div>
  </div>
);

// Results Display Component
const ResultsDisplay: React.FC<{ result: VideoAnalysisData }> = ({ result }) => (
  <div className="space-y-6">
    {/* Video Information */}
    <VideoInfo video={result} />
    
    {/* Comments Analysis */}
    {result.comment_analysis && (
      <CommentsAnalysis analysis={result.comment_analysis} />
    )}
  </div>
);

// Video Info Component
const VideoInfo: React.FC<{ video: VideoAnalysisData }> = ({ video }) => (
  <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
    <h2 className="text-2xl font-bold text-gray-900 mb-6">📹 Video Information</h2>
    
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <InfoItem label="Title" value={video.title} />
        <InfoItem label="Channel" value={video.channel} />
        <InfoItem label="Views" value={video.view_count.toLocaleString()} />
        <InfoItem label="Likes" value={video.like_count.toLocaleString()} />
        <InfoItem label="Duration" value={formatDuration(video.duration)} />
      </div>

      {/* Thumbnail */}
      {video.thumbnail && (
        <div className="flex justify-center">
          <img
            src={video.thumbnail}
            alt={video.title}
            className="rounded-lg shadow-md max-w-full h-auto"
          />
        </div>
      )}
    </div>

    {/* Description Sentiment */}
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-3">Description Sentiment</h3>
      <SentimentBadge 
        sentiment={video.description_sentiment}
        confidence={video.description_confidence}
      />
    </div>
  </div>
);

// Comments Analysis Component
const CommentsAnalysis: React.FC<{ 
  analysis: NonNullable<VideoAnalysisData['comment_analysis']> 
}> = ({ analysis }) => (
  <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
    <h2 className="text-2xl font-bold text-gray-900 mb-6">💬 Comments Analysis</h2>
    
    {/* Sentiment Distribution */}
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Sentiment Distribution</h3>
      <SentimentChart distribution={analysis.sentiment_distribution} />
    </div>

    {/* Sample Comments */}
    <div>
      <h3 className="text-lg font-semibold text-gray-700 mb-4">
        Sample Comments ({analysis.total_comments} total analyzed)
      </h3>
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {analysis.comments.slice(0, 10).map((comment, index) => (
          <CommentCard key={comment.id || index} comment={comment} />
        ))}
      </div>
    </div>

    {/* Analysis Stats */}
    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>Model: {analysis.model_used}</span>
        <span>Avg Confidence: {(analysis.average_confidence * 100).toFixed(1)}%</span>
      </div>
    </div>
  </div>
);

// Utility Components
const InfoItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <dt className="text-sm font-medium text-gray-500">{label}</dt>
    <dd className="text-lg text-gray-900 font-semibold">{value}</dd>
  </div>
);

const SentimentBadge: React.FC<{ sentiment: string; confidence: number }> = ({ sentiment, confidence }) => {
  const getColor = () => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-800';
      case 'negative': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEmoji = () => {
    switch (sentiment) {
      case 'positive': return '😊';
      case 'negative': return '😞';
      default: return '😐';
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <span className={`px-3 py-2 rounded-full text-sm font-medium ${getColor()}`}>
        {getEmoji()} {sentiment}
      </span>
      <span className="text-gray-600 text-sm">
        ({(confidence * 100).toFixed(1)}% confidence)
      </span>
    </div>
  );
};

const SentimentChart: React.FC<{ 
  distribution: {
    counts: { [key: string]: number };
    percentages: { [key: string]: number };
  }
}> = ({ distribution }) => (
  <div className="grid grid-cols-3 gap-4">
    {Object.entries(distribution.counts).map(([sentiment, count]) => (
      <div key={sentiment} className="text-center">
        <div className={`p-6 rounded-lg ${getSentimentColor(sentiment)}`}>
          <div className="text-3xl font-bold">{count}</div>
          <div className="text-sm font-medium">
            {getSentimentEmoji(sentiment)} {sentiment}
          </div>
          <div className="text-xs mt-1">
            {distribution.percentages[sentiment]}%
          </div>
        </div>
      </div>
    ))}
  </div>
);

const CommentCard: React.FC<{ comment: {
  author: string;
  sentiment: string;
  confidence: number;
  text: string;
  like_count: number;
  timestamp: number;
} }> = ({ comment }) => (
  <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between mb-2">
      <span className="font-medium text-gray-900">{comment.author}</span>
      <SentimentBadge sentiment={comment.sentiment} confidence={comment.confidence} />
    </div>
    <p className="text-gray-700 text-sm mb-2">{comment.text}</p>
    <div className="flex items-center justify-between text-xs text-gray-500">
      <span>👍 {comment.like_count}</span>
      <span>{new Date(comment.timestamp * 1000).toLocaleDateString()}</span>
    </div>
  </div>
);

// Utility Functions
const formatDuration = (seconds: number): string => {
  if (!seconds) return 'Unknown';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

const getSentimentColor = (sentiment: string): string => {
  switch (sentiment) {
    case 'positive': return 'bg-green-100 text-green-800';
    case 'negative': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getSentimentEmoji = (sentiment: string): string => {
  switch (sentiment) {
    case 'positive': return '😊';
    case 'negative': return '😞';
    default: return '😐';
  }
};

// Notification helper
const showNotification = (message: string, type: 'success' | 'error') => {
  console.log(`${type === 'success' ? '✅' : '❌'} ${message}`);
};

export default VideoAnalyzer;
