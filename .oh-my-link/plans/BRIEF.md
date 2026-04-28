# BRIEF: Instagram Blotato Migration Bugfixes

## Summary

Two issues remain after the FB/IG Graph API → Blotato migration. **Issue A (already resolved):** `instagram.service.js` is confirmed to use the correct `/media/uploads` presigned upload flow (POST `/media/uploads` → PUT presignedUrl → use returned `publicUrl`), identical to `facebook.service.js`. The "multipart/form-data" error from Run 1 was almost certainly a stale server process — no code change needed for Issue A. **Issue B (active bug):** Every Gemini caption template injects 6–7 hashtags directly into the `caption` string (e.g., `beforeAfter` has 7: `#Brand #noimi #beforeafter #eyelashes #BrandLower #lammi #lashextensions`), and Gemini may add additional ones. Blotato enforces a hard ≤5-hashtag limit for Instagram. Since `post.caption` is passed verbatim to both `postToInstagram` and `postReelToInstagram`, a `truncateHashtagsForInstagram` helper must be added and applied on the IG path only before the Blotato API call.

---

## Affected Files

| File | Reason |
|------|--------|
| `src/services/instagram.service.js` | Add `truncateHashtagsForInstagram(text, max=5)` helper and call it inside both `postToInstagram` and `postReelToInstagram` before passing `caption` to the Blotato payload |
| `src/services/facebook.service.js` | **Not affected** — FB path must remain unchanged (no hashtag trimming) |
| `src/controllers/post.controller.js` | Caller passes `post.caption` directly — no change needed if fix is in the service layer |
| `src/controllers/gallery.controller.js` | Caller passes `post.caption` directly — no change needed if fix is in the service layer |

---

## Suggested Approach

### Issue A — Instagram multipart upload (RESOLVED, no code change needed)

`instagram.service.js` already contains the correct two-step presigned upload:

```js
// uploadMedia() in instagram.service.js — already correct
const presignRes = await axios.post(`${blotatoCfg.baseUrl}/media/uploads`, { filename }, ...);
const { presignedUrl, publicUrl } = presignRes.data;
await axios.put(presignedUrl, fileBuffer, { headers: { 'Content-Type': getMimeType(filePath) } });
return publicUrl;
```

Action: restart the Node server to clear any cached old module. Verify Run 1 error disappears.

### Issue B — IG hashtag limit (≤5 required by Blotato/Instagram)

Add a pure helper function in `instagram.service.js` and apply it to both posting functions:

```js
/**
 * Trim caption to at most `max` hashtags for Instagram's constraint.
 * Preserves the non-hashtag text. Extra hashtags are dropped silently.
 */
function truncateHashtagsForInstagram(text, max = 5) {
  if (!text) return text;
  const tokens = text.split(/(\s+)/);
  let hashtagCount = 0;
  const result = tokens.filter(token => {
    if (/^#\S+/.test(token)) {
      if (hashtagCount >= max) return false;
      hashtagCount++;
    }
    return true;
  });
  return result.join('').trim();
}
```

Apply inside **both** `postToInstagram` and `postReelToInstagram`, right before building the Blotato payload:

```js
// inside postToInstagram / postReelToInstagram, before axios.post(...)
const igCaption = truncateHashtagsForInstagram(caption);
// then use igCaption instead of caption in the payload:
content: { text: igCaption, ... }
```

The `caption` parameter itself is never mutated, so Facebook callers remain unaffected.

**Why in the service layer:** Both call-sites (`post.controller.js` line 289 and `gallery.controller.js` line 200) pass `post.caption` directly without pre-processing. Centralizing the trim in `instagram.service.js` means every future caller gets the fix automatically without needing to remember to apply it at the controller level.

---

## Acceptance Criteria

- [ ] `instagram.service.js` confirmed to use `/media/uploads` presigned flow (no multipart) — **already true, just needs server restart**
- [ ] `truncateHashtagsForInstagram(text, max=5)` helper added to `instagram.service.js`
- [ ] Helper called in both `postToInstagram` and `postReelToInstagram` before building the Blotato payload
- [ ] IG captions trimmed to ≤5 hashtags before sending to Blotato
- [ ] FB captions unaffected — `facebook.service.js` has no hashtag trimming
- [ ] Existing tests pass

---

## Complexity Assessment

**Straightforward — 1 file change only** (`instagram.service.js`).  
~15 lines added: 1 helper function + 2 one-liner call sites inside the two existing posting functions.  
No schema changes, no new dependencies, no controller changes required.
