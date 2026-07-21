import { http } from "./client.js";
import type {
  ConnectionStatusModel,
  NetlifyDeployModel,
  NetlifySiteModel,
} from "./types.js";

/**
 * Typed wrapper over the Netlify Dashboard backoffice API endpoints.
 */
export const NetlifyService = {
  getConnection(): Promise<ConnectionStatusModel> {
    return http.get<ConnectionStatusModel>("/connection");
  },

  saveToken(token: string): Promise<ConnectionStatusModel> {
    return http.post<ConnectionStatusModel>("/connection/token", { token });
  },

  disconnect(): Promise<void> {
    return http.del<void>("/connection/token");
  },

  selectSite(siteId: string): Promise<void> {
    return http.post<void>("/connection/site", { siteId });
  },

  getSites(): Promise<NetlifySiteModel[]> {
    return http.get<NetlifySiteModel[]>("/sites");
  },

  getDeploys(siteId: string, take = 5): Promise<NetlifyDeployModel[]> {
    return http.get<NetlifyDeployModel[]>(`/sites/${encodeURIComponent(siteId)}/deploys?take=${take}`);
  },

  purgeCache(siteId: string, cacheTags?: string[]): Promise<void> {
    return http.post<void>(`/sites/${encodeURIComponent(siteId)}/purge`, {
      cacheTags: cacheTags && cacheTags.length > 0 ? cacheTags : null,
    });
  },
};
