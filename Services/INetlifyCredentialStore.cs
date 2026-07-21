namespace Umbraco.Community.NetlifyDashboard.Services;

/// <summary>
/// Stores the Netlify personal access token (encrypted at rest) and the selected site id.
/// Backed by Umbraco's key-value store, so values persist per installation.
/// </summary>
public interface INetlifyCredentialStore
{
    /// <summary>Returns the decrypted token, or null when none is stored.</summary>
    string? GetToken();

    /// <summary>Encrypts and stores the token.</summary>
    void SetToken(string token);

    /// <summary>Removes the stored token and the selected site.</summary>
    void ClearToken();

    /// <summary>Returns the selected site id, or null.</summary>
    string? GetSelectedSiteId();

    /// <summary>Persists the selected site id.</summary>
    void SetSelectedSiteId(string siteId);
}
