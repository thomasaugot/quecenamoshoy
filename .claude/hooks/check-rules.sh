#!/usr/bin/env bash
# Mechanical rule enforcement — the greppable subset of .claude/rules/.
# PostToolUse hook on Edit|Write. Exit 2 = block + feed stderr back to Claude.
#
# Only checks that are DETERMINISTIC and false-positive-free belong here.
# Anything needing judgement stays prose in .claude/rules/.
#
# One script for both stacks. The stack is detected from the project root:
#   vite.config.* → vite   (rules in .claude/rules/vite/,   code under src/)
#   next.config.* → next   (rules in .claude/rules/nextjs/, code at the root)
# Shared checks run for both; stack checks only for their stack.

set -uo pipefail
f=$(jq -r '.tool_input.file_path // empty' 2>/dev/null) || exit 0
[ -z "$f" ] || [ ! -f "$f" ] && exit 0

case "$f" in
  */node_modules/*|*/.next/*|*/dist/*|*/.claude/*) exit 0 ;;
esac

root="${CLAUDE_PROJECT_DIR:-$(pwd)}"
stack=""
if ls "$root"/vite.config.* >/dev/null 2>&1; then stack="vite"
elif ls "$root"/next.config.* >/dev/null 2>&1; then stack="next"
fi

rel="${f#"$root/"}"
# Folder rules are written against the canonical tree (components/, hooks/…).
# In Vite that tree lives under src/, so compare without the prefix.
srel="$rel"
[ "$stack" = "vite" ] && srel="${rel#src/}"
base=$(basename "$f")

v=()
add() { v+=("$1"); }
# grep the file without comment lines: a file may legitimately DOCUMENT a ban
code() { grep -vE '^\s*(//|\*|/\*)' "$f"; }

# =====================================================================
# SHARED — .ts / .tsx
# =====================================================================
case "$f" in
  *.ts|*.tsx)
    grep -qE 'from "\.\.' "$f" && add "relative ../ import → use @/ alias (04-CLIENT_SERVER)"
    grep -qE ':\s*any\b' "$f" && add "': any' type → use a real type (15-CHECKLIST M)"
    # logger.ts IS the console wrapper; lib/ and Icons.tsx ARE the sanctioned barrels
    case "$f" in
      */utils/logger.ts|utils/logger.ts) ;;
      *) grep -qE '\bconsole\.(log|error|warn|info|debug)\b' "$f" && add "console.* → use logger from @/utils/logger (04-CLIENT_SERVER)" ;;
    esac
    case "$f" in
      */lib/gsap.ts|lib/gsap.ts) ;;
      *) grep -qE 'from "gsap"|from "gsap/' "$f" && add "direct gsap import → use @/lib/gsap (04-CLIENT_SERVER)" ;;
    esac
    case "$f" in
      */lib/lenis.ts|lib/lenis.ts) ;;
      *) grep -qE 'from "lenis"' "$f" && add "direct lenis import → use @/lib/lenis (04-CLIENT_SERVER)" ;;
    esac
    case "$f" in
      */components/ui/Icons.tsx|components/ui/Icons.tsx) ;;
      *) grep -qE 'from "react-icons/' "$f" && add "direct react-icons import → use @/components/ui/Icons (04-CLIENT_SERVER)" ;;
    esac
    code | grep -qE 'clearProps:\s*"all"' \
      && add "clearProps:\"all\" also wipes inline styles a library set for layout → name the properties (05-ANIMATIONS)"
    # dangerouslySetInnerHTML only with sanitised HTML or serialised JSON-LD
    if code | grep -q 'dangerouslySetInnerHTML' \
       && ! grep -qE 'DOMPurify|sanitize|serializeJsonLd' "$f"; then
      add "dangerouslySetInnerHTML without DOMPurify / serializeJsonLd → sanitise it (11-SECURITY)"
    fi
    ;;
esac

