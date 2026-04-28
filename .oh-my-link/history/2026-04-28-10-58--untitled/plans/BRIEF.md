# BRIEF — Settings Cleanup + Caption Editing

## Section A — Settings UI Cleanup

### Context
`.env` defines: `BLOTATO_API_KEY`, `BLOTATO_FB_ACCOUNT_ID`, `BLOTATO_FB_PAGE_ID`, `BLOTATO_IG_ACCOUNT_ID`.
`runtime-config.service.js` reads blotato values **exclusively from `.env`** — no DB fallback, never written to DB.
The settings controller `updateSettings` never touches blotato fields.

### Field-by-Field Table

| UI Field | Input name | Backend source | Stored in DB? | Action |
|---|---|---|---|---|
| Gemini API Key | `geminiApiKey` | DB `settings.ai.apiKey` (encrypted) | YES | **Keep** |
| Facebook Page Access Token | `facebookPageAccessToken` | DB `settings.social.facebookPageAccessToken` (encrypted) | YES | **Keep** |
| Instagram Access Token | `instagramAccessToken` | DB `settings.social.instagramAccessToken` (encrypted) | YES | **Keep** |
| Telegram Bot Token | `telegramBotToken` | DB `settings.social.telegramBotToken` (encrypted) | YES | **Keep** |
| Telegram Chat ID | `telegramChatId` | DB `settings.social.telegramChatId` (plain) | YES | **Keep** |
| Brand Name/Tagline/Website/Address/Phone/Hotline | `brandName` etc. | DB `settings.brand.*` | YES | **Keep** |

### Verdict
All current settings UI fields are DB-only. **No UI field duplicates a `.env` value.**
Blotato fields are `.env`-only and are **already absent** from the settings UI.

### Real Cleanup Needed
`buildMaskedSettings()` in `runtime-config.service.js` currently returns a `blotato.apiKey` masked value.
This is never rendered in the UI but is sent to the client — it unnecessarily exposes that the key exists and its masked form.

**Action:** Remove `blotato` block from `buildMaskedSettings()` output.
**Optional:** Add a read-only info line in `views/settings.ejs` — "Blotato API: configured via .env" — so users understand the Blotato section is managed via environment variables, not the UI.

### Files to Change (Section A)

| File | Change |
|---|---|
| `src/services/runtime-config.service.js` | Remove `blotato: { apiKey: maskSecret(config.blotato.apiKey) }` from `buildMaskedSettings()` |
| `views/settings.ejs` | (Optional) Add static read-only notice about Blotato being configured via `.env` |

---

## Section B — Caption Editing Flow

### Current Flow
1. User uploads image → `POST /` → `createPost` saves a PostAsset (empty caption) and renders `views/preview.ejs`; image processing enqueues in background.
2. `preview.ejs` shows an **editable** `<textarea id="captionText">`. Once AI generation completes, `app.js` polls `/api/posts/:id/status` and fills in the AI-generated caption.
3. User can edit the textarea, then clicks "Duyệt & Đăng bài".
4. `app.js` reads `captionText.value` and sends `{ postId, caption }` to `POST /approve`.
5. `approvePost` in `post.controller.js` does `if (editedCaption) post.caption = editedCaption` before publishing.

**Caption editing already works on the preview/approve path — no change needed there.**

### Gap: Gallery Re-publish Flow
When user clicks "Đăng Facebook" / "Đăng Instagram" from the gallery card:
- `gallery.js` calls `POST /api/posts/:postId/publish/facebook` with **no body** — caption not sent.
- `gallery.controller.js` `publishFacebook`/`publishInstagram` use `post.caption` from DB directly — no override possible.
- The gallery card shows caption as plain text with no way to edit before re-publishing.

### Files Involved

| File | Role |
|---|---|
| `views/gallery.ejs` | Gallery card UI — plain-text caption, publish buttons |
| `public/js/gallery.js` | Handles button clicks, calls publish API with no body |
| `src/controllers/gallery.controller.js` | `publishFacebook` / `publishInstagram` — reads DB caption only |
| `src/routes/gallery.routes.js` | Routes (no change needed) |

### Proposed Change

1. **`views/gallery.ejs`** — Replace plain caption text with an editable `<textarea class="caption-edit">` pre-filled with `item.caption` in each article card's action area.

2. **`public/js/gallery.js`** — In both `btn-post-facebook` and `btn-post-instagram` click handlers, read:
   ```js
   const caption = btn.closest('article').querySelector('.caption-edit')?.value || '';
   ```
   Pass it in the `callApi` body: `callApi(url, 'POST', { caption })`.

3. **`src/controllers/gallery.controller.js`** — In both `publishFacebook` and `publishInstagram`:
   ```js
   const { caption: editedCaption } = req.body;
   if (editedCaption && editedCaption.trim()) {
     post.caption = editedCaption.trim();
   }
   await post.save(); // persist before publishing
   ```
   This mirrors the existing `approvePost` pattern exactly.

4. **Routes** — No change. Existing POST endpoints already accept a JSON body.

---

## Combined Acceptance Criteria

- [ ] `buildMaskedSettings()` no longer returns `blotato` block — no masked key sent to client
- [ ] Settings UI optionally shows read-only "Blotato: .env configured" notice
- [ ] Preview page caption textarea remains editable (already works — no change)
- [ ] Gallery card shows editable `<textarea class="caption-edit">` pre-filled with stored caption
- [ ] "Đăng Facebook" and "Đăng Instagram" in gallery send caption textarea value in request body
- [ ] `publishFacebook` and `publishInstagram` persist updated caption to DB before calling service
- [ ] If caption body is empty, existing `post.caption` from DB is used unchanged (no regression)

## Scope Assessment

Files to change: **4 core** (`runtime-config.service.js`, `gallery.ejs`, `gallery.js`, `gallery.controller.js`) + 1 optional (`settings.ejs`).
**Fits a single execution — no split needed.**
