"use client";

import { useState, useCallback } from "react";
import api from "@/lib/api";

export interface Video {
  id: string;
  _id?: string;
  userId?: string;
  title: string;
  description?: string;
  thumbnail?: string;
  thumbnailUrl?: string;
  duration?: number;
  fileSize?: number;
  views?: number;
  likes?: number;
  tags?: string[];
  status?: string;
  hlsUrl?: string;
  streamUrl?: string;
  user?: {
    id?: string;
    _id?: string;
    username: string;
    avatar?: string;
    avatarUrl?: string;
  };
  createdAt: string;
  updatedAt?: string;
}

interface UseVideoReturn {
  videos: Video[];
  video: Video | null;
  loading: boolean;
  error: string | null;
  fetchVideos: () => Promise<void>;
  fetchVideo: (id: string) => Promise<void>;
  searchVideos: (query: string) => Promise<void>;
  fetchUserVideos: (username: string) => Promise<void>;
}

export function useVideo(): UseVideoReturn {
  const [videos, setVideos] = useState<Video[]>([]);
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/videos");
      setVideos(response.data.videos || response.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch videos");
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchVideo = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/videos/${id}`);
      setVideo(response.data.video || response.data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch video");
      setVideo(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchVideos = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/videos/search?q=${encodeURIComponent(query)}`);
      setVideos(response.data.videos || response.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to search videos");
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserVideos = useCallback(async (username: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/users/${username}/videos`);
      setVideos(response.data.videos || response.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch user videos");
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    videos,
    video,
    loading,
    error,
    fetchVideos,
    fetchVideo,
    searchVideos,
    fetchUserVideos,
  };
}
