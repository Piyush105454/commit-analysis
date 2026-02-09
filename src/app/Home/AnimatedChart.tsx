'use client'
import { useState, useEffect } from 'react'

const views = [
  {
    title: "Growth Metrics",
    data: { followers: 12500, growth: 8.5, engagement: 4.2 },
    bars: [65, 78, 82, 75, 88, 92],
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  },
  {
    title: "Engagement Rate",
    data: { likes: 2400, comments: 340, shares: 180 },
    bars: [45, 62, 58, 71, 66, 79],
    labels: ['Reels', 'Posts', 'Stories', 'IGTV', 'Live', 'Guides']
  },
  {
    title: "Reach & Impressions",
    data: { reach: 45600, impressions: 89200, peak: '2PM' },
    bars: [72, 85, 91, 68, 76, 83],
    labels: ['12PM', '1PM', '2PM', '3PM', '4PM', '5PM']
  },
  {
    title: "Content Performance",
    data: { video: 68, image: 24, text: 8 },
    bars: [68, 24, 8, 45, 62, 38],
    labels: ['Video', 'Image', 'Text', 'Carousel', 'Story', 'Reel']
  },
  {
    title: "Audience Insights",
    data: { age: '25-34', gender: '60% F', location: 'NYC' },
    bars: [42, 68, 35, 28, 15, 22],
    labels: ['18-24', '25-34', '35-44', '45-54', '55-64', '65+']
  }
]

const colors = ['#1DA1F2', '#E1306C', '#0077B5', '#25D366', '#FF0000', '#7B68EE']

export default function AnimatedChart() {
  const [currentView, setCurrentView] = useState(0)
  const [showGrowth, setShowGrowth] = useState(true)
  const [animatedValues, setAnimatedValues] = useState<Record<string, number>>({})

  // Auto switch view
  useEffect(() => {
    const viewInterval = setInterval(() => {
      setCurrentView(prev => (prev + 1) % views.length)
      setShowGrowth(false)
      setTimeout(() => setShowGrowth(true), 300)
    }, 3000)

    return () => clearInterval(viewInterval)
  }, [])

  // Animate values
  useEffect(() => {
    const viewData = views[currentView]!   // ✅ renamed
    const animateValues = () => {
      Object.keys(viewData.data).forEach(key => {
        const k = key as keyof typeof viewData.data;
        const target = viewData.data[k]
        if (typeof target === 'number') {
          setAnimatedValues(prev => {
            const current = prev[k] || 0
            const diff = target - current
            if (Math.abs(diff) < 0.5) return { ...prev, [k]: target }
            return { ...prev, [key]: current + (diff * 0.1) }
          })
        }
      })
    }

    const interval = setInterval(animateValues, 50)
    return () => clearInterval(interval)
  }, [currentView])

  // ✅ single declaration
  const currentData = views[currentView]!

  return (
    <div className="relative bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg p-5 max-w-lg mx-auto border border-gray-100">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-gray-800">Social Analytics</h3>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-500">Live</span>
          </div>
        </div>
        <p className="text-sm text-blue-600 font-medium">{currentData.title}</p>
        <div className="flex items-center mt-2">
          <div className="flex space-x-1">
            {views.map((_, index) => (
              <div
                key={index}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${index === currentView ? 'bg-blue-500 scale-125' : 'bg-gray-300'
                  }`}
              />
            ))}
          </div>
          <span className="ml-3 text-xs text-gray-500">{currentView + 1}/{views.length}</span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {Object.entries(currentData.data).map(([key, value]) => (
          <div key={key} className="bg-white rounded-lg p-2 text-center border border-gray-100">
            <div className="text-sm font-bold text-gray-800">
              {typeof value === 'number'
                ? (key === 'followers'
                  ? `${Math.round(animatedValues[key] || 0).toLocaleString()}`
                  : key === 'reach' || key === 'impressions'
                    ? `${Math.round((animatedValues[key] || 0) / 1000)}K`
                    : `${Math.round(animatedValues[key] || 0)}${key.includes('growth') || key.includes('engagement') ? '%' : ''}`)
                : value}
            </div>
            <div className="text-xs text-gray-500 capitalize">{key}</div>
          </div>
        ))}
      </div>

      {/* Chart Container */}
      <div className="relative h-32 mb-3">
        {/* Grid Lines */}
        <div className="absolute inset-0">
          {[0, 50, 100].map(line => (
            <div
              key={line}
              className="absolute w-full border-t border-gray-200"
              style={{ bottom: `${line}%` }}
            />
          ))}
        </div>

        {/* Bars */}
        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between px-1 h-full">
          {currentData.bars.map((value, index) => (
            <div key={index} className="flex flex-col items-center flex-1 mx-0.5">
              {/* Growth Arrow */}
              {showGrowth && value > 70 && (
                <div className="absolute -top-4 animate-bounce">
                  <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}

              {/* Bar */}
              <div
                className="w-full max-w-6 rounded-t-sm transition-all duration-700 ease-out relative overflow-hidden"
                style={{
                  height: `${value}%`,
                  backgroundColor: colors[index % colors.length],
                  boxShadow: value > 70 ? `0 0 10px ${colors[index % colors.length]}40` : 'none'
                }}
              >
                {value > 75 && (
                  <div className="absolute inset-0 bg-white opacity-30 animate-pulse" />
                )}
              </div>

              {/* Label */}
              <span className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-center">
                {currentData.labels[index]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Trend Indicators */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-2 text-center">
          <div className="flex items-center justify-center text-sm font-bold text-green-600">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
            +{Math.round(Math.max(...currentData.bars))}%
          </div>
          <div className="text-xs text-green-700">This Week</div>
        </div>
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-2 text-center">
          <div className="text-sm font-bold text-blue-600">
            {Math.round(currentData.bars.reduce((a, b) => a + b, 0) / currentData.bars.length)}%
          </div>
          <div className="text-xs text-blue-700">Average</div>
        </div>
      </div>

      {/* Platform Indicators */}
      <div className="absolute -top-1 -right-1 flex space-x-1">
        <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse" title="Instagram"></div>
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse animation-delay-300" title="LinkedIn"></div>
        <div className="w-2 h-2 bg-sky-400 rounded-full animate-pulse animation-delay-500" title="Twitter"></div>
      </div>


      {/* Progress Line */}
      <div className="absolute top-0 left-0 w-full h-0.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-pink-500 via-blue-500 to-green-500 transition-all duration-3000 ease-out"
          style={{ width: `${((currentView + 1) / views.length) * 100}%` }}
        />
      </div>
    </div>
  )
}
