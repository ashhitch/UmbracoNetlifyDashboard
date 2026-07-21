using Asp.Versioning;
using Microsoft.AspNetCore.Mvc.ApiExplorer;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;
using Umbraco.Cms.Api.Common.OpenApi;
using Umbraco.Cms.Api.Management.OpenApi;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Community.NetlifyDashboard.Services;

namespace Umbraco.Community.NetlifyDashboard.Composers;

/// <summary>
/// Registers the Netlify Dashboard services, the typed Netlify HTTP client, and its Swagger document.
/// </summary>
public sealed class NetlifyComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
    {
        builder.Services.AddSingleton<INetlifyCredentialStore, NetlifyCredentialStore>();

        builder.Services.AddHttpClient<INetlifyApiClient, NetlifyApiClient>(client =>
        {
            client.BaseAddress = new Uri(NetlifyConstants.NetlifyApiBaseUrl);
            client.DefaultRequestHeaders.UserAgent.ParseAdd("Umbraco.Community.NetlifyDashboard");
            client.Timeout = TimeSpan.FromSeconds(30);
        });

        builder.Services.AddSingleton<IOperationIdHandler, NetlifyOperationIdHandler>();

        builder.Services.Configure<SwaggerGenOptions>(options =>
        {
            options.SwaggerDoc(NetlifyConstants.ApiName, new OpenApiInfo
            {
                Title = "Netlify Dashboard API",
                Version = "1.0",
                Description = "Backoffice API for the Umbraco Netlify Dashboard extension.",
            });

            options.OperationFilter<NetlifyOperationSecurityFilter>();
        });
    }

    /// <summary>Enables Umbraco backoffice authentication for the Netlify Swagger document.</summary>
    private sealed class NetlifyOperationSecurityFilter : BackOfficeSecurityRequirementsOperationFilterBase
    {
        protected override string ApiName => NetlifyConstants.ApiName;
    }

    /// <summary>Produces clean Swagger operation ids for this package's controllers.</summary>
    private sealed class NetlifyOperationIdHandler : OperationIdHandler
    {
        public NetlifyOperationIdHandler(IOptions<ApiVersioningOptions> apiVersioningOptions)
            : base(apiVersioningOptions)
        {
        }

        protected override bool CanHandle(ApiDescription apiDescription, ControllerActionDescriptor controllerActionDescriptor)
            => controllerActionDescriptor.ControllerTypeInfo.Namespace?.StartsWith(
                "Umbraco.Community.NetlifyDashboard.Controllers",
                StringComparison.InvariantCultureIgnoreCase) is true;

        public override string Handle(ApiDescription apiDescription)
            => $"{apiDescription.ActionDescriptor.RouteValues["action"]}";
    }
}
