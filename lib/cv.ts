/** Resume builder: the data typed in the form. Layout: cv-layout.ts. */

export type CvEntry = { role: string; organization: string; place: string; start: string; end: string; details: string };

export type CvData = {
  template: 'modern' | 'classic';
  accent: string;
  /** Square JPEG data URL, or '' without a photo. */
  photo: string;
  fullName: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  summary: string;
  experiences: CvEntry[];
  education: CvEntry[];
  skills: string;
  languages: string;
  interests: string;
};

export type CvLabels = { contact: string; profile: string; experience: string; education: string; skills: string; languages: string; interests: string };

/** Dark enough for white text on the sidebar. */
export const CV_ACCENTS = ['#1d4ed8', '#0f766e', '#6d28d9', '#9f1239', '#c2410c', '#166534', '#1e293b'] as const;

export const EMPTY_ENTRY: CvEntry = { role: '', organization: '', place: '', start: '', end: '', details: '' };

export function emptyCv(): CvData {
  return {
    template: 'modern', accent: CV_ACCENTS[0], photo: '', fullName: '', title: '', email: '', phone: '', location: '', website: '',
    summary: '', experiences: [{ ...EMPTY_ENTRY }], education: [{ ...EMPTY_ENTRY }], skills: '', languages: '', interests: '',
  };
}

/** Items of a list field: one per line, or separated by commas when typed on one line. */
export function listItems(text: string): string[] {
  const lines = text.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
  return lines.length === 1 ? lines[0].split(',').map((item) => item.trim()).filter(Boolean) : lines;
}

export function period(entry: CvEntry): string {
  return [entry.start.trim(), entry.end.trim()].filter(Boolean).join(' – ');
}
