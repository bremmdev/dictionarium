# Auth: one password, one cookie, one fact

There is one admin — the person editing the dictionary — so there is no users table, no sessions table, no registration, no password reset. The entire system answers a single question:

> Does this caller know `ADMIN_PASSWORD`?

The answer is sealed into a cookie and reduced to one boolean, `isAdmin`. Everything below is the consequence of keeping it that small.

| File                       | Responsibility                                                        |
| -------------------------- | --------------------------------------------------------------------- |
| `src/server/session.ts`    | Opens the sealed cookie. The only module that touches `useSession`.    |
| `src/server/auth.ts`       | `login`, `logout`, `getIsAdmin`, `authMiddleware`, and guarded server fns. |
| `src/routes/login.tsx`     | The form. One password field, no username.                            |
| `src/routes/__root.tsx`    | Reads the session once per page load, for the header.                 |
| `src/components/Header.tsx`| Shows `exī` and performs the logout.                                  |
| `src/routes/admin.tsx`     | The one guarded page.                                                 |

## Two secrets

| Variable               | What it is                                    | If it is missing                                          |
| ---------------------- | --------------------------------------------- | --------------------------------------------------------- |
| `ADMIN_PASSWORD`       | Compared against what the form submits.       | Every login fails — an empty expected value is rejected before the compare. |
| `ADMIN_SESSION_SECRET` | The key the cookie is sealed with. ≥ 32 chars. | `useAppSession()` throws on first use, loudly, by design.  |

Both are read through `process.env` in server-only modules. Neither is `VITE_`-prefixed, so neither can reach the browser bundle. **Rotating `ADMIN_SESSION_SECRET` invalidates every existing cookie** — that is the only "log out everywhere" this design has, and it is enough for one user.

## The cookie is the session

```ts
useSession<AdminSession>({
	name: "dictionarium-session",
	password: process.env.ADMIN_SESSION_SECRET,
	cookie: { secure: NODE_ENV === "production", sameSite: "lax", httpOnly: true },
});
```

The cookie is not an ID pointing at server state; it *is* the state, sealed so the client can neither read nor forge it. There is nothing to expire, evict, or clean up, and a restart does not sign anyone out.

- `httpOnly` — no script can read it, so an XSS bug cannot exfiltrate the session.
- `sameSite: "lax"` — the cookie is not sent on cross-site POSTs, which is what stops another origin driving the mutating server functions on the admin's behalf. This is the CSRF story; there is no token.
- `secure` only in production, because dev is plain `http://localhost`.

`AdminSession` is typed `{ isAdmin: true }` — only the true case exists. There is no `isAdmin: false` to store; not being an admin is the absence of the fact. That is why every read is written `session.data.isAdmin === true` rather than trusting a possibly-undefined field.

## Comparing the password

`secretMatches` uses `timingSafeEqual`, so a wrong password cannot be discovered one byte at a time by measuring how long the rejection took. The length check needs care:

```ts
if (a.length !== b.length) {
	timingSafeEqual(a, a); // burn an equivalent comparison
	return false;
}
```

`timingSafeEqual` throws on a length mismatch, and returning early on that throw would leak the length through timing — the exact thing the function exists to prevent. So a comparison of equivalent cost runs first, then the answer is no.

## The boundary: guards are UX, middleware is the gate

This is the rule the whole design turns on:

> A route guard protects a **page**. It does not protect **data**.

`createServerFn` compiles to an RPC endpoint reachable by its own URL with its own HTTP method. Nobody has to load `/admin` to call `adminStats` — they can hit the endpoint directly. So:

- **Every server function that touches admin data carries `authMiddleware`.** That middleware reads the session and throws `401` before the handler runs. `adminStats` is the worked example.
- **`beforeLoad` on `/admin` exists only so an anonymous visitor gets the login form instead of a raw 401.** It is a courtesy, not a control.

Adding a new admin server function means adding `.middleware([authMiddleware])`. Forgetting it publishes the data, and no amount of route guarding will catch that.

## Why `getIsAdmin` exists

`beforeLoad` and `loader` are *isomorphic* — they run on the server for a document request and **in the browser** for a client-side navigation. So a route cannot read the cookie itself. Importing the session module into a route file fails the production build outright:

```
[import-protection] Import denied in client environment
  Denied by specifier pattern: @tanstack/react-start/server
  Trace: src/routeTree.gen.ts → src/routes/admin.tsx → src/server/session.ts
```

`getIsAdmin` is the bridge: a `GET` server function returning one boolean, callable from either side. Routes ask it; they never open the session.

## Where the answer is cached

The session changes at exactly two moments — login and logout — and the app controls both. That makes it cacheable, which matters because the naïve placement is expensive:

| Placement                            | Cost                                                                 |
| ------------------------------------ | -------------------------------------------------------------------- |
| Root `beforeLoad` (rejected)         | `beforeLoad` ignores `staleTime`, so **every** navigation pays an RPC before it renders — including each search submit on `/`. |
| Root `loader` + `staleTime: Infinity` | One call per page load, resolved during SSR on a document request.    |

So the root route uses a loader, the shell reads it with `useLoaderData()`, and `Header` takes `isAdmin` as a prop. `/admin` does **not** read that cached value — it calls `getIsAdmin()` in its own `beforeLoad`, so the one page whose behaviour turns on the answer gets a fresh one, and the rest of the app pays nothing.

The cache has one requirement: **login and logout must call `router.invalidate()`**, or the header keeps rendering the previous state. Both do.

## The flows

Logging in:

```
/login form submit
  ↓  login({ data: password })     POST — throws on a bad password
  ↓  session.update({ isAdmin })   Set-Cookie, sealed
  ↓  router.invalidate()           root loader re-runs; header gains exī
  ↓  navigate({ to: "/admin" })
```

Logging out, from anywhere:

```
exī click
  ↓  logout()                      POST — session.clear()
  ↓  navigate({ to: "/" })         leave /admin before its guard notices
  ↓  router.invalidate()           root loader re-runs; header loses exī
```

The navigation comes before the invalidation on purpose. Invalidating while still on `/admin` would re-run that route's guard and bounce the user to `/login`, which is a confusing place to land after choosing to log out.

Arriving at `/admin` directly:

```
GET /admin
  ↓  beforeLoad → getIsAdmin()     false → 307 to /login
  ↓  loader     → adminStats()     authMiddleware re-checks; 401 if forged
  ↓  component
```

Note the double check. The guard is for the human; the middleware is for the endpoint.

## Failure messages say nothing

`login` throws a bare `Error` on failure, and the form does not surface it — it shows a fixed line: *Nōn licet. That password is not right.* There is one account and its name is not a secret, so enumeration is not the concern; the point is simply that no server-side detail (missing env var, malformed input, thrown stack) reaches the page. The only thing a visitor can act on is the password.

## Gotchas

- **A new admin server function needs `authMiddleware` explicitly.** Nothing infers it from the route it happens to be called from.
- **Never import `#/server/session` from a route or component.** The build fails with the import-protection error above. Go through a server function.
- **`staleTime: Infinity` means the header trusts its answer for the life of the page.** If the cookie is cleared in another tab, `exī` keeps showing until a reload or the next `invalidate()`. Harmless — the middleware still refuses the data — but it is why the header is not a security surface.
- **`useAppSession()` throws when `ADMIN_SESSION_SECRET` is short or unset.** In dev that surfaces as a failing request, not a boot error, because it is checked on use.
- **The dev and production cookies differ.** `secure` is off in dev, so a cookie set on `localhost` will not be sent to an HTTPS deployment, and vice versa.
