/**
 * Behind The Scenes (BTS) - AI Image Generation Prompt
 * Gemini sẽ nhận ảnh gốc và tạo ra ảnh thiết kế BTS hoàn chỉnh
 */
const config = require('../config');
const { buildProductReferenceInvariants } = require('./image/prompt.shared');

/**
 * Build prompt cho Gemini để tạo ảnh template BTS
 */
function buildImagePrompt({ title = '', content = '', serviceName = '', brand: brandOverride = null, includeFooterContact = true } = {}) {
  const brand = { ...config.brand, ...(brandOverride || {}) };
  const sharedInvariant = buildProductReferenceInvariants({ brand, postType: 'BTS', includeFooterContact });

  return `You are a professional social media graphic designer for a premium lash extension brand called "${brand.name}".

TASK: Create an artistic BEHIND THE SCENES social media post image using the provided photo.

${sharedInvariant}

DESIGN REQUIREMENTS:
- Canvas size: 1080x1080px (Instagram square - perfect for BTS content)
- Feature the behind-the-scenes photo as a full-bleed or near-full image
- Add a cinematic overlay: subtle film grain, vignette, or muted color grade
- Add a branded badge/stamp: "${brand.name}" in a circular or rectangular badge
- Include "BEHIND THE SCENES" or "BTS" text in a cinematic/editorial style font
${title ? `- Title overlay: "${title}"` : ''}
${content ? `- Description: "${content}"` : ''}
 ${serviceName ? `- Technique: "${serviceName}"` : ''}
- Add the brand tagline "${brand.tagline}" in small italic text
- Style: Professional, cinematic, "exclusive peek" aesthetic
- Color palette: derived from source image; cinematic treatment can be light, neutral, or dark

IMPORTANT:
- DO NOT add any logo or QR code (these will be added separately)
- Keep bottom-left and bottom-right corners clear for logo/QR placement
- The BTS photo should dominate the composition
- Create a sense of exclusivity and professionalism
- The design should feel like a premium editorial peek behind the curtain`;
}

/**
 * Build prompt cho Gemini để tạo caption
 */
function buildCaptionPrompt({ title = '', content = '', serviceName = '', brand: brandOverride = null } = {}) {
  const brand = { ...config.brand, ...(brandOverride || {}) };
  return `Bạn là chuyên gia content marketing cho thương hiệu nối mi "${brand.name}".
Hãy viết caption cho bài đăng BEHIND THE SCENES (BTS) trên Facebook và Instagram.

THÔNG TIN:
- Tiêu đề: ${title}
${content ? `- Mô tả: ${content}` : ''}
${serviceName ? `- Kỹ thuật: ${serviceName}` : ''}

YÊU CẦU:
1. Phong cách: Professional, "nghệ thuật", behind-the-scenes
2. Hook tạo tò mò (VD: "Đằng sau mỗi đôi mi hoàn hảo là cả một quy trình kỹ lưỡng 🖤")
3. Highlight quy trình, dụng cụ sạch, tay nghề thợ
4. Tạo cảm giác exclusive, premium
5. CTA: trải nghiệm trực tiếp
6. 150-250 từ, tiếng Việt, emoji phù hợp
7. LƯU Ý: KHÔNG đề cập đến logo, QR code trên ảnh

HASHTAGS: #${brand.name.replace(/\s+/g, '')} #behindthescenes #bts #noimi #lashartist #process #${brand.name.replace(/\s+/g, '').toLowerCase()}

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
