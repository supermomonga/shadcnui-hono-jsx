#!/usr/bin/env node
// The package's executable. `bun run build` bundles it for Node into dist/.
import { run } from "./index"

run(process.argv.slice(2))
