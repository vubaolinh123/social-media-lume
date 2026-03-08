/**
 * Promotion - AI Image Generation Prompt
 * Gemini sẽ nhận ảnh gốc và tạo ra ảnh thiết kế Khuyến mãi hoàn chỉnh
 */
const config = require('../config');
const { buildProductReferenceInvariants } = require('./image/prompt.shared');

/**
 * Build prompt cho Gemini để tạo ảnh template Promotion
 */
function buildImagePrompt({ title = '', content = '', serviceName = '', brand: brandOverride = null, includeFooterContact = true } = {}) {
  const brand = { ...config.brand, ...(brandOverride || {}) };
  const sharedInvariant = buildProductReferenceInvariants({ brand, postType: 'Promo', includeFooterContact });

  return `You are a professional social media graphic designer for a premium lash extension brand called "${brand.name}".

TASK: Create an eye-catching PROMOTION / SPECIAL OFFER social media post image using the provided photo.

${sharedInvariant}

DESIGN REQUIREMENTS:
- Canvas size: 1080x1350px (Instagram portrait)
- Feature the provided photo as the main visual
- Add a bold promotional overlay with urgency-driven design
- Include a prominent offer badge/banner (e.g., ribbon, starburst, or elegant badge)
${title ? `- Promotion title: "${title}"` : '- Add "SPECIAL OFFER" or "ƯU ĐÃI ĐẶC BIỆT" as the headline'}
${content ? `- Offer details: "${content}"` : ''}
 ${serviceName ? `- Service: "${serviceName}"` : ''}
- Brand name "${brand.name}" prominently displayed
- Use promo colors adapted from source image palette (do not force dark-only themes)
- Add sense of urgency: "LIMITED TIME" or "BOOK NOW" call-to-action text
- Include decorative elements: gold borders, sparkles, elegant lines
- Style: Premium luxury promotion, NOT cheap/flashy discount style
- Add subtle "${brand.handle}" text

IMPORTANT:
- DO NOT add any logo or QR code (these will be added separately)
- Keep bottom-left and bottom-right corners clear for logo/QR placement
- Balance promotional urgency with luxury brand aesthetics
- The photo should still be the hero — promotion elements should enhance, not overwhelm`;
}

/**
 * Build prompt cho Gemini để tạo caption
 */
function buildCaptionPrompt({ title = '', content = '', serviceName = '', brand: brandOverride = null } = {}) {
  const brand = { ...config.brand, ...(brandOverride || {}) };
  return `Bạn là chuyên gia content marketing cho thương hiệu nối mi "${brand.name}".
Hãy viết caption cho bài đăng KHUYẾN MÃI / PROMOTION trên Facebook và Instagram.

THÔNG TIN:
- Tiêu đề: ${title || 'Special Offer'}
${content ? `- Chi tiết KM: ${content}` : ''}
${serviceName ? `- Dịch vụ: ${serviceName}` : ''}

YÊU CẦU:
1. Phong cách: Sang trọng, tạo urgency, FOMO
2. Hook mạnh (VD: "CHỈ TRONG TUẦN NÀY — Ưu đãi cực sốc cho các nàng yêu mi 🔥")
3. Nhấn mạnh giá trị ưu đãi, thời hạn
4. CTA rõ: đặt lịch ngay, inbox, gọi hotline
5. 150-250 từ, tiếng Việt, emoji phù hợp
6. LƯU Ý: KHÔNG đề cập đến logo/QR trên ảnh

HASHTAGS: #${brand.name.replace(/\s+/g, '')} #khuyenmai #noimi #promotion #eyelashes #${brand.name.replace(/\s+/g, '').toLowerCase()}

THÔNG TIN LIÊN HỆ (chèn cuối caption):
- ${brand.name} | ${brand.phone}
- ${brand.address}
- ${brand.handle}

FORMAT JSON:
{
  "caption": "caption đầy đủ + hashtags",
  "shortCaption": "tối đa 50 từ cho story",
  "hashtags": ["hashtag1", "hashtag2"]
}`;
}

module.exports = { buildImagePrompt, buildCaptionPrompt };
