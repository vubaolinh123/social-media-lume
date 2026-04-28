/**
 * Portfolio - AI Image Generation Prompt
 * Gemini sẽ nhận ảnh gốc và tạo ra ảnh thiết kế portfolio/gallery
 */
const config = require('../config');
const { buildProductReferenceInvariants } = require('./image/prompt.shared');

function buildImagePrompt({ title = '', content = '', serviceName = '', brand: brandOverride = null, includeFooterContact = true } = {}) {
  const brand = { ...config.brand, ...(brandOverride || {}) };
  const sharedInvariant = buildProductReferenceInvariants({ brand, postType: 'Portfolio', includeFooterContact });

  return `You are a professional social media graphic designer for a premium lash extension brand called "${brand.name}".

TASK: Create a premium PORTFOLIO / WORK SHOWCASE social media post image using the provided photo.

${sharedInvariant}

DESIGN REQUIREMENTS:
- Canvas size: 1080x1350px (Instagram portrait)
- Use the uploaded photo as the hero panel in a curated gallery composition
- Build a 2-4 panel portfolio layout with elegant framing and spacing
- Add a refined headline such as "OUR WORK", "PORTFOLIO", or "ARTISTRY SHOWCASE"
${title ? `- Portfolio title: "${title}"` : ''}
${content ? `- Supporting text: "${content}"` : ''}
 ${serviceName ? `- Technique label: "${serviceName}"` : ''}
- Create a luxury editorial mood with minimal, polished decorative lines
- Highlight craftsmanship, detail, and consistency
- Use typography with clear hierarchy and premium fashion-magazine feel
- Color palette: adapted from uploaded product image with soft contrast and elegant balance

IMPORTANT:
- DO NOT add any logo or QR code (these will be added separately)
- Keep bottom-left and bottom-right corners clear for logo/QR placement
- Composition should feel curated like a professional gallery board
- Keep the hero panel dominant and text readable`;
}

function buildCaptionPrompt({ title = '', content = '', serviceName = '', brand: brandOverride = null } = {}) {
  const brand = { ...config.brand, ...(brandOverride || {}) };
  return `You are a content marketing expert for the lash extension brand "${brand.name}".
Write an engaging caption for a PORTFOLIO / SHOWCASE post on Facebook and Instagram.

POST DETAILS:
- Title: ${title || 'Portfolio Highlights'}
${content ? `- Additional content: ${content}` : ''}
${serviceName ? `- Featured technique: ${serviceName}` : ''}

REQUIREMENTS:
1. Tone: High-class, artistic, professional
2. Hook celebrating the craftsmanship (e.g., "Every lash set is its own signature — tailored to each unique eye shape ✨")
3. Highlight the diversity of styles and attention to detail
4. CTA: book an appointment for a personalized design consultation
5. 150-250 words, in English, with appropriate emojis
6. NOTE: Do NOT mention the logo or QR code on the image

HASHTAGS: #${brand.name.replace(/\s+/g, '')} #lashportfolio #ourwork #noimi #lashartist #${brand.name.replace(/\s+/g, '').toLowerCase()}

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
