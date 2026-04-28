/**
 * AI Random - Vision-guided creative freedom template
 * Dùng khi user muốn giao toàn quyền thiết kế cho AI
 */
const config = require('../config');
const { buildProductReferenceInvariants } = require('./image/prompt.shared');

function buildImagePrompt({ title = '', content = '', serviceName = '', brand: brandOverride = null, includeFooterContact = true } = {}) {
  const brand = { ...config.brand, ...(brandOverride || {}) };
  const sharedInvariant = buildProductReferenceInvariants({ brand, postType: 'AIRandom', includeFooterContact });

  return `You are a world-class social media art director and designer for a premium lash extension brand called "${brand.name}".

TASK: You have FULL CREATIVE FREEDOM to design one high-performing social media post image from the uploaded product image.

${sharedInvariant}

CREATIVE INTELLIGENCE MODE:
- Analyze the uploaded image deeply: product type, visual mood, composition opportunities, color harmony, texture cues, luxury signals, and storytelling potential.
- Use the provided product-analysis block (if available) as hard guidance.
- Decide the best design concept without asking the user for extra direction.
- Build a complete final concept with premium layout, typography, and visual hierarchy.

POSSIBLE STYLES (choose the single best fit):
1) Elegant Showcase
2) Before & After Transformation
3) Educational / Tutorial
4) Promotion / Offer
5) Editorial Magazine Cover
6) Minimalist Luxury
7) Collage / Mosaic Storyboard
8) Lifestyle Narrative

CONCEPT EXECUTION REQUIREMENTS:
- Canvas size: 1080x1350px (Instagram portrait)
- Keep uploaded product as hero element
- Auto-select a matching headline and CTA in English
- Make the concept visually distinctive, polished, and campaign-ready
${title ? `- Optional user title context (translate/adapt to English if needed): "${title}"` : ''}
${content ? `- Optional user content context (translate/adapt to English if needed): "${content}"` : ''}
 ${serviceName ? `- Optional service context (translate/adapt to English if needed): "${serviceName}"` : ''}
- Keep composition balanced with strong readability and premium taste

IMPORTANT:
- DO NOT add any logo or QR code (these will be added separately)
- Keep bottom-left and bottom-right corners clear for logo/QR placement
- Do not output design rationale, only produce the final designed image
- Prioritize originality while preserving product identity`;
}

function buildCaptionPrompt({ title = '', content = '', serviceName = '', brand: brandOverride = null } = {}) {
  const brand = { ...config.brand, ...(brandOverride || {}) };
  return `You are a content marketing expert for the lash extension brand "${brand.name}".
Write an engaging caption for an AI RANDOM DESIGN post on Facebook and Instagram.

CONTEXT:
- The image design concept was chosen by AI based on the uploaded product photo.
- The caption should match the spirit of the visual concept: premium, creative, persuasive.

POST DETAILS:
- Reference title: ${title || 'AI Creative Concept'}
${content ? `- Additional content: ${content}` : ''}
${serviceName ? `- Technique/service: ${serviceName}` : ''}

REQUIREMENTS:
1. Tone: Creative, confident, high-class
2. Striking hook (e.g., "When creativity has no limits, beauty speaks an entirely different language ✨")
3. Describe the concept's highlights and the value it delivers to the client
4. CTA: book an appointment / DM to receive a personalized concept
5. 150-250 words, in English, with appropriate emojis
6. NOTE: Do NOT mention the logo or QR code on the image

HASHTAGS: #${brand.name.replace(/\s+/g, '')} #aidesign #creativeconcept #noimi #lashart #${brand.name.replace(/\s+/g, '').toLowerCase()}

CONTACT INFO (add at end of caption):
- ${brand.name} | ${brand.phone}
- ${brand.address}

JSON FORMAT:
{
  "caption": "full caption + hashtags",
  "shortCaption": "max 50 words for story",
  "hashtags": ["hashtag1", "hashtag2"]
}`;
}

module.exports = { buildImagePrompt, buildCaptionPrompt };
