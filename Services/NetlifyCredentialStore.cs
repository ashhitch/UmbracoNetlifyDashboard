using Microsoft.AspNetCore.DataProtection;
using Umbraco.Cms.Core.Services;

namespace Umbraco.Community.NetlifyDashboard.Services;

/// <inheritdoc />
public sealed class NetlifyCredentialStore : INetlifyCredentialStore
{
    private readonly IKeyValueService _keyValueService;
    private readonly IDataProtector _protector;

    public NetlifyCredentialStore(IKeyValueService keyValueService, IDataProtectionProvider dataProtectionProvider)
    {
        _keyValueService = keyValueService;
        _protector = dataProtectionProvider.CreateProtector(NetlifyConstants.DataProtectionPurpose);
    }

    public string? GetToken()
    {
        var stored = _keyValueService.GetValue(NetlifyConstants.KeyValueKeys.Token);
        if (string.IsNullOrWhiteSpace(stored))
        {
            return null;
        }

        try
        {
            return _protector.Unprotect(stored);
        }
        catch
        {
            // Stored value can no longer be decrypted (e.g. data-protection keys rotated/lost).
            // Treat as not connected so the user can re-enter the token.
            return null;
        }
    }

    public void SetToken(string token)
    {
        var encrypted = _protector.Protect(token);
        _keyValueService.SetValue(NetlifyConstants.KeyValueKeys.Token, encrypted);
    }

    public void ClearToken()
    {
        _keyValueService.SetValue(NetlifyConstants.KeyValueKeys.Token, string.Empty);
        _keyValueService.SetValue(NetlifyConstants.KeyValueKeys.SelectedSiteId, string.Empty);
    }

    public string? GetSelectedSiteId()
    {
        var value = _keyValueService.GetValue(NetlifyConstants.KeyValueKeys.SelectedSiteId);
        return string.IsNullOrWhiteSpace(value) ? null : value;
    }

    public void SetSelectedSiteId(string siteId)
        => _keyValueService.SetValue(NetlifyConstants.KeyValueKeys.SelectedSiteId, siteId);
}
