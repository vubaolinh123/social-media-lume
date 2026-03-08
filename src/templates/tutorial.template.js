/**
 * Tutorial - AI Image Generation Prompt
 * Gemini sẽ nhận ảnh gốc và tạo ra ảnh thiết kế dạng hướng dẫn từng bước
 */
const config = require('../config');
const { buildProductReferenceInvariants } = require('./image/prompt.shared');

/**
 * Build prompt cho Gemini để tạo ảnh template Tutorial
 */
function buildImagePrompt({ title = '', content = '', serviceName = '', brand: brandOverride = null, includeFooterContact = true } = {}) {
  const brand = { ...config.brand, ...(brandOverride || {}) };
  const sharedInvariant = buildProductReferenceInvariants({ brand, postType: 'Tutorial', includeFooterContact });

  return `You are a professional social media graphic designer for a premium lash extension brand called "${brand.name}".

TASK: Create a high-value STEP-BY-STEP TUTORIAL social media post image using the provided photo.

${sharedInvariant}

DESIGN REQUIREMENTS:
- Canvas size: 1080x1350px (Instagram portrait)
- Keep the uploaded photo as the hero visual and build tutorial overlays around it
- Create a clean instructional structure with 3-4 numbered steps
- Add a clear educational headline such as "STEP BY STEP" or "HOW TO GET THIS LOOK"
${title ? `- Tutorial title: "${title}"` : ''}
${content ? `- Supporting note: "${content}"` : ''}
 ${serviceName ? `- Technique focus: "${serviceName}"` : ''}
- Use elegant cards/containers for each step with clear hierarchy
- Include subtle directional cues (arrows, separators, connectors) to guide reading flow
- Maintain premium visual language: refined typography, clean spacing, soft luxury accents
- Color palette: adapt from uploaded product image while preserving readability
- Style: Educational but premium, save-worthy and professional

IMPORTANT:
- DO NOT add any logo or QR code (these will be added separately)
- Keep bottom-left and bottom-right corners clear for logo/QR placement
- Keep text concise and easy to scan
- Prioritize clarity over decoration
- Keep the design balanced and not overcrowded`;
}

/**
 * Build prompt cho Gemini để tạo caption
 */
function buildCaptionPrompt({ title = '', content = '', serviceName = '', brand: brandOverride = null } = {}) {
  const brand = { ...config.brand, ...(brandOverride || {}) };
  return `Bạn là chuyên gia content marketing cho thương hiệu nối mi "${brand.name}".
Hãy viết caption cho bài đăng TUTORIAL / EDUCATIONAL trên Facebook và Instagram.

THÔNG TIN:
- Tiêu đề: ${title || 'Tutorial Lash Care'}
${content ? `- Nội dung thêm: ${content}` : ''}
${serviceName ? `- Kỹ thuật: ${serviceName}` : ''}

YÊU CẦU:
1. Phong cách: Chuyên gia, dễ hiểu, đáng tin cậy
2. Hook dạng educational (VD: "Muốn bộ mi bền đẹp suốt tuần? Lưu ngay checklist này ✨")
3. Trình bày 3-4 bước ngắn gọn, dễ áp dụng
4. Tạo cảm giác "save post" và "share post"
5. CTA: đặt lịch để được tư vấn kỹ thuật phù hợp
6. 150-250 từ, tiếng Việt, emoji phù hợp
7. LƯU Ý: KHÔNG đề cập logo/QR trên ảnh

HASHTAGS: #${brand.name.replace(/\s+/g, '')} #lashtutorial #lashcare #noimi #beautytips #${brand.name.replace(/\s+/g, '').toLowerCase()}

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
