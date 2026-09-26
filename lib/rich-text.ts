import "server-only";
import sanitizeHtml from "sanitize-html";

/**
 * Property descriptions are HTML written in the admin's Tiptap editor. Only the tags the editor
 * can produce survive; scripts, styles, event handlers and javascript: links are stripped.
 * Sanitized on save (validator) and again right before rendering with dangerouslySetInnerHTML.
 */
const options: sanitizeHtml.IOptions = {
  allowedTags: ["p", "br", "h2", "h3", "strong", "em", "u", "s", "a", "ul", "ol", "li", "blockquote", "hr", "code"],
  allowedAttributes: { a: ["href", "target", "rel"] },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowProtocolRelative: false,
  transformTags: {
    // Old/pasted markup → the editor's tags.
    b: "strong",
    i: "em",
    strike: "s",
    del: "s",
    h1: "h2",
    h4: "h3",
    h5: "h3",
    h6: "h3",
    // External links open in a new tab and don't pass ranking or window access.
    a: sanitizeHtml.simpleTransform("a", { target: "_blank", rel: "noopener noreferrer nofollow" }),
  },
};

export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html, options).trim();
}

/** Editor output always starts with a block tag; anything else is a legacy plain-text description. */
const looksLikeHtml = (value: string) => /^\s*<(p|h[1-6]|ul|ol|blockquote|div|hr)[\s>/]/i.test(value);

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Safe HTML for the property page. Older plain-text descriptions become paragraphs. */
export function richTextToHtml(description: string): string {
  if (!description.trim()) return "";
  if (looksLikeHtml(description)) return sanitizeRichText(description);
  return description
    .split(/\n{2,}/)
    .map((block) => `<p>${escapeHtml(block.trim()).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

/** Plain text for meta descriptions, JSON-LD and "is it empty?" checks. */
export function richTextToPlain(description: string): string {
  const text = looksLikeHtml(description)
    ? sanitizeHtml(description.replace(/<\/(p|h2|h3|li|blockquote)>|<br\s*\/?>/gi, " "), {
        allowedTags: [],
        allowedAttributes: {},
      })
    : description;
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}
