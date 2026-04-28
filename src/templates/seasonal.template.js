/**
 * Seasonal - AI Image Generation Prompt
 * Gemini sẽ nhận ảnh gốc và tạo ra ảnh thiết kế theo mùa/lễ
 */
const config = require('../config');
const { buildProductReferenceInvariants } = require('./image/prompt.shared');

function buildImagePrompt({ title = '', content = '', serviceName = '', brand: brandOverride = null, includeFooterContact = true } = {}) {
  const brand = { ...config.brand, ...(brandOverride || {}) };
  const sharedInvariant = buildProductReferenceInvariants({ brand, postType: 'Seasonal', includeFooterContact });

  return `You are a professional social media graphic designer for a premium lash extension brand called "${brand.name}".

TASK: Create an elegant SEASONAL / HOLIDAY social media post image using the provided photo.

${sharedInvariant}

DESIGN REQUIREMENTS:
- Canvas size: 1080x1350px (Instagram portrait)
- Keep uploaded photo as the hero visual
- Create a seasonal art direction based on context from the image and optional text:
  - Spring: floral, fresh, airy
  - Summer: bright luxury, sun-kissed warmth
  - Autumn: warm earthy elegance
  - Winter: cool premium sparkle
- Add a seasonal headline such as "SEASONAL SPECIAL", "HOLIDAY GLOW", or "FESTIVE LASH LOOK"
${title ? `- Seasonal title: "${title}"` : ''}
${content ? `- Seasonal details: "${content}"` : ''}
 ${serviceName ? `- Service highlight: "${serviceName}"` : ''}
- Include subtle seasonal decorative motifs (never overpower the product)
- Maintain premium beauty aesthetic with refined typography and clean composition
- Color palette: adapt from uploaded photo first, then blend seasonal accents

IMPORTANT:
- DO NOT add any logo or QR code (these will be added separately)
- Keep bottom-left and bottom-right corners clear for logo/QR placement
- Keep visual tone festive but sophisticated
- Avoid clipart-heavy or noisy decoration`;
}

function buildCaptionPrompt({ title = '', content = '', serviceName = '', brand: brandOverride = null } = {}) {
  const brand = { ...config.brand, ...(brandOverride || {}) };
  return `You are a content marketing expert for the lash extension brand "${brand.name}".
Write an engaging caption for a SEASONAL / HOLIDAY post on Facebook and Instagram.

POST DETAILS:
- Title: ${title || 'Seasonal Lash Special'}
${content ? `- Additional content: ${content}` : ''}
${serviceName ? `- Service: ${serviceName}` : ''}

REQUIREMENTS:
1. Tone: Seasonal, refined, luxurious
2. Seasonal/holiday hook (e.g., "This holiday season, your eyes deserve a truly elegant touch ✨")
3. Connect seasonal emotion with a beauty need
4. CTA: book during the season / peak period slots
5. 150-250 words, in English, with appropriate emojis
6. NOTE: Do NOT mention the logo or QR code on the image

HASHTAGS: #${brand.name.replace(/\s+/g, '')} #seasonalbeauty #holidaylook #noimi #lashextensions #${brand.name.replace(/\s+/g, '').toLowerCase()}

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
