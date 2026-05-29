export class ApiError extends Error {
  status: number;
  payload: unknown;
  requestId: string | null;

  constructor(message: string, status: number, payload: unknown, requestId: string | null) {
    super(message);
    this.status = status;
    this.payload = payload;
    this.requestId = requestId;
  }
}

const resolveBaseUrl = () => {
  const env = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (env && env.trim()) {
    return env.replace(/\/+$/, "");
  }
  return "/api";
};

export const API_BASE_URL = resolveBaseUrl();

const parseJson = async (response: Response) => {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return null;
};

export const apiRequest = async <T>(
  path: string,
  options: RequestInit = {}
): Promise<{ data: T; requestId: string | null }> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  const requestId = response.headers.get("X-Request-ID");
  const payload = await parseJson(response);

  if (!response.ok) {
    const message =
      (payload as { error?: { message?: string } })?.error?.message ||
      (payload as { detail?: string })?.detail ||
      response.statusText ||
      "Request failed";
    throw new ApiError(message, response.status, payload, requestId);
  }

  return { data: payload as T, requestId };
};

export const apiUpload = async <T>(
  path: string,
  formData: FormData
): Promise<{ data: T; requestId: string | null }> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    body: formData,
  });

  const requestId = response.headers.get("X-Request-ID");
  const payload = await parseJson(response);

  if (!response.ok) {
    const message =
      (payload as { error?: { message?: string } })?.error?.message ||
      (payload as { detail?: string })?.detail ||
      response.statusText ||
      "Upload failed";
    throw new ApiError(message, response.status, payload, requestId);
  }

  return { data: payload as T, requestId };
};
