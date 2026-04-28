/**
 * Review - AI Image Generation Prompt
 * Gemini sẽ nhận ảnh gốc và tạo ra ảnh thiết kế Review/Testimonial hoàn chỉnh
 */
const config = require('../config');
const { buildProductReferenceInvariants } = require('./image/prompt.shared');

/**
 * Build prompt cho Gemini để tạo ảnh template Review
 */
function buildImagePrompt({ title = '', content = '', serviceName = '', brand: brandOverride = null, includeFooterContact = true } = {}) {
  const brand = { ...config.brand, ...(brandOverride || {}) };
  const sharedInvariant = buildProductReferenceInvariants({ brand, postType: 'Review', includeFooterContact });

  return `You are a professional social media graphic designer for a premium lash extension brand called "${brand.name}".

TASK: Create a beautiful CUSTOMER REVIEW / TESTIMONIAL social media post image using the provided photo.

${sharedInvariant}

DESIGN REQUIREMENTS:
- Canvas size: 1080x1350px (Instagram portrait)
- Feature the customer photo prominently (this is a happy customer showing off their lashes)
- Add an elegant card/frame overlay with review-style design
- Include decorative quotation marks or testimonial visual elements
- Use color palette adapted from uploaded product image while maintaining premium look
- Brand name "${brand.name}" at the top in elegant typography
${title ? `- Review title/quote: "${title}"` : '- Add text like "WHAT CLIENTS SAY" or "CLIENT REVIEW"'}
${content ? `- Customer review snippet: "${content}"` : ''}
 ${serviceName ? `- Service: "${serviceName}"` : ''}
- Add star rating visual (5 stars, gold colored)
- Style: Warm, trustworthy, premium beauty brand

IMPORTANT:
- DO NOT add any logo or QR code (these will be added separately)
- Keep bottom-left and bottom-right corners clear for logo/QR placement
- The customer photo should be the hero element
- Design should feel authentic and trustworthy
- Text must be readable with good contrast`;
}

/**
 * Build prompt cho Gemini để tạo caption
 */
function buildCaptionPrompt({ title = '', content = '', serviceName = '', brand: brandOverride = null } = {}) {
  const brand = { ...config.brand, ...(brandOverride || {}) };
  return `You are a content marketing expert for the lash extension brand "${brand.name}".
Write an engaging caption for a CUSTOMER REVIEW post on Facebook and Instagram.

POST DETAILS:
- Title: ${title}
${content ? `- Review content: ${content}` : ''}
${serviceName ? `- Service: ${serviceName}` : ''}

REQUIREMENTS:
1. Tone: Authentic, warm, trust-building
2. Genuine hook (e.g., "Her reaction when she looked in the mirror — no words needed 🥹✨")
3. Quote or paraphrase the customer review
4. Soft CTA: invite readers to book an appointment
5. 150-250 words, in English, with appropriate emojis
6. NOTE: Do NOT mention the logo or QR code on the image

HASHTAGS: #${brand.name.replace(/\s+/g, '')} #review #khachangnoigi #noimi #eyelashes #${brand.name.replace(/\s+/g, '').toLowerCase()}

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
