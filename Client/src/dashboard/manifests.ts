/**
 * Dashboard tabs for the Netlify section: Deploys (default) and Settings.
 */
import {
  NETLIFY_SECTION_ALIAS,
  NETLIFY_DEPLOYS_DASHBOARD_ALIAS,
  NETLIFY_SETTINGS_DASHBOARD_ALIAS,
} from "../constants.js";

export const manifests: Array<UmbExtensionManifest> = [
  {
    type: "dashboard",
    alias: NETLIFY_DEPLOYS_DASHBOARD_ALIAS,
    name: "Netlify Deploys Dashboard",
    element: () => import("./netlify-deploys-dashboard.element.js"),
    weight: 200,
    meta: {
      label: "Deploys",
      pathname: "deploys",
    },
    conditions: [
      {
        alias: "Umb.Condition.SectionAlias",
        match: NETLIFY_SECTION_ALIAS,
      },
    ],
  },
  {
    type: "dashboard",
    alias: NETLIFY_SETTINGS_DASHBOARD_ALIAS,
    name: "Netlify Settings Dashboard",
    element: () => import("./netlify-settings-dashboard.element.js"),
    weight: 100,
    meta: {
      label: "Settings",
      pathname: "settings",
    },
    conditions: [
      {
        alias: "Umb.Condition.SectionAlias",
        match: NETLIFY_SECTION_ALIAS,
      },
    ],
  },
];
