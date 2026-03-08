/**
 * Before/After - AI Image Generation Prompt
 * Gemini sẽ nhận ảnh gốc và tạo ra ảnh thiết kế Before/After hoàn chỉnh
 */
const config = require('../config');
const { buildProductReferenceInvariants } = require('./image/prompt.shared');

/**
 * Build prompt cho Gemini để tạo ảnh template Before/After
 * @param {object} options - { title, content, serviceName }
 * @returns {string} prompt
 */
function buildImagePrompt({ title = '', content = '', serviceName = '', brand: brandOverride = null, includeFooterContact = true } = {}) {
  const brand = { ...config.brand, ...(brandOverride || {}) };
  const sharedInvariant = buildProductReferenceInvariants({ brand, postType: 'BA', includeFooterContact });

  return `You are a professional social media graphic designer for a premium lash extension brand called "${brand.name}".

TASK: Create a stunning BEFORE & AFTER social media post image using the provided photo.

${sharedInvariant}

DESIGN REQUIREMENTS:
- Canvas size: 1080x1350px (Instagram portrait)
- Split the image into BEFORE (top/left) and AFTER (bottom/right) layout
- Add elegant "BEFORE" and "AFTER" labels with clean typography
- Use palette adapted from uploaded product image (dark or light depending on source)
- Add the brand name "${brand.name}" prominently at the top
- Add a subtle decorative border or frame
${title ? `- Title text: "${title}"` : '- Add an elegant title like "TRANSFORMATION"'}
 ${serviceName ? `- Service name: "${serviceName}"` : ''}
- Style: Luxury, elegant, premium beauty brand aesthetic
- Add subtle sparkle or glow effects to enhance the "after" side
- The overall design should look like a professional Instagram post from a high-end beauty salon

IMPORTANT:
- DO NOT add any logo or QR code (these will be added separately)
- Keep bottom-left and bottom-right corners clear for logo/QR placement
- The photo provided should be the main visual focus
- Make the transformation dramatic and eye-catching
- Text should be readable and well-contrasted against the background`;
}

/**
 * Build prompt cho Gemini để tạo caption
 */
function buildCaptionPrompt({ title = '', content = '', serviceName = '', brand: brandOverride = null } = {}) {
  const brand = { ...config.brand, ...(brandOverride || {}) };
  return `Bạn là chuyên gia content marketing cho thương hiệu nối mi "${brand.name}".
Hãy viết caption cho bài đăng BEFORE/AFTER trên Facebook và Instagram.

THÔNG TIN BÀI VIẾT:
- Tiêu đề: ${title}
${content ? `- Nội dung thêm: ${content}` : ''}
${serviceName ? `- Dịch vụ: ${serviceName}` : ''}

YÊU CẦU:
1. Phong cách: Sang trọng, tự tin, WOW effect
2. Hook đầu bài phải gây tò mò (VD: "Khách đến với lông thưa, sau 2 tiếng — kết quả nói lên tất cả 🖤")
3. Nhấn mạnh sự thay đổi before vs after
4. Kêu gọi khách đặt lịch (CTA)
5. 150-250 từ, tiếng Việt, có emoji phù hợp
6. LƯU Ý QUAN TRỌNG: KHÔNG đề cập đến logo, QR code trên ảnh trong caption — hệ thống tự chèn vào ảnh

HASHTAGS: #${brand.name.replace(/\s+/g, '')} #noimi #beforeafter #eyelashes #${brand.name.replace(/\s+/g, '').toLowerCase()} #lammi #lashextensions

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
