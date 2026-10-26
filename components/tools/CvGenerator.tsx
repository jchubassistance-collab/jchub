'use client';

import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { ArrowDown, ArrowUp, Camera, Download, Eraser, Plus, Trash2 } from 'lucide-react';
import { useLocale } from 'next-intl';
import { bilingual } from '@/i18n/copy';
import { CV_ACCENTS, EMPTY_ENTRY, emptyCv, type CvData, type CvEntry } from '@/lib/cv';
import { layoutCv } from '@/lib/cv-layout';
import { downloadName } from '@/lib/download-name';
import { DocumentPreview, Field, FormSection, TextArea, forgetDraft, imageToDataUrl, readDraft, savePdf, useDraftSaving, useIsClient, usePdfKit } from '@/components/tools/DocumentPreview';

const DRAFT_KEY = 'jchub-cv-v1';

const copy = bilingual({
  sections: { contact: 'Contact', profile: 'Profil', experience: 'Expérience', education: 'Formation', skills: 'Compétences', languages: 'Langues', interests: 'Centres d’intérêt' },
  template: 'Modèle',
  modern: 'Moderne',
  classic: 'Classique',
  accent: 'Couleur',
  accentName: (color: string) => `Couleur ${color}`,
  download: 'Télécharger le PDF',
  clear: 'Tout effacer',
  confirmClear: 'Effacer tout le contenu du CV ?',
  identity: 'Identité',
  photo: 'Photo',
  addPhoto: 'Ajouter une photo',
  changePhoto: 'Changer',
  removePhoto: 'Retirer la photo',
  photoFailed: 'Impossible de lire cette image.',
  fullName: 'Nom complet',
  title: 'Poste recherché ou métier',
  email: 'E-mail',
  phone: 'Téléphone',
  location: 'Ville, pays',
  website: 'LinkedIn ou site',
  summary: 'Résumé de ton profil',
  summaryHint: 'Trois ou quatre phrases : ton expérience, ce que tu sais faire, ce que tu cherches.',
  role: 'Poste',
  organization: 'Entreprise',
  degree: 'Diplôme',
  school: 'École ou université',
  place: 'Ville',
  start: 'Début',
  end: 'Fin',
  endPlaceholder: 'Aujourd’hui',
  details: 'Missions et résultats',
  detailsHint: 'Une ligne par point ; commence-la par « - » pour une puce.',
  addExperience: 'Ajouter une expérience',
  addEducation: 'Ajouter une formation',
  moveUp: 'Monter',
  moveDown: 'Descendre',
  remove: 'Supprimer',
  skills: 'Compétences',
  languages: 'Langues',
  interests: 'Centres d’intérêt',
  listHint: 'Une par ligne.',
  preview: 'Aperçu du CV',
  page: (current: number, total: number) => `Page ${current} sur ${total}`,
  previous: 'Page précédente',
  next: 'Page suivante',
  privacy: 'Tout se passe dans ton navigateur : ton CV n’est envoyé à aucun serveur. Il reste enregistré sur cet appareil pour que tu le retrouves.',
}, {
  sections: { contact: 'Contact', profile: 'Profile', experience: 'Experience', education: 'Education', skills: 'Skills', languages: 'Languages', interests: 'Interests' },
  template: 'Template',
  modern: 'Modern',
  classic: 'Classic',
  accent: 'Color',
  accentName: (color: string) => `Color ${color}`,
  download: 'Download the PDF',
  clear: 'Clear all',
  confirmClear: 'Clear the whole resume?',
  identity: 'Identity',
  photo: 'Photo',
  addPhoto: 'Add a photo',
  changePhoto: 'Change',
  removePhoto: 'Remove the photo',
  photoFailed: 'Could not read this image.',
  fullName: 'Full name',
  title: 'Target job or profession',
  email: 'Email',
  phone: 'Phone',
  location: 'City, country',
  website: 'LinkedIn or website',
  summary: 'Profile summary',
  summaryHint: 'Three or four sentences: your experience, what you do well, what you are looking for.',
  role: 'Job title',
  organization: 'Company',
  degree: 'Degree',
  school: 'School or university',
  place: 'City',
  start: 'Start',
  end: 'End',
  endPlaceholder: 'Present',
  details: 'Tasks and achievements',
  detailsHint: 'One line per point; start it with "-" for a bullet.',
  addExperience: 'Add an experience',
  addEducation: 'Add an education',
  moveUp: 'Move up',
  moveDown: 'Move down',
  remove: 'Delete',
  skills: 'Skills',
  languages: 'Languages',
  interests: 'Interests',
  listHint: 'One per line.',
  preview: 'Resume preview',
  page: (current: number, total: number) => `Page ${current} of ${total}`,
  previous: 'Previous page',
  next: 'Next page',
  privacy: 'Everything happens in your browser: your resume is not sent to any server. It stays saved on this device so you find it again.',
});

