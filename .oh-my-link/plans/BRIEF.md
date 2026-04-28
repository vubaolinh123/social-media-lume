# BRIEF: Remove FB/IG Token Fields from Settings UI

## Summary

This is a focused UI + controller cleanup (3 files, ~10 line changes total). The goal is to remove the
`facebookPageAccessToken` and `instagramAccessToken` inputs from the "Social Tokens" section in
`views/settings.ejs`, since Blotato now owns FB/IG credentials via `.env`. The Telegram inputs (bot
token + chat ID) must remain untouched. On the backend, `updateSettings()` in
`settings.controller.js` currently reads and writes these two fields; those lines should be removed
so the UI no longer drives any writes. `buildMaskedSettings()` in `runtime-config.service.js` still
exposes both fields as masked placeholders fed to the template — these should also be removed to
eliminate dead data flowing to the view. The Mongoose schema fields in `user.model.js` can be kept
as-is for backward compatibility (old encrypted values won't be overwritten). `testConnections()`,
`post.controller.js`, and `gallery.controller.js` already gate FB/IG on `blotato.apiKey` — no
changes needed there. Complexity: LOW (3 files).

## Affected Files

| File | Reason |
|---|---|
| `views/settings.ejs` | Remove 2 `<div>` blocks: FB Page Access Token input (lines 39-42) + IG Access Token input (lines 43-46) |
| `src/controllers/settings.controller.js` | Remove `nextFb`/`nextIg` vars (lines 40-41) and their `facebookPageAccessToken`/`instagramAccessToken` writes in `payload.settings.social` (lines 52-53) |
| `src/services/runtime-config.service.js` | Remove `facebookPageAccessToken` and `instagramAccessToken` from `buildMaskedSettings()` return (lines 54-55); `buildRuntimeConfig()` `facebook`/`instagram` blocks can stay for now (they are harmless dead paths) |

## Suggested Approach

(a) In `views/settings.ejs`, delete the two `<div>` wrappers (lines 39-46) that render the FB and
IG password inputs — the Telegram `<div>` blocks (lines 47-55) and section heading stay. (b) In
`updateSettings()`, drop the `nextFb`/`nextIg` variables and their corresponding keys from the
`payload.settings.social` object; the DB field values already in the document are simply left alone
(no explicit preservation needed since we stop touching them entirely). (c) In
`buildMaskedSettings()`, remove the two social keys so the template no longer receives these
placeholders — this keeps the masked-settings object in sync with what the form actually renders.

## Acceptance Criteria

- [ ] `settings.ejs`: Facebook Page Access Token `<div>` + `<input>` removed
- [ ] `settings.ejs`: Instagram Access Token `<div>` + `<input>` removed
- [ ] `settings.ejs`: Telegram Bot Token + Chat ID inputs preserved intact
- [ ] `settings.controller.js`: `nextFb` / `nextIg` vars removed from `updateSettings()`
- [ ] `settings.controller.js`: `facebookPageAccessToken` / `instagramAccessToken` keys removed from `payload.settings.social`
- [ ] `runtime-config.service.js` `buildMaskedSettings()`: no longer exposes `facebookPageAccessToken` / `instagramAccessToken`
- [ ] No regressions: posting still works via Blotato (gates on `config.blotato.apiKey`, not DB tokens)
- [ ] Test connections still reports FB/IG status correctly (already gated on `blotato.apiKey`)
