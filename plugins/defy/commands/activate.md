---
description: Activate your Defy license key to unlock /defy:stripe and /defy:ship
argument-hint: <defy_ key from your checkout page>
allowed-tools: Bash(node:*)
---

!`node "${CLAUDE_PLUGIN_ROOT}/bin/defy-license.mjs" activate "$ARGUMENTS"`

Tell the user the result above in one or two plain sentences. Never repeat the full key back. If it was activated, say that `/defy:stripe` and `/defy:ship` are ready. If it failed, say why and point to https://www.learn-defy.com/pricing.
