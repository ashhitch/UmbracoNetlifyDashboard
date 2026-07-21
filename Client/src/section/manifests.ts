/**
 * Registers the dedicated "Netlify" backoffice section and its sidebar.
 *
 * The dashboards (Deploys, Settings) attach to this section via the
 * `Umb.Condition.SectionAlias` condition and render as tabs in the main area.
 */
import {
  NETLIFY_SECTION_ALIAS,
  NETLIFY_SECTION_PATHNAME,
  NETLIFY_SIDEBAR_APP_ALIAS,
  NETLIFY_MENU_ALIAS,
} from "../constants.js";

export const manifests: Array<UmbExtensionManifest> = [
  {
    type: "section",
    alias: NETLIFY_SECTION_ALIAS,
    name: "Netlify Section",
    weight: 5,
    meta: {
      label: "Netlify",
      pathname: NETLIFY_SECTION_PATHNAME,
    },
  },
  {
    type: "sectionSidebarApp",
    kind: "menu",
    alias: NETLIFY_SIDEBAR_APP_ALIAS,
    name: "Netlify Sidebar App",
    weight: 100,
    meta: {
      label: "Netlify",
      menu: NETLIFY_MENU_ALIAS,
    },
    conditions: [
      {
        alias: "Umb.Condition.SectionAlias",
        match: NETLIFY_SECTION_ALIAS,
      },
    ],
  },
  {
    type: "menu",
    alias: NETLIFY_MENU_ALIAS,
    name: "Netlify Menu",
    meta: {
      label: "Netlify",
    },
  },
];
