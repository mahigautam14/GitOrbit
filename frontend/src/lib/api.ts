import type {
  ContributionsSummary,
  ContributionYear,
  FollowerEvent,
  FollowerStats,
  GitHubUser,
  Paginated,
  Profile,
  Repo,
  ReposOverview,
  StarPoint,
  SyncResult,
  TrafficDay,
} from "./types";

/**
 * Frontend env only:
 * - Local: frontend/.env.local
 * - Vercel: Project Settings > Environment Variables
 *
 * Example:
 *   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
 *   NEXT_PUBLIC_API_BASE_URL=https://gitorbit.onrender.com
 */
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000").replace(
  /\/$/,
  "",
);

/**
 * If your backend routes are mounted under /api, keep this.
 * If backend routes are directly at root, change to:
 *   const API = API_BASE;
 */
const API = `${API_BASE}/api`;

function buildUrl(path: string) {
  return `${API}${path.startsWith("/") ? path : `/${path}`}`;
}

export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export const apiFetch = (path: string, options: RequestInit = {}) =>
  fetch(buildUrl(path), {
    ...options,
    cache: "no-store",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await apiFetch(path, options);

  if (!res.ok) {
    let data: unknown = undefined;
    try {
      data = await res.json();
    } catch {
      // ignore non-json error bodies
    }

    throw new ApiError(
      res.status === 404 ? "Not found" : `Request failed (${res.status})`,
      res.status,
      data,
    );
  }

  return res.json() as Promise<T>;
}

function query(params: Record<string, string | number | undefined>) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

export interface ListArgs {
  page?: number;
  per_page?: number;
  search?: string;
}

/** Fields the backend will sort repositories on. Anything else falls back to stars. */
export type RepoSort =
  | "name"
  | "stars"
  | "pushed_at"
  | "watchers"
  | "commits_total"
  | "branches"
  | "views_all_time";

export type SortOrder = "asc" | "desc";
export type Visibility = "all" | "public" | "private";

export interface RepoListArgs extends ListArgs {
  sort?: RepoSort;
  order?: SortOrder;
  visibility?: Visibility;
}

export const api = {
  profile: (signal?: AbortSignal) => request<Profile>("/profile", { signal }),

  followers: ({ page = 1, per_page = 24, search }: ListArgs, signal?: AbortSignal) =>
    request<Paginated<GitHubUser>>(`/followers${query({ page, per_page, search })}`, { signal }),

  following: ({ page = 1, per_page = 24, search }: ListArgs, signal?: AbortSignal) =>
    request<Paginated<GitHubUser>>(`/following${query({ page, per_page, search })}`, { signal }),

  unfollowed: ({ page = 1, per_page = 24, search }: ListArgs, signal?: AbortSignal) =>
    request<Paginated<FollowerEvent>>(
      `/followers/unfollowed${query({ page, per_page, search })}`,
      { signal },
    ),

  followerStats: (signal?: AbortSignal) => request<FollowerStats>("/followers/stats", { signal }),

  followerHistory: (login: string, signal?: AbortSignal) =>
    request<FollowerEvent[]>(`/followers/${encodeURIComponent(login)}/history`, { signal }),

  reposOverview: (signal?: AbortSignal) => request<ReposOverview>("/repos/overview", { signal }),

  repos: (
    {
      page = 1,
      per_page = 30,
      search,
      sort = "pushed_at",
      order = "desc",
      visibility = "all",
    }: RepoListArgs,
    signal?: AbortSignal,
  ) =>
    request<Paginated<Repo>>(
      `/repos${query({ page, per_page, search, sort, order, visibility })}`,
      { signal },
    ),

  repoTraffic: (name: string, signal?: AbortSignal) =>
    request<TrafficDay[]>(`/repos/${encodeURIComponent(name)}/traffic`, { signal }),

  repo: (name: string, signal?: AbortSignal) =>
    request<Repo>(`/repos/${encodeURIComponent(name)}`, { signal }),

  starHistory: (name: string, signal?: AbortSignal) =>
    request<StarPoint[]>(`/repos/${encodeURIComponent(name)}/star-history`, { signal }),

  contributions: (signal?: AbortSignal) => request<ContributionsSummary>("/contributions", { signal }),

  contributionYear: (year: number, signal?: AbortSignal) =>
    request<ContributionYear>(`/contributions/${year}`, { signal }),

  sync: async (): Promise<SyncResult> => request<SyncResult>("/sync", { method: "POST" }),
};