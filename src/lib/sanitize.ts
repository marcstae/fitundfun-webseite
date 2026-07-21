import sanitizeHtml, { type Transformer } from "sanitize-html";

const WHITELIST = {
  allowedTags: ["p", "br", "strong", "em", "ul", "ol", "li", "a"],
  allowedAttributes: { a: ["href", "title", "target", "rel"] },
  allowedSchemes: ["http", "https", "mailto"],
  transformTags: {
    a: ((_tag: string, attribs: Record<string, string>) => ({
      tagName: "a",
      attribs: { ...attribs, target: "_blank", rel: "noopener noreferrer" },
    })) as Transformer,
  },
};

export function sanitizeRichText(html: string): string {
  if (!html) return "";
  return sanitizeHtml(html, WHITELIST);
}
