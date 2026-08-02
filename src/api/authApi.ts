import { apiClient } from "./client";
import { AuthResponse, LoginPayload, User } from "../types/auth";
import { ApiResponse } from "../types/api";

export const authApi = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    return await apiClient.post("auth/login", { json: payload }).json<AuthResponse>();
  },

  me: async (): Promise<ApiResponse<User>> => {
    return await apiClient.get("auth/me").json<ApiResponse<User>>();
  },

  logout: async (refreshToken?: string): Promise<ApiResponse> => {
    return await apiClient
      .post("auth/logout", { json: { refresh_token: refreshToken } })
      .json<ApiResponse>();
  },
};
