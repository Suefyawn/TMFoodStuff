// Serialize an object for embedding inside a <script type="application/ld+json">
// tag. Escapes "<" so a field value containing "</script>" (or any "<...")
// can't break out of the script element — the standard JSON-LD XSS guard.
// Product names/descriptions are admin-controlled, but this is cheap defence
// in depth and the industry-standard practice.
export function jsonLdHtml(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
