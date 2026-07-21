/**
 * Aggregates all extension manifests for the Netlify Dashboard package.
 * Referenced by umbraco-package.json (the built bundle file).
 */
import { manifests as section } from "./section/manifests.js";
import { manifests as dashboard } from "./dashboard/manifests.js";

export const manifests: Array<UmbExtensionManifest> = [
  {
    type: "backofficeEntryPoint",
    alias: "Umbraco.Community.NetlifyDashboard.EntryPoint",
    name: "Netlify Dashboard Entry Point",
    js: () => import("./entry-point.js"),
  },
  ...section,
  ...dashboard,
];
