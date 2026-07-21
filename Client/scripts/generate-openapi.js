// Optional tooling: regenerate a typed client from the running Umbraco instance's Swagger document.
//
// The dashboard ships with a small hand-written typed client in `src/api/` so the project builds
// without a running server. If you prefer a fully generated client, run `npm run generate-client`
// while the host is running; output lands in `src/generated/` (kept separate so it never clobbers
// the hand-written client). Update the swagger URL/port in package.json to match your launch profile.
import fetch from "node-fetch";
import chalk from "chalk";
import { createClient, defaultPlugins } from "@hey-api/openapi-ts";

console.log(chalk.green("Generating OpenAPI client..."));

const swaggerUrl = process.argv[2];
if (swaggerUrl === undefined) {
  console.error(chalk.red("ERROR: Missing URL to OpenAPI spec"));
  console.error("Example: node generate-openapi.js https://localhost:44388/umbraco/swagger/netlifydashboard/swagger.json");
  process.exit(1);
}

// Ignore the self-signed dev certificate on localhost.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

console.log(`Fetching OpenAPI definition from ${chalk.yellow(swaggerUrl)}`);

fetch(swaggerUrl)
  .then(async (response) => {
    if (!response.ok) {
      console.error(chalk.red(`ERROR: Swagger returned ${response.status} ${response.statusText}. Is the host running?`));
      return;
    }

    await createClient({
      input: swaggerUrl,
      output: "src/generated",
      plugins: [
        ...defaultPlugins,
        { name: "@hey-api/client-fetch", bundle: true, exportFromIndex: true, throwOnError: true },
        { name: "@hey-api/typescript", enums: "typescript" },
        { name: "@hey-api/sdk", asClass: true },
      ],
    });

    console.log(chalk.green("Done. Generated client written to src/generated/"));
  })
  .catch((error) => {
    console.error(`ERROR: Failed to connect to the OpenAPI spec: ${chalk.red(error.message)}`);
  });
