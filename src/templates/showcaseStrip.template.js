/**
 * Showcase Strip - Exact Layout Template
 * Layout specification:
 *   Layer 0: Full-bleed background photo
 *   Layer 1: Inset Panel (Before/After grid, 2 rows) - bottom half, 90% width, centered
 *   Layer 2: Typography + guide lines overlay
 */
const config = require('../config');
const { buildCaptionPolicy } = require('./caption-policy');

function buildImagePrompt({ title = '', content = '', serviceName = '', brand: brandOverride = null, includeFooterContact = true } = {}) {
  const brand = { ...config.brand, ...(brandOverride || {}) };

  const serviceLabel = (serviceName || title || 'BEAUTY TREATMENT')
    .toUpperCase()
    .split('')
    .join(' '); // Force wide letter spacing by inserting spaces: "EYELASH LIFT" → "E Y E L A S H  L I F T"

  const address = brand?.address || '';
  const phone = brand?.phone || brand?.hotline || '';

  const footerContactRule = includeFooterContact
    ? `- At the very bottom margin below the Brand Watermark, add a small footer line with: "${address}" and "${phone}" in tiny white text.`
    : `- Do NOT add any address or phone number text.`;

  return `You are a professional photo compositor for a premium beauty brand. Reproduce this EXACT layout using the uploaded photo. Every detail below is mandatory.

=====================================================
CANVAS
=====================================================
- Size: 1080 x 1350 px (Instagram portrait 4:5)
- The final image has exactly 3 visual layers stacked:
  LAYER 0 (bottom) = background photo
  LAYER 1 (middle) = inset before/after panel
  LAYER 2 (top)    = text + graphic accents

=====================================================
LAYER 0 — BACKGROUND PHOTO
=====================================================
- Take the uploaded photo and place it as a full-bleed background covering the entire 1080x1350 canvas (object-fit: cover, center)
- DO NOT redraw, illustrate, or stylize this photo in any way — it must look like a real photograph
- The upper half of the canvas shows the background photo clearly
- Apply a SUBTLE dark gradient overlay only on the LOWER half of the canvas (from y=675 downward), fading from transparent at top to rgba(0,0,0,0.30) at bottom. This makes the inset panel stand out more.

=====================================================
LAYER 1 — INSET PANEL (Before/After)
=====================================================
POSITION:
- The inset panel block is horizontally centered on the canvas
- Left margin: 5% of canvas width = 54px from left edge
- Right margin: 5% of canvas width = 54px from right edge  
- Panel width: 90% of canvas = 972px
- Panel BOTTOM edge: sits 13% from the bottom of canvas = approx y=1175
- Panel HEIGHT: each row is equal height. Total panel height ≈ 430px, so each row ≈ 215px
- Panel TOP edge: approx y=745

STRUCTURE — 2 ROWS (stacked vertically, equal height):
  ROW 1 — TOP ROW (Before):
  - Crop the uploaded photo focusing on the UPPER portion of the subject (e.g. top of face, eyes from front view)
  - This crop fills the top row of the panel: x=54 to x=1026, y=745 to y=957
  - The crop should be zoomed in on the eye/brow area showing BOTH eyes side by side from a FRONT-FACING angle
  - object-fit: cover within this row rectangle

  DIVIDER between rows:
  - A single horizontal line at y=960
  - Color: white, stroke width: 1px, opacity: 40%
  - Spans the full panel width from x=54 to x=1026

  ROW 2 — BOTTOM ROW (After):
  - Crop the uploaded photo focusing on the LOWER portion or a different crop showing BOTH eyes from front
  - This crop fills the bottom row: x=54 to x=1026, y=960 to y=1175
  - object-fit: cover within this row rectangle

PANEL STYLING:
- NO outer border/stroke around the panel rectangle
- NO rounded corners — sharp 90-degree corners on all sides
- The panel has NO background fill of its own — the cropped photo crops ARE the panel content
- The two rows are simply two different crops of the uploaded photo, divided by the thin white line

=====================================================
LAYER 2 — TYPOGRAPHY & GRAPHIC ACCENTS
=====================================================

A) MAIN TITLE — "EYELASH LIFT" (or equivalent service name)
- Text content: "${serviceLabel}"
- Position: Horizontally centered on canvas. Vertically placed in the UPPER HALF of the canvas, approximately y=380 to y=480 (above the inset panel)
- Font: Elegant thin-stroke SERIF font (like Didot, Bodoni, or Playfair Display Light)
- Weight: Thin / Light (not bold)
- Style: ALL CAPS
- Letter-spacing: EXTREMELY WIDE — render each letter with massive tracking so it spans across the canvas
- Font size: approximately 52-60px
- Color: #FFFFFF (pure white)
- Effect: very subtle drop shadow (0px 1px 3px rgba(0,0,0,0.5)) for legibility on skin tones
- NO background box, NO underline, NO badge of any kind

B) BRAND WATERMARK
- Text content: "${brand.name}"
- Position: Horizontally centered on canvas. Placed BELOW the inset panel bottom edge, at approximately y=1210-1240
- Font: Same elegant SERIF font as main title
- Style: ALL CAPS, wide letter-spacing (but not as extreme as title)
- Font size: approximately 24-28px (about 50% of title size)
- Color: #FFFFFF (white)
- NO background

C) PAGINATION TAG
- Text content: "1/6"
- Position: Top-right corner, approximately x=1020, y=50
- Font: Clean sans-serif, small (16-18px)
- Color: white, opacity ~80%

D) HORIZONTAL GUIDE LINES (accent detail — very important)
- These are 2 thin horizontal lines extending from the RIGHT EDGE of the inset panel out to the RIGHT EDGE of the canvas
- Line 1: Starts at x=1026 (right edge of panel), runs to x=1080 (canvas right edge), at the y-position of the DIVIDER between row 1 and row 2 (y≈960). Color: white, 1px, opacity: 35%
- Line 2: Same, but at the BOTTOM edge of the inset panel (y≈1175). Color: white, 1px, opacity: 35%
- These look like alignment tick-marks or bracket accents on the right side only

${footerContactRule}

=====================================================
STRICT FORBIDDEN LIST:
=====================================================
- FORBIDDEN: Generate any new illustration, painting, or digital art — use only the uploaded real photo
- FORBIDDEN: Add any floral, botanical, sparkle, bokeh, glow, or lens flare decorations
- FORBIDDEN: Add any logo mark, emblem, or QR code (system adds these separately)
- FORBIDDEN: Rounded corners on the inset panel
- FORBIDDEN: A colored or opaque background fill behind the panel rows (rows show the real photo crop)
- FORBIDDEN: Any "BEFORE" / "AFTER" labels on the rows
- FORBIDDEN: Border stroke around the outer edge of the inset panel
- FORBIDDEN: Recreating the uploaded photo as an artistic rendering

=====================================================
FINAL RESULT DESCRIPTION:
=====================================================
A real photograph fills the entire canvas as the background. In the upper half, the elegant serif service name floats in extremely wide letter-spacing across the photo. In the lower half, a frameless rectangle (90% wide, centered) contains two rows — each row showing a cropped portion of the same photo (front-facing eye close-up detail). The two rows are separated by a 1px semi-transparent white line. Below this panel, the brand name sits in small serif caps. Two thin white tick-mark lines extend from the right edge of the panel to the canvas edge. Top-right shows "1/6" in small sans-serif. The look is editorial, minimalist, Korean beauty salon premium.`;
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
