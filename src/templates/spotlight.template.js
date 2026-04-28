/**
 * Spotlight - AI Image Generation Prompt
 * Gemini sẽ nhận ảnh gốc và tạo ra ảnh thiết kế Spotlight/Showcase hoàn chỉnh
 */
const config = require('../config');
const { buildProductReferenceInvariants } = require('./image/prompt.shared');

/**
 * Build prompt cho Gemini để tạo ảnh template Spotlight
 */
function buildImagePrompt({ title = '', content = '', serviceName = '', brand: brandOverride = null, includeFooterContact = true } = {}) {
  const brand = { ...config.brand, ...(brandOverride || {}) };
  const sharedInvariant = buildProductReferenceInvariants({ brand, postType: 'Spotlight', includeFooterContact });

  return `You are a professional social media graphic designer for a premium lash extension brand called "${brand.name}".

TASK: Create a stunning CLIENT SPOTLIGHT / SHOWCASE social media post image using the provided photo.

${sharedInvariant}

DESIGN REQUIREMENTS:
- Canvas size: 1080x1350px (Instagram portrait)
- Feature the client photo as a hero image — make it the star of the design
- Create an elegant showcase frame: circular cutout, or framed with decorative border
- Add "SPOTLIGHT" or "CLIENT OF THE DAY" or "LASH SPOTLIGHT" as headline
- Brand name "${brand.name}" in elegant typography
${title ? `- Title: "${title}"` : ''}
${content ? `- Description: "${content}"` : ''}
 ${serviceName ? `- Lash technique: "${serviceName}" — display this prominently` : ''}
- Include elegant design elements: thin gold lines, subtle sparkles, sophisticated typography
- Color palette: adaptive from uploaded product image with premium styling
- Add decorative stars or achievement elements to celebrate the result
- Style: Showcase/portfolio — highlighting artistry and results

IMPORTANT:
- DO NOT add any logo or QR code (these will be added separately)
- Keep bottom-left and bottom-right corners clear for logo/QR placement
- The client photo must be the focal point
- Design should feel like a premium beauty portfolio showcase
- Celebrate the craftsmanship and result`;
}

/**
 * Build prompt cho Gemini để tạo caption
 */
function buildCaptionPrompt({ title = '', content = '', serviceName = '', brand: brandOverride = null } = {}) {
  const brand = { ...config.brand, ...(brandOverride || {}) };
  return `You are a content marketing expert for the lash extension brand "${brand.name}".
Write an engaging caption for a CLIENT SPOTLIGHT / SHOWCASE post on Facebook and Instagram.

POST DETAILS:
- Title: ${title || 'Lash Spotlight'}
${content ? `- Description: ${content}` : ''}
${serviceName ? `- Technique: ${serviceName}` : ''}

REQUIREMENTS:
1. Tone: Celebratory, luxurious, professional
2. Hook spotlighting the beautiful details (e.g., "Every single lash placed with care — where artistry meets skill ✨")
3. Describe the lash technique (Classic, Volume, Mega, Hybrid...)
4. Highlight the difference and quality of the result
5. CTA: invite readers to book and experience it
6. 150-250 words, in English, with appropriate emojis
7. NOTE: Do NOT mention the logo or QR code on the image

HASHTAGS: #${brand.name.replace(/\s+/g, '')} #lashspotlight #noimi #lashartist #eyelashextensions #${brand.name.replace(/\s+/g, '').toLowerCase()}

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
