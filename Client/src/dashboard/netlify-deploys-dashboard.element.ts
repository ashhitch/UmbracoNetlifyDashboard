import { html, css, customElement, state, nothing } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import {
  UMB_NOTIFICATION_CONTEXT,
  type UmbNotificationContext,
} from "@umbraco-cms/backoffice/notification";
import { umbConfirmModal } from "@umbraco-cms/backoffice/modal";
import { NetlifyService, ApiError, DeployStatus } from "../api/index.js";
import type { ConnectionStatusModel, NetlifyDeployModel } from "../api/index.js";

const AUTO_REFRESH_MS = 10000;

/**
 * Deploys dashboard: shows the latest deploys with status, and lets the user purge the CDN cache.
 */
@customElement("netlify-deploys-dashboard")
export class NetlifyDeploysDashboardElement extends UmbLitElement {
  @state() private _loading = true;
  @state() private _refreshing = false;
  @state() private _purging = false;
  @state() private _connection: ConnectionStatusModel = { isConnected: false };
  @state() private _deploys: NetlifyDeployModel[] = [];
  @state() private _tagInput = "";

  #notifications?: UmbNotificationContext;
  #timer?: number;

  constructor() {
    super();
    this.consumeContext(UMB_NOTIFICATION_CONTEXT, (ctx) => {
      this.#notifications = ctx;
    });
  }

  override connectedCallback() {
    super.connectedCallback();
    this.#init();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#stopAutoRefresh();
  }

