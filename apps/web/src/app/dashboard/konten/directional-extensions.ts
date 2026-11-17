import { Heading } from '@tiptap/extension-heading';
import { Paragraph } from '@tiptap/extension-paragraph';

/**
 * Hanya menyimpan `dir="rtl"` (bukan nilai bebas) agar output HTML konsisten
 * dengan allowlist sanitizer di API.
 */
const directionAttributes = {
  dir: {
    default: null as string | null,
    parseHTML: (element: HTMLElement) => (element.getAttribute('dir') === 'rtl' ? 'rtl' : null),
    renderHTML: (attributes: Record<string, unknown>) =>
      attributes.dir === 'rtl' ? { dir: 'rtl' } : {},
  },
};

export const DirectionalParagraph = Paragraph.extend({
  addAttributes() {
    return {
      ...(this.parent?.() ?? {}),
      ...directionAttributes,
    };
  },
});

export const DirectionalHeading = Heading.extend({
  addAttributes() {
    return {
      ...(this.parent?.() ?? {}),
      ...directionAttributes,
    };
  },
});
