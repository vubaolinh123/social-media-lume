/**
 * AI Random - Vision-guided creative freedom template
 * Dùng khi user muốn giao toàn quyền thiết kế cho AI
 */
const config = require('../config');
const { buildProductReferenceInvariants } = require('./image/prompt.shared');

function buildImagePrompt({ title = '', content = '', serviceName = '', brand: brandOverride = null, includeFooterContact = true } = {}) {
  const brand = { ...config.brand, ...(brandOverride || {}) };
  const sharedInvariant = buildProductReferenceInvariants({ brand, postType: 'AIRandom', includeFooterContact });

  return `You are a world-class social media art director and designer for a premium lash extension brand called "${brand.name}".

TASK: You have FULL CREATIVE FREEDOM to design one high-performing social media post image from the uploaded product image.

${sharedInvariant}

CREATIVE INTELLIGENCE MODE:
- Analyze the uploaded image deeply: product type, visual mood, composition opportunities, color harmony, texture cues, luxury signals, and storytelling potential.
- Use the provided product-analysis block (if available) as hard guidance.
- Decide the best design concept without asking the user for extra direction.
- Build a complete final concept with premium layout, typography, and visual hierarchy.

POSSIBLE STYLES (choose the single best fit):
1) Elegant Showcase
2) Before & After Transformation
3) Educational / Tutorial
4) Promotion / Offer
5) Editorial Magazine Cover
6) Minimalist Luxury
7) Collage / Mosaic Storyboard
8) Lifestyle Narrative

CONCEPT EXECUTION REQUIREMENTS:
- Canvas size: 1080x1350px (Instagram portrait)
- Keep uploaded product as hero element
- Auto-select a matching headline and CTA in English
- Make the concept visually distinctive, polished, and campaign-ready
${title ? `- Optional user title context (translate/adapt to English if needed): "${title}"` : ''}
${content ? `- Optional user content context (translate/adapt to English if needed): "${content}"` : ''}
 ${serviceName ? `- Optional service context (translate/adapt to English if needed): "${serviceName}"` : ''}
- Keep composition balanced with strong readability and premium taste

IMPORTANT:
- DO NOT add any logo or QR code (these will be added separately)
- Keep bottom-left and bottom-right corners clear for logo/QR placement
- Do not output design rationale, only produce the final designed image
- Prioritize originality while preserving product identity`;
}

function buildCaptionPrompt({ title = '', content = '', serviceName = '', brand: brandOverride = null } = {}) {
  const brand = { ...config.brand, ...(brandOverride || {}) };
  return `Bạn là chuyên gia content marketing cho thương hiệu nối mi "${brand.name}".
Hãy viết caption cho bài đăng AI RANDOM DESIGN trên Facebook và Instagram.

BỐI CẢNH:
- Thiết kế ảnh được AI tự chọn concept dựa trên ảnh sản phẩm user upload.
- Caption cần bám theo tinh thần concept hình ảnh: premium, sáng tạo, thuyết phục.

THÔNG TIN:
- Tiêu đề tham khảo: ${title || 'AI Creative Concept'}
${content ? `- Nội dung thêm: ${content}` : ''}
${serviceName ? `- Kỹ thuật/dịch vụ: ${serviceName}` : ''}

YÊU CẦU:
1. Phong cách: Sáng tạo, tự tin, đẳng cấp
2. Hook ấn tượng (VD: "Khi không giới hạn ý tưởng, vẻ đẹp được kể bằng một ngôn ngữ rất khác ✨")
3. Mô tả điểm nổi bật concept và giá trị cho khách hàng
4. CTA: đặt lịch/inbox để nhận concept cá nhân hóa
5. 150-250 từ, tiếng Việt, emoji phù hợp
6. LƯU Ý: KHÔNG đề cập logo/QR trên ảnh

HASHTAGS: #${brand.name.replace(/\s+/g, '')} #aidesign #creativeconcept #noimi #lashart #${brand.name.replace(/\s+/g, '').toLowerCase()}

THÔNG TIN LIÊN HỆ (chèn cuối caption):
- ${brand.name} | ${brand.phone}
- ${brand.address}

FORMAT JSON:
{
  "caption": "caption đầy đủ + hashtags",
  "shortCaption": "tối đa 50 từ cho story",
  "hashtags": ["hashtag1", "hashtag2"]
}`;
}

module.exports = { buildImagePrompt, buildCaptionPrompt };
