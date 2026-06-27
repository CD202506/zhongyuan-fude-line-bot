export type DataMode = "demo" | "api";

export const dataMode: DataMode = import.meta.env.VITE_WEB_ADMIN_DATA_MODE === "api" ? "api" : "demo";

export const isApiMode = dataMode === "api";

export const webAdminApiBaseUrl = import.meta.env.VITE_WEB_ADMIN_API_BASE_URL || "http://127.0.0.1:8000";
