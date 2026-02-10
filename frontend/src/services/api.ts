/**
 * API Service Layer
 * Base configuration for all API calls.
 * Includes request timeout, auth headers, and auto-logout on 401.
 */

// API base URL - using proxy in vite.config.ts
export const API_BASE_URL = "/api";

// Token storage key
const TOKEN_KEY = "livebid_token";

// Request timeout in milliseconds
const REQUEST_TIMEOUT_MS = 10_000;

// Get stored JWT token
export const getToken = (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
};

// Set JWT token
export const setToken = (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
};

// Remove JWT token
export const removeToken = (): void => {
    localStorage.removeItem(TOKEN_KEY);
};

// API request helper with auth headers, timeout, and auto-logout
export const apiRequest = async <T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> => {
    const token = getToken();

    const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    // AbortController for request timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
            signal: controller.signal,
        });

        if (response.status === 401) {
            // Token expired or invalid — auto-logout
            removeToken();
            // Dispatch a custom event so AuthContext can react
            window.dispatchEvent(new CustomEvent("auth:logout"));
            throw new Error("Your session has expired. Please log in again.");
        }

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: "Request failed" }));
            throw new Error(error.message || `Request failed (${response.status})`);
        }

        return response.json();
    } catch (error: any) {
        if (error.name === "AbortError") {
            throw new Error("Request timed out. Please check your connection and try again.");
        }
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
};

// Simulated network delay for mock responses
export const mockDelay = (ms: number = 500) =>
    new Promise(resolve => setTimeout(resolve, ms));