  async #init() {
    this._loading = true;
    try {
      this._connection = await NetlifyService.getConnection();
      if (this.#siteId) {
        await this.#loadDeploys();
      }
    } catch (error) {
      this.#error("Could not load the Netlify connection", error);
    } finally {
      this._loading = false;
    }
  }

  get #siteId(): string | undefined {
    return this._connection.isConnected ? this._connection.selectedSiteId ?? undefined : undefined;
  }

  async #loadDeploys() {
    const siteId = this.#siteId;
    if (!siteId) {
      return;
    }
    this._refreshing = true;
    try {
      this._deploys = await NetlifyService.getDeploys(siteId, 5);
      this.#scheduleAutoRefresh();
    } catch (error) {
      this.#error("Could not load deploys", error);
    } finally {
      this._refreshing = false;
    }
  }

  #scheduleAutoRefresh() {
    this.#stopAutoRefresh();
    const anyBuilding = this._deploys.some((d) => d.status === DeployStatus.Building);
    if (anyBuilding) {
      this.#timer = window.setTimeout(() => this.#loadDeploys(), AUTO_REFRESH_MS);
    }
  }

  #stopAutoRefresh() {
    if (this.#timer !== undefined) {
      window.clearTimeout(this.#timer);
      this.#timer = undefined;
    }
  }

  async #purgeAll() {
    const siteId = this.#siteId;
    if (!siteId) {
      return;
    }
    try {
      await umbConfirmModal(this, {
        headline: "Purge entire cache",
        content: "This clears the whole Netlify CDN cache for this site. Continue?",
        confirmLabel: "Purge everything",
        color: "danger",
      });
    } catch {
      return; // cancelled
    }
    await this.#purge(siteId, undefined, "Entire cache purged");
  }

  async #purgeTags() {
    const siteId = this.#siteId;
    if (!siteId) {
      return;
    }
    const tags = this._tagInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (tags.length === 0) {
      this.#notifications?.peek("warning", {
        data: { headline: "No tags", message: "Enter one or more comma-separated cache tags." },
      });
      return;
    }
    await this.#purge(siteId, tags, `Purged ${tags.length} cache tag(s)`);
  }

  async #purge(siteId: string, tags: string[] | undefined, successHeadline: string) {
    this._purging = true;
    try {
      await NetlifyService.purgeCache(siteId, tags);
      this.#notifications?.peek("positive", {
        data: { headline: successHeadline, message: "Netlify accepted the purge request." },
      });
      if (tags) {
        this._tagInput = "";
      }
    } catch (error) {
      this.#error("Cache purge failed", error);
    } finally {
      this._purging = false;
    }
  }

  #error(headline: string, error: unknown) {
    const message = error instanceof ApiError ? error.message : "An unexpected error occurred.";
    // eslint-disable-next-line no-console
    console.error(headline, error);
    this.#notifications?.peek("danger", { data: { headline, message } });
  }

  override render() {
    if (this._loading) {
      return html`<uui-box><uui-loader></uui-loader></uui-box>`;
    }
    if (!this._connection.isConnected) {
      return this.#renderNotice("Not connected", "Connect a Netlify token on the Settings tab to get started.");
    }
    if (!this.#siteId) {
      return this.#renderNotice("No site selected", "Choose a Netlify site on the Settings tab.");
    }
    return html`${this.#renderDeploys()}${this.#renderCache()}`;
  }

  #renderNotice(headline: string, message: string) {
    return html`
      <uui-box headline=${headline}>
        <p>${message}</p>
      </uui-box>
    `;
  }

  #renderDeploys() {
    return html`
      <uui-box headline="Recent deploys">
        <uui-button
          slot="header-actions"
          look="secondary"
          label="Refresh"
          .state=${this._refreshing ? "waiting" : undefined}
          @click=${() => this.#loadDeploys()}>
          <uui-icon name="icon-sync"></uui-icon> Refresh
        </uui-button>
        ${this._deploys.length === 0
          ? html`<p><em>No deploys found for this site yet.</em></p>`
          : html`
              <uui-table>
                <uui-table-head>
                  <uui-table-head-cell>Status</uui-table-head-cell>
                  <uui-table-head-cell>Branch</uui-table-head-cell>
                  <uui-table-head-cell>Commit</uui-table-head-cell>
                  <uui-table-head-cell>When</uui-table-head-cell>
                  <uui-table-head-cell></uui-table-head-cell>
                </uui-table-head>
                ${this._deploys.map((d) => this.#renderDeployRow(d))}
              </uui-table>
            `}
      </uui-box>
    `;
  }

  #renderDeployRow(d: NetlifyDeployModel) {
    return html`
      <uui-table-row>
        <uui-table-cell>
          <uui-tag color=${this.#statusColor(d.status)} look="secondary">${this.#statusLabel(d)}</uui-tag>
        </uui-table-cell>
        <uui-table-cell>${d.branch ?? "—"}</uui-table-cell>
        <uui-table-cell>
          ${d.commitRef
            ? d.commitUrl
              ? html`<a href=${d.commitUrl} target="_blank" rel="noopener">${d.commitRef.slice(0, 7)}</a>`
              : html`<code>${d.commitRef.slice(0, 7)}</code>`
            : "—"}
        </uui-table-cell>
        <uui-table-cell>${this.#formatDate(d.publishedAt ?? d.createdAt)}</uui-table-cell>
        <uui-table-cell>
          ${d.deployUrl
            ? html`
                <uui-button
                  href=${d.deployUrl}
                  target="_blank"
                  look="secondary"
                  compact
                  label="View deploy">
                  View
                </uui-button>`
            : nothing}
        </uui-table-cell>
      </uui-table-row>
    `;
  }

  #renderCache() {
    return html`
      <uui-box headline="Cache">
        <uui-form-layout-item>
          <uui-label slot="label">Entire cache</uui-label>
          <span slot="description">Clear the whole Netlify CDN cache for this site.</span>
          <uui-button
            look="primary"
            color="danger"
            label="Purge entire cache"
            .state=${this._purging ? "waiting" : undefined}
            @click=${() => this.#purgeAll()}>
            Purge entire cache
          </uui-button>
        </uui-form-layout-item>

        <uui-form-layout-item>
          <uui-label slot="label" for="tags">Purge by cache tag</uui-label>
          <span slot="description">Comma-separated cache tags, e.g. <code>products, homepage</code>.</span>
          <div class="tag-row">
            <uui-input
              id="tags"
              label="Cache tags"
              placeholder="products, homepage"
              .value=${this._tagInput}
              ?disabled=${this._purging}
              @input=${(e: InputEvent) => (this._tagInput = (e.target as HTMLInputElement).value)}
              @keydown=${(e: KeyboardEvent) => e.key === "Enter" && this.#purgeTags()}>
            </uui-input>
            <uui-button
              look="primary"
              label="Purge tags"
              .state=${this._purging ? "waiting" : undefined}
              @click=${() => this.#purgeTags()}>
              Purge tags
            </uui-button>
          </div>
        </uui-form-layout-item>
      </uui-box>
    `;
  }

  #statusLabel(d: NetlifyDeployModel): string {
    switch (d.status) {
      case DeployStatus.Deployed:
        return "Deployed";
      case DeployStatus.Building:
        return "Building";
      case DeployStatus.Failed:
        return "Failed";
      default:
        return d.state || "Unknown";
    }
  }

  #statusColor(status: DeployStatus): "positive" | "warning" | "danger" | "default" {
    switch (status) {
      case DeployStatus.Deployed:
        return "positive";
      case DeployStatus.Building:
        return "warning";
      case DeployStatus.Failed:
        return "danger";
      default:
        return "default";
    }
  }

  #formatDate(value?: string | null): string {
    if (!value) {
      return "—";
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? "—"
      : date.toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
  }

  static override styles = css`
    :host {
      display: grid;
      gap: var(--uui-size-layout-1);
      padding: var(--uui-size-layout-1);
      max-width: 1000px;
    }
    p {
      color: var(--uui-color-text-alt);
    }
    a {
      color: var(--uui-color-interactive);
    }
    uui-table-cell a,
    code {
      font-size: var(--uui-type-small-size);
    }
    .tag-row {
      display: flex;
      gap: var(--uui-size-space-3);
      align-items: center;
      flex-wrap: wrap;
    }
    .tag-row uui-input {
      min-width: 280px;
    }
  `;
}

export default NetlifyDeploysDashboardElement;

declare global {
  interface HTMLElementTagNameMap {
    "netlify-deploys-dashboard": NetlifyDeploysDashboardElement;
  }
}
