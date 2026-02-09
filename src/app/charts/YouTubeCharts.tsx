'use client'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Bar, Line, Doughnut, Pie } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

// Video interface for charts
export interface Video {
  id: string
  title: string
  view_count?: number
  like_count?: number
  comment_count?: number
  published_at?: string
  engagement_ratio?: number
  category_id?: string
}

// Channel Performance Chart
export function ChannelPerformanceChart({ videos }: { videos: Video[] }) {
  if (!videos || videos.length === 0) return null

  const topVideos = videos
    .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
    .slice(0, 10)

  const data = {
    labels: topVideos.map(v => v.title.substring(0, 30) + '...'),
    datasets: [
      {
        label: 'Views',
        data: topVideos.map(v => v.view_count || 0),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
      {
        label: 'Likes',
        data: topVideos.map(v => v.like_count || 0),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
      }
    ]
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Top 10 Videos Performance'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value: string | number) {
            const numValue = Number(value);
            if (numValue >= 1000000) return (numValue / 1000000).toFixed(1) + 'M'
            if (numValue >= 1000) return (numValue / 1000).toFixed(1) + 'K'
            return value
          }
        }
      }
    }
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <Bar data={data} options={options} />
    </div>
  )
}

// Engagement Trend Chart
export function EngagementTrendChart({ videos }: { videos: Video[] }) {
  if (!videos || videos.length === 0) return null

  const sortedVideos = videos
    .filter(v => v.published_at)
    .sort((a, b) => new Date(a.published_at!).getTime() - new Date(b.published_at!).getTime())
    .slice(-20) // Last 20 videos

  const data = {
    labels: sortedVideos.map(v => new Date(v.published_at!).toLocaleDateString()),
    datasets: [
      {
        label: 'Engagement Rate (%)',
        data: sortedVideos.map(v => Number(((v.engagement_ratio || 0) * 100).toFixed(2))),
        borderColor: 'rgba(168, 85, 247, 1)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Views (K)',
        data: sortedVideos.map(v => (v.view_count || 0) / 1000),
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: false,
        tension: 0.4,
        yAxisID: 'y1',
      }
    ]
  }

  const options = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Engagement Trend Over Time'
      }
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Engagement Rate (%)'
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Views (K)'
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    }
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <Line data={data} options={options} />
    </div>
  )
}

// Sentiment Analysis Chart
export function SentimentAnalysisChart({ sentimentData }: {
  sentimentData?: {
    counts?: {
      positive: number
      negative: number
      neutral: number
    }
    percentages?: {
      positive: number
      negative: number
      neutral: number
    }
  }
}) {
  // Handle undefined or missing data
  if (!sentimentData || (!sentimentData.counts && !sentimentData.percentages)) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="text-center text-gray-500">
          <p>No sentiment data available</p>
        </div>
      </div>
    )
  }

  // Use percentages if available, otherwise use counts
  const dataToUse = sentimentData.percentages || sentimentData.counts || { positive: 0, negative: 0, neutral: 0 }

  const data = {
    labels: ['Positive 😊', 'Neutral 😐', 'Negative 😞'],
    datasets: [
      {
        data: [dataToUse.positive || 0, dataToUse.neutral || 0, dataToUse.negative || 0],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(156, 163, 175, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(156, 163, 175, 1)',
          'rgba(239, 68, 68, 1)'
        ],
        borderWidth: 2,
      }
    ]
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Comment Sentiment Distribution'
      },
      tooltip: {
        callbacks: {
          label: function (context: { label: string; parsed: number; dataset: { data: number[] } }) {
            const label = context.label || ''
            const value = context.parsed
            // If we're using percentages, show as percentage, otherwise calculate percentage
            if (sentimentData?.percentages) {
              return `${label}: ${value}%`
            } else {
              const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0'
              return `${label}: ${value} (${percentage}%)`
            }
          }
        }
      }
    }
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <Doughnut data={data} options={options} />
    </div>
  )
}

