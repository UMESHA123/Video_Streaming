"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import {
  getToken,
  setToken,
  removeToken,
  getUser,
  isAuthenticated as checkAuth,
  UserPayload,
} from "@/lib/auth";

interface AuthState {
  user: UserPayload | null;
  isAuthenticated: boolean;
  loading: boolean;
}

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    loading: true,
  });

  // Initialize auth state on mount
  useEffect(() => {
    const user = getUser();
    const authenticated = checkAuth();
    setAuthState({
      user,
      isAuthenticated: authenticated,
      loading: false,
    });
  }, []);

  const login = useCallback(async (data: LoginData) => {
    const response = await api.post("/auth/login", data);
    const { token, user } = response.data;
    setToken(token);
    setAuthState({
      user: user || getUser(),
      isAuthenticated: true,
      loading: false,
    });
    return response.data;
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const response = await api.post("/auth/register", data);
    const { token, user } = response.data;
    setToken(token);
    setAuthState({
      user: user || getUser(),
      isAuthenticated: true,
      loading: false,
    });
    return response.data;
  }, []);

  const logout = useCallback(() => {
    removeToken();
    setAuthState({
      user: null,
      isAuthenticated: false,
      loading: false,
    });
  }, []);

  const refreshUser = useCallback(() => {
    const user = getUser();
    const authenticated = checkAuth();
    setAuthState({
      user,
      isAuthenticated: authenticated,
      loading: false,
    });
  }, []);

  return {
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    loading: authState.loading,
    login,
    register,
    logout,
    refreshUser,
  };
}
