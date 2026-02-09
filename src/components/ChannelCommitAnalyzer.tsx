'use client';

import React, { useState, useCallback } from 'react';
import { commitAPI } from '@/services/api';
import CommitAnalysisChart from '@/components/CommitAnalysisChart';

interface Video {
  id: string;
  title: string;
  description: string;
  view_count: number;
  like_count: number;
  published_at: string;
  thumbnail: string;
}

interface CommitAnalysisResult {
  message: string;
  sentiment: {
    label: string;
    score: number;
  };
  type: {
    type: string;
    confidence: number;
  };
  quality_score: number;
}

interface AnalysisState {
  loading: boolean;
  videos: Video[];
  selectedVideo: Video | null;
  commits: string[];
  analysisResults: CommitAnalysisResult[];
  error: string | null;
  stage: 'channel' | 'videos' | 'commits' | 'analysis';
}

const ChannelCommitAnalyzer: React.FC = () => {
  const [channelUrl, setChannelUrl] = useState('');
  const [state, setState] = useState<AnalysisState>({
    loading: false,
    videos: [],
    selectedVideo: null,
    commits: [],
    analysisResults: [],
    error: null,
    stage: 'channel',
  });

  // Extract commits from video description
  const extractCommitsFromDescription = (description: string): string[] => {
    if (!description) return [];
    
    let commits: string[] = [];
    
    // Split by lines and process each line
    const lines = description.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip empty lines and very short lines
      if (trimmed.length < 3) continue;
      
      // Pattern 1: Conventional commits (feat:, fix:, etc.)
      if (/^(feat|fix|refactor|docs|test|chore|perf|style|build|ci|revert):\s*.+/i.test(trimmed)) {
        commits.push(trimmed);
      }
      // Pattern 2: Bullet points with dash
      else if (/^-\s+.+/.test(trimmed)) {
        const text = trimmed.replace(/^-\s+/, '').trim();
        if (text.length > 3) commits.push(text);
      }
      // Pattern 3: Bullet points with bullet character
      else if (/^•\s+.+/.test(trimmed)) {
        const text = trimmed.replace(/^•\s+/, '').trim();
        if (text.length > 3) commits.push(text);
      }
      // Pattern 4: Numbered lists
      else if (/^\d+\.\s+.+/.test(trimmed)) {
        const text = trimmed.replace(/^\d+\.\s+/, '').trim();
        if (text.length > 3) commits.push(text);
      }
      // Pattern 5: Any line with common commit keywords at start
      else if (/^(added|fixed|updated|improved|removed|changed|implemented|created|deleted|modified)[\s:].+/i.test(trimmed)) {
        commits.push(trimmed);
      }
      // Pattern 6: Lines that look like tasks/items (common in video descriptions)
      else if (/^[✓✔✅x✗❌].+/.test(trimmed)) {
        const text = trimmed.replace(/^[✓✔✅x✗❌]\s*/, '').trim();
        if (text.length > 3) commits.push(text);
      }
    }

    // Filter out empty strings and duplicates, minimum 5 chars
    const filtered = [...new Set(commits.filter(c => c.trim().length > 5))];
    
    console.log('Extracted commits:', filtered);
    console.log('From description:', description.substring(0, 200));
    
    return filtered;
  };

  // Fetch channel videos from backend
  const handleFetchVideos = useCallback(async () => {
    if (!channelUrl.trim()) {
      setState(prev => ({ ...prev, error: 'Please enter a channel URL' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Call backend to fetch real YouTube videos
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/youtube/channel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel_url: channelUrl })
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch videos: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform backend response to Video format
      const videos: Video[] = (data.videos || []).map((v: any) => ({
        id: v.id || v.video_id,
        title: v.title,
        description: v.description || '',
        view_count: v.view_count || 0,
        like_count: v.like_count || 0,
        published_at: v.published_at || new Date().toISOString(),
        thumbnail: v.thumbnail || 'https://via.placeholder.com/320x180',
      }));

      if (videos.length === 0) {
        throw new Error('No videos found for this channel');
      }

      setState(prev => ({
        ...prev,
        videos,
        stage: 'videos',
        loading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch videos';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }));
    }
  }, [channelUrl]);

  // Select video and extract commits
  const handleSelectVideo = useCallback((video: Video) => {
    const commits = extractCommitsFromDescription(video.description);
    setState(prev => ({
      ...prev,
      selectedVideo: video,
      commits,
      stage: 'commits',
    }));
  }, []);

  // Analyze commits
  const handleAnalyzeCommits = useCallback(async () => {
    if (state.commits.length === 0) {
      setState(prev => ({ ...prev, error: 'No commits found in video description' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await commitAPI.analyzeCommitsBatch(state.commits);
      // Handle both direct response and axios response format
      const responseData = (response as any).data || response;
      const results = (responseData?.results || responseData) as CommitAnalysisResult[];

      setState(prev => ({
        ...prev,
        analysisResults: Array.isArray(results) ? results : [],
        stage: 'analysis',
        loading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }));
    }
  }, [state.commits]);

  // Reset to channel selection
  const handleReset = useCallback(() => {
    setState({
      loading: false,
      videos: [],
      selectedVideo: null,
      commits: [],
      analysisResults: [],
      error: null,
      stage: 'channel',
    });
    setChannelUrl('');
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          🎬 Channel Commit Analyzer
        </h1>
        <p className="text-lg text-gray-600">
          Analyze commits from your YouTube channel videos using AI
        </p>
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <span className="text-red-600 text-lg mr-3">❌</span>
            <div>
              <h3 className="text-red-800 font-semibold">Error</h3>
              <p className="text-red-700 mt-1">{state.error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stage 1: Channel Selection */}
      {state.stage === 'channel' && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Step 1: Enter Your Channel</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                YouTube Channel URL
              </label>
              <input
                type="text"
                value={channelUrl}
                onChange={(e) => setChannelUrl(e.target.value)}
                placeholder="https://www.youtube.com/@yourchannelname or https://www.youtube.com/channel/UCxxxxxx"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-2">
                💡 You can use either @channelname or /channel/ID format
              </p>
            </div>
            <button
              onClick={handleFetchVideos}
              disabled={state.loading || !channelUrl.trim()}
              className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {state.loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Fetching Videos...
                </span>
              ) : (
                '🔍 Fetch Videos'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Stage 2: Video Selection */}
      {state.stage === 'videos' && state.videos.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Step 2: Select a Video</h2>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              ← Back
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.videos.map((video, idx) => (
              <div
                key={`${video.id}-${idx}`}
                onClick={() => handleSelectVideo(video)}
                className="cursor-pointer border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                <img
                  src={video.thumbnail || 'https://via.placeholder.com/320x180?text=Video'}
                  alt={video.title}
                  className="w-full h-40 object-cover bg-gray-200"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="320" height="180"%3E%3Crect fill="%23ddd" width="320" height="180"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E';
                  }}
                />
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{video.title}</h3>
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>👁 {video.view_count.toLocaleString()}</span>
                    <span>👍 {video.like_count.toLocaleString()}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectVideo(video);
                    }}
                    className="mt-3 w-full px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    Select & Analyze
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stage 3: Commit Review */}
      {state.stage === 'commits' && state.selectedVideo && state.commits.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Step 3: Review Commits</h2>
            <button
              onClick={() => setState(prev => ({ ...prev, stage: 'videos' }))}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              ← Back
            </button>
          </div>

          {/* Video Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">{state.selectedVideo.title}</h3>
            <p className="text-sm text-gray-600">{state.selectedVideo.description.substring(0, 150)}...</p>
          </div>

          {/* Commits List */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Found {state.commits.length} Commits</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {state.commits.map((commit, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200 font-mono text-sm">
                  {commit}
                </div>
              ))}
            </div>
          </div>

          {/* Analyze Button */}
          <button
            onClick={handleAnalyzeCommits}
            disabled={state.loading}
            className="w-full px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {state.loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing Commits...
              </span>
            ) : (
              '🚀 Analyze Commits'
            )}
          </button>
        </div>
      )}

      {/* Stage 4: Analysis Results */}
      {state.stage === 'analysis' && state.analysisResults.length > 0 && (
        <div className="space-y-6">
          {/* Results Header */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Analysis Results</h2>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                🔄 Analyze Another
              </button>
            </div>

            {/* Charts */}
            <CommitAnalysisChart results={state.analysisResults} />
          </div>

          {/* Detailed Results */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Detailed Results</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {state.analysisResults.map((result, idx) => (
                <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-mono text-sm text-gray-900 flex-1">{result.message}</p>
                    <div className="flex gap-2 ml-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        result.sentiment.label === 'POSITIVE' ? 'bg-green-100 text-green-800' :
                        result.sentiment.label === 'NEGATIVE' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {result.sentiment.label}
                      </span>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                        {result.type.type}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>Quality: {(result.quality_score * 100).toFixed(0)}%</span>
                    <span>Confidence: {(result.sentiment.score * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {state.stage === 'commits' && state.commits.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800 font-semibold mb-2">⚠️ No Commits Found</p>
          <p className="text-yellow-700 text-sm">
            The selected video description doesn't contain any commit messages.
            Try selecting another video or format commits as:
          </p>
          <div className="mt-3 text-left bg-white p-3 rounded border border-yellow-200 text-xs font-mono">
            <p>feat: add new feature</p>
            <p>fix: resolve bug</p>
            <p>refactor: improve code</p>
          </div>
          <button
            onClick={() => setState(prev => ({ ...prev, stage: 'videos' }))}
            className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            ← Select Another Video
          </button>
        </div>
      )}
    </div>
  );
};

export default ChannelCommitAnalyzer;
