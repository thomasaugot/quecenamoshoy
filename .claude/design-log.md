# Design log — what was tried, and what Thomas said

Read this BEFORE any design work. Append after every attempt, accepted or not.

## 2026-10-10 — Logo, attempt 1 — REJECTED ("wtf is this shit")
- Rounded-square app icon, kitchen-green ground, cream plate seen from above, a terracotta
  Spanish "¿" drawn as a stroke of sauce on the plate, its dot a cherry tomato with a green stalk.
- Flat vector, centred, emoji-like.
- Likely why: reads as a generic food-app icon / clip art; childish (tomato with a leaf);
  centred mark on a coloured square is the default app-icon template; the hook looked like a
  worm/fishhook. Nothing of the actual design language (pinned photos, handwriting, serif) in it.
- Next attempt must NOT be: a plate icon, a centred glyph on a flat square, cartoon food.

## 2026-10-10 — Logo, attempt 2 — NOT SHOWN (self-rejected)
- Three hand-drawn SVG directions: lifted cloche with a "?" of steam, terracotta cocotte with
  steam, fork with a spaghetti strand curling into "?". All read as flat clip art; geometry off.
- Lesson: hand-coded SVG paths cannot reach logo quality here. Get a generated/drawn image
  (image model or a designer) from a precise art-direction prompt, then vectorise and integrate.
- Thomas: "text isn't visual" — he wants a pictorial mark, not a wordmark.

## 2026-10-10 — Logo, attempts 3–4 (Gemini 3 Pro Image, 6 images, ~€0.80) — STOPPED by Thomas
- 3: carbonara fork as editorial cookbook illustration → "illustrations, certainly not logos".
- 4: flat logo marks (fork + spaghetti strand forming a "?") → "why do you keep putting a question mark".
- He likes: the FORK with SPAGHETTI CARBONARA (his all-time favourite). Wants a real logo mark, not an illustration.
- NEVER again: a question mark ("?" / "¿") in the logo.
- Do not spend his Gemini credits on more attempts without asking first.

## 2026-10-10 — Logo, attempt 5 — IDEA LIKED ("the idea is great")
- Animated cloche (src/components/ui/Cloche.tsx): terracotta dome, ink knob and plate, lid lifts
  and reveals a different hand-drawn SVG dish each time (carbonara, burger, salad, quiche).
- Thomas's rules for it: NO AI generation, NO photos — everything drawn in SVG; it's a logo.
- Fixed after feedback: lid opens on the LEFT hinge; dishes sit ON the plate (plate drawn with
  rim + foot, dishes overlap it), never floating.

## 2026-10-10 — Cloche dishes, detail pass — REJECTED ("not realistic enough", "bad Paint-drawn")
- Added strands, sesame seeds, cheese, tomato halves, crimped crust, a toasted-gold token.
- Lesson: hand-coded SVG food hits a ceiling fast; more detail made it look amateur, not realistic.
- The cloche + reveal idea is still liked. The DISH DRAWINGS are the problem.

## 2026-10-10 — Cloche dishes, attempt 3 — Fluent Emoji (pending feedback)
- Thomas: "get icons if it looks better", refuses badly drawn food. Also: dishes floated above the plate.
- Dishes are now Microsoft Fluent Emoji Flat SVGs (MIT): spaghetti, burger, salad, paella, in
  public/assets/images/logo/. Each placed so its lowest pixel sits on the rim (measured bbox).
- Unused stop-* gradient utilities removed from base.css.
- Fluent Emoji — REJECTED ("it looks awful"). Likely: emoji style (grey bowls, purple pan, 3/4 views)
  clashed with the flat two-colour cloche.

## 2026-10-10 — Cloche dishes, attempt 4 — Phosphor Fill icons in ink (pending)
- Bowl, burger, pizza, cooking pot; single colour (text/ink) like plate and knob.

## 2026-10-10 — attempt 5 — plate in perspective (pending)
- Thomas: icons "face us", food must be IN the plate. Plate redrawn as an ellipse seen from above;
  dish sits mid-well on a shadow, front lip drawn over its base; lid bottom follows the rim curve.
- Pizza (slice standing up) rejected → fish, which lies flat on a plate.
- Each dish now its own palette colour: bowl green, burger gold, fish sage, pot terracotta.
- Lid covered too much plate → lid narrowed to the well (rx 38), rim visible around it.
- 2026-10-10: cloche placed in navbar (h-10), PageLoader, PageLoading, login intro; favicon = closed cloche.
- APPROVED ("perfect"). zzcloche preview deleted.
