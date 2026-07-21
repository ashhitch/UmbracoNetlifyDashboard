# Netlify Dashboard for Umbraco

A backoffice dashboard for [Netlify](https://www.netlify.com/), built for Umbraco 17+ (the modern
Lit/TypeScript Bellissima backoffice) on .NET 10. Connect with a Netlify **personal access token**, view your latest deploys
and their status, and purge the Netlify CDN cache — all from inside Umbraco.

## Features

- **Dedicated "Netlify" section** in the backoffice with **Deploys** and **Settings** tabs.
- **Connect with a personal access token** — validated against Netlify and stored **encrypted** on the
  server (ASP.NET Core Data Protection). The token is never returned to the browser.
- **Pick a site** from your Netlify account.
- **Last 5 deploys** with a friendly status (Deployed / Building / Failed), branch, commit, time, and a
  link to each deploy. Auto-refreshes while a build is in progress.
- **Purge the CDN cache** — the entire site cache, or selected **cache tags**.

## How it works

```
Browser (Lit dashboard) ──auth'd request──► Backoffice API (C#) ──Bearer token──► api.netlify.com
   never sees the token                        holds + decrypts the token
```

The browser talks only to this package's authenticated backoffice API
(`/umbraco/netlify-dashboard/api/v1/...`). That API holds the token and proxies to the Netlify REST API.

## Installation

```bash
dotnet add package Umbraco.Community.NetlifyDashboard
```

Then run your site, open the backoffice, and go to the **Netlify** section → **Settings** to connect.

### Getting a Netlify personal access token

In Netlify: **User settings → Applications → Personal access tokens → New access token**. Paste it into
the Settings tab. (See <https://app.netlify.com/user/applications#personal-access-tokens>.)

## Development

This repo contains the package itself. Reference `Umbraco.Community.NetlifyDashboard.csproj` from an
Umbraco 17+ host app to test it locally.

```bash
# Backend
dotnet build

# Frontend (from Client)
cd Client
npm install
npm run build        # or: npm run watch  (rebuilds on change)
```

The frontend is plain Lit + TypeScript with a small hand-written typed API client in `Client/src/api`.
If you prefer a generated client, run `npm run generate-client` (a host referencing this package must be
running); output is written to `Client/src/generated` so it never clobbers the hand-written client.

### Packaging

```bash
dotnet pack -c Release -p:BuildClientAssets=true
```

`-p:BuildClientAssets=true` runs the npm build during pack so the `App_Plugins` assets are included.

## License

MIT
