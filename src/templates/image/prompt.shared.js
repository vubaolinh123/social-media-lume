/**
 * Shared prompt invariants for product-referenced image generation.
 */

function buildProductReferenceInvariants({ brand, postType = 'generic', includeFooterContact = true } = {}) {
  const address = brand?.address || '';
  const phone = brand?.phone || brand?.hotline || '';

  const logoPaletteGuide = {
    background: '#F0ECE9 (soft warm ivory)',
    primaryAccent: '#B08A8F (dusty rose mauve)',
    secondaryNeutral: '#A98B92 / #8F7A80 (muted mauve-taupe)',
  };

  const footerRules = includeFooterContact
    ? `
FOOTER CONTACT BLOCK (MANDATORY IN AI IMAGE):
- Add one footer contact block in the lower safe area, readable and clean.
- Footer must include EXACT text (no paraphrase, no omission):
  1) "${address}"
  2) "${phone}"
- Footer must appear exactly once (do not duplicate address/phone lines).
- Keep footer text style coherent with logo + QR visual cluster.
- If composition becomes crowded, reduce decorative elements first; never remove footer contact text.
`
    : `
FOOTER CONTACT BLOCK:
- Do NOT include address, phone, hotline, contact handle, or any footer contact text in the generated image.
- Keep lower safe area clean for minimal layout.
`;

  return `
MANDATORY PRODUCT FIDELITY RULES:
- The uploaded product photo is the single source of truth.
- Keep the SAME uploaded product identity.
- Preserve core product cues: silhouette, packaging structure, texture, label text/logo marks, and material finish.
- DO NOT invent, replace, or redesign the product into a different item.

COLOR + STYLE ADAPTATION RULES:
- Derive the primary palette from the uploaded product photo and its natural tones.
- Match layout mood to the source image context (light / neutral / dark are all allowed).
- DO NOT force an always-dark style.

LOGO HARMONY RULES (LUMÉ LASHES):
- The brand logo style is elegant, minimal, feminine luxury with muted mauve accents on warm ivory background.
- Keep colors harmonious with this logo palette: ${JSON.stringify(logoPaletteGuide)}.
- Avoid overly bright neon colors, harsh high-contrast blocks, overexposed highlights, and crushed dark shadows.
- Keep balanced tonal range: soft-to-medium contrast, premium editorial feel, not too flashy and not too gloomy.
- Typography and decorative elements should stay refined, clean, and compatible with the logo's current aesthetic language.

LAYOUT + FOOTER COHERENCE RULES:
- Keep product as hero element and maintain clear readability.
- Keep visual safe areas for logo and QR placement.

${footerRules}

POST TYPE CONTEXT:
- Current post type is ${postType}. Keep this post-type storytelling while preserving product identity.

LANGUAGE RULES (MANDATORY):
- ALL text rendered in the generated image MUST be in English.
- If user-provided text (title, content, service name, labels) is in Vietnamese or any non-English language, translate it to natural marketing English before rendering.
- Apply this to every visible text element: headline, subheadline, badge text, CTA text, labels, captions-on-image, and decorative words.
- Keep brand name "${brand?.name || ''}" exactly as provided.
- Keep footer contact values exactly as provided for address and phone lines.
- Do NOT render Vietnamese words or Vietnamese diacritics in image text.
`;
}

function buildRetryReinforcement(attempt) {
  return '';
}

module.exports = {
  buildProductReferenceInvariants,
  buildRetryReinforcement,
};
