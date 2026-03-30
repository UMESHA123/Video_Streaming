"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ThumbsUp,
  Eye,
  Calendar,
  Loader2,
  Share2,
  Flag,
  Tag,
} from "lucide-react";
import { useVideo, Video } from "@/hooks/useVideo";
import { useAuth } from "@/hooks/useAuth";
import VideoPlayer from "@/components/VideoPlayer";
import CommentSection from "@/components/CommentSection";
import api from "@/lib/api";

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatViews(views?: number): string {
  if (!views) return "0 views";
  if (views === 1) return "1 view";
  if (views >= 1_000_000)
    return `${(views / 1_000_000).toFixed(1).replace(/\.0$/, "")}M views`;
  if (views >= 1_000)
    return `${(views / 1_000).toFixed(1).replace(/\.0$/, "")}K views`;
  return `${views} views`;
}

export default function WatchPage() {
  const params = useParams();
  const videoId = params.id as string;
  const { video, loading, error, fetchVideo } = useVideo();
  const { isAuthenticated } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    if (videoId) {
      fetchVideo(videoId);
    }
  }, [videoId, fetchVideo]);

  useEffect(() => {
    if (video) {
      setLikeCount(video.likes ?? 0);
    }
  }, [video]);

  const handleLike = async () => {
    if (!isAuthenticated) return;

    try {
      if (liked) {
        await api.delete(`/videos/${videoId}/like`);
        setLiked(false);
        setLikeCount((prev) => Math.max(0, prev - 1));
      } else {
        await api.post(`/videos/${videoId}/like`);
        setLiked(true);
        setLikeCount((prev) => prev + 1);
      }
    } catch {
      // Error handled by API interceptor
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">
            {error || "Video not found"}
          </p>
          <a href="/" className="btn-primary px-6 py-2">
            Go Home
          </a>
        </div>
      </div>
    );
  }

  const streamSrc = video.hlsUrl || video.streamUrl || "";

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Video Player */}
          <VideoPlayer
            src={streamSrc}
            poster={video.thumbnail}
            autoPlay
          />

          {/* Video Info */}
          <div className="mt-4">
            <h1 className="text-xl font-semibold text-white leading-tight">
              {video.title}
            </h1>

            {/* Metadata & Actions Row */}
            <div className="flex flex-wrap items-center justify-between gap-4 mt-3 pb-4 border-b border-surface-border">
              {/* View Count & Date */}
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {formatViews(video.views)}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(video.createdAt)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleLike}
                  disabled={!isAuthenticated}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    liked
                      ? "bg-red-600/20 text-red-400 border border-red-600/30"
                      : "bg-surface-hover text-gray-300 hover:bg-surface-border"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <ThumbsUp
                    className={`w-4 h-4 ${liked ? "fill-current" : ""}`}
                  />
                  {likeCount}
                </button>

                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium bg-surface-hover text-gray-300 hover:bg-surface-border transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>

                <button className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium bg-surface-hover text-gray-300 hover:bg-surface-border transition-colors">
                  <Flag className="w-4 h-4" />
                  Report
                </button>
              </div>
            </div>

            {/* Description */}
            {video.description && (
              <div className="mt-4 p-4 bg-surface-card rounded-xl">
                <p className="text-sm text-gray-300 whitespace-pre-wrap">
                  {video.description}
                </p>
              </div>
            )}

            {/* Tags */}
            {video.tags && video.tags.length > 0 && (
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <Tag className="w-4 h-4 text-gray-500" />
                {video.tags.map((tag) => (
                  <a
                    key={tag}
                    href={`/search?q=${encodeURIComponent(tag)}`}
                    className="text-xs bg-surface-hover text-blue-400 px-2.5 py-1 rounded-full hover:bg-surface-border transition-colors"
                  >
                    #{tag}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Comments */}
          <CommentSection videoId={videoId} />
        </div>

        {/* Sidebar - Related Videos Placeholder */}
        <aside className="lg:col-span-1">
          <h2 className="text-base font-semibold text-gray-300 mb-4">
            Up next
          </h2>
          <p className="text-sm text-gray-600">
            Related videos coming soon...
          </p>
        </aside>
      </div>
    </div>
  );
}
