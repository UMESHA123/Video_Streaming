"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { User, Film, Calendar, Loader2 } from "lucide-react";
import { useVideo, Video } from "@/hooks/useVideo";
import VideoCard from "@/components/VideoCard";
import api from "@/lib/api";

interface UserProfile {
  id: string;
  username: string;
  avatarUrl: string;
  bio: string;
  plan: string;
  createdAt: string;
}

function formatJoinDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });
}

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { videos, loading: videosLoading, fetchUserVideos } = useVideo();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    if (!username) return;

    const loadProfile = async () => {
      setProfileLoading(true);
      setProfileError(null);
      try {
        const response = await api.get(`/users/${username}`);
        setProfile(response.data.user || response.data);
      } catch (err: any) {
        setProfileError(err.message || "Failed to load profile");
      } finally {
        setProfileLoading(false);
      }
    };

    loadProfile();
    fetchUserVideos(username);
  }, [username, fetchUserVideos]);

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-700 mx-auto mb-4" />
          <p className="text-red-400 text-lg mb-4">
            {profileError || "User not found"}
          </p>
          <a href="/" className="btn-primary px-6 py-2">
            Go Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-4 py-6">
      {/* Profile Header */}
      <div className="card-dark p-6 mb-8">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          {profile.avatarUrl ? (
            <img
              src={
                profile.avatarUrl.startsWith("http")
                  ? profile.avatarUrl
                  : `${process.env.NEXT_PUBLIC_STREAM_URL}${profile.avatarUrl}`
              }
              alt={profile.username}
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-red-600 flex items-center justify-center text-3xl font-bold text-white shrink-0">
              {profile.username.charAt(0).toUpperCase()}
            </div>
          )}

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">
              {profile.username}
            </h1>
            {profile.bio && (
              <p className="text-sm text-gray-400 mt-1 max-w-xl">
                {profile.bio}
              </p>
            )}
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Film className="w-4 h-4" />
                {videos.length} {videos.length === 1 ? "video" : "videos"}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Joined {formatJoinDate(profile.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* User's Videos */}
      <h2 className="text-lg font-semibold text-white mb-4">Videos</h2>

      {videosLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
        </div>
      )}

      {!videosLoading && videos.length === 0 && (
        <div className="text-center py-12">
          <Film className="w-10 h-10 text-gray-700 mx-auto mb-2" />
          <p className="text-sm text-gray-500">
            This user hasn&apos;t uploaded any videos yet.
          </p>
        </div>
      )}

      {!videosLoading && videos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
          {videos.map((video: Video) => (
            <VideoCard key={video.id || video._id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
}
