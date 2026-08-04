import { chromium } from "playwright";

const SCRATCH = "/private/tmp/claude-501/-Users-alejandro-Documents-tradingjournal2/1dcf8002-8838-468b-b016-91ec00cb0ce0/scratchpad";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

const trades = [
  ["arhs", "2131ab6e88218db70e358831e98ba36db4c8f89ac2bd840b4e11e3b47750a7b8"],
  ["amix-3exits", "27f9a96fe2f2cb2feef4b7b878a0eb96c688963ee6a70c13e272c866259a1a68"],
];

for (const [label, id] of trades) {
  await page.goto(`https://fillbooks.vercel.app/trades/${id}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${SCRATCH}/verify-${label}.png` });
}

await browser.close();
console.log("done");
