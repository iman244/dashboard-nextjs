---
target: post-login transition (auth flow)
total_score: 14
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 3
timestamp: 2026-09-05T00-21-24Z
slug: src-app-locale-auth-flow-authentication
---
Method: dual-agent (A: a8c7ab7e3d025acdc · B: a7cf354693f3fba2b)

# Critique — the post-login transition

Target: the moment between "user clicks Sign in with correct credentials" and "user is looking at the console".
Files: (auth-flow)/authentication/layout.tsx, _side-effects/on-login.ts, (public)/auth-authenticated/page.tsx,
(public)/console-unauthenticate/page.tsx, (authenticated)/layout.tsx, _auth/provider.tsx, app/loading.tsx, app/paths.ts

## Measured frame-by-frame (A stubbed the JWT endpoints, 300ms latency)

| t | Screen |
|---|---|
| 0ms | Button -> pending, spinner in slot. Card/orbs/toggle intact. |
| 392ms | HARD CUT. Card, tray, orbs, theme toggle all vanish in one paint. Two centred <p> + 48x36 button on bare bg. |
| 392-3513ms | 3.12s frozen. No spinner, no progress, no motion. URL still /fa/authentication, title still "Authentication". |
| 3513ms | Second hard cut -> /fa/console, which renders <div></div>. |

~3.5s click-to-app; 3.12s is a hard-coded setTimeout.

## Root cause: the correct code is unreachable

Two redirect mechanisms: on-login.ts:24-34 (no delay, correct) and layout.tsx:18-29 (3000ms).
AuthenticateUser flips authStatus; on that same commit the parent layout stops rendering {children},
so Client + useOnLogin unmount in the very commit that flips the state. The effect never observes Authenticated.
Empirically: on-login.ts's console.log never fires; the layout's fires 7x (layout.tsx:36 is a console.log
inside the render body — an impure render).

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Says it in words, then 3.12s frozen; URL and title still read "Authentication" |
| 2 | Match System / Real World | 2 | "the desired page" names a page never asked for; EN button says "Redirect", a server's verb |
| 3 | User Control and Freedom | 1 | Back is trapped: Back -> interstitial -> force-pushed forward 3.1s later, indefinitely (measured) |
| 4 | Consistency and Standards | 1 | Twins disagree (size default vs lg; different button voice) and diverge from the sign-in card |
| 5 | Error Prevention | 2 | jwt_verify failure logs and stays in Loading forever — bare spinner, no exit |
| 6 | Recognition Rather Than Recall | 2 | No username, no destination name, no branding |
| 7 | Flexibility and Efficiency | 1 | 3000ms tax on the most-repeated action; nothing focused so Enter does nothing |
| 8 | Aesthetic and Minimalist Design | 1 | Minimal as in unstyled, not restrained |
| 9 | Error Recovery | 1 | The twin error screen never says why (expired? logged out? never signed in?) |
| 10 | Help and Documentation | 1 | Only "help" is a sentence telling you to click a button |
| Total | | 14/40 | Poor |

## Design specificity verdict

Category-interchangeable, aggressively so. Damning because of the neighbour: the sign-in card has concentric
radii (2rem tray / 1.625rem plate), a three-layer shadow stack with separate dark values, color-mix(in oklab)
orbs held to the brand hue, an RTL-aware arrow, a stable async slot. Its successor 400ms later is
"flex flex-col items-center! justify-center gap-4 h-screen mx-auto" — two <p>s and a default button.

Deterministic scan: detector returned [] / exit 0 on all four files — NO SIGNAL, not a clean bill.
It runs DEGRADED here (node_modules missing; "findings are an undercount"), and its TSX path missed a control
file containing Comic Sans, transition:all, img with no alt, and 11px #777-on-#888. Same patterns in HTML did fire.
All findings above are browser-measured.

## What's working

1. The state machine is honest — AuthenticationStatus is a real 3-member enum and every consumer branches on
   all three including Loading. No flash-of-wrong-content on any path. The fixes are therefore small.
2. Deep-link intent survives the round trip (getAuthRedirectUrl encodes it, both ends read it back).
3. RTL is genuinely clean here — html dir server-resolved, Direction.Provider at root, no physical-direction
   utilities in either file.

## Priority issues

[P0] ?next= is an unvalidated open redirect; the interstitial is the delivery vehicle.
  searchParams.get("next") goes verbatim into router.push() and <Link href> with no same-origin check.
  Measured end-to-end: /fa/authentication?next=https%3A%2F%2Fexample.com%2Fsession-expired -> successful
  sign-in -> t=3147ms the browser lands on example.com. Automatic, no click. Trust-laundering: real domain,
  real card, real success, and the copy pre-authorises the jump.
  Fix: safeNext(v) = v && v.startsWith("/") && !v.startsWith("//") ? v : AppRoutes.CONSOLE, in paths.ts,
  called from layout.tsx, auth-authenticated/page.tsx, on-login.ts.  -> /impeccable harden

