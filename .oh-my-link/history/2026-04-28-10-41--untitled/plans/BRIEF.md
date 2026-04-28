# BRIEF: Migrate Facebook & Instagram Posting from Graph API to Blotato API

## Summary

The project currently posts to Facebook and Instagram using the Facebook Graph API (v21.0) via two service files (`facebook.service.js` and `instagram.service.js`). Both services use a single `FACEBOOK_PAGE_ACCESS_TOKEN` to authenticate, auto-discover Page/Account IDs at runtime, then call `https://graph.facebook.com/v21.0/...` endpoints to upload photos, videos, and Instagram media containers. The migration replaces these Graph API calls with Blotato API calls (`https://backend.blotato.com/v2`) using a static API key and pre-configured account IDs stored in `.env`, eliminating the token-based runtime discovery entirely.

---

## Blotato API Reference

- **Base URL:** `https://backend.blotato.com/v2`
- **Auth header:** `blotato-api-key: <BLOTATO_API_KEY>`
- **Post to Facebook:** `POST /posts` with body `{ "post": { "text": "...", "accountId": "<BLOTATO_FB_ACCOUNT_ID>" }, "mediaUrls": ["<url>"] }`
- **Post to Instagram:** `POST /posts` with body `{ "post": { "text": "...", "accountId": "<BLOTATO_IG_ACCOUNT_ID>" }, "mediaUrls": ["<url>"] }`
- **Upload media:** `POST /media` (multipart/form-data) → returns `{ url: "..." }` public URL for use in posts

---

## Affected Files

| File | Reason |
|------|--------|
| `src/services/facebook.service.js` | **Full rewrite** — replace all Graph API calls with Blotato `/media` upload + `/posts` publish |
| `src/services/instagram.service.js` | **Full rewrite** — replace Graph API container/publish flow with single Blotato `/posts` call |
| `src/config/index.js` | **Add blotato config block** reading from env vars (`BLOTATO_API_KEY`, `BLOTATO_FB_ACCOUNT_ID`, `BLOTATO_FB_PAGE_ID`, `BLOTATO_IG_ACCOUNT_ID`) |
| `src/services/runtime-config.service.js` | **Add blotato section** to `buildRuntimeConfig()` and `buildMaskedSettings()` |
| `src/controllers/post.controller.js` | **Update service status checks** — `facebook`/`instagram` active when Blotato key is set (not FB page token) |
| `src/controllers/gallery.controller.js` | **Update service status checks** — same as post.controller; also remove Graph API image URL construction (`graph.facebook.com/${postId}/picture`) |
| `src/controllers/settings.controller.js` | **Update `testConnections()`** — test Blotato connectivity instead of `fetchPageId` / `fetchInstagramAccountId` |
| `.env` | **Add 4 new vars** (see section below) |

---

## Suggested Approach

1. **Rewrite the two service files** (`facebook.service.js`, `instagram.service.js`) so each exposes the same function signatures (`postToPage`, `postVideoToPage`, `postToInstagram`, `postReelToInstagram`) but internally calls the Blotato API — upload the local file to `POST /media` first to get a public URL, then call `POST /posts` with the appropriate `accountId`. This keeps all callers (controllers) unchanged except for removing the `fetchPageId`/`fetchInstagramAccountId` helper usage.

2. **Update config and runtime-config** to carry Blotato credentials alongside existing config, then update the `getServiceStatus` / `getServiceStatusFromRuntime` checks in controllers to gate on `blotato.apiKey` being present instead of `facebook.pageAccessToken`.

3. **Fix the Instagram image URL** in `gallery.controller.js` line 224 (`https://graph.facebook.com/${facebookPostId}/picture`) — with Blotato, Instagram posts directly from its own media upload so this coupling to the Facebook post ID is removed entirely.

---

## .env Additions

Add the following to `.env` (values pre-filled from credentials provided):

```dotenv
# Blotato API
BLOTATO_API_KEY=blt_VrjE6lzAMLJR4+LLK+ju8q1e3RLi68pk4i066KKwI/E=
BLOTATO_FB_ACCOUNT_ID=28121
BLOTATO_FB_PAGE_ID=991400507395903
BLOTATO_IG_ACCOUNT_ID=44007
```

---

## Acceptance Criteria

- [ ] `.env` contains all 4 `BLOTATO_*` variables with correct values
- [ ] `src/config/index.js` exposes a `blotato` config block reading from those env vars
- [ ] `src/services/facebook.service.js` posts images via Blotato API (no `graph.facebook.com` calls remain)
- [ ] `src/services/facebook.service.js` posts videos via Blotato API
- [ ] `src/services/instagram.service.js` posts images via Blotato API (no Graph API container/publish flow)
- [ ] `src/services/instagram.service.js` posts reels/video via Blotato API
- [ ] `src/controllers/post.controller.js` — service status for `facebook` and `instagram` gates on `blotato.apiKey`
- [ ] `src/controllers/gallery.controller.js` — `graph.facebook.com` image URL reference removed; Instagram posts independently
- [ ] `src/controllers/settings.controller.js` — `testConnections()` uses Blotato health check instead of Graph API
- [ ] Old `FACEBOOK_PAGE_ACCESS_TOKEN` dependency removed from all posting flows (settings/UI can remain for backward compat)
- [ ] Manual test: approve a post → Facebook published via Blotato, Instagram published via Blotato
