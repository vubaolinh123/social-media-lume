/**
 * Tips - AI Image Generation Prompt
 * Gemini sẽ nhận ảnh gốc và tạo ra ảnh thiết kế tip/fact educational
 */
const config = require('../config');
const { buildProductReferenceInvariants } = require('./image/prompt.shared');

function buildImagePrompt({ title = '', content = '', serviceName = '', brand: brandOverride = null, includeFooterContact = true } = {}) {
  const brand = { ...config.brand, ...(brandOverride || {}) };
  const sharedInvariant = buildProductReferenceInvariants({ brand, postType: 'Tips', includeFooterContact });

  return `You are a professional social media graphic designer for a premium lash extension brand called "${brand.name}".

TASK: Create an educational PRO TIPS / DID YOU KNOW social media post image using the provided photo.

${sharedInvariant}

DESIGN REQUIREMENTS:
- Canvas size: 1080x1080px (Instagram square)
- Keep uploaded photo as the primary visual anchor
- Build an infographic-style layout with concise educational blocks
- Add a clear header: "PRO TIP", "DID YOU KNOW?", or "LASH CARE TIPS"
${title ? `- Tip headline: "${title}"` : ''}
${content ? `- Tip details: "${content}"` : ''}
 ${serviceName ? `- Service context: "${serviceName}"` : ''}
- Include 3-5 concise tips/facts with numbering or icon bullets
- Use high readability cards/labels with strong contrast
- Style: Expert, modern, minimal, save-worthy
- Keep spacing clean and hierarchy obvious for quick scanning

IMPORTANT:
- DO NOT add any logo or QR code (these will be added separately)
- Keep bottom-left and bottom-right corners clear for logo/QR placement
- Educational text must remain short and punchy
- Avoid dense paragraphs on the image`;
}

function buildCaptionPrompt({ title = '', content = '', serviceName = '', brand: brandOverride = null } = {}) {
  const brand = { ...config.brand, ...(brandOverride || {}) };
  return `You are a content marketing expert for the lash extension brand "${brand.name}".
Write an engaging caption for a TIPS / DID YOU KNOW post on Facebook and Instagram.

POST DETAILS:
- Title: ${title || 'Lash Care Tips'}
${content ? `- Additional content: ${content}` : ''}
${serviceName ? `- Related technique: ${serviceName}` : ''}

REQUIREMENTS:
1. Tone: Expert, relatable, genuinely helpful
2. Tip-style hook (e.g., "Small mistakes that make your lashes fall out faster — are you making them? 👀")
3. Present a list of 3-5 easy-to-remember tips
4. CTA: save the post + DM for in-depth consultation
5. 150-250 words, in English, with appropriate emojis
6. NOTE: Do NOT mention the logo or QR code on the image

HASHTAGS: #${brand.name.replace(/\s+/g, '')} #lashcaretips #didyouknow #noimi #beautyeducation #${brand.name.replace(/\s+/g, '').toLowerCase()}

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
