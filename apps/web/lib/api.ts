import { useAuthStore } from "../store/auth-store";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333/api/v1";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown,
  ) {
    super(message);
  }
}

async function parseBody(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
}

/** Cliente HTTP simples: injeta o Bearer token e renova a sessão uma vez em caso de 401. */
async function request<T>(path: string, options: RequestOptions = {}, isRetry = false): Promise<T> {
  const { method = "GET", body, auth = true } = options;
  const { accessToken } = useAuthStore.getState();

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(auth && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401 && auth && !isRetry) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return request<T>(path, options, true);
    }
    useAuthStore.getState().clear();
  }

  const data = await parseBody(response);

  if (!response.ok) {
    const message = (data && typeof data === "object" && "message" in data ? String((data as { message: unknown }).message) : null) ?? "Erro inesperado";
    throw new ApiError(message, response.status, data);
  }

  return data as T;
}

async function tryRefresh(): Promise<boolean> {
  const { refreshToken } = useAuthStore.getState();
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!response.ok) return false;

    const data = (await response.json()) as { accessToken: string; refreshToken: string };
    useAuthStore.getState().setSession(data);
    return true;
  } catch {
    return false;
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "POST", body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  upload: <T>(path: string, file: File) => uploadRequest<T>(path, file),
};

/** Upload multipart — não passa pelo `request()` porque o Content-Type (com boundary) precisa ser definido pelo próprio navegador. */
async function uploadRequest<T>(path: string, file: File, isRetry = false): Promise<T> {
  const { accessToken } = useAuthStore.getState();
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    body: formData,
  });

  if (response.status === 401 && !isRetry) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return uploadRequest<T>(path, file, true);
    }
    useAuthStore.getState().clear();
  }

  const data = await parseBody(response);

  if (!response.ok) {
    const message = (data && typeof data === "object" && "message" in data ? String((data as { message: unknown }).message) : null) ?? "Erro inesperado";
    throw new ApiError(message, response.status, data);
  }

  return data as T;
}
