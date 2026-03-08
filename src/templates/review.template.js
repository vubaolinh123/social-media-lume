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
${title ? `- Review title/quote: "${title}"` : '- Add text like "KHÁCH HÀNG NÓI GÌ?" or "CLIENT REVIEW"'}
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
  return `Bạn là chuyên gia content marketing cho thương hiệu nối mi "${brand.name}".
Hãy viết caption cho bài đăng REVIEW KHÁCH HÀNG trên Facebook và Instagram.

THÔNG TIN:
- Tiêu đề: ${title}
${content ? `- Nội dung review: ${content}` : ''}
${serviceName ? `- Dịch vụ: ${serviceName}` : ''}

YÊU CẦU:
1. Phong cách: Chân thật, ấm áp, tạo trust
2. Hook chân thật (VD: "Reaction của khách sau khi nhìn gương — không cần nói thêm 🥹✨")
3. Trích dẫn/paraphrase review khách
4. CTA mềm: mời đặt lịch
5. 150-250 từ, tiếng Việt, emoji phù hợp
6. LƯU Ý: KHÔNG đề cập đến logo, QR code trên ảnh

HASHTAGS: #${brand.name.replace(/\s+/g, '')} #review #khachangnoigi #noimi #eyelashes #${brand.name.replace(/\s+/g, '').toLowerCase()}

THÔNG TIN LIÊN HỆ (chèn cuối caption):
- ${brand.name} | ${brand.phone}
- ${brand.address}

Trả lời theo format JSON:
{
  "caption": "Nội dung caption đầy đủ bao gồm hashtags",
  "shortCaption": "Caption ngắn gọn cho story (tối đa 50 từ)",
  "hashtags": ["hashtag1", "hashtag2", ...]
}`;
}

module.exports = { buildImagePrompt, buildCaptionPrompt };
