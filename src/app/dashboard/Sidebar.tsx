'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserChannel } from '@/hooks/useUserChannel'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  onCollapseChange?: (collapsed: boolean) => void
}

interface User {
  name?: string
  email?: string
  avatar?: string
}

interface MenuItem {
  id: string
  label: string
  icon: string
  href: string
  badge?: string | null
  description?: string
}

export default function Sidebar({ isOpen, onClose, onCollapseChange }: SidebarProps) {
  const [activeItem, setActiveItem] = useState<string>('dashboard')
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false)
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  // Get user's channel data for quick stats
  const { channelAnalysis, user: currentUser } = useUserChannel()

  // Notify parent when collapse state changes
  useEffect(() => {
    if (onCollapseChange) {
      onCollapseChange(isCollapsed)
    }
  }, [isCollapsed, onCollapseChange])

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', href: '/dashboard', badge: null, description: 'Overview & insights' },
    { id: 'analytics-dashboard', label: 'Complete Analytics', icon: '🚀', href: '/analytics-dashboard', badge: 'Pro', description: 'Full AI-powered dashboard' },
    { id: 'channel-commits', label: 'Channel Commits', icon: '🎬', href: '/channel-commits', badge: 'New', description: 'Analyze video commits' },
    { id: 'commits', label: 'Commit Analyzer', icon: '📝', href: '/commits', badge: 'New', description: 'AI commit analysis' },
    // { id: 'content', label: 'Content Manager', icon: '📝', href: '/content', badge: null, description: 'Create & schedule' },
    // { id: 'audience', label: 'Audience Insights', icon: '👥', href: '/audience', badge: null, description: 'Know your followers' },
    // { id: 'competitors', label: 'Competitors', icon: '🔍', href: '/competitors', badge: 'Pro', description: 'Track competition' },
    // { id: 'reports', label: 'Reports', icon: '📋', href: '/reports', badge: null, description: 'Export & share' },
    // { id: 'accounts', label: 'Social Accounts', icon: '🔗', href: '/accounts', badge: '4', description: 'Connected platforms' },
    { id: 'settings', label: 'Settings', icon: '⚙️', href: '/settings', badge: null, description: 'Preferences & billing' },
  ]

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    router.push('/')
  }

  const handleNavigation = (item: MenuItem) => {
    setActiveItem(item.id)
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      onClose()
    }
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 ${isCollapsed ? 'w-16' : 'w-64'
          } bg-white shadow-xl border-r border-gray-200 transform transition-all duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:fixed lg:inset-y-0`}
      >
        {/* Logo Header */}
        <div
          className={`flex items-center justify-between h-16 ${isCollapsed ? 'px-2' : 'px-4'
            } border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50`}
        >
          <div className="flex items-center min-w-0">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            {!isCollapsed && (
              <div className="ml-3 min-w-0">
                <span className="text-lg font-bold text-gray-900 block truncate">Reach1K</span>
                <div className="text-xs text-gray-500">Analytics</div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-1">
            {/* Collapse button for desktop */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <svg
                className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>

            {/* Close button for mobile */}
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 mt-3 ${isCollapsed ? 'px-1' : 'px-3'} pb-4 overflow-y-auto`}>
          <div className="space-y-1">
            {menuItems.map((item) => (
              <div key={item.id} className="relative group">
                <a
                  href={item.href}
                  onClick={() => handleNavigation(item)}
                  className={`w-full flex items-center ${isCollapsed ? 'px-2 py-2 justify-center' : 'px-3 py-2.5'
                    } text-sm font-medium rounded-lg transition-all duration-200 group relative ${activeItem === item.id
                      ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 shadow-sm border border-blue-100'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  title={isCollapsed ? item.label : ''}
                >
                  <span
                    className={`${isCollapsed ? 'text-base' : 'text-lg'
                      } flex-shrink-0 group-hover:scale-110 transition-transform`}
                  >
                    {item.icon}
                  </span>

                  {!isCollapsed && (
                    <>
                      <div className="ml-3 flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="truncate text-sm">{item.label}</span>
                          {item.badge && (
                            <span
                              className={`ml-2 px-1.5 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${item.badge === 'New'
                                ? 'bg-green-100 text-green-700'
                                : item.badge === 'Pro'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-blue-100 text-blue-700'
                                }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {activeItem === item.id && !isCollapsed && (
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                  )}
                  {activeItem === item.id && isCollapsed && (
                    <div className="absolute right-1 w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                  )}
                </a>

                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs text-gray-300">{item.description}</div>
                    <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Quick Stats Card - Real User Data */}
          {!isCollapsed && (
            <div className="mt-6">
              <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-lg p-3 border border-red-200">
                <h3 className="text-xs font-semibold text-gray-900 mb-2 flex items-center">
                  <span className="mr-1">🎥</span>
                  {currentUser?.youtubeChannel ? 'Your Channel' : 'Quick Stats'}
                </h3>

                {channelAnalysis?.analysis_summary ? (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Videos</span>
                      <span className="text-xs font-bold text-gray-900">
                        {channelAnalysis.analysis_summary.total_videos}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Views</span>
                      <span className="text-xs font-bold text-green-600">
                        {(channelAnalysis.analysis_summary.total_views / 1000000).toFixed(1)}M
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Engagement</span>
                      <span className="text-xs font-bold text-blue-600">
                        {channelAnalysis.analysis_summary.avg_engagement_rate}%
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-2 truncate">
                      {channelAnalysis.channel_info.title}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Followers</span>
                      <span className="text-xs font-bold text-gray-900">25.6K</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Engagement</span>
                      <span className="text-xs font-bold text-green-600">+8.2%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Platforms</span>
                      <span className="text-xs font-bold text-blue-600">4/6</span>
                    </div>
                    {currentUser?.youtubeChannel && (
                      <div className="text-xs text-gray-500 mt-2">
                        Loading {currentUser.youtubeChannel}...
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </nav>

        {/* User Profile Section */}
        <div className={`border-t border-gray-200 ${isCollapsed ? 'p-2' : 'p-3'}`}>
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
            <div
              className={`${isCollapsed ? 'w-8 h-8' : 'w-9 h-9'
                } bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0`}
            >
              <span className="text-white font-medium text-sm">
                {user?.avatar || user?.name?.charAt(0) || 'U'}
              </span>
            </div>
            {!isCollapsed && (
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email || 'user@example.com'}</p>
              </div>
            )}
            {!isCollapsed && (
              <div className="ml-2">
                <button
                  onClick={handleLogout}
                  className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  title="Logout"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
