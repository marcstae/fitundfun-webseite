import sanitizeHtml, { type Transformer } from "sanitize-html";

const WHITELIST = {
  allowedTags: ["p", "br", "strong", "em", "h2", "h3", "ul", "ol", "li", "a"],
  allowedAttributes: { a: ["href", "title", "target", "rel"] },
  allowedSchemes: ["http", "https", "mailto"],
  transformTags: {
    a: ((_tag: string, attribs: Record<string, string>) => {
      const external = /^https?:\/\//i.test(attribs.href || "");
      return {
        tagName: "a",
        attribs: external
          ? { ...attribs, target: "_blank", rel: "noopener noreferrer" }
          : attribs,
      };
    }) as Transformer,
  },
};

export function sanitizeRichText(html: string): string {
  if (!html) return "";
  return sanitizeHtml(html, WHITELIST);
}

export function richTextToPlainText(html: string): string {
  return sanitizeRichText(html)
    .replace(/<[^>]+>/g, " ")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&")
    .replace(/\s+/g, " ")
    .trim();
}
