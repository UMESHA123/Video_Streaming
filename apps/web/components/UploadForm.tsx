"use client";

import { useState, useRef, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileVideo,
  X,
  CheckCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";
import api from "@/lib/api";

type UploadStatus = "idle" | "uploading" | "processing" | "done" | "error";

export default function UploadForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      // Auto-fill title from filename if empty
      if (!title) {
        const name = selected.name.replace(/\.[^/.]+$/, "");
        setTitle(name.replace(/[-_]/g, " "));
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped && dropped.type.startsWith("video/")) {
      setFile(dropped);
      if (!title) {
        const name = dropped.name.replace(/\.[^/.]+$/, "");
        setTitle(name.replace(/[-_]/g, " "));
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!file) {
      setErrorMessage("Please select a video file.");
      return;
    }

    if (!title.trim()) {
      setErrorMessage("Please enter a title.");
      return;
    }

    setErrorMessage("");
    setStatus("uploading");
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append("video", file);
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      if (tags.trim()) {
        formData.append(
          "tags",
          JSON.stringify(
            tags.split(",").map((t) => t.trim()).filter(Boolean)
          )
        );
      }

      const response = await api.post("/videos/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setProgress(percent);
            if (percent >= 100) {
              setStatus("processing");
            }
          }
        },
      });

      setStatus("done");
      const videoId =
        response.data.video?.id ||
        response.data.video?._id ||
        response.data.id;

      // Redirect after a short delay to show success state
      setTimeout(() => {
        if (videoId) {
          router.push(`/watch/${videoId}`);
        } else {
          router.push("/");
        }
      }, 1500);
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || "Upload failed. Please try again.");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(1)} GB`;
    if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
    return `${(bytes / 1_000).toFixed(1)} KB`;
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
      {/* File Drop Zone */}
      {!file ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          className="card-dark border-dashed border-2 p-12 flex flex-col items-center justify-center cursor-pointer hover:border-gray-500 transition-colors"
        >
          <Upload className="w-12 h-12 text-gray-500 mb-4" />
          <p className="text-lg text-gray-300 mb-1">
            Drag and drop a video file
          </p>
          <p className="text-sm text-gray-500">or click to browse</p>
          <p className="text-xs text-gray-600 mt-3">
            MP4, WebM, MOV, AVI supported
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      ) : (
        <div className="card-dark p-4">
          <div className="flex items-center gap-3">
            <FileVideo className="w-8 h-8 text-red-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{file.name}</p>
              <p className="text-xs text-gray-500">
                {formatFileSize(file.size)}
              </p>
            </div>
            {status === "idle" && (
              <button
                type="button"
                onClick={removeFile}
                className="p-1 text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Progress Bar */}
          {(status === "uploading" || status === "processing") && (
            <div className="mt-3">
              <div className="w-full bg-surface-hover rounded-full h-2 overflow-hidden">
                <div
                  className="upload-progress-bar h-full bg-red-600 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1.5">
                {status === "uploading" && (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Uploading... {progress}%
                  </>
                )}
                {status === "processing" && (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Processing video...
                  </>
                )}
              </p>
            </div>
          )}

          {/* Done */}
          {status === "done" && (
            <div className="mt-3 flex items-center gap-2 text-green-400 text-sm">
              <CheckCircle className="w-4 h-4" />
              Upload complete! Redirecting...
            </div>
          )}
        </div>
      )}

      {/* Title */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-300 mb-1.5"
        >
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter video title"
          maxLength={150}
          className="input-dark w-full"
          disabled={status !== "idle"}
        />
        <p className="text-xs text-gray-600 mt-1">{title.length}/150</p>
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-300 mb-1.5"
        >
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your video..."
          rows={4}
          maxLength={2000}
          className="input-dark w-full resize-y"
          disabled={status !== "idle"}
        />
        <p className="text-xs text-gray-600 mt-1">{description.length}/2000</p>
      </div>

      {/* Tags */}
      <div>
        <label
          htmlFor="tags"
          className="block text-sm font-medium text-gray-300 mb-1.5"
        >
          Tags
        </label>
        <input
          id="tags"
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="gaming, tutorial, music (comma-separated)"
          className="input-dark w-full"
          disabled={status !== "idle"}
        />
        <p className="text-xs text-gray-600 mt-1">
          Separate tags with commas
        </p>
      </div>

      {/* Error */}
      {errorMessage && (
        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/20 border border-red-800/30 rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {errorMessage}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!file || !title.trim() || status !== "idle"}
        className="btn-primary w-full py-3 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <Upload className="w-5 h-5" />
        Upload Video
      </button>
    </form>
  );
}