# =====================================================================
# SHARED — tests
# =====================================================================
case "$f" in
  *.spec.ts|*.test.ts|*.spec.tsx|*.test.tsx|*/e2e/*.ts)
    code | grep -qE '\bwaitForTimeout\(' \
      && add "waitForTimeout in a test → wait for a state (expect/waitForResponse) instead (12-TESTING_CI)"
    ;;
esac

# =====================================================================
# SHARED — .tsx components
# =====================================================================
case "$f" in
  *.tsx)
    code | grep -qE 'style=\{\{' \
      && add "style={{ }} is BANNED — use Tailwind utility/arbitrary class (03-CSS_TOKENS)"
    grep -qE 'className="[^"]*\bsm:' "$f" && add "sm: prefix is BANNED (03-CSS_TOKENS)"
    grep -qE 'className="[^"]*\bdark:' "$f" && add "dark: prefix is BANNED → dark mode is a token override in theme.css (03-CSS_TOKENS)"
    grep -qE 'className="[^"]*\bz-\[' "$f" && add "arbitrary z-index → use named class from base.css (03-CSS_TOKENS)"
    grep -qE 'className="[^"]*(text|font|bg|border)-\(--' "$f" && add "raw CSS-var utility in JSX → use semantic token (03-CSS_TOKENS)"
    grep -qE 'className="[^"]*\btext-(xs|sm|base|lg|xl|[2-9]xl)\b' "$f" \
      && add "Tailwind text-size utility → use semantic class from base.css (03-CSS_TOKENS)"
    grep -qE 'className="[^"]*\btext-(gray|slate|zinc|neutral|stone|red|blue|green|yellow|indigo|purple|pink)-[0-9]' "$f" \
      && add "Tailwind palette color → use semantic token (03-CSS_TOKENS)"
    grep -qE 'className="[^"]*\btext-caption\b' "$f" \
      && add "text-caption does not exist → .text-body-sm / .text-label (03-CSS_TOKENS)"
    # Legitimate hex: manifest/metadata colour values and raw HTML/style STRINGS handed to
    # non-React libs (Leaflet/MapLibre markers) — CSS custom properties do not resolve there.
    if ! grep -qE 'divIcon|maplibre|leaflet|new Marker|setIcon' "$f"; then
      if grep -E '#[0-9a-fA-F]{3,6}\b' "$f" | grep -qvE 'themeColor|background_color|theme_color'; then
        add "hardcoded hex color → use CSS variable / semantic token (03-CSS_TOKENS)"
      fi
    fi
    case "$f" in
      */contexts/ScrollContext.tsx) ;;
      *) grep -qE '\bwindow\.scrollTo\(' "$f" && add "window.scrollTo → use scrollToTop()/scrollToY() from useScroll (06-TRANSITIONS)" ;;
    esac
    grep -qE '\btabIndex=\{[1-9]' "$f" && add "positive tabIndex → only 0 and -1 allowed (08-ACCESSIBILITY)"
    grep -qE '<(div|span)[^>]*\sonClick=' "$f" && add "<div|span onClick> → use real <button> or <a> (08-ACCESSIBILITY)"
    grep -qE 'role="checkbox"' "$f" && add "role=\"checkbox\" → <Checkbox> wraps a real hidden checkbox (07-UI_PRIMITIVES)"

    # ---- arbitrary value where a token/scale entry already exists ----
    # Only flags values that provably duplicate an existing token. Anything with
    # clamp/calc/ch/vh/vw/% or a grid template is a legitimate arbitrary value.
    grep -qE 'className="[^"]*\brounded-\[' "$f" \
      && add "rounded-[…] → use rounded-sm|md|lg|xl|full, the tokens exist (03-CSS_TOKENS)"
    grep -qE 'className="[^"]*\btext-\[[0-9.]+(rem|px)\]' "$f" \
      && add "text-[fixed size] → use a semantic class from base.css (03-CSS_TOKENS)"

    # ---- one component per file ----
    # Icons.tsx is the sanctioned icon barrel; contexts/ export the Context next to its Provider.
    case "$f" in
      */components/ui/Icons.tsx) ;;
      */contexts/*) ;;
      *)
        n=$(grep -cE '^export (const|function) [A-Z][A-Za-z0-9]*\s*(=|\()' "$f" || true)
        [ "${n:-0}" -gt 1 ] && add "$n components exported from one file → split, one per file (04-CLIENT_SERVER)"
        ;;
    esac

    # ---- components are render-only ----
    grep -qE '^\s+(const|let)\s+\w+\s*=\s*\[?\.{0,3}[\w.]*\s*\.(filter|sort|reduce|flatMap)\(' "$f" \
      && add "data transform inside a component → move to utils/ unless trivial+single-use+presentational (04-CLIENT_SERVER)"
    grep -qE '\b(fetch|axios)\s*\(' "$f" \
      && add "network call inside a component → move to services/ (04-CLIENT_SERVER, render-only)"
    grep -qE 'useRef\((Date\.now\(\)|Math\.random\(\)|new Date\(\))' "$f" && add "impure call during render → move into an effect (15-CHECKLIST N)"

    # ---- GSAP: three ways to break an animation without any error ----
    # All three cost an afternoon on 02/09/2026: the screen does not animate, animates
    # once, or stays blank.
    # 1. GSAP mounted by hand in an effect instead of useGSAPAnimations.
    code | grep -qE 'return init[A-Z][A-Za-z]*\(root' \
      && add "GSAP mounted by hand in useEffect → use useGSAPAnimations (05-ANIMATIONS)"
    # 2. useGSAPAnimations given a ref: the signature takes a factory.
    grep -qE 'useGSAPAnimations\(\s*[a-zA-Z]+Ref' "$f" \
      && add "useGSAPAnimations does NOT take a ref → useGSAPAnimations(() => ({...})) (05-ANIMATIONS)"
    # 3. The same rootRef on two elements: React keeps the last one, the rest stop animating.
    [ "$(grep -c 'ref={rootRef}' "$f")" -gt 1 ] \
      && add "two elements share rootRef → one per component (05-ANIMATIONS)"

    # ---- GSAP flicker: every data-anim target ships `invisible` (05-ANIMATIONS) ----
    while IFS= read -r name; do
      [ -n "$name" ] && add "data-anim=\"$name\" is not hidden at first paint → add className=\"invisible\" (GSAP flicker, 05-ANIMATIONS)"
    done < <(python3 - "$f" <<'PYEOF'
import re, sys, pathlib
src = pathlib.Path(sys.argv[1]).read_text()
for m in re.finditer(r'<[A-Za-z][^>]*?data-anim="([\w-]+)"[^>]*?>', src, re.S):
    tag, name = m.group(0), m.group(1)
    if any(k in tag for k in ('invisible', 'scaleX(0)', 'scaleY(0)')):
        continue
    # An element whose nearest data-anim ancestor is already hidden inherits that
    # hiding; flagging it would force a double-hide that never reveals.
    before = src[:m.start()]
    if re.search(r'data-anim="[\w-]+"[^>]*?invisible', before[-4000:], re.S):
        continue
    print(name)
PYEOF
)
    ;;
esac

# =====================================================================
# SHARED — utils/animations: the target gate
# =====================================================================
case "$srel" in
  utils/animations/*.ts)
    # offsetParent is null under any visibility:hidden ancestor — exactly what the
    # `invisible` class puts on EVERY target: the filter emptied the list, nothing animated.
    code | grep -q 'offsetParent' \
      && add "offsetParent filter on targets → plain querySelectorAll (05-ANIMATIONS)"
    ;;
esac

# =====================================================================
# NEXT ONLY
# =====================================================================
if [ "$stack" = "next" ]; then
  case "$f" in
    *.tsx)
      case "$f" in
        */TransitionLink.tsx) ;;
        *) grep -qE 'from "next/link"' "$f" && add "next/link → use @/components/ui/TransitionLink (04-CLIENT_SERVER)" ;;
      esac
      case "$f" in
        */contexts/TransitionContext.tsx|*/contexts/TranslationContext.tsx) ;;
        # Rendered OUTSIDE PageShell and owning their own exit animation, so
        # navigateTo has no pageRef to work with. Documented at each call site.
        */RoleGate.tsx|*/ModeSwitch.tsx) ;;
        *) grep -qE '\brouter\.push\(' "$f" && add "router.push() → use navigateTo() from TransitionContext (06-TRANSITIONS)" ;;
      esac
      ;;
  esac
  case "$f" in
    *.ts|*.tsx)
      # The semicolon is optional: prettier adds it, and the check read it as
      # "directive not on line 1".
      if grep -qE '^\s*"use client"' "$f" \
         && [ "$(head -1 "$f" | tr -d '\r;')" != '"use client"' ]; then
        add '"use client" must be the very first line (04-CLIENT_SERVER)'
      fi
      ;;
  esac
  case "$f" in
    *middleware.ts)                   add "middleware.ts is BANNED → use proxy.ts at project root (15-CHECKLIST A)" ;;
    */app/globals.css|app/globals.css) add "app/globals.css is BANNED → globals.css lives at project root (15-CHECKLIST A)" ;;
  esac
