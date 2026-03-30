"use client";

import Link from "next/link";
import Image from "next/image";
import { Eye, Clock } from "lucide-react";
import { Video } from "@/hooks/useVideo";

interface VideoCardProps {
  video: Video;
}

/**
 * Format seconds into MM:SS or HH:MM:SS
 */
function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return "0:00";
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Format a number into a compact view count string
 */
function formatViews(views?: number): string {
  if (!views || views === 0) return "0 views";
  if (views === 1) return "1 view";
  if (views >= 1_000_000) {
    return `${(views / 1_000_000).toFixed(1).replace(/\.0$/, "")}M views`;
  }
  if (views >= 1_000) {
    return `${(views / 1_000).toFixed(1).replace(/\.0$/, "")}K views`;
  }
  return `${views} views`;
}

/**
 * Format a date string into a relative "time ago" string
 */
function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    return `${mins} ${mins === 1 ? "minute" : "minutes"} ago`;
  }
  if (seconds < 86400) {
    const hrs = Math.floor(seconds / 3600);
    return `${hrs} ${hrs === 1 ? "hour" : "hours"} ago`;
  }
  if (seconds < 2592000) {
    const days = Math.floor(seconds / 86400);
    return `${days} ${days === 1 ? "day" : "days"} ago`;
  }
  if (seconds < 31536000) {
    const months = Math.floor(seconds / 2592000);
    return `${months} ${months === 1 ? "month" : "months"} ago`;
  }
  const years = Math.floor(seconds / 31536000);
  return `${years} ${years === 1 ? "year" : "years"} ago`;
}

export default function VideoCard({ video }: VideoCardProps) {
  const videoId = video.id || video._id;
  const rawThumbnail = video.thumbnailUrl || video.thumbnail;
  const thumbnailUrl = rawThumbnail
    ? rawThumbnail.startsWith("http")
      ? rawThumbnail
      : `${process.env.NEXT_PUBLIC_STREAM_URL}${rawThumbnail}`
    : null;

  return (
    <Link href={`/watch/${videoId}`} className="block group">
      <div className="video-card">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-surface-hover rounded-xl overflow-hidden">
          {thumbnailUrl ? (
            <Image
              src={thumbnailUrl}
              alt={video.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-surface-hover">
              <Clock className="w-10 h-10 text-gray-600" />
            </div>
          )}

          {/* Duration overlay */}
          {video.duration && video.duration > 0 && (
            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-medium px-1.5 py-0.5 rounded">
              {formatDuration(video.duration)}
            </div>
          )}

          {/* Hover play overlay */}
          <div className="thumbnail-overlay absolute inset-0 bg-black/20 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white ml-0.5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="flex gap-3 mt-3">
          {/* Channel Avatar */}
          {video.user && (
            <div className="shrink-0">
              {video.user.avatar ? (
                <img
                  src={video.user.avatar}
                  alt={video.user.username}
                  className="w-9 h-9 rounded-full object-cover"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-surface-hover flex items-center justify-center text-sm font-medium text-gray-400">
                  {video.user.username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          )}

          {/* Text */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-white line-clamp-2 leading-snug">
              {video.title}
            </h3>
            {video.user && (
              <p className="text-xs text-gray-400 mt-1 hover:text-gray-300 transition-colors">
                {video.user.username}
              </p>
            )}
            <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
              <span>{formatViews(video.views)}</span>
              <span className="mx-1">&middot;</span>
              <span>{timeAgo(video.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
