"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { useVideo, Video } from "@/hooks/useVideo";
import VideoCard from "@/components/VideoCard";

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const { videos, loading, error, searchVideos } = useVideo();

  useEffect(() => {
    if (query.trim()) {
      searchVideos(query);
    }
  }, [query, searchVideos]);

  return (
    <div className="max-w-screen-2xl mx-auto px-4 py-6">
      {/* Search Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
          <Search className="w-4 h-4" />
          Search results for
        </div>
        <h1 className="text-2xl font-bold text-white">
          &ldquo;{query}&rdquo;
        </h1>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="text-center py-20">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* No Results */}
      {!loading && !error && videos.length === 0 && query && (
        <div className="text-center py-20">
          <Search className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-300 mb-2">
            No results found
          </h2>
          <p className="text-gray-500">
            Try different keywords or check for typos.
          </p>
        </div>
      )}

      {/* Results Grid */}
      {!loading && videos.length > 0 && (
        <>
          <p className="text-sm text-gray-500 mb-4">
            {videos.length} {videos.length === 1 ? "result" : "results"}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
            {videos.map((video: Video) => (
              <VideoCard key={video.id || video._id} video={video} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
        </div>
      }
    >
      <SearchResults />
    </Suspense>
  );
}
