using Asp.Versioning;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Umbraco.Community.NetlifyDashboard.Models;
using Umbraco.Community.NetlifyDashboard.Services;

namespace Umbraco.Community.NetlifyDashboard.Controllers;

/// <summary>
/// Read access to Netlify sites and deploys, plus cache purging.
/// </summary>
[ApiVersion("1.0")]
[ApiExplorerSettings(GroupName = NetlifyConstants.ApiName)]
public sealed class NetlifySitesController : NetlifyApiControllerBase
{
    private readonly INetlifyApiClient _apiClient;

    public NetlifySitesController(INetlifyApiClient apiClient) => _apiClient = apiClient;

    /// <summary>Lists the sites the connected account can access.</summary>
    [HttpGet("sites")]
    [ProducesResponseType(typeof(IEnumerable<NetlifySiteModel>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<IReadOnlyList<NetlifySiteModel>>> GetSites(CancellationToken cancellationToken)
    {
        try
        {
            var sites = await _apiClient.GetSitesAsync(cancellationToken);
            return Ok(sites);
        }
        catch (NetlifyApiException ex)
        {
            return MapError(ex);
        }
    }

    /// <summary>Returns the most recent deploys for a site (defaults to the latest 5).</summary>
    [HttpGet("sites/{siteId}/deploys")]
    [ProducesResponseType(typeof(IEnumerable<NetlifyDeployModel>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<IReadOnlyList<NetlifyDeployModel>>> GetDeploys(
        string siteId,
        [FromQuery] int take = 5,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var deploys = await _apiClient.GetDeploysAsync(siteId, take, cancellationToken);
            return Ok(deploys);
        }
        catch (NetlifyApiException ex)
        {
            return MapError(ex);
        }
    }

    /// <summary>Purges the site cache. An empty tag list purges the entire site cache.</summary>
    [HttpPost("sites/{siteId}/purge")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> PurgeCache(
        string siteId,
        [FromBody] PurgeCacheRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            await _apiClient.PurgeCacheAsync(siteId, request.CacheTags, cancellationToken);
            return NoContent();
        }
        catch (NetlifyApiException ex)
        {
            return MapError(ex);
        }
    }

    private ObjectResult MapError(NetlifyApiException ex)
        => StatusCode((int)ex.StatusCode is >= 400 and < 600 ? (int)ex.StatusCode : StatusCodes.Status400BadRequest,
            ex.Message);
}