/** A filled-in example, so the first visit shows what the resume looks like. */
function sampleCv(locale: string): CvData {
  const fr = locale !== 'en';
  return {
    ...emptyCv(),
    fullName: 'Awa Ndiaye',
    title: fr ? 'Chargée de communication digitale' : 'Digital communications officer',
    email: 'awa.ndiaye@email.com',
    phone: '+221 77 123 45 67',
    location: fr ? 'Dakar, Sénégal' : 'Dakar, Senegal',
    website: 'linkedin.com/in/awandiaye',
    summary: fr
      ? 'Cinq ans d’expérience en communication digitale pour des marques et des institutions d’Afrique de l’Ouest. J’aime transformer une stratégie en contenus concrets, mesurer ce qui marche et former les équipes.'
      : 'Five years of experience in digital communications for brands and institutions in West Africa. I enjoy turning a strategy into concrete content, measuring what works and training teams.',
    experiences: [
      {
        role: fr ? 'Chargée de communication digitale' : 'Digital communications officer', organization: 'Agence Horizon', place: 'Dakar', start: '2022', end: fr ? 'Aujourd’hui' : 'Present',
        details: fr
          ? '- Pilotage des réseaux sociaux de 8 clients (banque, santé, tourisme)\n- Hausse de 40 % de l’engagement en un an\n- Campagnes publicitaires Meta et LinkedIn'
          : '- Managed the social media of 8 clients (banking, health, tourism)\n- Grew engagement by 40% in one year\n- Ran Meta and LinkedIn ad campaigns',
      },
      {
        role: fr ? 'Assistante marketing' : 'Marketing assistant', organization: 'Teranga Telecom', place: 'Dakar', start: '2020', end: '2022',
        details: fr ? '- Animation de la communauté (250 000 abonnés)\n- Rédaction des newsletters mensuelles' : '- Community management (250,000 followers)\n- Wrote the monthly newsletters',
      },
    ],
    education: [{ role: fr ? 'Master Communication et Marketing' : 'Master’s in Communication and Marketing', organization: 'Université Cheikh Anta Diop', place: 'Dakar', start: '2018', end: '2020', details: '' }],
    skills: fr ? 'Stratégie social media\nCanva, Figma\nRédaction web et SEO\nMeta Ads, LinkedIn Ads\nGoogle Analytics' : 'Social media strategy\nCanva, Figma\nWeb writing and SEO\nMeta Ads, LinkedIn Ads\nGoogle Analytics',
    languages: fr ? 'Français — courant\nWolof — natif\nAnglais — professionnel' : 'French — fluent\nWolof — native\nEnglish — professional',
    interests: fr ? 'Photographie, bénévolat associatif, course à pied' : 'Photography, volunteering, running',
  };
}

function isCvData(value: unknown): value is CvData {
  const cv = value as CvData;
  return Boolean(cv) && typeof cv === 'object' && typeof cv.fullName === 'string' && Array.isArray(cv.experiences) && Array.isArray(cv.education);
}

export function CvGenerator() {
  const locale = useLocale();
  const isClient = useIsClient();
  // The draft lives in this browser: the server renders a placeholder.
  if (!isClient) return <div className="h-[32rem] animate-pulse rounded-xl bg-slate-100" />;
  const draft = readDraft(DRAFT_KEY, isCvData);
  return <CvEditor initial={draft ? { ...emptyCv(), ...draft } : sampleCv(locale)} />;
}

type EntryList = 'experiences' | 'education';

