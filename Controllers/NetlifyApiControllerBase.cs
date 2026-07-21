using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Umbraco.Cms.Api.Common.Attributes;
using Umbraco.Cms.Web.Common.Authorization;
using Umbraco.Cms.Web.Common.Routing;

namespace Umbraco.Community.NetlifyDashboard.Controllers;

/// <summary>
/// Base controller for the Netlify Dashboard backoffice API. Configures routing, backoffice
/// authentication, and Swagger grouping.
/// </summary>
[ApiController]
[BackOfficeRoute("netlify-dashboard/api/v{version:apiVersion}")]
[Authorize(Policy = AuthorizationPolicies.BackOfficeAccess)]
[MapToApi(NetlifyConstants.ApiName)]
public abstract class NetlifyApiControllerBase : ControllerBase
{
}
