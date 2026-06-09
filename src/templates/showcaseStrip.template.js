/**
 * Showcase Strip - Horizontal Panel Layout Template
 * Layout: Real photo background + service name text + 2 horizontal crop strips + studio name
 */
const config = require('../config');
const { buildProductReferenceInvariants } = require('./image/prompt.shared');
const { buildCaptionPolicy } = require('./caption-policy');

function buildImagePrompt({ title = '', content = '', serviceName = '', brand: brandOverride = null, includeFooterContact = true } = {}) {
  const brand = { ...config.brand, ...(brandOverride || {}) };
  const sharedInvariant = buildProductReferenceInvariants({ brand, postType: 'ShowcaseStrip', includeFooterContact });

  const serviceLabel = (serviceName || title || 'BEAUTY TREATMENT').toUpperCase();

  return `You are a photo compositor creating a social media post. Your job is to take the uploaded photo and composite it into a specific layout. Do NOT generate new illustrations. Do NOT recreate the photo as artwork. Use the actual uploaded photo pixels.

${sharedInvariant}

OUTPUT CANVAS: 1080 x 1350 pixels

YOU MUST FOLLOW THESE EXACT STEPS:

==============================================
STEP 1 — BACKGROUND LAYER
==============================================
- Place the uploaded photo as the full-canvas background, stretched or cropped to fill all 1080x1350px
- The photo must remain a REAL PHOTOGRAPH — do not paint it, illustrate it, or stylize it
- Apply a very soft darkening vignette along the LEFT edge only (so text is legible)
- The photo background stays 100% photographic and natural

==============================================
STEP 2 — SERVICE NAME TEXT (overlay on photo)
==============================================
- Position: vertically centered around y=400-550px, starting from x=80px (left-aligned)
- Text content: "${serviceLabel}"
- Typography: thin/light weight elegant sans-serif or serif font
- Letter spacing: EXTREMELY wide (each letter spaced far apart, like: E  Y  E  L  A  S  H     L  I  F  T)
- Font size: large (approx 60-70px)
- Color: pure white #FFFFFF
- Rendering: plain floating text directly on the photo, NO box behind it, NO underline, NO badge
- Text shadow: only 1px blur shadow for readability, no glow effect

==============================================
STEP 3 — TWO HORIZONTAL STRIP PANELS (KEY design feature)
==============================================

STRIP PANEL SPECIFICATIONS:
- Both strips span the FULL width of the canvas: x=0 to x=1080
- Strip 1 (top): positioned at y=680 to y=890 (height = 210px)
- Gap between strips: 5px of transparent space showing the photo behind
- Strip 2 (bottom): positioned at y=895 to y=1105 (height = 210px)

STRIP VISUAL STYLE:
- Each strip has a solid rectangular background: warm peachy-nude color #EABFA0 at 80% opacity
- Inside each strip, display a CROPPED PORTION of the uploaded photo, filling the strip height
  - Strip 1: crop the upper-middle area of the uploaded photo
  - Strip 2: crop the lower-middle area of the uploaded photo
- The photo crops inside the strips should be centered vertically within each strip
- The strips must have CLEAN HARD EDGES — no feathering, no gradient fade on the sides
- On the right edge of each strip: a tiny 4px vertical notch at x=1076 for a subtle layered effect

==============================================
STEP 4 — BRAND NAME (bottom of canvas)
==============================================
- Position: horizontally centered, y approx 1290-1320px
- Text content: "${brand.name}"
- Typography: elegant thin tracking, all caps or small caps, wide letter spacing
- Font size: small (approx 22-28px)
- Color: white #FFFFFF or very light warm tone
- NO box, NO background — clean floating text only

==============================================
FORBIDDEN — DO NOT DO ANY OF THESE:
==============================================
- DO NOT draw, paint, or illustrate anything new — use only the uploaded photo
- DO NOT add floral decorations, sparkle effects, bokeh blobs, or lens flares
- DO NOT add any fake eye illustration or recreated face
- DO NOT add "before" or "after" labels
- DO NOT add a poster frame, white border, or card outline
- DO NOT add slide numbers like "1/6"
- DO NOT add any logo or QR code (the system adds these separately)
- DO NOT invent brand slogans or extra text
- The strip panels must be SOLID RECTANGULAR BLOCKS — not rounded, not faded
- DO NOT add any decorative botanical or floral elements anywhere

==============================================
TARGET RESULT:
==============================================
Real uploaded photo used as full background → elegant extremely-spaced service name text floating over it → two solid warm peachy-tan rectangular horizontal strips overlaid in bottom half, showing cropped photo details inside → brand name at very bottom. Clean editorial Korean beauty salon look. Minimalist. No clutter.`;
}

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
