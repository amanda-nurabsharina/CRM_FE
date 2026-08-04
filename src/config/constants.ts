const getApiBaseUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host.includes("fourplusone.my.id")) {
      return "https://crmapi.fourplusone.my.id/v1";
    }
  }
  return "/v1";
};

export const API_BASE_URL = getApiBaseUrl();
export const ACCESS_TOKEN_KEY = "crm_access_token";
export const REFRESH_TOKEN_KEY = "crm_refresh_token";
export const USER_DATA_KEY = "crm_user_data";
