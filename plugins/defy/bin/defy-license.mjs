#!/usr/bin/env node
// Defy license helper. Paid commands (/defy:stripe, /defy:ship) run
// `defy-license.mjs check` and only continue when it prints "DEFY_LICENSE=valid".
//   check            verify the saved key (cached for 7 days)
//   activate <key>   save a key after verifying it
//   status           show which key is saved, without the secret part
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const API = process.env.DEFY_API || "https://www.learn-defy.com/api/license/verify";
const DIR = join(process.env.XDG_CONFIG_HOME || join(homedir(), ".config"), "defy");
const FILE = join(DIR, "license.json");
const WEEK = 7 * 24 * 60 * 60 * 1000;

const load = () => {
  if (process.env.DEFY_LICENSE) return { key: process.env.DEFY_LICENSE.trim() };
  try { return JSON.parse(readFileSync(FILE, "utf8")); } catch { return null; }
};
const save = (data) => {
  mkdirSync(DIR, { recursive: true });
  writeFileSync(FILE, JSON.stringify(data, null, 2), { mode: 0o600 });
};
const mask = (key) => (key.length > 16 ? `${key.slice(0, 13)}…${key.slice(-4)}` : "defy_…");

async function verify(key) {
  const res = await fetch(API, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ key }),
  });
  if (!res.ok && res.status !== 402 && res.status !== 404) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const [cmd, arg] = process.argv.slice(2);

if (cmd === "activate") {
  const key = (arg || "").trim();
  if (!key.startsWith("defy_")) {
    console.log("DEFY_LICENSE=invalid\nThat doesn't look like a Defy key. Keys start with defy_ and are on your checkout confirmation page.");
    process.exit(0);
  }
  try {
    const r = await verify(key);
    if (r.valid) {
      save({ key, plan: r.plan, checkedAt: Date.now() });
      console.log(`DEFY_LICENSE=valid\nActivated ${mask(key)} (${r.plan}). /defy:stripe and /defy:ship are unlocked.`);
    } else {
      console.log(`DEFY_LICENSE=invalid\n${r.reason || "That key isn't valid."}`);
    }
  } catch (e) {
    console.log(`DEFY_LICENSE=unreachable\nCouldn't reach learn-defy.com to check the key (${e.message}). Try again in a minute.`);
  }
} else if (cmd === "status") {
  const saved = load();
  console.log(saved ? `Saved key: ${mask(saved.key)}${saved.plan ? ` (${saved.plan})` : ""}` : "No Defy key saved. Run /defy:activate <key>.");
} else {
  const saved = load();
  if (!saved) {
    console.log("DEFY_LICENSE=missing\nNo Defy key found. Get one at https://www.learn-defy.com/pricing, then run /defy:activate <key>.");
    process.exit(0);
  }
  if (saved.checkedAt && Date.now() - saved.checkedAt < WEEK) {
    console.log("DEFY_LICENSE=valid");
    process.exit(0);
  }
  try {
    const r = await verify(saved.key);
    if (r.valid) {
      if (!process.env.DEFY_LICENSE) save({ ...saved, plan: r.plan, checkedAt: Date.now() });
      console.log("DEFY_LICENSE=valid");
    } else {
      console.log(`DEFY_LICENSE=invalid\n${r.reason || "Your Defy key is no longer valid."} Get a new one at https://www.learn-defy.com/pricing.`);
    }
  } catch {
    // Offline grace: a key that verified before keeps working for another week.
    const ok = saved.checkedAt && Date.now() - saved.checkedAt < 2 * WEEK;
    console.log(ok ? "DEFY_LICENSE=valid" : "DEFY_LICENSE=unreachable\nCouldn't reach learn-defy.com to check your key. Try again when you're online.");
  }
}
