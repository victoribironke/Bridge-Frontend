/* eslint-disable @typescript-eslint/no-explicit-any */
import { BACKEND_URL } from "./constants";
import { isTokenExpired } from "./auth";

export class ApiError extends Error {
  public statusCode: number;
  public messages: string[];

  constructor(statusCode: number, message: string | string[]) {
    const errorString = Array.isArray(message) ? message.join(", ") : message;
    super(errorString);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.messages = Array.isArray(message) ? message : [message];
  }
}

interface FetchOptions extends Omit<RequestInit, "body"> {
  body?: any;
  params?: Record<string, string | number | boolean | undefined | null>;
}

export const apiFetch = async <T>(endpoint: string, options: FetchOptions = {}): Promise<T> => {
  const { body, params, headers, ...customConfig } = options;

  let token = null;
  if (typeof window !== "undefined") {
    const authState = window.localStorage.getItem("bridge.auth");
    if (authState) {
      try {
        const parsed = JSON.parse(authState);
        if (parsed?.token) {
          // If token is expired, clear it and don't send
          if (isTokenExpired(parsed.token)) {
            window.localStorage.removeItem("bridge.auth");
          } else {
            token = parsed.token;
          }
        }
      } catch {
        // ignore JSON parse error
      }
    }
  }

  const config: RequestInit = {
    ...customConfig,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  let url = `${BACKEND_URL}${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    // On 401, clear stored auth to force re-login
    if (response.status === 401 && typeof window !== "undefined") {
      window.localStorage.removeItem("bridge.auth");
    }

    let errorData;
    try {
      errorData = await response.json();
    } catch {
      throw new ApiError(response.status, response.statusText);
    }

    // NestJS default exception shape
    throw new ApiError(
      errorData.statusCode || response.status,
      errorData.message || response.statusText,
    );
  }

  // Handle empty responses
  if (response.status === 204) {
    return {} as T;
  }

  return await response.json();
};
