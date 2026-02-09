import { useState, useEffect } from 'react';
import { youtubeAPI, authAPI } from '@/services/api';

interface ChannelAnalysisData {
  analysis_summary: {
    total_videos: number;
    total_views: number;
    avg_engagement_rate: number;
  };
  channel_info: {
    title: string;
    thumbnail: string;
    channel_id: string;
  };
  all_videos: unknown[];
}

interface UserChannelData {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    youtubeChannel?: string;
    channelData?: {
      channelId?: string;
      subscriberCount?: number;
      videoCount?: number;
      viewCount?: number;
      thumbnail?: string;
      lastAnalyzed?: string;
    };
  };
  channelAnalysis: ChannelAnalysisData | null;
  loading: boolean;
  error: string | null;
}

export const useUserChannel = () => {
  const [data, setData] = useState<UserChannelData>({
    user: { firstName: '', lastName: '', email: '' },
    channelAnalysis: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchUserChannelData = async () => {
      try {
        setData(prev => ({ ...prev, loading: true, error: null }));

        // Get current user data
        const userResponse = await authAPI.getCurrentUser();

        if (!userResponse.success) {
          throw new Error('Failed to get user data');
        }

        const user = userResponse.user;
        setData(prev => ({ ...prev, user }));

        // If user has a YouTube channel, analyze it
        if (user.youtubeChannel) {
          try {
            const channelResponse = await youtubeAPI.analyzeChannel({
              channelName: user.youtubeChannel,
              maxVideos: 50
            });

            if (channelResponse.success) {
              // Update user's channel data in database
              const responseData = channelResponse as unknown as ChannelAnalysisData;
              const channelInfo = responseData.channel_info;
              const analysisData = responseData.analysis_summary;

              await authAPI.updateChannelData({
                channelId: channelInfo.channel_id,
                subscriberCount: analysisData.total_views, // Using views as subscriber proxy
                videoCount: analysisData.total_videos,
                viewCount: analysisData.total_views,
                thumbnail: channelInfo.thumbnail
              });

              setData(prev => ({
                ...prev,
                channelAnalysis: responseData,
                loading: false
              }));
            } else {
              setData(prev => ({
                ...prev,
                error: `Could not analyze channel: ${user.youtubeChannel}`,
                loading: false
              }));
            }
          } catch (channelError: unknown) {
            const err = channelError as { response?: { data?: { message?: string } }; message: string };
            const errorMessage = err.response?.data?.message || err.message;
            setData(prev => ({
              ...prev,
              error: `Failed to analyze channel: ${user.youtubeChannel}. ${errorMessage}`,
              loading: false
            }));
          }
        } else {
          // User has no YouTube channel
          setData(prev => ({
            ...prev,
            error: 'No YouTube channel configured. Please update your profile.',
            loading: false
          }));
        }

      } catch (error: unknown) {
        const err = error as Error;
        console.error('User channel data fetch error:', err);
        setData(prev => ({
          ...prev,
          error: err.message || 'Failed to fetch user data',
          loading: false
        }));
      }
    };

    // Only fetch if user is logged in
    const token = localStorage.getItem('authToken');
    if (token) {
      fetchUserChannelData();
    } else {
      setData(prev => ({
        ...prev,
        loading: false,
        error: 'Please log in to see your channel analytics'
      }));
    }
  }, []);

  const refreshChannelData = async () => {
    const token = localStorage.getItem('authToken');
    if (token && data.user.youtubeChannel) {
      setData(prev => ({ ...prev, loading: true, error: null }));

      try {
        const channelResponse = await youtubeAPI.analyzeChannel({
          channelName: data.user.youtubeChannel,
          maxVideos: 50
        });

        if (channelResponse.success) {
          setData(prev => ({
            ...prev,
            channelAnalysis: channelResponse as unknown as ChannelAnalysisData,
            loading: false
          }));
        }
      } catch {
        setData(prev => ({
          ...prev,
          error: 'Failed to refresh channel data',
          loading: false
        }));
      }
    }
  };

  return {
    ...data,
    refreshChannelData
  };
};