fi

# =====================================================================
# VITE ONLY
# =====================================================================
if [ "$stack" = "vite" ]; then
  case "$f" in
    *.ts|*.tsx)
      grep -qE '^\s*"use client"' "$f" && add '"use client" means nothing in Vite → remove it (04-CLIENT_SERVER)'
      case "$rel" in
        src/*)
          code | grep -qE '\bprocess\.env\b' \
            && add "process.env does not exist in the browser bundle → appConfig from @/config/app.config (04-CLIENT_SERVER)"
          case "$srel" in
            config/app.config.ts) ;;
            # DEV / PROD / MODE are build-time constants; only VITE_ values are config
            *) code | grep -qE 'import\.meta\.env\.VITE_' \
                 && add "import.meta.env.VITE_* outside src/config/app.config.ts → read it from appConfig (04-CLIENT_SERVER)" ;;
          esac
          ;;
      esac
      ;;
  esac
  case "$f" in
    *.tsx)
      case "$f" in
        */components/ui/TransitionLink.tsx) ;;
        *) grep -qE 'import \{[^}]*\b(Link|NavLink)\b[^}]*\} from "react-router(-dom)?"' "$f" \
             && add "Link/NavLink from react-router → use @/components/ui/TransitionLink (04-CLIENT_SERVER)" ;;
      esac
      case "$f" in
        */contexts/TransitionContext.tsx) ;;
        *) grep -qE '\buseNavigate\(' "$f" && add "useNavigate() → use navigateTo() from TransitionContext (06-TRANSITIONS)" ;;
      esac
      grep -qE '<ScrollRestoration\b' "$f" && add "<ScrollRestoration /> is BANNED → PageShell owns scroll (06-TRANSITIONS)"
      ;;
  esac
  case "$rel" in
    src/index.css|src/App.css) add "Vite boilerplate CSS → delete it; styles live in src/globals.css + src/styles/ (01-BOOTSTRAP)" ;;
  esac
