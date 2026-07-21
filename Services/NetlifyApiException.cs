using System.Net;

namespace Umbraco.Community.NetlifyDashboard.Services;

/// <summary>
/// Thrown when the Netlify API returns a non-success response, carrying the status code
/// so controllers can translate it into an appropriate HTTP result.
/// </summary>
public sealed class NetlifyApiException : Exception
{
    public NetlifyApiException(HttpStatusCode statusCode, string message) : base(message)
        => StatusCode = statusCode;

    public HttpStatusCode StatusCode { get; }
}
