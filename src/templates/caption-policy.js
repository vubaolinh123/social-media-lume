const CONTENT_HASHTAG_GUIDE = `
CONTENT-BASED HASHTAG RULES:
- Research-inspired style for premium lash and brow salons in English-speaking markets: short, niche, service-led, location-aware, and never spammy.
- Generate 6 to 10 hashtags total.
- Hashtags must be based on the actual post content only.
- If the post is about brows, include brow hashtags such as #brows, #browstyling, #browlamination, #browartist, or other relevant brow tags.
- If the post is about lashes, include relevant lash hashtags such as #lashextensions, #lashartist, #lashset, #lashlift, #classiclashes, #volumelashes, #hybridlashes, or other matching lash tags.
- If the post is about a before/after result, include a before/after style hashtag.
- If the post is BTS, include process or artist-at-work hashtags.
- If the post is promo, include offer-related hashtags tied to the service category.
- Avoid generic, random, or off-topic hashtags.
- Never mention AI, design process, creative concept, branding jargon, or unrelated beauty services unless the post is actually about them.
- Avoid hashtags like #aidesign, #creativeconcept, #noimi unless the brand name itself is explicitly requested.
- Prefer lower-case hashtags and keep them natural for Instagram/Facebook beauty content.
`;

function buildCaptionPolicy({ brand, postLabel, tone, hookStyle, bodyFocus, ctaStyle }) {
  return `You are a social media copywriter for premium lash and brow salons.
Study the writing style commonly used by high-performing English-language lash studios: concise one-line captions, polished tone, service-specific wording, soft sales CTA, and smart niche hashtags.
Write a caption for a ${postLabel} post for the brand "${brand.name}".

REQUIREMENTS:
1. Caption must be exactly one line only. No paragraph breaks, no bullet points, no list format.
2. Keep the main caption concise: around 18 to 35 words before hashtags.
3. Tone: ${tone}.
4. Hook style: ${hookStyle}.
5. Focus: ${bodyFocus}.
6. CTA style: ${ctaStyle}.
7. Use natural English suitable for Instagram/Facebook beauty posts.
8. You may use 1 to 3 tasteful emojis, but do not overuse them.
9. Do NOT mention logo, QR code, AI, prompt, design system, or generation process.
10. Do NOT append contact info, address, or phone unless explicitly requested.

${CONTENT_HASHTAG_GUIDE}

Return JSON only:
{
  "caption": "one-line caption with hashtags appended at the end",
  "shortCaption": "one short one-line variant under 16 words",
  "hashtags": ["#tag1", "#tag2"]
}`;
}

module.exports = {
  buildCaptionPolicy,
};