function CvEditor({ initial }: { initial: CvData }) {
  const t = copy[useLocale()];
  const kit = usePdfKit();
  const photoInput = useRef<HTMLInputElement>(null);
  const [cv, setCv] = useState(initial);
  const [photoError, setPhotoError] = useState('');
  useDraftSaving(DRAFT_KEY, cv);
  const pages = useMemo(() => (kit ? layoutCv(cv, t.sections, kit.measure) : null), [kit, cv, t]);

  const set = <K extends keyof CvData>(key: K, value: CvData[K]) => setCv((current) => ({ ...current, [key]: value }));
  const updateEntry = (list: EntryList, index: number, key: keyof CvEntry, value: string) => setCv((current) => ({
    ...current,
    [list]: current[list].map((entry, position) => (position === index ? { ...entry, [key]: value } : entry)),
  }));
  const moveEntry = (list: EntryList, index: number, offset: number) => setCv((current) => {
    const entries = [...current[list]];
    [entries[index], entries[index + offset]] = [entries[index + offset], entries[index]];
    return { ...current, [list]: entries };
  });
  const removeEntry = (list: EntryList, index: number) => setCv((current) => ({ ...current, [list]: current[list].filter((_, position) => position !== index) }));
  const addEntry = (list: EntryList) => setCv((current) => ({ ...current, [list]: [...current[list], { ...EMPTY_ENTRY }] }));

  const choosePhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      set('photo', (await imageToDataUrl(file, 480, { square: true })).src);
      setPhotoError('');
    } catch {
      setPhotoError(t.photoFailed);
    }
  };

  const clearAll = () => {
    if (!window.confirm(t.confirmClear)) return;
    forgetDraft(DRAFT_KEY);
    setCv(emptyCv());
  };

  const download = () => {
    if (!kit || !pages) return;
    const base = ['CV', ...cv.fullName.trim().split(/\s+/)].filter(Boolean).join('-');
    savePdf(kit, pages, downloadName(`${base}.pdf`, 'pdf', '', 'CV'));
  };

  const chipClass = (active: boolean) => `min-h-9 rounded-lg border px-3 text-sm font-semibold transition ${active ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'}`;
  const iconButton = 'rounded-lg border border-slate-300 bg-white p-1.5 text-slate-600 hover:border-slate-400 disabled:opacity-30';

  const entryEditor = (list: EntryList) => {
    const education = list === 'education';
    return <>
      {cv[list].map((entry, index) => <div key={index} role="group" aria-label={`${index + 1}. ${entry.role || entry.organization || (education ? t.degree : t.role)}`} className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-bold text-slate-500">{index + 1}. {entry.role || entry.organization || (education ? t.degree : t.role)}</p>
          <div className="flex gap-1">
            <button type="button" aria-label={t.moveUp} title={t.moveUp} disabled={index === 0} onClick={() => moveEntry(list, index, -1)} className={iconButton}><ArrowUp className="h-3.5 w-3.5" aria-hidden="true" /></button>
            <button type="button" aria-label={t.moveDown} title={t.moveDown} disabled={index === cv[list].length - 1} onClick={() => moveEntry(list, index, 1)} className={iconButton}><ArrowDown className="h-3.5 w-3.5" aria-hidden="true" /></button>
            <button type="button" aria-label={t.remove} title={t.remove} onClick={() => removeEntry(list, index)} className={`${iconButton} hover:text-rose-600`}><Trash2 className="h-3.5 w-3.5" aria-hidden="true" /></button>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={education ? t.degree : t.role} value={entry.role} onChange={(event) => updateEntry(list, index, 'role', event.target.value)} />
          <Field label={education ? t.school : t.organization} value={entry.organization} onChange={(event) => updateEntry(list, index, 'organization', event.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label={t.place} value={entry.place} onChange={(event) => updateEntry(list, index, 'place', event.target.value)} className="col-span-2 sm:col-span-1" />
          <Field label={t.start} value={entry.start} placeholder="2022" onChange={(event) => updateEntry(list, index, 'start', event.target.value)} />
          <Field label={t.end} value={entry.end} placeholder={t.endPlaceholder} onChange={(event) => updateEntry(list, index, 'end', event.target.value)} />
        </div>
        <TextArea label={t.details} value={entry.details} rows={3} placeholder={t.detailsHint} onChange={(event) => updateEntry(list, index, 'details', event.target.value)} />
      </div>)}
      <button type="button" onClick={() => addEntry(list)} className="inline-flex items-center gap-2 rounded-lg border border-dashed border-slate-400 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-slate-600"><Plus className="h-4 w-4" aria-hidden="true" />{education ? t.addEducation : t.addExperience}</button>
    </>;
  };

  return <div className="space-y-5 text-slate-700">
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
      <div className="flex items-center gap-2" role="group" aria-label={t.template}>
        <span className="text-sm font-semibold text-slate-700">{t.template}</span>
        <button type="button" aria-pressed={cv.template === 'modern'} onClick={() => set('template', 'modern')} className={chipClass(cv.template === 'modern')}>{t.modern}</button>
        <button type="button" aria-pressed={cv.template === 'classic'} onClick={() => set('template', 'classic')} className={chipClass(cv.template === 'classic')}>{t.classic}</button>
      </div>
      <div className="flex items-center gap-2" role="group" aria-label={t.accent}>
        <span className="text-sm font-semibold text-slate-700">{t.accent}</span>
        {CV_ACCENTS.map((color) => <button key={color} type="button" aria-label={t.accentName(color)} aria-pressed={cv.accent === color} onClick={() => set('accent', color)} className={`h-7 w-7 rounded-full border-2 transition ${cv.accent === color ? 'border-slate-900 ring-2 ring-slate-300' : 'border-white ring-1 ring-slate-300'}`} style={{ backgroundColor: color }} />)}
      </div>
    </div>

    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
      <div className="space-y-3">
        <FormSection title={t.identity}>
          <div className="flex items-center gap-3">
            <input ref={photoInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={choosePhoto} />
            {/* eslint-disable-next-line @next/next/no-img-element -- local data URL */}
            {cv.photo ? <img src={cv.photo} alt="" className="h-14 w-14 rounded-full object-cover" /> : <span className="grid h-14 w-14 place-items-center rounded-full bg-slate-100 text-slate-400"><Camera className="h-5 w-5" aria-hidden="true" /></span>}
            <button type="button" onClick={() => photoInput.current?.click()} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:border-slate-400">{cv.photo ? t.changePhoto : t.addPhoto}</button>
            {cv.photo && <button type="button" onClick={() => set('photo', '')} className="text-sm font-semibold text-slate-500 hover:text-rose-600">{t.removePhoto}</button>}
          </div>
          {photoError && <p role="alert" className="text-sm text-rose-700">{photoError}</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t.fullName} value={cv.fullName} autoComplete="name" onChange={(event) => set('fullName', event.target.value)} />
            <Field label={t.title} value={cv.title} onChange={(event) => set('title', event.target.value)} />
            <Field label={t.email} type="email" value={cv.email} autoComplete="email" onChange={(event) => set('email', event.target.value)} />
            <Field label={t.phone} type="tel" value={cv.phone} autoComplete="tel" onChange={(event) => set('phone', event.target.value)} />
            <Field label={t.location} value={cv.location} onChange={(event) => set('location', event.target.value)} />
            <Field label={t.website} value={cv.website} onChange={(event) => set('website', event.target.value)} />
          </div>
        </FormSection>
        <FormSection title={t.sections.profile}>
          <TextArea label={t.summary} value={cv.summary} rows={4} placeholder={t.summaryHint} onChange={(event) => set('summary', event.target.value)} />
        </FormSection>
        <FormSection title={t.sections.experience}>{entryEditor('experiences')}</FormSection>
        <FormSection title={t.sections.education}>{entryEditor('education')}</FormSection>
        <FormSection title={`${t.skills}, ${t.languages.toLowerCase()}, ${t.interests.toLowerCase()}`}>
          <TextArea label={t.skills} value={cv.skills} rows={4} placeholder={t.listHint} onChange={(event) => set('skills', event.target.value)} />
          <TextArea label={t.languages} value={cv.languages} rows={3} placeholder={t.listHint} onChange={(event) => set('languages', event.target.value)} />
          <TextArea label={t.interests} value={cv.interests} rows={2} onChange={(event) => set('interests', event.target.value)} />
        </FormSection>
      </div>

      <div className="space-y-3 lg:sticky lg:top-24 lg:self-start">
        <DocumentPreview pages={pages} labels={t} />
        <button type="button" disabled={!pages} onClick={download} className="btn-download flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 py-3"><Download className="h-5 w-5" aria-hidden="true" />{t.download}</button>
        <button type="button" onClick={clearAll} className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-slate-500 hover:text-rose-600"><Eraser className="h-4 w-4" aria-hidden="true" />{t.clear}</button>
      </div>
    </div>
    <p className="text-xs text-slate-500">{t.privacy}</p>
  </div>;
}
