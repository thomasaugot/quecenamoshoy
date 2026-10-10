#!/usr/bin/env python3
"""Validate a project against the house tree structure.

Usage: check_structure.py [project_root]
Exit 0 = clean, 1 = problems found.

The stack is detected from the root:
  vite.config.*  → Vite:  code under src/,       rules in .claude/rules/vite/
  next.config.*  → Next:  code at the root,      rules in .claude/rules/nextjs/
Shared checks (naming, banned files, styles, public/ hygiene) run on the code root of
either stack.
"""
import sys, re
from pathlib import Path

ROOT = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
errors, warnings = [], []

def err(m): errors.append(m)
def warn(m): warnings.append(m)
def read(p): return p.read_text(encoding="utf-8", errors="ignore")
def rel(p): return p.relative_to(ROOT)

if any(ROOT.glob("vite.config.*")):
    STACK, CODE = "vite", ROOT / "src"
elif any(ROOT.glob("next.config.*")):
    STACK, CODE = "next", ROOT
else:
    print("  ! no vite.config.* or next.config.* at the root — stack unknown, shared checks only")
    STACK, CODE = "unknown", ROOT

# ---------- required root files ----------
REQUIRED = {
    "next":    ["globals.css", "proxy.ts", "tsconfig.json", "package.json", "MEMORY.md"],
    "vite":    ["index.html", "tsconfig.json", "tsconfig.app.json", "package.json", "MEMORY.md",
                "src/main.tsx", "src/globals.css", "src/config/app.config.ts", "src/app/router.tsx"],
    "unknown": ["tsconfig.json", "package.json", "MEMORY.md"],
}[STACK]
for f in REQUIRED:
    if not (ROOT / f).exists():
        warn(f"missing: {f}")

# ---------- banned files/dirs ----------
BANNED = {
    "tailwind.config.ts":   "Tailwind v4 is CSS-only",
    "tailwind.config.js":   "Tailwind v4 is CSS-only",
    "messages":             'locale folder must be named "locales/"',
}
if STACK == "next":
    BANNED.update({
        "middleware.ts":    "use proxy.ts at project root",
        "src":              "no src dir in a Next project — folders live at project root",
        "app/globals.css":  "globals.css belongs at project root",
    })
if STACK == "vite":
    BANNED.update({
        "src/App.css":      "Vite boilerplate — styles live in src/globals.css + src/styles/",
        "src/index.css":    "Vite boilerplate — replaced by src/globals.css",
        "src/messages":     'locale folder must be named "locales/"',
        "globals.css":      "in a Vite project globals.css lives in src/",
        "styles":           "in a Vite project styles/ lives in src/",
        "components":       "in a Vite project components/ lives in src/",
    })
for r, why in BANNED.items():
    if (ROOT / r).exists():
        err(f"banned: {r} — {why}")
if (CODE / "styles" / "components.css").exists():
    err(f"banned: {rel(CODE / 'styles' / 'components.css')} — no fallback CSS file, Tailwind or nothing")

for p in ROOT.rglob("*.module.css"):
    if "node_modules" not in p.parts:
        err(f"banned: {rel(p)} — no CSS modules")

# ---------- required styles ----------
for f in ["theme.css", "base.css", "animations.css", "accessibility.css"]:
    if not (CODE / "styles" / f).exists():
        err(f"missing {rel(CODE / 'styles' / f)}")

# ---------- naming conventions ----------
PASCAL = re.compile(r"^[A-Z][A-Za-z0-9]*\.tsx?$")
# kebab-case, optionally with a dotted qualifier: app.config.ts, i18n.config.ts, x.test.ts
KEBAB  = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*(\.[a-z0-9]+(-[a-z0-9]+)*)*\.tsx?$")
HOOK   = re.compile(r"^use[A-Z][A-Za-z0-9]*\.ts$")

def scan(folder, pattern, label):
    d = CODE / folder
    if not d.is_dir():
        return
    for p in d.rglob("*.ts*"):
        if "node_modules" in p.parts or p.name.endswith(".d.ts"):
            continue
        if not pattern.match(p.name):
            err(f"{rel(p)} — {label}")

scan("components", PASCAL, "components/ must be PascalCase")
scan("contexts",   PASCAL, "contexts/ must be PascalCase")
scan("hooks",      HOOK,   "hooks/ must be useCamelCase.ts")
for folder in ["utils", "lib", "config", "services", "stores", "types", "constants", "i18n"]:
    scan(folder, KEBAB, f"{folder}/ must be kebab-case")
if STACK == "vite":
    scan("app", KEBAB, "app/ must be kebab-case (router.tsx, route-modules.ts)")

# ---------- animation files named after behaviour, not pages ----------
pdir = CODE / "components" / "pages"
pages = {p.name for p in pdir.iterdir()} if pdir.is_dir() else set()
adir = CODE / "utils" / "animations"
if adir.is_dir():
    for p in adir.glob("*.ts"):
        if p.stem.split("-")[0] in pages:
            err(f"{rel(p)} — named after a page; name it after the behaviour")

# ---------- page controller naming ----------
# Next: <Route>Client.tsx · Vite: <Route>Page.tsx
if pdir.is_dir():
    wrong = "Page.tsx" if STACK == "next" else "Client.tsx"
    right = "Client.tsx" if STACK == "next" else "Page.tsx"
    for p in pdir.rglob(f"*{wrong}"):
        warn(f"{rel(p)} — page controllers are <Route>{right} in this stack")

