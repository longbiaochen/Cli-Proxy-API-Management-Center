import type { ApiError } from '@/types';
import { normalizeApiBase } from '@/utils/connection';

export interface UiMetaApiKeyRecord {
  key: string;
  alias: string;
  owner: string;
  active: boolean;
}

export interface UiMetaFeatures {
  snake_tab_enabled: boolean;
}

export interface UiMetaUsageEntry {
  key: string;
  alias: string;
  owner: string;
  active: boolean;
  total_requests: number;
  total_tokens: number;
  models: Record<string, unknown>;
  details: Array<Record<string, unknown>>;
  recent_request_at: string;
}

export interface UiMetaUsageResponse {
  failed_requests?: number;
  summary?: Record<string, unknown>;
  entries: UiMetaUsageEntry[];
}

const buildUiMetaUrl = (apiBase: string, apiName: string) => {
  const normalized = normalizeApiBase(apiBase);
  if (!normalized) {
    throw new Error('Missing API base');
  }
  return `${normalized}/management.html?api=${encodeURIComponent(apiName)}`;
};

const DEFAULT_TIMEOUT_MS = 15_000;

const toApiError = (message: string, extra: Partial<ApiError> = {}): ApiError => {
  const apiError = new Error(message) as ApiError;
  apiError.name = 'ApiError';
  Object.assign(apiError, extra);
  return apiError;
};

const handleUiMetaError = (error: unknown): ApiError => {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return toApiError('Request timed out');
  }

  if (error instanceof Error) {
    return toApiError(error.message);
  }

  return toApiError(typeof error === 'string' ? error : 'Unknown error occurred');
};

const request = async <T>(
  method: 'GET' | 'PUT',
  apiBase: string,
  managementKey: string,
  apiName: string,
  data?: unknown
): Promise<T> => {
  const url = buildUiMetaUrl(apiBase, apiName);
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${managementKey}`,
        'Content-Type': 'application/json',
      },
      body: data === undefined ? undefined : JSON.stringify(data),
      signal: controller.signal,
    });

    const text = await response.text();
    const parsed = text ? (JSON.parse(text) as T | Record<string, unknown>) : ({} as T);

    if (!response.ok) {
      const record =
        parsed && typeof parsed === 'object' && !Array.isArray(parsed)
          ? (parsed as Record<string, unknown>)
          : null;
      const message =
        (typeof record?.message === 'string' && record.message) ||
        (typeof record?.error === 'string' && record.error) ||
        response.statusText ||
        'Request failed';
      throw toApiError(message, {
        status: response.status,
        data: parsed,
        details: parsed,
      });
    }

    return parsed as T;
  } catch (error) {
    throw handleUiMetaError(error);
  } finally {
    window.clearTimeout(timeoutId);
  }
};

export const uiMetaApi = {
  async getKeyMetadata(apiBase: string, managementKey: string): Promise<UiMetaApiKeyRecord[]> {
    const response = await request<{ api_keys?: UiMetaApiKeyRecord[] }>(
      'GET',
      apiBase,
      managementKey,
      'key-metadata'
    );
    return Array.isArray(response.api_keys) ? response.api_keys : [];
  },

  async putKeyMetadata(
    apiBase: string,
    managementKey: string,
    apiKeys: UiMetaApiKeyRecord[]
  ): Promise<UiMetaApiKeyRecord[]> {
    const response = await request<{ api_keys?: UiMetaApiKeyRecord[] }>(
      'PUT',
      apiBase,
      managementKey,
      'key-metadata',
      { api_keys: apiKeys }
    );
    return Array.isArray(response.api_keys) ? response.api_keys : [];
  },

  async getFeatures(apiBase: string, managementKey: string): Promise<UiMetaFeatures> {
    const response = await request<{ features?: UiMetaFeatures }>(
      'GET',
      apiBase,
      managementKey,
      'features'
    );
    return {
      snake_tab_enabled: Boolean(response.features?.snake_tab_enabled),
    };
  },

  async putFeatures(
    apiBase: string,
    managementKey: string,
    features: Partial<UiMetaFeatures>
  ): Promise<UiMetaFeatures> {
    const response = await request<{ features?: UiMetaFeatures }>(
      'PUT',
      apiBase,
      managementKey,
      'features',
      { features }
    );
    return {
      snake_tab_enabled: Boolean(response.features?.snake_tab_enabled),
    };
  },

  async getUsageByKey(apiBase: string, managementKey: string): Promise<UiMetaUsageResponse> {
    const response = await request<UiMetaUsageResponse>(
      'GET',
      apiBase,
      managementKey,
      'usage-by-key'
    );
    return {
      ...response,
      entries: Array.isArray(response.entries) ? response.entries : [],
    };
  },
};
