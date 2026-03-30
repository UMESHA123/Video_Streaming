"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import UploadForm from "@/components/UploadForm";

export default function UploadPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Upload className="w-7 h-7" />
          Upload Video
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Upload a video to StreamLocal. It will be transcoded to multiple
          quality levels for adaptive streaming.
        </p>
      </div>

      <UploadForm />
    </div>
  );
}
