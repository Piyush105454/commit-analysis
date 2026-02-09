'use client';

import React, { useState, useCallback } from 'react';
import { commitAPI } from '@/services/api';

interface CommitAnalysisResult {
  message: string;
  sentiment: {
    label: string;
    score: number;
    all_scores?: Array<{ label: string; score: number }>;
    error?: string;
  };
  type: {
    type: string;
    confidence: number;
    all_scores?: { [key: string]: number };
  };
  quality_score: number;
}

interface BatchAnalysisResult {
  count: number;
  results: CommitAnalysisResult[];
  statistics: {
    sentiment_distribution: { [key: string]: number };
    type_distribution: { [key: string]: number };
    average_quality_score: number;
    total_commits: number;
  };
}

interface AnalysisState {
  loading: boolean;
  result: CommitAnalysisResult | BatchAnalysisResult | null;
  error: string | null;
  isBatch: boolean;
}

const CommitAnalyzer: React.FC = () => {
  const [commitInput, setCommitInput] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisState>({
    loading: false,
    result: null,
    error: null,
    isBatch: false,
  });

  // Analyze single commit
  const handleAnalyzeSingle = useCallback(async () => {
    if (!commitInput.trim()) {
      setAnalysis(prev => ({ ...prev, error: 'Please enter a commit message' }));
      return;
    }

    setAnalysis({ loading: true, result: null, error: null, isBatch: false });

    try {
      const response = await commitAPI.analyzeCommit(commitInput);
      setAnalysis({
        loading: false,
        result: (response.data || response) as CommitAnalysisResult,
        error: null,
        isBatch: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
      setAnalysis({
        loading: false,
        result: null,
        error: errorMessage,
        isBatch: false,
      });
    }
  }, [commitInput]);

  // Analyze batch commits
  const handleAnalyzeBatch = useCallback(async () => {
    const commits = commitInput
      .split('\n')
      .map(c => c.trim())
      .filter(c => c.length > 0);

    if (commits.length === 0) {
      setAnalysis(prev => ({ ...prev, error: 'Please enter at least one commit message' }));
      return;
    }

    setAnalysis({ loading: true, result: null, error: null, isBatch: true });

    try {
      const response = await commitAPI.analyzeCommitsBatch(commits);
      setAnalysis({
        loading: false,
        result: (response.data || response) as BatchAnalysisResult,
        error: null,
        isBatch: true,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Batch analysis failed';
      setAnalysis({
        loading: false,
        result: null,
        error: errorMessage,
        isBatch: true,
      });
    }
  }, [commitInput]);

  const handleClear = useCallback(() => {
    setAnalysis({ loading: false, result: null, error: null, isBatch: false });
    setCommitInput('');
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          📝 Commit Analyzer
        </h1>
        <p className="text-lg text-gray-600">
          AI-powered commit message analysis with sentiment & quality scoring
        </p>
      </div>

      {/* Input Form */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="space-y-6">
          {/* Commit Input */}
          <div>
            <label htmlFor="commitInput" className="block text-sm font-semibold text-gray-700 mb-2">
              Commit Message(s)
            </label>
            <textarea
              id="commitInput"
              value={commitInput}
              onChange={(e) => setCommitInput(e.target.value)}
              placeholder="Enter a single commit message or multiple (one per line)&#10;&#10;Examples:&#10;fix: resolve authentication bug in login flow&#10;feat: add dark mode support&#10;refactor: optimize database queries"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors h-32 font-mono text-sm"
              disabled={analysis.loading}
            />
            <p className="text-xs text-gray-500 mt-2">
              💡 Tip: Enter multiple commits on separate lines for batch analysis
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleAnalyzeSingle}
              disabled={analysis.loading || !commitInput.trim()}
              className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {analysis.loading && !analysis.isBatch ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing...
                </span>
              ) : (
                '🔍 Analyze Single'
              )}
            </button>

            <button
              onClick={handleAnalyzeBatch}
              disabled={analysis.loading || !commitInput.trim()}
              className="flex-1 px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {analysis.loading && analysis.isBatch ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing...
                </span>
              ) : (
                '📊 Batch Analyze'
              )}
            </button>

            {analysis.result && (
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
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <span className="text-red-600 text-lg mr-3">❌</span>
            <div>
              <h3 className="text-red-800 font-semibold">Analysis Error</h3>
              <p className="text-red-700 mt-1">{analysis.error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results Display */}
      {analysis.result && !analysis.isBatch && (
        <SingleCommitResult result={analysis.result as CommitAnalysisResult} />
      )}

      {analysis.result && analysis.isBatch && (
        <BatchCommitResults result={analysis.result as BatchAnalysisResult} />
      )}
    </div>
  );
};

// Single Commit Result Component
const SingleCommitResult: React.FC<{ result: CommitAnalysisResult }> = ({ result }) => {
  const getSentimentColor = (label: string) => {
    switch (label) {
      case 'POSITIVE': return 'bg-green-100 text-green-800';
      case 'NEGATIVE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSentimentEmoji = (label: string) => {
    switch (label) {
      case 'POSITIVE': return '😊';
      case 'NEGATIVE': return '😞';
      default: return '😐';
    }
  };

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'feature': 'bg-blue-100 text-blue-800',
      'bugfix': 'bg-red-100 text-red-800',
      'refactor': 'bg-purple-100 text-purple-800',
      'docs': 'bg-yellow-100 text-yellow-800',
      'test': 'bg-green-100 text-green-800',
      'chore': 'bg-gray-100 text-gray-800',
      'perf': 'bg-orange-100 text-orange-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getTypeEmoji = (type: string) => {
    const emojis: { [key: string]: string } = {
      'feature': '✨',
      'bugfix': '🐛',
      'refactor': '♻️',
      'docs': '📚',
      'test': '🧪',
      'chore': '🔧',
      'perf': '⚡',
    };
    return emojis[type] || '📝';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">📋 Analysis Result</h2>

      {/* Commit Message */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <p className="text-sm text-gray-600 mb-1">Commit Message:</p>
        <p className="text-lg font-mono text-gray-900">{result.message}</p>
      </div>

      {/* Analysis Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Sentiment */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <p className="text-sm text-blue-600 font-semibold mb-2">Sentiment</p>
          <div className={`inline-block px-3 py-2 rounded-full text-sm font-medium ${getSentimentColor(result.sentiment.label)}`}>
            {getSentimentEmoji(result.sentiment.label)} {result.sentiment.label}
          </div>
          <p className="text-xs text-gray-600 mt-2">
            Confidence: {(result.sentiment.score * 100).toFixed(1)}%
          </p>
        </div>

        {/* Type */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <p className="text-sm text-purple-600 font-semibold mb-2">Commit Type</p>
          <div className={`inline-block px-3 py-2 rounded-full text-sm font-medium ${getTypeColor(result.type.type)}`}>
            {getTypeEmoji(result.type.type)} {result.type.type}
          </div>
          <p className="text-xs text-gray-600 mt-2">
            Confidence: {(result.type.confidence * 100).toFixed(1)}%
          </p>
        </div>

        {/* Quality Score */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <p className="text-sm text-green-600 font-semibold mb-2">Quality Score</p>
          <div className="text-3xl font-bold text-green-700">
            {(result.quality_score * 100).toFixed(0)}%
          </div>
          <div className="w-full bg-green-200 rounded-full h-2 mt-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all"
              style={{ width: `${result.quality_score * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Detailed Scores */}
      {result.sentiment.all_scores && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <p className="text-sm font-semibold text-gray-700 mb-3">Sentiment Breakdown</p>
          <div className="space-y-2">
            {result.sentiment.all_scores.map((score, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{score.label}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${score.score * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-700 w-12 text-right">
                    {(score.score * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Batch Results Component
const BatchCommitResults: React.FC<{ result: BatchAnalysisResult }> = ({ result }) => {
  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">📊 Batch Analysis Summary</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Total Commits"
            value={result.statistics.total_commits}
            icon="📝"
            color="blue"
          />
          <StatCard
            label="Avg Quality"
            value={`${(result.statistics.average_quality_score * 100).toFixed(0)}%`}
            icon="⭐"
            color="green"
          />
          <StatCard
            label="Sentiment Types"
            value={Object.keys(result.statistics.sentiment_distribution).length}
            icon="😊"
            color="purple"
          />
          <StatCard
            label="Commit Types"
            value={Object.keys(result.statistics.type_distribution).length}
            icon="🏷️"
            color="orange"
          />
        </div>

        {/* Distribution Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sentiment Distribution */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Sentiment Distribution</h3>
            <div className="space-y-3">
              {Object.entries(result.statistics.sentiment_distribution).map(([sentiment, count]) => (
                <div key={sentiment} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{sentiment}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(count / result.count) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-700 w-12 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Type Distribution */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Commit Type Distribution</h3>
            <div className="space-y-3">
              {Object.entries(result.statistics.type_distribution).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{type}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${(count / result.count) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-700 w-12 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Individual Results */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">📋 Individual Results</h2>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {result.results.map((commit, idx) => (
            <CommitResultCard key={idx} commit={commit} index={idx + 1} />
          ))}
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard: React.FC<{
  label: string;
  value: string | number;
  icon: string;
  color: string;
}> = ({ label, value, icon, color }) => {
  const colorClasses: { [key: string]: string } = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
  };

  return (
    <div className={`rounded-lg p-4 border ${colorClasses[color]}`}>
      <p className="text-sm font-medium opacity-75 mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-2xl font-bold">{value}</span>
      </div>
    </div>
  );
};

// Commit Result Card Component
const CommitResultCard: React.FC<{ commit: CommitAnalysisResult; index: number }> = ({ commit, index }) => {
  const getSentimentColor = (label: string) => {
    switch (label) {
      case 'POSITIVE': return 'bg-green-100 text-green-800';
      case 'NEGATIVE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="text-sm font-semibold text-gray-500">#{index}</span>
          <p className="text-sm font-mono text-gray-900 mt-1">{commit.message}</p>
        </div>
        <div className="flex gap-2">
          <span className={`px-2 py-1 rounded text-xs font-medium ${getSentimentColor(commit.sentiment.label)}`}>
            {commit.sentiment.label}
          </span>
          <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
            {commit.type.type}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-gray-600">
        <span>Quality: {(commit.quality_score * 100).toFixed(0)}%</span>
        <span>Confidence: {(commit.sentiment.score * 100).toFixed(0)}%</span>
      </div>
    </div>
  );
};

export default CommitAnalyzer;
