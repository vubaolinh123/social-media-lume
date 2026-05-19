/**
 * Before/After - AI Image Generation Prompt
 * Gemini sẽ nhận ảnh gốc và tạo ra ảnh thiết kế Before/After hoàn chỉnh
 */
const config = require('../config');
const { buildProductReferenceInvariants } = require('./image/prompt.shared');
const { buildCaptionPolicy } = require('./caption-policy');

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
  return `${buildCaptionPolicy({
    brand,
    postLabel: 'BEFORE/AFTER',
    tone: 'luxury, confident, transformation-focused',
    hookStyle: 'lead with the visible result or transformation payoff',
    bodyFocus: 'highlight the transformation, the service result, and the polished final look',
    ctaStyle: 'soft booking CTA such as DM us, book your set, or secure your appointment',
  })}

POST DETAILS:
- Title: ${title}
${content ? `- Additional content: ${content}` : ''}
${serviceName ? `- Service: ${serviceName}` : ''}
`;
}

module.exports = { buildImagePrompt, buildCaptionPrompt };
