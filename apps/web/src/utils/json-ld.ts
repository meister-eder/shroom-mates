/** Serialisiert JSON-LD für `set:html`; `<` wird escaped, damit kein `</script>` ausbrechen kann. */
export function jsonLd(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}
