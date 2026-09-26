/**
 * Updates the documentation site's upstream sources (`upstream/site/`) alone;
 * `bun run upstream:sync` does this too, after the component snapshot.
 */
import { parseArgs } from "node:util"
import { config } from "../../../generator.config"
import { ROOT } from "../paths"
import {
  renderSiteSourcesReport,
  syncSiteSources,
} from "../upstream/site-sources"

const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: { report: { type: "string" } },
})

const changes = await syncSiteSources({
  root: ROOT,
  components: config.components,
  registryBaseUrl: config.registryBaseUrl,
  githubToken: process.env.GITHUB_TOKEN,
})
const report = renderSiteSourcesReport(changes)
console.log(report)
if (values.report) await Bun.write(values.report, report)
