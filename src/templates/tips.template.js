/**
 * Tips - AI Image Generation Prompt
 * Gemini sẽ nhận ảnh gốc và tạo ra ảnh thiết kế tip/fact educational
 */
const config = require('../config');
const { buildProductReferenceInvariants } = require('./image/prompt.shared');

function buildImagePrompt({ title = '', content = '', serviceName = '', brand: brandOverride = null, includeFooterContact = true } = {}) {
  const brand = { ...config.brand, ...(brandOverride || {}) };
  const sharedInvariant = buildProductReferenceInvariants({ brand, postType: 'Tips', includeFooterContact });

  return `You are a professional social media graphic designer for a premium lash extension brand called "${brand.name}".

TASK: Create an educational PRO TIPS / DID YOU KNOW social media post image using the provided photo.

${sharedInvariant}

DESIGN REQUIREMENTS:
- Canvas size: 1080x1080px (Instagram square)
- Keep uploaded photo as the primary visual anchor
- Build an infographic-style layout with concise educational blocks
- Add a clear header: "PRO TIP", "DID YOU KNOW?", or "LASH CARE TIPS"
${title ? `- Tip headline: "${title}"` : ''}
${content ? `- Tip details: "${content}"` : ''}
 ${serviceName ? `- Service context: "${serviceName}"` : ''}
- Include 3-5 concise tips/facts with numbering or icon bullets
- Use high readability cards/labels with strong contrast
- Style: Expert, modern, minimal, save-worthy
- Keep spacing clean and hierarchy obvious for quick scanning

IMPORTANT:
- DO NOT add any logo or QR code (these will be added separately)
- Keep bottom-left and bottom-right corners clear for logo/QR placement
- Educational text must remain short and punchy
- Avoid dense paragraphs on the image`;
}

function buildCaptionPrompt({ title = '', content = '', serviceName = '', brand: brandOverride = null } = {}) {
  const brand = { ...config.brand, ...(brandOverride || {}) };
  return `Bạn là chuyên gia content marketing cho thương hiệu nối mi "${brand.name}".
Hãy viết caption cho bài đăng TIPS / DID YOU KNOW trên Facebook và Instagram.

THÔNG TIN:
- Tiêu đề: ${title || 'Lash Care Tips'}
${content ? `- Nội dung thêm: ${content}` : ''}
${serviceName ? `- Kỹ thuật liên quan: ${serviceName}` : ''}

YÊU CẦU:
1. Phong cách: Chuyên môn, gần gũi, hữu ích
2. Hook dạng tip (VD: "Những lỗi nhỏ khiến bộ mi nhanh rụng — nàng có mắc phải không? 👀")
3. Trình bày dạng list 3-5 tips dễ nhớ
4. CTA: lưu bài + inbox để tư vấn chuyên sâu
5. 150-250 từ, tiếng Việt, emoji phù hợp
6. LƯU Ý: KHÔNG đề cập logo/QR trên ảnh

HASHTAGS: #${brand.name.replace(/\s+/g, '')} #lashcaretips #didyouknow #noimi #beautyeducation #${brand.name.replace(/\s+/g, '').toLowerCase()}

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
