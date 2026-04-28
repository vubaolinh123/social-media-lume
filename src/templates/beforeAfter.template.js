/**
 * Before/After - AI Image Generation Prompt
 * Gemini sẽ nhận ảnh gốc và tạo ra ảnh thiết kế Before/After hoàn chỉnh
 */
const config = require('../config');
const { buildProductReferenceInvariants } = require('./image/prompt.shared');

/**
 * Build prompt cho Gemini để tạo ảnh template Before/After
 * @param {object} options - { title, content, serviceName }
 * @returns {string} prompt
 */
function buildImagePrompt({ title = '', content = '', serviceName = '', brand: brandOverride = null, includeFooterContact = true } = {}) {
  const brand = { ...config.brand, ...(brandOverride || {}) };
  const sharedInvariant = buildProductReferenceInvariants({ brand, postType: 'BA', includeFooterContact });

  return `You are a professional social media graphic designer for a premium lash extension brand called "${brand.name}".

TASK: Create a stunning BEFORE & AFTER social media post image using the provided photo.

${sharedInvariant}

DESIGN REQUIREMENTS:
- Canvas size: 1080x1350px (Instagram portrait)
- Split the image into BEFORE (top/left) and AFTER (bottom/right) layout
- Add elegant "BEFORE" and "AFTER" labels with clean typography
- Use palette adapted from uploaded product image (dark or light depending on source)
- Add the brand name "${brand.name}" prominently at the top
- Add a subtle decorative border or frame
${title ? `- Title text: "${title}"` : '- Add an elegant title like "TRANSFORMATION"'}
 ${serviceName ? `- Service name: "${serviceName}"` : ''}
- Style: Luxury, elegant, premium beauty brand aesthetic
- Add subtle sparkle or glow effects to enhance the "after" side
- The overall design should look like a professional Instagram post from a high-end beauty salon

IMPORTANT:
- DO NOT add any logo or QR code (these will be added separately)
- Keep bottom-left and bottom-right corners clear for logo/QR placement
- The photo provided should be the main visual focus
- Make the transformation dramatic and eye-catching
- Text should be readable and well-contrasted against the background`;
}

/**
 * Build prompt cho Gemini để tạo caption
 */
function buildCaptionPrompt({ title = '', content = '', serviceName = '', brand: brandOverride = null } = {}) {
  const brand = { ...config.brand, ...(brandOverride || {}) };
  return `You are a content marketing expert for the lash extension brand "${brand.name}".
Write an engaging caption for a BEFORE/AFTER post on Facebook and Instagram.

POST DETAILS:
- Title: ${title}
${content ? `- Additional content: ${content}` : ''}
${serviceName ? `- Service: ${serviceName}` : ''}

REQUIREMENTS:
1. Tone: Luxurious, confident, WOW effect
2. Opening hook must spark curiosity (e.g., "She came in with sparse lashes — two hours later, the results speak for themselves 🖤")
3. Highlight the before vs. after transformation
4. Include a clear call to action to book an appointment (CTA)
5. 150-250 words, in English, with appropriate emojis
6. IMPORTANT NOTE: Do NOT mention the logo or QR code on the image in the caption — the system adds these to the image automatically

HASHTAGS: #${brand.name.replace(/\s+/g, '')} #noimi #beforeafter #eyelashes #${brand.name.replace(/\s+/g, '').toLowerCase()} #lammi #lashextensions

CONTACT INFO (add at end of caption):
- ${brand.name} | ${brand.phone}
- ${brand.address}

Reply in JSON format:
{
  "caption": "Full caption including hashtags",
  "shortCaption": "Short caption for story (max 50 words)",
  "hashtags": ["hashtag1", "hashtag2", ...]
}`;
}

module.exports = { buildImagePrompt, buildCaptionPrompt };
