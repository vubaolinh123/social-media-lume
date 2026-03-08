/**
 * Seasonal - AI Image Generation Prompt
 * Gemini sẽ nhận ảnh gốc và tạo ra ảnh thiết kế theo mùa/lễ
 */
const config = require('../config');
const { buildProductReferenceInvariants } = require('./image/prompt.shared');

function buildImagePrompt({ title = '', content = '', serviceName = '', brand: brandOverride = null, includeFooterContact = true } = {}) {
  const brand = { ...config.brand, ...(brandOverride || {}) };
  const sharedInvariant = buildProductReferenceInvariants({ brand, postType: 'Seasonal', includeFooterContact });

  return `You are a professional social media graphic designer for a premium lash extension brand called "${brand.name}".

TASK: Create an elegant SEASONAL / HOLIDAY social media post image using the provided photo.

${sharedInvariant}

DESIGN REQUIREMENTS:
- Canvas size: 1080x1350px (Instagram portrait)
- Keep uploaded photo as the hero visual
- Create a seasonal art direction based on context from the image and optional text:
  - Spring: floral, fresh, airy
  - Summer: bright luxury, sun-kissed warmth
  - Autumn: warm earthy elegance
  - Winter: cool premium sparkle
- Add a seasonal headline such as "SEASONAL SPECIAL", "HOLIDAY GLOW", or "FESTIVE LASH LOOK"
${title ? `- Seasonal title: "${title}"` : ''}
${content ? `- Seasonal details: "${content}"` : ''}
 ${serviceName ? `- Service highlight: "${serviceName}"` : ''}
- Include subtle seasonal decorative motifs (never overpower the product)
- Maintain premium beauty aesthetic with refined typography and clean composition
- Color palette: adapt from uploaded photo first, then blend seasonal accents

IMPORTANT:
- DO NOT add any logo or QR code (these will be added separately)
- Keep bottom-left and bottom-right corners clear for logo/QR placement
- Keep visual tone festive but sophisticated
- Avoid clipart-heavy or noisy decoration`;
}

function buildCaptionPrompt({ title = '', content = '', serviceName = '', brand: brandOverride = null } = {}) {
  const brand = { ...config.brand, ...(brandOverride || {}) };
  return `Bạn là chuyên gia content marketing cho thương hiệu nối mi "${brand.name}".
Hãy viết caption cho bài đăng SEASONAL / HOLIDAY trên Facebook và Instagram.

THÔNG TIN:
- Tiêu đề: ${title || 'Seasonal Lash Special'}
${content ? `- Nội dung thêm: ${content}` : ''}
${serviceName ? `- Dịch vụ: ${serviceName}` : ''}

YÊU CẦU:
1. Phong cách: Theo mùa, tinh tế, sang trọng
2. Hook theo bối cảnh mùa/lễ (VD: "Mùa lễ này, đôi mắt nàng xứng đáng một điểm nhấn thật tinh tế ✨")
3. Liên kết cảm xúc theo mùa với nhu cầu làm đẹp
4. CTA: đặt lịch theo mùa/khung giờ cao điểm
5. 150-250 từ, tiếng Việt, emoji phù hợp
6. LƯU Ý: KHÔNG đề cập logo/QR trên ảnh

HASHTAGS: #${brand.name.replace(/\s+/g, '')} #seasonalbeauty #holidaylook #noimi #lashextensions #${brand.name.replace(/\s+/g, '').toLowerCase()}

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
