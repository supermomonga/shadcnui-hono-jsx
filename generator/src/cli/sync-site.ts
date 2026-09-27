/**
 * Updates the documentation site's upstream sources (`upstream/site/`) alone;
 * `bun run upstream:sync` does this too, after the component snapshot.
 * `--commit <sha>` takes the GitHub sources from that shadcn-ui/ui commit
 * instead of main's head (to add a source without moving the others).
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
  options: { report: { type: "string" }, commit: { type: "string" } },
})

const changes = await syncSiteSources({
  root: ROOT,
  components: config.components,
  registryBaseUrl: config.registryBaseUrl,
  commit: values.commit,
  githubToken: process.env.GITHUB_TOKEN,
})
const report = renderSiteSourcesReport(changes)
console.log(report)
if (values.report) await Bun.write(values.report, report)