fi

# =====================================================================
# SHARED — banned files
# =====================================================================
case "$f" in
  *tailwind.config.*) add "tailwind.config is BANNED → Tailwind v4 is CSS-only (15-CHECKLIST A)" ;;
  *.module.css)       add "CSS modules are BANNED (15-CHECKLIST A)" ;;
  */styles/components.css) add "components.css is BANNED → delete it (03-CSS_TOKENS)" ;;
esac

# =====================================================================
# SHARED — structure: naming + placement of the file just written
# =====================================================================
# Full-tree audit: .claude/skills/check-project-structure/scripts/check_structure.py.
# This is the per-file subset, so a misplaced file is caught the moment it is created.
case "$srel" in
  components/*.tsx|components/*.ts)
    echo "$base" | grep -qE '^[A-Z][A-Za-z0-9]*\.tsx?$' \
      || add "components/ must be PascalCase — got $base (04-CLIENT_SERVER)" ;;
  hooks/*)
    echo "$base" | grep -qE '^use[A-Z][A-Za-z0-9]*\.ts$' \
      || add "hooks/ must be use+camelCase — got $base (04-CLIENT_SERVER)" ;;
  contexts/*)
    echo "$base" | grep -qE '^[A-Z][A-Za-z0-9]*\.tsx?$' \
      || add "contexts/ must be PascalCase — got $base (04-CLIENT_SERVER)" ;;
  utils/*|lib/*|config/*|services/*|stores/*|types/*|constants/*|i18n/*)
    echo "$base" | grep -qE '^[a-z0-9]+(-[a-z0-9]+)*(\.[a-z0-9]+(-[a-z0-9]+)*)*\.tsx?$' \
      || add "$(dirname "$srel")/ must be kebab-case — got $base (04-CLIENT_SERVER)" ;;
esac

# ---- each folder holds only what belongs in it ----
case "$srel" in
  hooks/*)
    grep -qE '^export (function|const) use[A-Z]' "$f" \
      || add "hooks/ must export a use* hook — $base does not (04-CLIENT_SERVER)"
    grep -qE '\b(fetch|axios)\s*\(' "$f" \
      && add "network call in hooks/ → put the request in services/, call it from the hook (04-CLIENT_SERVER)"
    ;;
  contexts/*)
    grep -qE 'createContext' "$f" \
      || add "contexts/ must create a context — $base does not (04-CLIENT_SERVER)" ;;
  types/*)
    # `export const X = {...} as const` + `type X = typeof X` is a legitimate
    # type-level pattern. Only executable declarations are wrong here.
    grep -qE '^\s*export\s+(function|class)\s' "$f" \
      && add "types/ holds type declarations only — $base exports a function/class (04-CLIENT_SERVER)" ;;
  constants/*)
    # An arrow inside a value (a .sort() comparator, a mapped literal) is fine.
    # An EXPORTED function is logic and belongs in utils/.
    grep -qE '^export (function|const [a-zA-Z][A-Za-z0-9]* = (\(|async|<))' "$f" \
      && add "constants/ holds fixed values only — $base exports a function, move it to utils/ (04-CLIENT_SERVER)"
    grep -qE '\buseState\(|\buseEffect\(|\buseRef\(' "$f" \
      && add "React hooks in constants/ → wrong folder (04-CLIENT_SERVER)"
    ;;
  utils/animations/*)
    grep -qE 'from "@/lib/gsap"|from "@/lib/lenis"' "$f" \
      || add "utils/animations/ must import GSAP/Lenis from @/lib — $base does not (05-ANIMATIONS)" ;;
  utils/*)
    grep -qE '\buseState\(|\buseEffect\(|\buseContext\(|\buseRef\(' "$f" \
      && add "React hooks in utils/ → move to hooks/ (04-CLIENT_SERVER)"
    grep -qE '^\s*return\s*\(?\s*<[A-Za-z]' "$f" \
      && add "JSX in utils/ → move to components/ (04-CLIENT_SERVER)"
    ;;
  services/*)
    grep -qE '\buseState\(|\buseEffect\(|\buseContext\(|\buseQuery\(|\buseMutation\(' "$f" \
      && add "React hooks in services/ → services are raw calls; the hook goes in hooks/ (04-CLIENT_SERVER)"
    grep -qE '^\s*return\s*\(?\s*<[A-Za-z]' "$f" \
      && add "JSX in services/ → services are data access only (04-CLIENT_SERVER)"
    ;;
  config/*)
    grep -qE '^\s*return\s*\(?\s*<[A-Za-z]' "$f" \
      && add "JSX in config/ → config holds configuration values only (04-CLIENT_SERVER)" ;;
  components/*)
    # A component may declare its OWN Props/State/local shapes. An EXPORTED
    # domain type is shared by definition and belongs in types/.
    while IFS= read -r t; do
      case "$t" in
        *Props|*State|*Variant|*Size) ;;
        "") ;;
        *) add "exported type '$t' in a component → move to types/ (04-CLIENT_SERVER)" ;;
      esac
    done < <(grep -oE '^export (type|interface) [A-Z][A-Za-z0-9]*' "$f" | awk '{print $3}')
    ;;
esac

# a component file must actually live under components/
case "$srel" in
  components/*|app/*|contexts/*) ;;
  *.tsx)
    grep -qE '^export (const|function) [A-Z]' "$f" \
      && add "component defined outside components/ → move it ($rel) (04-CLIENT_SERVER)" ;;
esac

[ ${#v[@]} -eq 0 ] && exit 0

{
  echo "Rule violations in $f — fix before continuing:"
  for x in "${v[@]}"; do echo "  ✗ $x"; done
} >&2
exit 2
