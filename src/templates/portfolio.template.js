/**
 * Portfolio - AI Image Generation Prompt
 * Gemini sẽ nhận ảnh gốc và tạo ra ảnh thiết kế portfolio/gallery
 */
const config = require('../config');
const { buildProductReferenceInvariants } = require('./image/prompt.shared');

function buildImagePrompt({ title = '', content = '', serviceName = '', brand: brandOverride = null, includeFooterContact = true } = {}) {
  const brand = { ...config.brand, ...(brandOverride || {}) };
  const sharedInvariant = buildProductReferenceInvariants({ brand, postType: 'Portfolio', includeFooterContact });

  return `You are a professional social media graphic designer for a premium lash extension brand called "${brand.name}".

TASK: Create a premium PORTFOLIO / WORK SHOWCASE social media post image using the provided photo.

${sharedInvariant}

DESIGN REQUIREMENTS:
- Canvas size: 1080x1350px (Instagram portrait)
- Use the uploaded photo as the hero panel in a curated gallery composition
- Build a 2-4 panel portfolio layout with elegant framing and spacing
- Add a refined headline such as "OUR WORK", "PORTFOLIO", or "ARTISTRY SHOWCASE"
${title ? `- Portfolio title: "${title}"` : ''}
${content ? `- Supporting text: "${content}"` : ''}
 ${serviceName ? `- Technique label: "${serviceName}"` : ''}
- Create a luxury editorial mood with minimal, polished decorative lines
- Highlight craftsmanship, detail, and consistency
- Use typography with clear hierarchy and premium fashion-magazine feel
- Color palette: adapted from uploaded product image with soft contrast and elegant balance

IMPORTANT:
- DO NOT add any logo or QR code (these will be added separately)
- Keep bottom-left and bottom-right corners clear for logo/QR placement
- Composition should feel curated like a professional gallery board
- Keep the hero panel dominant and text readable`;
}

function buildCaptionPrompt({ title = '', content = '', serviceName = '', brand: brandOverride = null } = {}) {
  const brand = { ...config.brand, ...(brandOverride || {}) };
  return `Bạn là chuyên gia content marketing cho thương hiệu nối mi "${brand.name}".
Hãy viết caption cho bài đăng PORTFOLIO / SHOWCASE trên Facebook và Instagram.

THÔNG TIN:
- Tiêu đề: ${title || 'Portfolio Highlights'}
${content ? `- Nội dung thêm: ${content}` : ''}
${serviceName ? `- Kỹ thuật nổi bật: ${serviceName}` : ''}

YÊU CẦU:
1. Phong cách: Đẳng cấp, nghệ thuật, chuyên nghiệp
2. Hook tôn vinh tay nghề (VD: "Mỗi bộ mi là một dấu ấn riêng — tinh chỉnh theo từng dáng mắt ✨")
3. Nhấn mạnh sự đa dạng style và độ chỉn chu
4. CTA: đặt lịch để được tư vấn design phù hợp
5. 150-250 từ, tiếng Việt, emoji phù hợp
6. LƯU Ý: KHÔNG đề cập logo/QR trên ảnh

HASHTAGS: #${brand.name.replace(/\s+/g, '')} #lashportfolio #ourwork #noimi #lashartist #${brand.name.replace(/\s+/g, '').toLowerCase()}

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
