using Umbraco.Community.NetlifyDashboard.Models;

namespace Umbraco.Community.NetlifyDashboard.Services;

/// <summary>
/// Server-side proxy to the Netlify REST API. The personal access token never leaves the server.
/// </summary>
public interface INetlifyApiClient
{
    /// <summary>
    /// Validates a token by calling Netlify's current-user endpoint, returning the account display
    /// name. Throws <see cref="NetlifyApiException"/> with 401 when the token is invalid.
    /// </summary>
    Task<string?> ValidateTokenAsync(string token, CancellationToken cancellationToken);

    /// <summary>Returns the connected account display name using the stored token.</summary>
    Task<string?> GetAccountNameAsync(CancellationToken cancellationToken);

    /// <summary>Lists the sites the connected account can access.</summary>
    Task<IReadOnlyList<NetlifySiteModel>> GetSitesAsync(CancellationToken cancellationToken);

    /// <summary>Returns the most recent deploys for a site (newest first).</summary>
    Task<IReadOnlyList<NetlifyDeployModel>> GetDeploysAsync(string siteId, int take, CancellationToken cancellationToken);

    /// <summary>Purges the site cache. When <paramref name="cacheTags"/> is null/empty, purges everything.</summary>
    Task PurgeCacheAsync(string siteId, string[]? cacheTags, CancellationToken cancellationToken);
}
