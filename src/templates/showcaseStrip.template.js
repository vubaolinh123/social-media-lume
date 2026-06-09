/**
 * Showcase Strip - Horizontal Panel Layout Template
 * Tạo ảnh bố cục: Hero photo background + tên dịch vụ overlay + 2 dải ngang before/after + studio name
 * Layout reference: Eyelash Lift style (Yu Studio)
 */
const config = require('../config');
const { buildProductReferenceInvariants } = require('./image/prompt.shared');
const { buildCaptionPolicy } = require('./caption-policy');

/**
 * Build prompt for Gemini to create Showcase Strip layout image
 * @param {object} options - { title, content, serviceName, brand, includeFooterContact }
 * @returns {string} prompt
 */
function buildImagePrompt({ title = '', content = '', serviceName = '', brand: brandOverride = null, includeFooterContact = true } = {}) {
  const brand = { ...config.brand, ...(brandOverride || {}) };
  const sharedInvariant = buildProductReferenceInvariants({ brand, postType: 'ShowcaseStrip', includeFooterContact });

  return `You are a professional social media graphic designer for a premium beauty brand called "${brand.name}".

TASK: Create a stunning social media post image using the exact SHOWCASE STRIP layout described below.

${sharedInvariant}

═══════════════════════════════════════════
LAYOUT BLUEPRINT (Follow exactly):
═══════════════════════════════════════════

CANVAS: 1080×1350px (Instagram portrait 4:5)

ZONE 1 — HERO BACKGROUND (top ~55% of canvas):
- Use the uploaded photo as a FULL-BLEED background covering the entire canvas
- The photo bleeds edge-to-edge with NO border, frame, or padding
- Apply very subtle vignette darkening on the left edge only (so text is readable)
- The photo remains the main visual hero of the composition

ZONE 2 — SERVICE NAME TEXT OVERLAY (centered vertically in the hero zone, left-of-center):
- Render the service/treatment name in WIDE-SPACED capital letters
- Font: elegant thin serif or light sans-serif (think Cormorant Garamond, Playfair Display Light, or similar luxury editorial)
- Letter-spacing: very wide (tracking ~0.3–0.5em between each letter)
- Font size: large, commanding — approximately 60–72px equivalent
- Color: pure white (#FFFFFF) or very light ivory (#F5F0EB) — high contrast against photo
- Position: vertically centered in the top hero zone, slightly left of center
- DO NOT add any box, underline, shadow box, or background behind this text — floating clean text only
- Add VERY subtle text-shadow (1–2px) purely for legibility
- Service name to render: "${serviceName || title || 'BEAUTY TREATMENT'}"

ZONE 3 — DOUBLE HORIZONTAL STRIP PANELS (bottom ~50% of canvas, overlapping the hero):
- Create TWO horizontal rectangular strip panels stacked vertically
- Each strip is: full canvas width × approximately 200–230px tall
- Between the two strips: a thin gap of ~4–6px (can be slightly transparent or the background photo peeking through)
- Strip background: warm peachy-nude semi-transparent tone (#E8C9B4 at ~85% opacity) OR a clean light warm ivory — must feel soft, feminine, premium
- Each strip contains: a close-up crop of the uploaded photo centered in that strip (eye detail, lash detail, or key beauty detail)
- The crops inside each strip should be cropped from different vertical positions of the uploaded photo to show variety
- Strip 1 (top strip): crop from the upper portion of the uploaded image
- Strip 2 (bottom strip): crop from the lower portion of the uploaded image
- The strips should feel like editorial beauty detail shots
- Add VERY subtle inner shadow on top edge of Strip 1 for depth

ZONE 4 — STUDIO / BRAND NAME (bottom center, below the strips):
- Add the brand/studio name in clean, spaced small caps typography
- Text: "${brand.name}" 
- Style: thin elegant lettering, 24–30px, warm nude or white color
- Position: horizontally centered, approximately 30–40px from the bottom edge of canvas
- DO NOT put this inside a box — floating text only

ADDITIONAL DESIGN RULES:
- Overall color mood: soft warm editorial, feminine luxury (NOT dark/moody, NOT neon, NOT clinical white)
- The two strip panels are the KEY distinguishing design element — make them prominent
- Ensure the strip panels extend edge-to-edge (full canvas width, no side margins on strips)
- No decorative borders, no heavy drop shadows, no gradient blobs
- The composition should feel like a high-end Korean beauty salon Instagram post
- Subtle use of negative space above and around the text adds premium feel

IMPORTANT:
- DO NOT add any logo or QR code (these will be added separately by the system)
- Keep bottom-left and bottom-right corners with minimal clutter for logo/QR overlays
- Keep the floating text elements (service name + studio name) clean and readable
- DO NOT render any number like "1/6" or slide indicators
- The final image must look like the uploaded photo is being presented through this elegant editorial strip framework`;
}

/**
 * Build caption prompt for Showcase Strip posts
 */
function buildCaptionPrompt({ title = '', content = '', serviceName = '', brand: brandOverride = null } = {}) {
  const brand = { ...config.brand, ...(brandOverride || {}) };
  const service = serviceName || title || 'beauty treatment';

  return `${buildCaptionPolicy({
    brand,
    postLabel: 'BEAUTY SHOWCASE',
    tone: 'soft, elegant, confident, feminine luxury',
    hookStyle: 'open with the visual result or the feeling of the transformation',
    bodyFocus: 'highlight the precision of the service, the natural beautiful result, and the premium experience at the studio',
    ctaStyle: 'gentle booking invitation: DM to book, secure your appointment, or visit us',
  })}

POST DETAILS:
- Service: ${service}
${content ? `- Additional info: ${content}` : ''}
`;
}

module.exports = { buildImagePrompt, buildCaptionPrompt };
