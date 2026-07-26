import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'Inter, sans-serif'
});

/**
 * Cleans and fixes common syntax issues in generated Mermaid specs.
 */
export function cleanMermaidSpec(spec: string): string {
  if (!spec) return '';

  let cleaned = spec.trim();

  // Strip Markdown fences if present
  cleaned = cleaned.replace(/^```mermaid\s*/i, '');
  cleaned = cleaned.replace(/^```\s*/i, '');
  cleaned = cleaned.replace(/\s*```$/, '');
  cleaned = cleaned.trim();

  // If missing diagram declaration, default to graph TD
  const validHeader = /^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|pie|gitGraph|mindmap|quadrantChart|C4Context)/i;
  if (!validHeader.test(cleaned)) {
    cleaned = `graph TD\n${cleaned}`;
  }

  // Quote unquoted node labels with special characters like parentheses
  // Example: A[User (Client)] -> A["User (Client)"]
  cleaned = cleaned.replace(/\[\s*([^[\]"'\n]+?\([^[\]"'\n]+?\)[^[\]"'\n]*?)\s*\]/g, '["$1"]');

  return cleaned;
}

function removeMermaidErrorElements() {
  try {
    document.querySelectorAll('#dmermaid, div[id^="dmermaid"], div[id^="mermaid-err"]').forEach(el => el.remove());
  } catch (e) {}
}

/**
 * Safely renders a Mermaid diagram into a target DOM element without triggering global Mermaid error banners.
 */
export async function safeRenderMermaid(container: HTMLElement, spec: string, idPrefix: string = 'mermaid'): Promise<boolean> {
  if (!container || !spec) return false;

  const cleaned = cleanMermaidSpec(spec);
  const renderId = `${idPrefix}-${Math.random().toString(36).substring(2, 9)}`;

  try {
    // Validate spec syntax first
    const isValid = await mermaid.parse(cleaned).catch(() => false);
    if (!isValid) {
      removeMermaidErrorElements();
      console.warn('Mermaid spec failed parse validation:', cleaned);
      container.innerHTML = `<div class="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-300 text-xs font-mono">📐 Architecture Diagram Spec — Syntax Warning</div>`;
      return false;
    }

    // Render valid spec
    const { svg } = await mermaid.render(renderId, cleaned);
    container.innerHTML = svg;
    removeMermaidErrorElements();
    return true;
  } catch (err) {
    removeMermaidErrorElements();
    console.warn('Mermaid render exception suppressed:', err);
    container.innerHTML = `<div class="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-300 text-xs font-mono">📐 Architecture Diagram Spec — Rendering Warning</div>`;
    return false;
  }
}
