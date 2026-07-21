import { html, css, customElement, state, nothing } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import {
  UMB_NOTIFICATION_CONTEXT,
  type UmbNotificationContext,
} from "@umbraco-cms/backoffice/notification";
import { NetlifyService, ApiError } from "../api/index.js";
import type { ConnectionStatusModel, NetlifySiteModel } from "../api/index.js";

/**
 * Settings dashboard: connect/disconnect a Netlify personal access token and choose the site to view.
 */
@customElement("netlify-settings-dashboard")
export class NetlifySettingsDashboardElement extends UmbLitElement {
  @state() private _loading = true;
  @state() private _busy = false;
  @state() private _connection: ConnectionStatusModel = { isConnected: false };
  @state() private _sites: NetlifySiteModel[] = [];
  @state() private _tokenInput = "";

  #notifications?: UmbNotificationContext;

  constructor() {
    super();
    this.consumeContext(UMB_NOTIFICATION_CONTEXT, (ctx) => {
      this.#notifications = ctx;
    });
  }

  override connectedCallback() {
    super.connectedCallback();
    this.#load();
  }

  async #load() {
    this._loading = true;
    try {
      this._connection = await NetlifyService.getConnection();
      if (this._connection.isConnected) {
        await this.#loadSites();
      }
    } catch (error) {
      this.#error("Could not load the Netlify connection", error);
    } finally {
      this._loading = false;
    }
  }

  async #loadSites() {
    try {
      this._sites = await NetlifyService.getSites();
    } catch (error) {
      this._sites = [];
      this.#error("Could not load your Netlify sites", error);
    }
  }

  async #connect() {
    const token = this._tokenInput.trim();
    if (!token) {
      this.#peek("warning", "Token required", "Paste a Netlify personal access token first.");
      return;
    }

    this._busy = true;
    try {
      this._connection = await NetlifyService.saveToken(token);
      this._tokenInput = "";
      this.#peek(
        "positive",
        "Connected",
        this._connection.accountName ? `Connected as ${this._connection.accountName}.` : "Connected to Netlify."
      );
      await this.#loadSites();
    } catch (error) {
      this.#error("Could not connect to Netlify", error);
    } finally {
      this._busy = false;
    }
  }

  async #disconnect() {
    this._busy = true;
    try {
      await NetlifyService.disconnect();
      this._connection = { isConnected: false };
      this._sites = [];
      this.#peek("positive", "Disconnected", "Your Netlify token has been removed.");
    } catch (error) {
      this.#error("Could not disconnect", error);
    } finally {
      this._busy = false;
    }
  }

  async #selectSite(siteId: string) {
    if (!siteId || siteId === this._connection.selectedSiteId) {
      return;
    }
    try {
      await NetlifyService.selectSite(siteId);
      this._connection = { ...this._connection, selectedSiteId: siteId };
      this.#peek("positive", "Site selected", "The Deploys tab now shows this site.");
    } catch (error) {
      this.#error("Could not save the selected site", error);
    }
  }

  #peek(color: "positive" | "warning" | "danger" | "default", headline: string, message: string) {
    this.#notifications?.peek(color, { data: { headline, message } });
  }

  #error(headline: string, error: unknown) {
    const message = error instanceof ApiError ? error.message : "An unexpected error occurred.";
    // eslint-disable-next-line no-console
    console.error(headline, error);
    this.#peek("danger", headline, message);
  }

  override render() {
    if (this._loading) {
      return html`<uui-box><uui-loader></uui-loader></uui-box>`;
    }
    return this._connection.isConnected ? this.#renderConnected() : this.#renderDisconnected();
  }

  #renderDisconnected() {
    return html`
      <uui-box headline="Connect to Netlify">
        <p>
          Paste a Netlify <strong>personal access token</strong> to connect this site. Create one in
          Netlify under <em>User settings → Applications → Personal access tokens</em>. The token is
          stored encrypted on the server and never sent back to the browser.
        </p>

        <uui-button
          href="https://app.netlify.com/user/applications#personal-access-tokens"
          target="_blank"
          look="secondary"
          label="Open Netlify token settings">
          <uui-icon name="icon-out"></uui-icon>
          Open Netlify token settings
        </uui-button>

        <uui-form-layout-item>
          <uui-label slot="label" for="token" required>Personal access token</uui-label>
          <uui-input
            id="token"
            type="password"
            label="Personal access token"
            placeholder="nfp_xxxxxxxxxxxx"
            .value=${this._tokenInput}
            ?disabled=${this._busy}
            @input=${(e: InputEvent) => (this._tokenInput = (e.target as HTMLInputElement).value)}
            @keydown=${(e: KeyboardEvent) => e.key === "Enter" && this.#connect()}>
          </uui-input>
        </uui-form-layout-item>

        <div class="actions">
          <uui-button
            look="primary"
            color="positive"
            label="Connect"
            .state=${this._busy ? "waiting" : undefined}
            @click=${() => this.#connect()}>
            Connect
          </uui-button>
        </div>
      </uui-box>
    `;
  }

  #renderConnected() {
    const selected = this._connection.selectedSiteId ?? "";
    const options = [
      { name: "— Select a site —", value: "", selected: selected === "" },
      ...this._sites.map((s) => ({
        name: s.customDomain ? `${s.name} (${s.customDomain})` : s.name,
        value: s.id,
        selected: s.id === selected,
      })),
    ];

    return html`
      <uui-box headline="Connection">
        <div class="status">
          <uui-tag color="positive" look="primary">
            <uui-icon name="icon-check"></uui-icon> Connected
          </uui-tag>
          ${this._connection.accountName
            ? html`<span>as <strong>${this._connection.accountName}</strong></span>`
            : nothing}
        </div>

        <div class="actions">
          <uui-button
            look="secondary"
            color="danger"
            label="Disconnect"
            .state=${this._busy ? "waiting" : undefined}
            @click=${() => this.#disconnect()}>
            <uui-icon name="icon-unplug"></uui-icon>
            Disconnect
          </uui-button>
        </div>
      </uui-box>

      <uui-box headline="Site">
        <p>Choose which Netlify site the Deploys tab should display. Your choice is saved automatically.</p>
        ${this._sites.length === 0
          ? html`<uui-tag look="secondary">No sites found for this account</uui-tag>`
          : html`
              <uui-form-layout-item>
                <uui-label slot="label" for="site">Netlify site</uui-label>
                <uui-select
                  id="site"
                  label="Netlify site"
                  .options=${options}
                  @change=${(e: Event) => this.#selectSite((e.target as HTMLInputElement).value)}>
                </uui-select>
              </uui-form-layout-item>
            `}
      </uui-box>
    `;
  }

  static override styles = css`
    :host {
      display: grid;
      gap: var(--uui-size-layout-1);
      padding: var(--uui-size-layout-1);
      max-width: 900px;
    }
    p {
      color: var(--uui-color-text-alt);
      margin-top: 0;
    }
    .status {
      display: flex;
      align-items: center;
      gap: var(--uui-size-space-3);
    }
    .actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--uui-size-space-3);
      width: 100%;
    }
    uui-form-layout-item {
      margin-top: var(--uui-size-space-4);
    }
  `;
}

export default NetlifySettingsDashboardElement;

declare global {
  interface HTMLElementTagNameMap {
    "netlify-settings-dashboard": NetlifySettingsDashboardElement;
  }
}
