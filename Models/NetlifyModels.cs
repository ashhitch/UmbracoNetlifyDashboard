namespace Umbraco.Community.NetlifyDashboard.Models;

/// <summary>
/// Current connection state surfaced to the dashboard.
/// </summary>
public sealed class ConnectionStatusModel
{
    /// <summary>Whether a (validated) Netlify token is stored.</summary>
    public bool IsConnected { get; set; }

    /// <summary>The connected Netlify account/user full name, when known.</summary>
    public string? AccountName { get; set; }

    /// <summary>The site id the user has chosen to view, when set.</summary>
    public string? SelectedSiteId { get; set; }
}

/// <summary>Request body for storing a Netlify personal access token.</summary>
public sealed class SaveTokenRequest
{
    public string Token { get; set; } = string.Empty;
}

/// <summary>Request body for persisting the selected site.</summary>
public sealed class SelectSiteRequest
{
    public string SiteId { get; set; } = string.Empty;
}

/// <summary>Request body for a cache purge. Empty/absent tags means a full purge.</summary>
public sealed class PurgeCacheRequest
{
    public string[]? CacheTags { get; set; }
}

/// <summary>A Netlify site, trimmed to what the dashboard needs.</summary>
public sealed class NetlifySiteModel
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Url { get; set; }
    public string? CustomDomain { get; set; }
}

/// <summary>
/// A normalised deploy/build result for the dashboard, with a friendly status.
/// </summary>
public sealed class NetlifyDeployModel
{
    public string Id { get; set; } = string.Empty;

    /// <summary>Raw Netlify deploy state (e.g. "ready", "building", "error").</summary>
    public string State { get; set; } = string.Empty;

    /// <summary>Mapped, display-friendly status: Deployed | Building | Failed | Other.</summary>
    public DeployStatus Status { get; set; }

    public string? Branch { get; set; }
    public string? CommitRef { get; set; }
    public string? CommitUrl { get; set; }
    public string? Context { get; set; }
    public string? DeployUrl { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTimeOffset? CreatedAt { get; set; }
    public DateTimeOffset? PublishedAt { get; set; }
}

/// <summary>Display-friendly deploy status buckets.</summary>
public enum DeployStatus
{
    Other = 0,
    Building = 1,
    Deployed = 2,
    Failed = 3,
}
