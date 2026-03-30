"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Upload,
  LogIn,
  UserPlus,
  LogOut,
  User,
  Play,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import SearchBar from "./SearchBar";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <nav className="sticky top-0 z-50 bg-surface-card/95 backdrop-blur-md border-b border-surface-border">
      <div className="max-w-screen-2xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 shrink-0 group"
        >
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center group-hover:bg-red-500 transition-colors">
            <Play className="w-4 h-4 text-white fill-white" />
          </div>
          <span className="text-lg font-bold text-white hidden sm:block">
            StreamLocal
          </span>
        </Link>

        {/* Search Bar - Center */}
        <div className="flex-1 max-w-2xl">
          <SearchBar />
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {isAuthenticated ? (
            <>
              {/* Upload Button */}
              <Link
                href="/upload"
                className="flex items-center gap-2 btn-ghost rounded-full px-3 py-1.5 text-sm"
              >
                <Upload className="w-5 h-5" />
                <span className="hidden md:inline">Upload</span>
              </Link>

              {/* User Menu */}
              <div className="flex items-center gap-2">
                <Link
                  href={`/profile/${user?.username || ""}`}
                  className="flex items-center gap-2 btn-ghost rounded-full px-2 py-1.5"
                >
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center text-sm font-medium text-white">
                      {user?.username?.charAt(0).toUpperCase() || "U"}
                    </div>
                  )}
                  <span className="text-sm text-gray-300 hidden lg:block">
                    {user?.username}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="btn-ghost rounded-full p-2 text-gray-400 hover:text-white"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="flex items-center gap-1.5 btn-ghost rounded-full px-3 py-1.5 text-sm border border-surface-border"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Log in</span>
              </Link>
              <Link
                href="/auth/register"
                className="flex items-center gap-1.5 btn-primary rounded-full px-3 py-1.5 text-sm"
              >
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Sign up</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
