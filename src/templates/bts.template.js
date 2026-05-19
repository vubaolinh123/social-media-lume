/**
 * Behind The Scenes (BTS) - AI Image Generation Prompt
 * Gemini sẽ nhận ảnh gốc và tạo ra ảnh thiết kế BTS hoàn chỉnh
 */
const config = require('../config');
const { buildProductReferenceInvariants } = require('./image/prompt.shared');
const { buildCaptionPolicy } = require('./caption-policy');

/**
 * Build prompt cho Gemini để tạo ảnh template BTS
 */
function buildImagePrompt({ title = '', content = '', serviceName = '', brand: brandOverride = null, includeFooterContact = true } = {}) {
  const brand = { ...config.brand, ...(brandOverride || {}) };
  const sharedInvariant = buildProductReferenceInvariants({ brand, postType: 'BTS', includeFooterContact });

  return `You are a professional social media graphic designer for a premium lash extension brand called "${brand.name}".

TASK: Create an artistic BEHIND THE SCENES social media post image using the provided photo.

${sharedInvariant}

DESIGN REQUIREMENTS:
- Canvas size: 1080x1080px (Instagram square - perfect for BTS content)
- Feature the behind-the-scenes photo as a full-bleed or near-full image
- Add a cinematic overlay: subtle film grain, vignette, or muted color grade
- If text is used, keep it minimal and editorial; "BEHIND THE SCENES" or "BTS" is enough
${title ? `- Title overlay: "${title}"` : ''}
${content ? `- Description: "${content}"` : ''}
 ${serviceName ? `- Technique: "${serviceName}"` : ''}
- Do not add any brand badge, stamp, emblem, wordmark, signature, monogram, or invented logo
- Do not place the uploaded image inside another mockup, frame, card, poster, device screen, or collage tile
- Preserve the uploaded BTS photo as the hero visual rather than recreating it as a new branded composition
- Style: Professional, cinematic, "exclusive peek" aesthetic
- Color palette: derived from source image; cinematic treatment can be light, neutral, or dark

IMPORTANT:
- DO NOT add any logo or QR code (these will be added separately)
- DO NOT generate or imitate any logo, salon mark, watermark, brand symbol, or text treatment that behaves like a logo
- DO NOT invent extra product packaging, fake labels, or duplicate versions of the uploaded image
- Keep bottom-left and bottom-right corners clear for logo/QR placement
- The BTS photo should dominate the composition
- Create a sense of exclusivity and professionalism
- The design should feel like a premium editorial peek behind the curtain`;
}

/**
 * Build prompt cho Gemini để tạo caption
 */
function buildCaptionPrompt({ title = '', content = '', serviceName = '', brand: brandOverride = null } = {}) {
  const brand = { ...config.brand, ...(brandOverride || {}) };
  return `${buildCaptionPolicy({
    brand,
    postLabel: 'BEHIND THE SCENES (BTS)',
    tone: 'professional, polished, exclusive, process-led',
    hookStyle: 'open with a crisp behind-the-scenes angle that feels premium and authentic',
    bodyFocus: 'highlight precision, clean technique, artistry, and what happens during the appointment',
    ctaStyle: 'invite readers to book and experience the service firsthand',
  })}

POST DETAILS:
- Title: ${title}
${content ? `- Description: ${content}` : ''}
${serviceName ? `- Technique: ${serviceName}` : ''}
`;
}

module.exports = { buildImagePrompt, buildCaptionPrompt };
