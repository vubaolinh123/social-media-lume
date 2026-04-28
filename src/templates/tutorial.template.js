/**
 * Tutorial - AI Image Generation Prompt
 * Gemini sẽ nhận ảnh gốc và tạo ra ảnh thiết kế dạng hướng dẫn từng bước
 */
const config = require('../config');
const { buildProductReferenceInvariants } = require('./image/prompt.shared');

/**
 * Build prompt cho Gemini để tạo ảnh template Tutorial
 */
function buildImagePrompt({ title = '', content = '', serviceName = '', brand: brandOverride = null, includeFooterContact = true } = {}) {
  const brand = { ...config.brand, ...(brandOverride || {}) };
  const sharedInvariant = buildProductReferenceInvariants({ brand, postType: 'Tutorial', includeFooterContact });

  return `You are a professional social media graphic designer for a premium lash extension brand called "${brand.name}".

TASK: Create a high-value STEP-BY-STEP TUTORIAL social media post image using the provided photo.

${sharedInvariant}

DESIGN REQUIREMENTS:
- Canvas size: 1080x1350px (Instagram portrait)
- Keep the uploaded photo as the hero visual and build tutorial overlays around it
- Create a clean instructional structure with 3-4 numbered steps
- Add a clear educational headline such as "STEP BY STEP" or "HOW TO GET THIS LOOK"
${title ? `- Tutorial title: "${title}"` : ''}
${content ? `- Supporting note: "${content}"` : ''}
 ${serviceName ? `- Technique focus: "${serviceName}"` : ''}
- Use elegant cards/containers for each step with clear hierarchy
- Include subtle directional cues (arrows, separators, connectors) to guide reading flow
- Maintain premium visual language: refined typography, clean spacing, soft luxury accents
- Color palette: adapt from uploaded product image while preserving readability
- Style: Educational but premium, save-worthy and professional

IMPORTANT:
- DO NOT add any logo or QR code (these will be added separately)
- Keep bottom-left and bottom-right corners clear for logo/QR placement
- Keep text concise and easy to scan
- Prioritize clarity over decoration
- Keep the design balanced and not overcrowded`;
}

/**
 * Build prompt cho Gemini để tạo caption
 */
function buildCaptionPrompt({ title = '', content = '', serviceName = '', brand: brandOverride = null } = {}) {
  const brand = { ...config.brand, ...(brandOverride || {}) };
  return `You are a content marketing expert for the lash extension brand "${brand.name}".
Write an engaging caption for a TUTORIAL / EDUCATIONAL post on Facebook and Instagram.

POST DETAILS:
- Title: ${title || 'Tutorial Lash Care'}
${content ? `- Additional content: ${content}` : ''}
${serviceName ? `- Technique: ${serviceName}` : ''}

REQUIREMENTS:
1. Tone: Expert, approachable, trustworthy
2. Educational hook (e.g., "Want your lashes to look flawless all week? Save this checklist now ✨")
3. Present 3-4 concise, easy-to-follow steps
4. Create a "save this post" and "share with a friend" feeling
5. CTA: book an appointment for personalized technique consultation
6. 150-250 words, in English, with appropriate emojis
7. NOTE: Do NOT mention the logo or QR code on the image

HASHTAGS: #${brand.name.replace(/\s+/g, '')} #lashtutorial #lashcare #noimi #beautytips #${brand.name.replace(/\s+/g, '').toLowerCase()}

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