// Video Categories Chart
export function VideoCategoriesChart({ videos }: { videos: Video[] }) {
  if (!videos || videos.length === 0) return null

  // YouTube category mapping
  const categoryNames: { [key: string]: string } = {
    '1': 'Film & Animation',
    '2': 'Autos & Vehicles',
    '10': 'Music',
    '15': 'Pets & Animals',
    '17': 'Sports',
    '19': 'Travel & Events',
    '20': 'Gaming',
    '22': 'People & Blogs',
    '23': 'Comedy',
    '24': 'Entertainment',
    '25': 'News & Politics',
    '26': 'Howto & Style',
    '27': 'Education',
    '28': 'Science & Technology',
    '29': 'Nonprofits & Activism'
  }

  // Group videos by category
  const categoryStats = videos.reduce((acc, video) => {
    const categoryId = video.category_id || 'Unknown'
    const categoryName = categoryNames[categoryId] || `Category ${categoryId}`

    if (!acc[categoryName]) {
      acc[categoryName] = { count: 0, totalViews: 0, totalLikes: 0 }
    }
    acc[categoryName].count++
    acc[categoryName].totalViews += video.view_count || 0
    acc[categoryName].totalLikes += video.like_count || 0
    return acc
  }, {} as Record<string, { count: number; totalViews: number; totalLikes: number }>)

  const categories = Object.keys(categoryStats)
  const counts = categories.map(cat => categoryStats[cat].count)

  // Generate different colors for each category
  const colors = categories.map((_, index) => {
    const hue = (index * 137.508) % 360 // Golden angle approximation for good color distribution
    return `hsla(${hue}, 70%, 60%, 0.8)`
  })

  const borderColors = categories.map((_, index) => {
    const hue = (index * 137.508) % 360
    return `hsla(${hue}, 70%, 50%, 1)`
  })

  const data = {
    labels: categories,
    datasets: [
      {
        label: 'Number of Videos',
        data: counts,
        backgroundColor: colors,
        borderColor: borderColors,
        borderWidth: 2,
      }
    ]
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          boxWidth: 12,
          padding: 15
        }
      },
      title: {
        display: true,
        text: 'Videos by Category'
      },
      tooltip: {
        callbacks: {
          label: function (context: { label: string; parsed: number; dataset: { data: number[] } }) {
            const label = context.label || ''
            const value = context.parsed
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
            const percentage = ((value / total) * 100).toFixed(1)
            return `${label}: ${value} videos (${percentage}%)`
          }
        }
      }
    }
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <Pie data={data} options={options} />
    </div>
  )
}

// Sentiment Over Time Chart
export function SentimentOverTimeChart({ sentimentOverTime }: {
  sentimentOverTime: Array<{
    date: string
    positive: number
    negative: number
    neutral: number
    total_comments: number
  }>
}) {
  if (!sentimentOverTime || sentimentOverTime.length === 0) return null

  const data = {
    labels: sentimentOverTime.map(item => new Date(item.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Positive %',
        data: sentimentOverTime.map(item => item.positive),
        borderColor: 'rgba(34, 197, 94, 1)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Negative %',
        data: sentimentOverTime.map(item => item.negative),
        borderColor: 'rgba(239, 68, 68, 1)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Neutral %',
        data: sentimentOverTime.map(item => item.neutral),
        borderColor: 'rgba(156, 163, 175, 1)',
        backgroundColor: 'rgba(156, 163, 175, 0.1)',
        fill: true,
        tension: 0.4,
      }
    ]
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Sentiment Trends Over Time'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Percentage (%)'
        }
      }
    }
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <Line data={data} options={options} />
    </div>
  )
}

// Channel Growth Chart
export function ChannelGrowthChart({ videos }: { videos: Video[] }) {
  if (!videos || videos.length === 0) return null

  const monthlyData = videos
    .filter(v => v.published_at)
    .reduce((acc, video) => {
      const date = new Date(video.published_at!)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      if (!acc[monthKey]) {
        acc[monthKey] = { videos: 0, views: 0, likes: 0 }
      }

      acc[monthKey].videos++
      acc[monthKey].views += video.view_count || 0
      acc[monthKey].likes += video.like_count || 0

      return acc
    }, {} as Record<string, { videos: number; views: number; likes: number }>)

  const sortedMonths = Object.keys(monthlyData).sort()

  const data = {
    labels: sortedMonths.map(month => {
      const [year, monthNum] = month.split('-')
      return new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short'
      })
    }),
    datasets: [
      {
        label: 'Videos Published',
        data: sortedMonths.map(month => monthlyData[month].videos),
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Total Views (M)',
        data: sortedMonths.map(month => Number((monthlyData[month].views / 1000000).toFixed(1))),
        borderColor: 'rgba(34, 197, 94, 1)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: false,
        tension: 0.4,
        yAxisID: 'y1',
      }
    ]
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Channel Growth Over Time'
      }
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Videos Published'
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Views (Millions)'
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    }
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <Line data={data} options={options} />
    </div>
  )
}