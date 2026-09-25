import { chromium } from "@playwright/test"

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 800, height: 600 } })
page.on("pageerror", (e) => console.log("pageerror", e.message))
await page.goto(`file://${import.meta.dir}/index.html`)
await page.waitForTimeout(300)
const dump = async (label: string) => {
  console.log(`\n===== ${label}`)
  console.log(
    await page.evaluate(() =>
      document.body.innerHTML
        .replace(/ class="[^"]*"/g, "")
        .replace(/<svg.*?<\/svg>/g, "<svg/>")
        .replace(/<script.*?<\/script>/, "")
        .replace(/<main>.*?<\/main>/, "<main/>")
    )
  )
}
await dump("initial")
await page.click("#plain")
await page.waitForTimeout(50)
await dump("added (starting?)")
await page.waitForTimeout(600)
await dump("settled")
await page.click("#success")
await page.waitForTimeout(600)
await dump("two")
await page.mouse.move(700, 550)
await page.waitForTimeout(600)
await dump("hover viewport")
await browser.close()
