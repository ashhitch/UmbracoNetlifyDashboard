namespace Umbraco.Community.NetlifyDashboard;

/// <summary>
/// Shared constants for the Netlify Dashboard extension.
/// </summary>
public static class NetlifyConstants
{
    /// <summary>
    /// API/Swagger group name. Endpoints are exposed under /umbraco/netlify-dashboard/api/v1
    /// and the Swagger document lives at /umbraco/swagger/netlifydashboard/swagger.json.
    /// </summary>
    public const string ApiName = "netlifydashboard";

    /// <summary>
    /// Base address for the Netlify REST API.
    /// </summary>
    public const string NetlifyApiBaseUrl = "https://api.netlify.com/api/v1/";

    /// <summary>
    /// Named <see cref="System.Net.Http.HttpClient"/> used for Netlify calls.
    /// </summary>
    public const string HttpClientName = "Netlify";

    /// <summary>
    /// Data Protection purpose string used to encrypt the stored token.
    /// </summary>
    public const string DataProtectionPurpose = "Umbraco.Community.NetlifyDashboard.Token";

    /// <summary>
    /// Key-value store keys (persisted per Umbraco installation).
    /// </summary>
    public static class KeyValueKeys
    {
        public const string Token = "Umbraco.Community.NetlifyDashboard:Token";
        public const string SelectedSiteId = "Umbraco.Community.NetlifyDashboard:SelectedSiteId";
    }
}
