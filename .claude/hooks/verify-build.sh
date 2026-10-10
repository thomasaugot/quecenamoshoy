#!/usr/bin/env bash
# Whole-project verification. Stop hook — runs when Claude is about to finish.
# Exit 2 = block + feed stderr back to Claude, which must then fix and retry.
#
# The per-file hook (check-rules.sh) cannot see the project as a whole: it never
# catches a broken import, a type error in a DIFFERENT file, or a rename that
# left callers dangling. This does. It is the reason "done" can be trusted.

set -uo pipefail
cd "$CLAUDE_PROJECT_DIR" 2>/dev/null || exit 0

# Nothing to verify in a project without a package.json.
[ -f package.json ] || exit 0

# Do not re-enter: if the Stop hook itself triggered this, let it finish.
if [ "$(jq -r '.stop_hook_active // false' 2>/dev/null)" = "true" ]; then
  exit 0
fi

fail=""

# ---- typecheck ----
# Vite splits tsconfig into references (root has `files: []`): `tsc --noEmit` there checks
# NOTHING and always passes. Vite needs `tsc -b`; Next keeps `tsc --noEmit`.
if ls vite.config.* >/dev/null 2>&1; then tscmd="tsc -b"; else tscmd="tsc --noEmit"; fi
if ! ts=$(npx --no-install $tscmd 2>&1); then
  fail+=$'\n=== npx '"$tscmd"$' ===\n'
  fail+=$(echo "$ts" | grep -E "error TS" | head -20)
fi

# ---- lint ----
if grep -q '"lint"' package.json; then
  if ! lint=$(npm run --silent lint 2>&1); then
    fail+=$'\n\n=== npm run lint ===\n'
    fail+=$(echo "$lint" | grep -vE "^$|^>" | head -20)
  fi
fi

[ -z "$fail" ] && exit 0

{
  echo "BUILD IS BROKEN — you cannot finish yet. Fix these, then verify again:"
  echo "$fail"
} >&2
exit 2
