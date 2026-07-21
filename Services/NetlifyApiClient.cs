using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Umbraco.Community.NetlifyDashboard.Models;

namespace Umbraco.Community.NetlifyDashboard.Services;

/// <inheritdoc />
public sealed class NetlifyApiClient : INetlifyApiClient
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        // Omit null cache_tags so an empty/absent tag list reads as a full-site purge.
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    private readonly HttpClient _httpClient;
    private readonly INetlifyCredentialStore _credentialStore;

    public NetlifyApiClient(HttpClient httpClient, INetlifyCredentialStore credentialStore)
    {
        _httpClient = httpClient;
        _credentialStore = credentialStore;
    }

    public async Task<string?> ValidateTokenAsync(string token, CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, "user");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        using var response = await _httpClient.SendAsync(request, cancellationToken);
        await EnsureSuccessAsync(response, "Failed to validate the Netlify token.", cancellationToken);

        var user = await response.Content.ReadFromJsonAsync<NetlifyUser>(JsonOptions, cancellationToken);
        return user?.FullName ?? user?.Email;
    }

    public async Task<string?> GetAccountNameAsync(CancellationToken cancellationToken)
    {
        var user = await SendAsync<NetlifyUser>(HttpMethod.Get, "user", null, cancellationToken);
        return user?.FullName ?? user?.Email;
    }

    public async Task<IReadOnlyList<NetlifySiteModel>> GetSitesAsync(CancellationToken cancellationToken)
    {
        var sites = await SendAsync<List<NetlifySite>>(HttpMethod.Get, "sites?per_page=100", null, cancellationToken)
            ?? new List<NetlifySite>();

        return sites
            .Select(s => new NetlifySiteModel
            {
                Id = s.Id ?? string.Empty,
                Name = s.Name ?? s.Id ?? "(unnamed)",
                Url = s.SslUrl ?? s.Url,
                CustomDomain = s.CustomDomain,
            })
            .OrderBy(s => s.Name, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    public async Task<IReadOnlyList<NetlifyDeployModel>> GetDeploysAsync(string siteId, int take, CancellationToken cancellationToken)
    {
        if (take < 1)
        {
            take = 5;
        }

        var deploys = await SendAsync<List<NetlifyDeploy>>(
            HttpMethod.Get,
            $"sites/{Uri.EscapeDataString(siteId)}/deploys?per_page={take}",
            null,
            cancellationToken) ?? new List<NetlifyDeploy>();

        return deploys
            .Take(take)
            .Select(d => new NetlifyDeployModel
            {
                Id = d.Id ?? string.Empty,
                State = d.State ?? string.Empty,
                Status = MapStatus(d.State),
                Branch = d.Branch,
                CommitRef = d.CommitRef,
                CommitUrl = d.CommitUrl,
                Context = d.Context,
                DeployUrl = d.DeploySslUrl ?? d.DeployUrl ?? d.SslUrl ?? d.Url,
                ErrorMessage = d.ErrorMessage,
                CreatedAt = d.CreatedAt,
                PublishedAt = d.PublishedAt,
            })
            .ToList();
    }

    public async Task PurgeCacheAsync(string siteId, string[]? cacheTags, CancellationToken cancellationToken)
    {
        var payload = new PurgePayload
        {
            SiteId = siteId,
            CacheTags = cacheTags is { Length: > 0 }
                ? cacheTags.Select(t => t.Trim()).Where(t => t.Length > 0).ToArray()
                : null,
        };

        await SendAsync<object>(HttpMethod.Post, "purge", payload, cancellationToken);
    }

    private async Task<T?> SendAsync<T>(HttpMethod method, string relativeUrl, object? body, CancellationToken cancellationToken)
    {
        var token = _credentialStore.GetToken();
        if (string.IsNullOrWhiteSpace(token))
        {
            throw new NetlifyApiException(HttpStatusCode.Unauthorized, "No Netlify token is configured.");
        }

        using var request = new HttpRequestMessage(method, relativeUrl);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        if (body is not null)
        {
            request.Content = JsonContent.Create(body, options: JsonOptions);
        }

        using var response = await _httpClient.SendAsync(request, cancellationToken);
        await EnsureSuccessAsync(response, "The Netlify API request failed.", cancellationToken);

        if (typeof(T) == typeof(object))
        {
            return default;
        }

        return await response.Content.ReadFromJsonAsync<T>(JsonOptions, cancellationToken);
    }

    private static async Task EnsureSuccessAsync(HttpResponseMessage response, string fallbackMessage, CancellationToken cancellationToken)
    {
        if (response.IsSuccessStatusCode)
        {
            return;
        }

        var message = response.StatusCode switch
        {
            HttpStatusCode.Unauthorized => "The Netlify token is invalid or has expired.",
            HttpStatusCode.Forbidden => "The Netlify token does not have permission for this action.",
            HttpStatusCode.TooManyRequests => "Netlify is rate-limiting requests. Each cache tag or site can only be purged twice every 5 seconds — please wait and try again.",
            HttpStatusCode.NotFound => "The requested Netlify resource was not found.",
            _ => fallbackMessage,
        };

        // Include a snippet of the body for diagnostics where available.
        try
        {
            var detail = await response.Content.ReadAsStringAsync(cancellationToken);
            if (!string.IsNullOrWhiteSpace(detail) && detail.Length <= 500)
            {
                message = $"{message} ({detail.Trim()})";
            }
        }
        catch
        {
            // best effort only
        }

        throw new NetlifyApiException(response.StatusCode, message);
    }

    private static DeployStatus MapStatus(string? state) => state?.ToLowerInvariant() switch
    {
        "ready" => DeployStatus.Deployed,
        "current" => DeployStatus.Deployed,
        "new" or "pending" or "queued" or "enqueued" or "building" or "processing"
            or "preparing" or "prepared" or "uploading" or "uploaded" => DeployStatus.Building,
        "error" or "failed" or "rejected" => DeployStatus.Failed,
        _ => DeployStatus.Other,
    };

    // ----- Internal Netlify response DTOs (snake_case via Web defaults + explicit names) -----

    private sealed class NetlifyUser
    {
        [JsonPropertyName("full_name")] public string? FullName { get; set; }
        [JsonPropertyName("email")] public string? Email { get; set; }
    }

    private sealed class NetlifySite
    {
        [JsonPropertyName("id")] public string? Id { get; set; }
        [JsonPropertyName("name")] public string? Name { get; set; }
        [JsonPropertyName("url")] public string? Url { get; set; }
        [JsonPropertyName("ssl_url")] public string? SslUrl { get; set; }
        [JsonPropertyName("custom_domain")] public string? CustomDomain { get; set; }
    }

    private sealed class NetlifyDeploy
    {
        [JsonPropertyName("id")] public string? Id { get; set; }
        [JsonPropertyName("state")] public string? State { get; set; }
        [JsonPropertyName("branch")] public string? Branch { get; set; }
        [JsonPropertyName("commit_ref")] public string? CommitRef { get; set; }
        [JsonPropertyName("commit_url")] public string? CommitUrl { get; set; }
        [JsonPropertyName("context")] public string? Context { get; set; }
        [JsonPropertyName("deploy_url")] public string? DeployUrl { get; set; }
        [JsonPropertyName("deploy_ssl_url")] public string? DeploySslUrl { get; set; }
        [JsonPropertyName("url")] public string? Url { get; set; }
        [JsonPropertyName("ssl_url")] public string? SslUrl { get; set; }
        [JsonPropertyName("error_message")] public string? ErrorMessage { get; set; }
        [JsonPropertyName("created_at")] public DateTimeOffset? CreatedAt { get; set; }
        [JsonPropertyName("published_at")] public DateTimeOffset? PublishedAt { get; set; }
    }

    private sealed class PurgePayload
    {
        [JsonPropertyName("site_id")] public string SiteId { get; set; } = string.Empty;
        [JsonPropertyName("cache_tags")] public string[]? CacheTags { get; set; }
    }
}
