# BRIEF: Caption Language — Switch to English

## Summary

Caption language is controlled entirely inside the `buildCaptionPrompt()` function in each of the 11 template files under `src/templates/`. Every template contains a Vietnamese instruction block (e.g., `"Hãy viết caption..."`, `"tiếng Việt"`) that tells Gemini to write in Vietnamese. The fix is to rewrite each `buildCaptionPrompt()` to instruct the model in English and to produce English output. Additionally, `getFallbackCaption()` in `src/services/gemini.service.js` contains hardcoded Vietnamese text for all 11 post types and must be translated to English. The `shortCaption` default `"Nối mi chuyên nghiệp"` in that same function also needs updating.

---

## Affected Files

| File | Reason |
|------|--------|
| `src/templates/beforeAfter.template.js` | `buildCaptionPrompt()` instructs Gemini in Vietnamese |
| `src/templates/review.template.js` | same |
| `src/templates/bts.template.js` | same |
| `src/templates/promotion.template.js` | same |
| `src/templates/spotlight.template.js` | same |
| `src/templates/tutorial.template.js` | same |
| `src/templates/newArrival.template.js` | same |
| `src/templates/seasonal.template.js` | same |
| `src/templates/tips.template.js` | same |
| `src/templates/portfolio.template.js` | same |
| `src/templates/aiRandom.template.js` | same |
| `src/services/gemini.service.js` | `getFallbackCaption()` has hardcoded Vietnamese strings; `shortCaption` default is Vietnamese |

**Total: 12 files** — all edits are mechanical text replacements in prompt strings, no logic changes.

---

## Suggested Approach

1. In each template's `buildCaptionPrompt()`, replace the Vietnamese instruction header (`"Bạn là chuyên gia content..."`, `"Hãy viết caption..."`) with an equivalent English instruction, and change the requirement line from `"150-250 từ, tiếng Việt"` to `"150-250 words, in English"`. Keep all hashtags, brand tokens (`brand.name`, `brand.phone`, `brand.address`), and the JSON output format unchanged.
2. In `src/services/gemini.service.js` `getFallbackCaption()`, translate the body text of each template string from Vietnamese to English — keeping emoji, brand info, and hashtags as-is.
3. Update `shortCaption` default from `"Nối mi chuyên nghiệp"` to `"Professional Lash Extensions"`.

No test files currently assert Vietnamese caption content, so existing tests will pass without modification.

---

## Acceptance Criteria

- [ ] All 11 `buildCaptionPrompt()` functions instruct Gemini to write the caption in English
- [ ] The word-count requirement line reads "in English" (not "tiếng Việt") in every template
- [ ] Fallback captions in `getFallbackCaption()` are in English
- [ ] `shortCaption` default is in English
- [ ] Brand info (name, phone, address, hashtags like `#noimi`) preserved as-is
- [ ] All existing tests pass (`test/ai/prompt-policy.test.js` and others)

---

## Complexity

Straightforward — mechanical text edit across 12 files, no structural changes needed.