[P0] Delete the 3000ms timer. 89% of the transition, every sign-in, buying nothing — the zero-delay
  implementation already exists and is unreachable. (authenticated)/layout.tsx:18-21 has the identical stall
  on logout. Fix: navigate on the tick the status flips; better, delete the interstitial branch entirely.

[P1] router.push traps the Back button. Measured: from /fa/console, Back -> interstitial -> force-navigated
  forward 3.1s later, repeatable indefinitely. Use replace in both layouts.

[P1] The transition is silent and focus-less for assistive tech. At t=392ms activeElement is BODY (focus was on
  the submit button, the button was destroyed, nothing caught it). Zero headings on the page. Zero
  application-authored live regions (only match is Sonner's empty toaster, outside the interstitial). URL never
  changes so Next's route announcer stays silent. SR user hears nothing for 3.1s then is teleported.
  Related: Spinner announces the hardcoded English "Loading" on a Persian-primary product.

[P1] Broken on mobile, undesigned everywhere. At 390x844 both paragraphs are x:0 width:390 — zero gutter
  (mx-auto on a full-width flex column is a no-op; no max-w-*, no px-*). Button 47.9x36 — under 44px in both
  directions and the only interactive element. radius 8px vs the card's pill and 26px plate. h-screen where the
  sign-in main correctly uses min-h-dvh. No card, no orbs, no theme toggle — the toggle appears, disappears and
  reappears within 3.5s.

[P2] Two permanent dead-ends. (a) jwt_verify failing calls console.error and returns; authStatus stays Loading
  forever on a bare 32px spinner with no text, retry or sign-out. (b) Both interstitials live in (public)/ and
  are imported as components, so /fa/auth-authenticated is a publicly routable page with no redirect effect —
  an anonymous visitor is told they're authenticated and left there. Crawlable and indexable.

## Persona red flags

Clinical staff (daily): 3s x ~10 sign-ins/week ~= 26 min/year/user staring at a static screen; they learn the
  pixel position of the escape button and race it. Nothing focused so muscle-memory Enter does nothing.
  Destination is <div></div>.
Screen-reader user: focus dropped to BODY, no headings, no live region, route announcer silenced. 3.1s of
  silence after submitting credentials, then a silent teleport. Compliance problem on a clinical system.
Mobile user: text touching both bezels, 48x36 tap target that the copy instructs you to press, chrome
  flickering in and out three times in 3.5s.

## Minor observations

- src/settings.ts:20 — module-scope console.log dumping DJANGO_ADDRESS, DJANGO_API_PATH,
  AUTHORIZATION_TOKEN_NAME and the token keys into every visitor's console on every page load. Both agents saw it.
- "unauthenticateUser called" logs 3x on a cold load; useLoadToken's effect depends on a fresh object literal
  each render, and each call runs queryClient.clear().
- The three !important modifiers are provably unnecessary — B dumped every text-align rule in every loaded
  stylesheet; nothing targets p or the container. console-unauthenticate already uses plain items-center.
- Sign-in inputs lack autocomplete="username" / "current-password" (Chrome warns; password managers won't autofill).
- No motion at all — three hard cuts. A 150ms crossfade would remove most of the "did it break?" reaction at 392ms.
- Copy: the two twin buttons use different grammatical forms for the same role. "the desired page" is a
  placeholder for a name nextPath already holds. EN "Redirect" is a system verb.
- Contrast is fine: 8.88 / 7.11 / 5.93 light, better in dark. All AA and AAA. Not a defect.

## Recommendation

It is a debugging artifact that shipped: three seconds of "did the redirect fire?" reassurance aimed at a
developer, left in the user's path. The better UX splits the two cases the code conflates:
  1. Just signed in from this form -> no interstitial. Button stays pending; navigate on the same tick.
  2. Arrived already authenticated -> router.replace immediately, showing at most the existing Loading.
That deletes the screen rather than restyling it, and takes the 3s, the Back trap, the focus loss, the mobile
breakage and the silent announcement with it.

## Questions to consider

- If you deleted both interstitials tomorrow and navigated on the same tick, name one thing that breaks.
- The sign-in card got concentric radii, oklab colour-mixing and load-bearing comments. The screen 400ms later
  got "h-screen mx-auto" and two <p>s. Where does the team believe the product ends?
- You make the user wait 3.12s to be told they'll be taken to "the desired page", then take them to a page that
  renders <div></div>. Which is the actual bug?
