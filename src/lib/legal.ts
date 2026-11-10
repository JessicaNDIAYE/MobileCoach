import content from '@/content/legal.json';

export type LegalDocId = 'privacy' | 'terms';

export type LegalSection = { title: string; paragraphs?: string[]; bullets?: string[] };
export type LegalDoc = { title: string; intro: string; sections: LegalSection[] };

export const LEGAL_META = content.meta;

/** Remplace {{app}}, {{editor}}, {{email}} et {{minAge}} par les valeurs de meta. */
export function fill(text: string): string {
  return text
    .replaceAll('{{app}}', content.meta.appName)
    .replaceAll('{{editor}}', content.meta.editor)
    .replaceAll('{{email}}', content.meta.contactEmail)
    .replaceAll('{{minAge}}', String(content.meta.minAge));
}

export function getLegalDoc(id: LegalDocId): LegalDoc {
  const doc = content[id] as LegalDoc;
  return {
    title: doc.title,
    intro: fill(doc.intro),
    sections: doc.sections.map((s) => ({
      title: s.title,
      paragraphs: s.paragraphs?.map(fill),
      bullets: s.bullets?.map(fill),
    })),
  };
}
