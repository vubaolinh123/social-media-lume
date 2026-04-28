/**
 * New Arrival - AI Image Generation Prompt
 * Gemini sẽ nhận ảnh gốc và tạo ra ảnh thiết kế thông báo dịch vụ/sản phẩm mới
 */
const config = require('../config');
const { buildProductReferenceInvariants } = require('./image/prompt.shared');

function buildImagePrompt({ title = '', content = '', serviceName = '', brand: brandOverride = null, includeFooterContact = true } = {}) {
  const brand = { ...config.brand, ...(brandOverride || {}) };
  const sharedInvariant = buildProductReferenceInvariants({ brand, postType: 'NewArrival', includeFooterContact });

  return `You are a professional social media graphic designer for a premium lash extension brand called "${brand.name}".

TASK: Create an exciting NEW ARRIVAL / NOW AVAILABLE social media post image using the provided photo.

${sharedInvariant}

DESIGN REQUIREMENTS:
- Canvas size: 1080x1350px (Instagram portrait)
- Use the uploaded photo as the hero visual with launch-style composition
- Add a bold but elegant launch badge: "NEW", "JUST ARRIVED", or "NOW AVAILABLE"
${title ? `- Launch headline: "${title}"` : '- Add launch headline focused on novelty and exclusivity'}
${content ? `- Launch details: "${content}"` : ''}
 ${serviceName ? `- New service/product: "${serviceName}"` : ''}
- Include supporting launch cues: subtle spotlight, layered cards, highlight stickers
- Add a premium CTA line such as "BOOK FIRST" or "TRY IT NOW"
- Keep the style luxurious, modern, and editorial
- Color palette: adapted from uploaded image with premium contrast and readability
- Create a sense of novelty and early-access excitement

IMPORTANT:
- DO NOT add any logo or QR code (these will be added separately)
- Keep bottom-left and bottom-right corners clear for logo/QR placement
- Avoid cheap discount aesthetics; keep premium brand feel
- Ensure all text is highly readable`;
}

function buildCaptionPrompt({ title = '', content = '', serviceName = '', brand: brandOverride = null } = {}) {
  const brand = { ...config.brand, ...(brandOverride || {}) };
  return `You are a content marketing expert for the lash extension brand "${brand.name}".
Write an engaging caption for a NEW ARRIVAL / NOW AVAILABLE post on Facebook and Instagram.

POST DETAILS:
- Title: ${title || 'Now Available'}
${content ? `- Description: ${content}` : ''}
${serviceName ? `- New service/product: ${serviceName}` : ''}

REQUIREMENTS:
1. Tone: Excited, premium, light FOMO
2. Launch hook (e.g., "Now live — a brand new experience for lash lovers ✨")
3. Highlight what's new and the key benefits
4. Strong CTA: book early / DM to secure a priority slot
5. 150-250 words, in English, with appropriate emojis
6. NOTE: Do NOT mention the logo or QR code on the image

HASHTAGS: #${brand.name.replace(/\s+/g, '')} #newarrival #nowavailable #noimi #lashservice #${brand.name.replace(/\s+/g, '').toLowerCase()}

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
