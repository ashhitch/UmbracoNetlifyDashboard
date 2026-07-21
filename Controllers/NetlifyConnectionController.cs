using Asp.Versioning;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Umbraco.Community.NetlifyDashboard.Models;
using Umbraco.Community.NetlifyDashboard.Services;

namespace Umbraco.Community.NetlifyDashboard.Controllers;

/// <summary>
/// Manages the Netlify connection: the stored personal access token and the selected site.
/// </summary>
[ApiVersion("1.0")]
[ApiExplorerSettings(GroupName = NetlifyConstants.ApiName)]
public sealed class NetlifyConnectionController : NetlifyApiControllerBase
{
    private readonly INetlifyCredentialStore _credentialStore;
    private readonly INetlifyApiClient _apiClient;

    public NetlifyConnectionController(INetlifyCredentialStore credentialStore, INetlifyApiClient apiClient)
    {
        _credentialStore = credentialStore;
        _apiClient = apiClient;
    }

    /// <summary>Returns the current connection state.</summary>
    [HttpGet("connection")]
    [ProducesResponseType(typeof(ConnectionStatusModel), StatusCodes.Status200OK)]
    public async Task<ActionResult<ConnectionStatusModel>> GetConnection(CancellationToken cancellationToken)
    {
        var token = _credentialStore.GetToken();
        if (string.IsNullOrWhiteSpace(token))
        {
            return Ok(new ConnectionStatusModel { IsConnected = false });
        }

        string? accountName = null;
        try
        {
            accountName = await _apiClient.GetAccountNameAsync(cancellationToken);
        }
        catch (NetlifyApiException)
        {
            // Token present but no longer valid; report disconnected so the UI prompts to reconnect.
            return Ok(new ConnectionStatusModel { IsConnected = false });
        }

        return Ok(new ConnectionStatusModel
        {
            IsConnected = true,
            AccountName = accountName,
            SelectedSiteId = _credentialStore.GetSelectedSiteId(),
        });
    }

    /// <summary>Validates and stores a Netlify personal access token.</summary>
    [HttpPost("connection/token")]
    [ProducesResponseType(typeof(ConnectionStatusModel), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ConnectionStatusModel>> SaveToken(
        [FromBody] SaveTokenRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Token))
        {
            return BadRequest("A token is required.");
        }

        string? accountName;
        try
        {
            accountName = await _apiClient.ValidateTokenAsync(request.Token.Trim(), cancellationToken);
        }
        catch (NetlifyApiException ex)
        {
            return BadRequest(ex.Message);
        }

        _credentialStore.SetToken(request.Token.Trim());

        return Ok(new ConnectionStatusModel
        {
            IsConnected = true,
            AccountName = accountName,
            SelectedSiteId = _credentialStore.GetSelectedSiteId(),
        });
    }

    /// <summary>Disconnects by clearing the stored token and selected site.</summary>
    [HttpDelete("connection/token")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public IActionResult Disconnect()
    {
        _credentialStore.ClearToken();
        return NoContent();
    }

    /// <summary>Persists the selected site id.</summary>
    [HttpPost("connection/site")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public IActionResult SelectSite([FromBody] SelectSiteRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.SiteId))
        {
            return BadRequest("A site id is required.");
        }

        _credentialStore.SetSelectedSiteId(request.SiteId.Trim());
        return NoContent();
    }
}
