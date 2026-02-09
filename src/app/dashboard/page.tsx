'use client'
import { useState } from 'react'
import Sidebar from './Sidebar'

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false)

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onCollapseChange={(collapsedState: boolean) => setSidebarCollapsed(collapsedState)}
      />

      {/* Main Content */}
      <div
        className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
          }`}
      >
        <main className="min-h-screen">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 mb-6 sm:mb-8 -mx-4 sm:-mx-6">
            {/* Mobile menu + profile */}
            <div className="flex items-center justify-between mb-4 lg:hidden">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <div className="flex items-center space-x-2">
                {/* Notifications */}
                <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                  </svg>
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>

                {/* Profile */}
                <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">JD</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Desktop Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Left side */}
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-shrink-0">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                      Social Media Dashboard
                    </h1>
                    <p className="text-gray-600">
                      Track your performance across all platforms
                    </p>
                  </div>

                  {/* Search bar */}
                  <div className="flex-1 max-w-md">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        placeholder="Search analytics and insights..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right side */}
              <div className="flex flex-wrap gap-3 lg:flex-shrink-0">
                <button className="bg-gray-50 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">
                  📅 Last 30 days
                </button>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                  📊 Export Data
                </button>
                <button className="hidden sm:flex items-center px-3 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                  <span className="mr-2">🤖</span>
                  AI Insights
                </button>
              </div>
            </div>
          </div>

          {/* Platform Overview */}
          <div className="px-4 sm:px-6 pb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Platform Overview</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { name: 'Instagram', followers: '12.5K', growth: '+8.2%', color: 'bg-pink-500', icon: '📷' },
                  { name: 'Facebook', followers: '8.2K', growth: '+5.1%', color: 'bg-blue-600', icon: '👥' },
                  { name: 'Twitter', followers: '3.1K', growth: '+12.3%', color: 'bg-sky-500', icon: '🐦' },
                  { name: 'LinkedIn', followers: '2.8K', growth: '+6.7%', color: 'bg-blue-700', icon: '💼' },
                  { name: 'TikTok', followers: '15.2K', growth: '+25.4%', color: 'bg-black', icon: '🎵' },
                  { name: 'YouTube', followers: '1.8K', growth: '+3.2%', color: 'bg-red-600', icon: '📺' }
                ].map((platform, index) => (
                  <div key={index} className="text-center p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className={`w-10 h-10 ${platform.color} rounded-lg flex items-center justify-center text-white text-lg mx-auto mb-2`}>
                      {platform.icon}
                    </div>
                    <div className="text-sm font-medium text-gray-900">{platform.name}</div>
                    <div className="text-xs text-gray-600">{platform.followers}</div>
                    <div className="text-xs text-green-600 font-medium">{platform.growth}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
