'use client';

import React from 'react';
import { Pie, Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

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

interface CommitAnalysisChartProps {
  results: CommitAnalysisResult[];
}

const CommitAnalysisChart: React.FC<CommitAnalysisChartProps> = ({ results }) => {
  // Calculate statistics
  const sentimentCounts = results.reduce((acc, r) => {
    acc[r.sentiment.label] = (acc[r.sentiment.label] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const typeCounts = results.reduce((acc, r) => {
    acc[r.type.type] = (acc[r.type.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const avgQualityScore = (results.reduce((sum, r) => sum + r.quality_score, 0) / results.length) * 100;
  const avgSentimentScore = (results.reduce((sum, r) => sum + r.sentiment.score, 0) / results.length) * 100;

  // Sentiment Distribution Chart
  const sentimentChartData = {
    labels: Object.keys(sentimentCounts),
    datasets: [
      {
        label: 'Sentiment Distribution',
        data: Object.values(sentimentCounts),
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',  // green for POSITIVE
          'rgba(239, 68, 68, 0.8)',  // red for NEGATIVE
          'rgba(107, 114, 128, 0.8)', // gray for NEUTRAL
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(239, 68, 68)',
          'rgb(107, 114, 128)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const sentimentChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = results.length;
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  // Commit Type Distribution Chart
  const typeChartData = {
    labels: Object.keys(typeCounts),
    datasets: [
      {
        label: 'Commits by Type',
        data: Object.values(typeCounts),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',   // blue - feature
          'rgba(239, 68, 68, 0.8)',    // red - bugfix
          'rgba(168, 85, 247, 0.8)',   // purple - refactor
          'rgba(251, 191, 36, 0.8)',   // yellow - docs
          'rgba(34, 197, 94, 0.8)',    // green - test
          'rgba(107, 114, 128, 0.8)',  // gray - chore
          'rgba(249, 115, 22, 0.8)',   // orange - perf
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(239, 68, 68)',
          'rgb(168, 85, 247)',
          'rgb(251, 191, 36)',
          'rgb(34, 197, 94)',
          'rgb(107, 114, 128)',
          'rgb(249, 115, 22)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const typeChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = results.length;
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  // Quality Score Distribution Chart
  const qualityScores = results.map(r => (r.quality_score * 100).toFixed(0));
  const qualityChartData = {
    labels: results.map((_, idx) => `Commit ${idx + 1}`),
    datasets: [
      {
        label: 'Quality Score (%)',
        data: qualityScores,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
      },
    ],
  };

  const qualityChartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: (value) => `${value}%`,
        },
      },
    },
  };

  // Sentiment Score Distribution Chart
  const sentimentScores = results.map(r => (r.sentiment.score * 100).toFixed(0));
  const sentimentScoreChartData = {
    labels: results.map((_, idx) => `Commit ${idx + 1}`),
    datasets: [
      {
        label: 'Sentiment Confidence (%)',
        data: sentimentScores,
        backgroundColor: results.map(r => {
          switch (r.sentiment.label) {
            case 'POSITIVE': return 'rgba(34, 197, 94, 0.6)';
            case 'NEGATIVE': return 'rgba(239, 68, 68, 0.6)';
            default: return 'rgba(107, 114, 128, 0.6)';
          }
        }),
        borderColor: results.map(r => {
          switch (r.sentiment.label) {
            case 'POSITIVE': return 'rgb(34, 197, 94)';
            case 'NEGATIVE': return 'rgb(239, 68, 68)';
            default: return 'rgb(107, 114, 128)';
          }
        }),
        borderWidth: 2,
      },
    ],
  };

  const sentimentScoreChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: (value) => `${value}%`,
        },
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <p className="text-sm text-blue-600 font-semibold mb-1">Total Commits</p>
          <p className="text-3xl font-bold text-blue-700">{results.length}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <p className="text-sm text-green-600 font-semibold mb-1">Avg Quality</p>
          <p className="text-3xl font-bold text-green-700">{avgQualityScore.toFixed(0)}%</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <p className="text-sm text-purple-600 font-semibold mb-1">Avg Sentiment</p>
          <p className="text-3xl font-bold text-purple-700">{avgSentimentScore.toFixed(0)}%</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <p className="text-sm text-orange-600 font-semibold mb-1">Commit Types</p>
          <p className="text-3xl font-bold text-orange-700">{Object.keys(typeCounts).length}</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentiment Distribution */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sentiment Distribution</h3>
          <div className="h-64">
            <Pie data={sentimentChartData} options={sentimentChartOptions} />
          </div>
        </div>

        {/* Commit Type Distribution */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Commits by Type</h3>
          <div className="h-64">
            <Pie data={typeChartData} options={typeChartOptions} />
          </div>
        </div>

        {/* Quality Score Trend */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quality Score Trend</h3>
          <div className="h-64">
            <Line data={qualityChartData} options={qualityChartOptions} />
          </div>
        </div>

        {/* Sentiment Confidence */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sentiment Confidence</h3>
          <div className="h-64">
            <Bar data={sentimentScoreChartData} options={sentimentScoreChartOptions} />
          </div>
        </div>
      </div>

      {/* Type Breakdown Table */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Commit Type Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-2 px-3 font-semibold text-gray-700">Type</th>
                <th className="text-center py-2 px-3 font-semibold text-gray-700">Count</th>
                <th className="text-center py-2 px-3 font-semibold text-gray-700">Percentage</th>
                <th className="text-center py-2 px-3 font-semibold text-gray-700">Avg Quality</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(typeCounts).map(([type, count]) => {
                const typeResults = results.filter(r => r.type.type === type);
                const avgQuality = typeResults.reduce((sum, r) => sum + r.quality_score, 0) / typeResults.length;
                const percentage = ((count / results.length) * 100).toFixed(1);

                return (
                  <tr key={type} className="border-b border-gray-200 hover:bg-gray-100">
                    <td className="py-2 px-3 font-medium text-gray-900">{type}</td>
                    <td className="py-2 px-3 text-center text-gray-700">{count}</td>
                    <td className="py-2 px-3 text-center text-gray-700">{percentage}%</td>
                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${avgQuality * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-gray-700 font-medium">{(avgQuality * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sentiment Breakdown Table */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sentiment Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-2 px-3 font-semibold text-gray-700">Sentiment</th>
                <th className="text-center py-2 px-3 font-semibold text-gray-700">Count</th>
                <th className="text-center py-2 px-3 font-semibold text-gray-700">Percentage</th>
                <th className="text-center py-2 px-3 font-semibold text-gray-700">Avg Confidence</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(sentimentCounts).map(([sentiment, count]) => {
                const sentimentResults = results.filter(r => r.sentiment.label === sentiment);
                const avgConfidence = sentimentResults.reduce((sum, r) => sum + r.sentiment.score, 0) / sentimentResults.length;
                const percentage = ((count / results.length) * 100).toFixed(1);

                const sentimentColor = sentiment === 'POSITIVE' ? 'text-green-700' :
                                      sentiment === 'NEGATIVE' ? 'text-red-700' :
                                      'text-gray-700';

                return (
                  <tr key={sentiment} className="border-b border-gray-200 hover:bg-gray-100">
                    <td className={`py-2 px-3 font-medium ${sentimentColor}`}>{sentiment}</td>
                    <td className="py-2 px-3 text-center text-gray-700">{count}</td>
                    <td className="py-2 px-3 text-center text-gray-700">{percentage}%</td>
                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${avgConfidence * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-gray-700 font-medium">{(avgConfidence * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CommitAnalysisChart;
