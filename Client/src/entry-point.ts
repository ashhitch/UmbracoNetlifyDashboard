import type {
  UmbEntryPointOnInit,
  UmbEntryPointOnUnload,
} from "@umbraco-cms/backoffice/extension-api";
import { UMB_AUTH_CONTEXT } from "@umbraco-cms/backoffice/auth";
import { setClientConfig } from "./api/client.js";

/**
 * Configures the API client with Umbraco's auth context so all requests to the Netlify Dashboard
 * backoffice API carry the backoffice bearer token.
 */
export const onInit: UmbEntryPointOnInit = (host) => {
  host.consumeContext(UMB_AUTH_CONTEXT, (authContext) => {
    if (!authContext) {
      return;
    }

    const config = authContext.getOpenApiConfiguration();
    setClientConfig({
      baseUrl: config.base,
      credentials: config.credentials,
      token: config.token,
    });
  });
};

export const onUnload: UmbEntryPointOnUnload = () => {
  // No cleanup required.
};