# ---------- PageLoader must be mounted (both stacks) ----------
prov = CODE / "components" / "layout" / "Providers.tsx"
pl   = CODE / "components" / "layout" / "PageLoader.tsx"
if pl.exists() and prov.exists() and "<PageLoader" not in read(prov):
    gated = [rel(q) for q in (CODE / "components").rglob("*.tsx")
             if q.name != "PageLoader.tsx" and "useLoaderGone" in read(q)]
    if gated:
        err("PageLoader.tsx exists but is NOT mounted in Providers.tsx — loaderGone never "
            f"fires, so these are dead: {', '.join(str(g) for g in gated[:4])}")
    else:
        warn("PageLoader.tsx exists but is not mounted in Providers.tsx — "
             "mount it, or delete it if the project has no loader")

# =====================================================================
# NEXT — app/ router conventions
# =====================================================================
app = ROOT / "app"
if STACK == "next" and app.is_dir():
    for p in app.rglob("page.tsx"):
        if read(p).lstrip().startswith('"use client"'):
            err(f'{rel(p)} — pages are Server Components; extract to a *Client.tsx')

    locale_dirs = [d for d in app.iterdir() if d.is_dir() and d.name.startswith("[") and "locale" in d.name]
    seg = locale_dirs[0] if locale_dirs else app
    for f, why in [
        ("error.tsx",     "a throw renders Next's default page — unstyled and untranslated"),
        ("not-found.tsx", "notFound() and unmatched routes fall through"),
    ]:
        if not (seg / f).exists():
            warn(f"missing {rel(seg)}/{f} — {why}")
    if not (app / "global-error.tsx").exists():
        warn("missing app/global-error.tsx — no fallback if the root layout throws")

    for p in app.rglob("error.tsx"):
        if not read(p).lstrip().startswith('"use client"'):
            err(f'{rel(p)} — error boundaries must be "use client" (they receive reset)')

    ge = app / "global-error.tsx"
    if ge.exists():
        t = read(ge)
        if "<html" not in t or "<body" not in t:
            err("app/global-error.tsx — must render its own <html> and <body>")

    # loading.tsx: every public page that awaits data has one, rendering <PageLoading />
    # (14-PERFORMANCE.md). Only flag one that renders something else (a skeleton belongs to
    # panels whose layout is known — a judgement call, so a warning).
    for p in app.rglob("loading.tsx"):
        if "PageLoading" not in read(p):
            warn(f"{rel(p)} — public pages use <PageLoading />; a skeleton only for known, "
                 "stable panel layouts (14-PERFORMANCE)")

    for p in app.rglob("actions.ts"):
        if not read(p).lstrip().startswith('"use server"'):
            err(f'{rel(p)} — must start with "use server"')

    for p in app.rglob("route.ts"):
        if "api" not in p.relative_to(app).parts:
            warn(f"{rel(p)} — route handlers belong under app/api/")

# =====================================================================
# VITE — router conventions (04-CLIENT_SERVER.md)
# =====================================================================
if STACK == "vite":
    router = CODE / "app" / "router.tsx"
    if router.exists():
        t = read(router)
        if "errorElement" not in t:
            warn("src/app/router.tsx — no errorElement: a thrown error shows React Router's raw screen")
        if 'path: "*"' not in t and "path: '*'" not in t:
            warn('src/app/router.tsx — no path: "*" route: unknown URLs render nothing')
        if "<ScrollRestoration" in t:
            err("src/app/router.tsx — <ScrollRestoration /> is banned, PageShell owns scroll")
    # routes are declared in ONE place
    for p in CODE.rglob("*.tsx"):
        if p == router or "node_modules" in p.parts:
            continue
        if re.search(r"\bcreateBrowserRouter\(|<Routes\b", read(p)):
            err(f"{rel(p)} — routes are declared only in src/app/router.tsx")
    # server code never lives in src/
    for p in CODE.rglob("*.ts*"):
        if "node_modules" in p.parts:
            continue
        if re.search(r'^\s*"use (client|server)"', read(p), re.M):
            err(f'{rel(p)} — "use client"/"use server" mean nothing in Vite; remove the directive')

# ---------- tests mirror source paths ----------
tdir = ROOT / "tests"
if tdir.is_dir():
    for p in tdir.rglob("*.test.ts*"):
        r = p.relative_to(tdir)
        src = CODE / r.parent / (p.name.split(".test.")[0] + ".ts")
        if not src.exists() and not src.with_suffix(".tsx").exists():
            warn(f"tests/{r} — no matching source at {rel(CODE / r.parent)}/")

# ---------- public/ hygiene ----------
pub = ROOT / "public"
if pub.is_dir():
    allowed = {"favicon.ico", "favicon.svg", "assets", "manifest.json", "manifest.webmanifest", "robots.txt",
               "sw.js", "_headers", "_redirects"}
    for p in pub.iterdir():
        if p.name not in allowed and not p.name.startswith(("icon", "swe-worker")):
            warn(f"public/{p.name} — only favicon.ico, assets/ and host/PWA files belong at public root")

# ---------- report ----------
print(f"Stack: {STACK}")
for w in warnings: print(f"  ! {w}")
for e in errors:   print(f"  ✗ {e}")
if not errors and not warnings:
    print("Structure OK")
elif not errors:
    print(f"\n{len(warnings)} warning(s), no errors")
else:
    print(f"\n{len(errors)} error(s), {len(warnings)} warning(s)")
sys.exit(1 if errors else 0)
