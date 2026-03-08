/**
 * Spotlight - AI Image Generation Prompt
 * Gemini sẽ nhận ảnh gốc và tạo ra ảnh thiết kế Spotlight/Showcase hoàn chỉnh
 */
const config = require('../config');
const { buildProductReferenceInvariants } = require('./image/prompt.shared');

/**
 * Build prompt cho Gemini để tạo ảnh template Spotlight
 */
function buildImagePrompt({ title = '', content = '', serviceName = '', brand: brandOverride = null, includeFooterContact = true } = {}) {
  const brand = { ...config.brand, ...(brandOverride || {}) };
  const sharedInvariant = buildProductReferenceInvariants({ brand, postType: 'Spotlight', includeFooterContact });

  return `You are a professional social media graphic designer for a premium lash extension brand called "${brand.name}".

TASK: Create a stunning CLIENT SPOTLIGHT / SHOWCASE social media post image using the provided photo.

${sharedInvariant}

DESIGN REQUIREMENTS:
- Canvas size: 1080x1350px (Instagram portrait)
- Feature the client photo as a hero image — make it the star of the design
- Create an elegant showcase frame: circular cutout, or framed with decorative border
- Add "SPOTLIGHT" or "CLIENT OF THE DAY" or "LASH SPOTLIGHT" as headline
- Brand name "${brand.name}" in elegant typography
${title ? `- Title: "${title}"` : ''}
${content ? `- Description: "${content}"` : ''}
 ${serviceName ? `- Lash technique: "${serviceName}" — display this prominently` : ''}
- Include elegant design elements: thin gold lines, subtle sparkles, sophisticated typography
- Color palette: adaptive from uploaded product image with premium styling
- Add decorative stars or achievement elements to celebrate the result
- Style: Showcase/portfolio — highlighting artistry and results

IMPORTANT:
- DO NOT add any logo or QR code (these will be added separately)
- Keep bottom-left and bottom-right corners clear for logo/QR placement
- The client photo must be the focal point
- Design should feel like a premium beauty portfolio showcase
- Celebrate the craftsmanship and result`;
}

/**
 * Build prompt cho Gemini để tạo caption
 */
function buildCaptionPrompt({ title = '', content = '', serviceName = '', brand: brandOverride = null } = {}) {
  const brand = { ...config.brand, ...(brandOverride || {}) };
  return `Bạn là chuyên gia content marketing cho thương hiệu nối mi "${brand.name}".
Hãy viết caption cho bài đăng CLIENT SPOTLIGHT / SHOWCASE trên Facebook và Instagram.

THÔNG TIN:
- Tiêu đề: ${title || 'Lash Spotlight'}
${content ? `- Mô tả: ${content}` : ''}
${serviceName ? `- Kỹ thuật: ${serviceName}` : ''}

YÊU CẦU:
1. Phong cách: Tôn vinh kết quả, sang trọng, professional
2. Hook: spotlight vào chi tiết đẹp (VD: "Từng sợi mi được chăm chút tỉ mỉ — khi nghệ thuật gặp tay nghề ✨")
3. Mô tả kỹ thuật mi (Classic, Volume, Mega, Hybrid...)
4. Highlight sự khác biệt & chất lượng
5. CTA: đặt lịch trải nghiệm
6. 150-250 từ, tiếng Việt, emoji phù hợp
7. LƯU Ý: KHÔNG đề cập đến logo/QR trên ảnh

HASHTAGS: #${brand.name.replace(/\s+/g, '')} #lashspotlight #noimi #lashartist #eyelashextensions #${brand.name.replace(/\s+/g, '').toLowerCase()}

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
