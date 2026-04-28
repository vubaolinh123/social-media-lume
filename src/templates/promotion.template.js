/**
 * Promotion - AI Image Generation Prompt
 * Gemini sẽ nhận ảnh gốc và tạo ra ảnh thiết kế Khuyến mãi hoàn chỉnh
 */
const config = require('../config');
const { buildProductReferenceInvariants } = require('./image/prompt.shared');

/**
 * Build prompt cho Gemini để tạo ảnh template Promotion
 */
function buildImagePrompt({ title = '', content = '', serviceName = '', brand: brandOverride = null, includeFooterContact = true } = {}) {
  const brand = { ...config.brand, ...(brandOverride || {}) };
  const sharedInvariant = buildProductReferenceInvariants({ brand, postType: 'Promo', includeFooterContact });

  return `You are a professional social media graphic designer for a premium lash extension brand called "${brand.name}".

TASK: Create an eye-catching PROMOTION / SPECIAL OFFER social media post image using the provided photo.

${sharedInvariant}

DESIGN REQUIREMENTS:
- Canvas size: 1080x1350px (Instagram portrait)
- Feature the provided photo as the main visual
- Add a bold promotional overlay with urgency-driven design
- Include a prominent offer badge/banner (e.g., ribbon, starburst, or elegant badge)
${title ? `- Promotion title: "${title}"` : '- Add "SPECIAL OFFER" or "LIMITED-TIME OFFER" as the headline'}
${content ? `- Offer details: "${content}"` : ''}
 ${serviceName ? `- Service: "${serviceName}"` : ''}
- Brand name "${brand.name}" prominently displayed
- Use promo colors adapted from source image palette (do not force dark-only themes)
- Add sense of urgency: "LIMITED TIME" or "BOOK NOW" call-to-action text
- Include decorative elements: gold borders, sparkles, elegant lines
- Style: Premium luxury promotion, NOT cheap/flashy discount style

IMPORTANT:
- DO NOT add any logo or QR code (these will be added separately)
- Keep bottom-left and bottom-right corners clear for logo/QR placement
- Balance promotional urgency with luxury brand aesthetics
- The photo should still be the hero — promotion elements should enhance, not overwhelm`;
}

/**
 * Build prompt cho Gemini để tạo caption
 */
function buildCaptionPrompt({ title = '', content = '', serviceName = '', brand: brandOverride = null } = {}) {
  const brand = { ...config.brand, ...(brandOverride || {}) };
  return `You are a content marketing expert for the lash extension brand "${brand.name}".
Write an engaging caption for a PROMOTION / SPECIAL OFFER post on Facebook and Instagram.

POST DETAILS:
- Title: ${title || 'Special Offer'}
${content ? `- Offer details: ${content}` : ''}
${serviceName ? `- Service: ${serviceName}` : ''}

REQUIREMENTS:
1. Tone: Luxurious, urgency-driven, FOMO
2. Strong hook (e.g., "THIS WEEK ONLY — An incredible deal for all lash lovers 🔥")
3. Highlight the offer value and deadline
4. Clear CTA: book now, DM us, call the hotline
5. 150-250 words, in English, with appropriate emojis
6. NOTE: Do NOT mention the logo or QR code on the image

HASHTAGS: #${brand.name.replace(/\s+/g, '')} #khuyenmai #noimi #promotion #eyelashes #${brand.name.replace(/\s+/g, '').toLowerCase()}

CONTACT INFO (add at end of caption):
- ${brand.name} | ${brand.phone}
- ${brand.address}

JSON FORMAT:
{
  "caption": "full caption + hashtags",
  "shortCaption": "max 50 words for story",
  "hashtags": ["hashtag1", "hashtag2"]
}`;
}

module.exports = { buildImagePrompt, buildCaptionPrompt };
