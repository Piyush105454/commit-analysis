'use client'
import { useState, type FormEvent } from 'react'
import { authAPI } from '@/services/api'

interface YouTubeChannelSetupProps {
  currentChannel?: string
  onChannelUpdated: (channelName: string) => void
}

export default function YouTubeChannelSetup({ currentChannel, onChannelUpdated }: YouTubeChannelSetupProps) {
  const [channelName, setChannelName] = useState(currentChannel || '')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!channelName.trim()) return

    setLoading(true)
    setMessage('')

    try {
      const response = await authAPI.updateProfile({
        youtubeChannel: channelName.trim()
      })

      if (response.success) {
        setMessage('✅ YouTube channel updated successfully!')
        onChannelUpdated(channelName.trim())

        // Update localStorage with new user data
        localStorage.setItem('user', JSON.stringify(response.user))

        // Refresh page to reload dashboard with new channel
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        setMessage('❌ Failed to update channel: ' + response.message)
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message: string };
      setMessage('❌ Error: ' + (err.response?.data?.message || err.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-6 border border-red-200">
      <div className="flex items-center mb-4">
        <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mr-4">
          <span className="text-white text-xl">🎥</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {currentChannel ? 'Update YouTube Channel' : 'Connect Your YouTube Channel'}
          </h3>
          <p className="text-gray-600 text-sm">
            {currentChannel
              ? `Current: ${currentChannel}`
              : 'Add your YouTube channel to see real analytics on your dashboard'
            }
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            YouTube Channel Name
          </label>
          <input
            type="text"
            value={channelName}
            onChange={(e) => setChannelName(e.target.value)}
            placeholder="Enter your YouTube channel name (e.g., MrBeast, PewDiePie)"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter the exact name as it appears on YouTube
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={loading || !channelName.trim()}
            className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating...' : currentChannel ? 'Update Channel' : 'Connect Channel'}
          </button>

          {currentChannel && (
            <button
              type="button"
              onClick={() => setChannelName('')}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Clear
            </button>
          )}
        </div>

        {message && (
          <div className={`p-3 rounded-lg text-sm ${message.includes('✅')
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
            {message}
          </div>
        )}
      </form>

      <div className="mt-4 text-xs text-gray-500">
        <strong>Popular channels to try:</strong> MrBeast, PewDiePie, T-Series, Cocomelon, SET India
      </div>
    </div>
  )
}