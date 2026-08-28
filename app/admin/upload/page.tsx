'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  Upload,
  Sparkles,
  Loader2,
  Check,
  AlertCircle,
  ChevronLeft,
  Save,
  Edit3,
  X,
  Eye,
  Image as ImageIcon,
  FileText,
  Headphones,
} from 'lucide-react';


type BookMetadata = {
  title: string;
  author: string;
  description: string;
  longDescription: string;
  category: string;
  tags: string[];
  language: string;
  estimatedAudioHours: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  totalChapters: number;
  suggestedRights: string;
  totalPages?: number;
};

type UploadState =
  | 'idle'
  | 'analyzing'
  | 'publishing'
  | 'success'
  | 'error';

const MAX_AUDIO_SIZE = 2 * 1024 * 1024 * 1024;
const LARGE_AUDIO_THRESHOLD = 90 * 1024 * 1024;
const AUDIO_CHUNK_SIZE = 20 * 1024 * 1024;

function createSlug(title: string) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

function isFreeGuide(metadata: Pick<BookMetadata, 'title' | 'category'>) {
  return /\bguide\b/i.test(`${metadata.title} ${metadata.category}`);
}

async function uploadAudioDirectly(
  audio: File,
  slug: string,
  onProgress: (progress: number) => void
) {
  const signatureResponse = await fetch('/api/admin/audio-upload-signature', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ slug }),
  });
  const signatureData = await signatureResponse.json();

  if (!signatureResponse.ok || !signatureData.success) {
    throw new Error(signatureData.error || 'Impossible de préparer l’envoi audio.');
  }

  const endpoint = `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/video/upload`;
  const sendPart = async (part: Blob, start: number, end: number, uploadId?: string) => {
    const data = new FormData();
    data.append('file', part, audio.name);
    data.append('api_key', signatureData.apiKey);
    data.append('timestamp', String(signatureData.timestamp));
    data.append('signature', signatureData.signature);
    data.append('folder', signatureData.folder);
    data.append('public_id', signatureData.publicId);
    return fetch(endpoint, {
      method: 'POST',
      headers: uploadId
        ? {
            'X-Unique-Upload-Id': uploadId,
            'Content-Range': `bytes ${start}-${end}/${audio.size}`,
          }
        : undefined,
      body: data,
    });
  };

  let response: Response;
  if (audio.size <= LARGE_AUDIO_THRESHOLD) {
    response = await sendPart(audio, 0, audio.size - 1);
    onProgress(100);
  } else {
    const uploadId = crypto.randomUUID();
    let lastResponse: Response | null = null;
    for (let start = 0; start < audio.size; start += AUDIO_CHUNK_SIZE) {
      const end = Math.min(start + AUDIO_CHUNK_SIZE, audio.size) - 1;
      lastResponse = await sendPart(audio.slice(start, end + 1), start, end, uploadId);
      if (!lastResponse.ok) {
        throw new Error('L’envoi audio en plusieurs parties a échoué.');
      }
      onProgress(Math.round(((end + 1) / audio.size) * 100));
    }
    response = lastResponse!;
  }

  const result = await response.json();
  if (!response.ok || !result.public_id) {
    throw new Error(result.error?.message || 'Cloudinary a refusé le fichier audio.');
  }
  return String(result.public_id);
}

const CATEGORIES = [
  'Web Dev',
  'Mobile',
  'Data & IA',
  'Cybersécurité',
  'Cloud',
  'DevOps',
  'Design UI/UX',
  'Histoire / Sciences',
  'Business',
  'Guide pratique',
  'Autre',
];

const RIGHTS_OPTIONS = [
  {
    value: 'public_domain',
    label: 'Domaine public',
    icon: '🌍',
  },
  {
    value: 'cc_by',
    label: 'CC BY',
    icon: '📝',
  },
  {
    value: 'cc_by_sa',
    label: 'CC BY-SA',
    icon: '📝',
  },
  {
    value: 'cc_by_nc',
    label: 'CC BY-NC (non commercial)',
    icon: '⚠️',
  },
  {
    value: 'cc_by_nc_sa',
    label: 'CC BY-NC-SA (non commercial)',
    icon: '⚠️',
  },
  {
    value: 'original',
    label: 'Œuvre originale',
    icon: '✍️',
  },
];

export default function AdminUploadPage() {
  const router = useRouter();
  const publicSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const coverInputRef =
    useRef<HTMLInputElement>(null);

  const audioInputRef =
    useRef<HTMLInputElement>(null);

  const [state, setState] =
    useState<UploadState>('idle');

  const [progress, setProgress] =
    useState(0);

  const [error, setError] =
    useState('');

  const [file, setFile] =
    useState<File | null>(null);

  const [coverFile, setCoverFile] =
    useState<File | null>(null);

  const [audioFile, setAudioFile] =
    useState<File | null>(null);

  const [audioOnlyMode, setAudioOnlyMode] =
    useState(false);

  const [metadata, setMetadata] =
    useState<BookMetadata | null>(null);

  const [isAdmin, setIsAdmin] =
    useState(false);

  const [authChecked, setAuthChecked] =
    useState(false);

  const [publishedSlug, setPublishedSlug] =
    useState('');

  /*
   * ============================================================
   * AUTHENTIFICATION ADMIN
   * ============================================================
   */

  useEffect(() => {
    fetch('/api/admin/stats', { credentials: 'include', cache: 'no-store' })
      .then((response) => {
        if (!response.ok) {
          router.replace('/admin/login');
          return;
        }
        setIsAdmin(true);
      })
      .catch(() => {
        setError('Impossible de vérifier tes droits administrateur.');
      })
      .finally(() => setAuthChecked(true));
  }, [router]);

  /*
   * ============================================================
   * VALIDATION PDF
   * ============================================================
   */

  const validatePdf = (selectedFile: File) => {
    const isPdf =
      selectedFile.type === 'application/pdf' ||
      selectedFile.name
        .toLowerCase()
        .endsWith('.pdf');

    if (!isPdf) {
      setError(
        'Seuls les fichiers PDF sont acceptés.'
      );

      return false;
    }

    if (selectedFile.size === 0) {
      setError(
        'Le fichier PDF est vide.'
      );

      return false;
    }

    const maxSize =
      50 * 1024 * 1024;

    if (selectedFile.size > maxSize) {
      setError(
        'Le fichier est trop volumineux. Taille maximale : 50 MB.'
      );

      return false;
    }

    return true;
  };

  const isAudioFile = (selectedFile: File) =>
    selectedFile.type.startsWith('audio/') || /\.(mp3|m4a|aac|wav|ogg|flac|mp4)$/i.test(selectedFile.name);

  const startAudioBook = (selectedFile: File) => {
    if (!isAudioFile(selectedFile)) {
      setError('Choisis un PDF, un MP3, un M4A ou un AAC.');
      return;
    }
    if (selectedFile.size === 0 || selectedFile.size > MAX_AUDIO_SIZE) {
      setError('Le fichier audio doit faire entre 1 octet et 2 GB.');
      return;
    }
    const title = selectedFile.name.replace(/\.(mp3|m4a|aac|wav|ogg|flac|mp4)$/i, '').replace(/[_-]+/g, ' ').trim();
    setFile(null);
    setAudioFile(selectedFile);
    setAudioOnlyMode(true);
    setError('');
    setMetadata({
      title: title || 'Livre audio sans titre', author: '', description: '', longDescription: '',
      category: 'Autre', tags: [], language: 'fr', estimatedAudioHours: 0,
      difficulty: 'intermediate', totalChapters: 1, suggestedRights: 'original', totalPages: 0,
    });
  };

  /*
   * ============================================================
   * DRAG & DROP
   * ============================================================
   */

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>
  ) => {
    e.preventDefault();

    const droppedFile =
      e.dataTransfer.files?.[0];

    if (!droppedFile) return;

    if (isAudioFile(droppedFile)) return startAudioBook(droppedFile);
    if (!validatePdf(droppedFile)) return;

    setFile(droppedFile);
    setAudioOnlyMode(false);
    analyzeFile(droppedFile);
  };

  /*
   * ============================================================
   * FILE INPUT
   * ============================================================
   */

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selected =
      e.target.files?.[0];

    if (!selected) return;

    if (isAudioFile(selected)) return startAudioBook(selected);
    if (!validatePdf(selected)) return;

    setFile(selected);
    setAudioOnlyMode(false);
    analyzeFile(selected);
  };

  /*
   * ============================================================
   * ANALYSE DU PDF
   * ============================================================
   */

  const analyzeFile = async (
    selectedFile: File
  ) => {
    setState('analyzing');
    setProgress(10);
    setError('');

    try {
      setProgress(20);

      setProgress(30);

      const formData =
        new FormData();

      formData.append(
        'pdf',
        selectedFile
      );

      /*
       * L'API doit savoir qu'il s'agit
       * uniquement d'une analyse.
       */
      formData.append(
        'action',
        'analyze'
      );

      setProgress(40);

      const response =
        await fetch(
          '/api/admin/upload-book',
          {
            method: 'POST',

            credentials: 'include',

            body: formData,
          }
        );

      setProgress(80);

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            'Erreur pendant l’analyse du PDF.'
        );
      }

      if (!data.metadata) {
        throw new Error(
          'Aucune métadonnée reçue par le serveur.'
        );
      }

      /*
       * Mise en forme des métadonnées
       */
      setMetadata({
        title:
          data.metadata.title || '',

        author:
          data.metadata.author || '',

        description:
          data.metadata.description || '',

        longDescription:
          data.metadata.longDescription || '',

        category:
          data.metadata.category ||
          'Autre',

        tags:
          Array.isArray(
            data.metadata.tags
          )
            ? data.metadata.tags
            : [],

        language:
          data.metadata.language ||
          'fr',

        estimatedAudioHours:
          Number(
            data.metadata
              .estimatedAudioHours
          ) || 0,

        difficulty:
          data.metadata.difficulty ===
            'beginner' ||
          data.metadata.difficulty ===
            'advanced'
            ? data.metadata.difficulty
            : 'intermediate',

        totalChapters:
          Number(
            data.metadata.totalChapters
          ) || 1,

        suggestedRights:
          data.metadata
            .suggestedRights ||
          'original',

        totalPages:
          Number(
            data.metadata.totalPages
          ) || 0,
      });

      setProgress(100);

      /*
       * On revient à idle.
       *
       * Le formulaire s'affiche grâce
       * à metadata !== null.
       */
      setState('idle');
    } catch (error: any) {
      console.error(
        'Erreur analyse:',
        error
      );

      setError(
        error?.message ||
          'Erreur pendant l’analyse du PDF.'
      );

      setState('error');
    }
  };

  /*
   * ============================================================
   * PUBLICATION
   * ============================================================
   */

  const handlePublish = async () => {
    if (!file && !audioFile) {
      setError(
        'Aucun fichier PDF sélectionné.'
      );

      return;
    }

    if (!metadata) {
      setError(
        'Les métadonnées du livre sont absentes.'
      );

      return;
    }

    /*
     * Validation du titre
     */
    if (!metadata.title.trim()) {
      setError(
        'Le titre du livre est obligatoire.'
      );

      return;
    }

    /*
     * Validation auteur
     */
    if (!metadata.author.trim()) {
      setError(
        'Le nom de l’auteur est obligatoire.'
      );

      return;
    }

    setState('publishing');
    setProgress(10);
    setError('');

    try {
      setProgress(20);

      setProgress(30);

      let audioPublicId: string | null = null;

      if (audioFile && !isFreeGuide(metadata)) {
        setProgress(35);
        audioPublicId = await uploadAudioDirectly(
          audioFile,
          createSlug(metadata.title),
          (audioProgress) => setProgress(35 + Math.round(audioProgress * 0.35))
        );
      }

      const formData =
        new FormData();

      /*
       * PDF
       */
      if (file) {
        formData.append('pdf', file);
      }

      if (coverFile) {
        formData.append('cover', coverFile);
      }

      if (audioPublicId) {
        formData.append('audioPublicId', audioPublicId);
      }

      /*
       * Métadonnées modifiées
       */
      formData.append(
        'metadata',
        JSON.stringify({
          title:
            metadata.title.trim(),

          author:
            metadata.author.trim(),

          description:
            metadata.description.trim(),

          longDescription:
            metadata.longDescription.trim(),

          category:
            metadata.category,

          tags:
            metadata.tags,

          language:
            metadata.language,

          estimatedAudioHours:
            metadata.estimatedAudioHours,

          difficulty:
            metadata.difficulty,

          totalChapters:
            metadata.totalChapters,

          suggestedRights:
            metadata.suggestedRights,
        })
      );

      /*
       * Cette requête doit publier.
       */
      if (!audioOnlyMode) {
        formData.append('action', 'publish');
      }

      setProgress(40);

      const response =
        await fetch(
          audioOnlyMode ? '/api/admin/publish-audio-book' : '/api/admin/upload-book',
          {
            method: 'POST',

            credentials: 'include',

            body: formData,
          }
        );

      setProgress(80);

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            'Impossible de publier le livre.'
        );
      }

      /*
       * Slug retourné par l'API
       */
      setPublishedSlug(
        data.bookSlug ||
          data.bookId ||
          ''
      );

      setProgress(100);

      setState('success');
    } catch (error: any) {
      console.error(
        'Erreur publication:',
        error
      );

      setError(
        error?.message ||
          'Erreur pendant la publication.'
      );

      setState('error');
    }
  };

  /*
   * ============================================================
   * RESET
   * ============================================================
   */

  const reset = () => {
    setFile(null);
    setMetadata(null);
    setState('idle');
    setProgress(0);
    setError('');
    setPublishedSlug('');

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (coverInputRef.current) {
      coverInputRef.current.value = '';
    }

    if (audioInputRef.current) {
      audioInputRef.current.value = '';
    }

    setCoverFile(null);
    setAudioFile(null);
    setAudioOnlyMode(false);
  };

  /*
   * ============================================================
   * LOADING AUTH
   * ============================================================
   */

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  /*
   * ============================================================
   * ACCÈS REFUSÉ
   * ============================================================
   */

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">

          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-500" />

          <h1 className="text-2xl font-black mb-2">
            Accès refusé
          </h1>

          <Link
            href="/"
            className="text-brand-600 hover:underline"
          >
            Retour à l'accueil
          </Link>

        </div>
      </div>
    );
  }

  /*
   * ============================================================
   * VARIABLE IMPORTANTE
   * ============================================================
   *
   * Cela évite le problème TypeScript :
   *
   * "This comparison appears to be unintentional..."
   *
   */

  const isPublishing =
    state === 'publishing';

  /*
   * ============================================================
   * INTERFACE
   * ============================================================
   */

  return (
    <div>

      <div className="max-w-4xl mx-auto">

        {/* Retour */}

        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Retour à l'admin
        </Link>

        {/* Header */}

        <div className="mb-8">

          <h1 className="text-3xl md:text-4xl font-black mb-2 flex items-center gap-3">

            <Upload className="w-8 h-8 text-brand-600" />

            Upload intelligent d'un livre

          </h1>

          <p className="text-gray-600">
            Dépose ton PDF, l'IA extrait automatiquement
            les métadonnées. Tu peux ensuite les modifier
            avant de publier le livre.
          </p>

        </div>

        {/* Erreur */}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-start gap-2">

            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />

            <span>{error}</span>

            <button
              type="button"
              onClick={() =>
                setError('')
              }
              className="ml-auto"
            >
              <X className="w-4 h-4" />
            </button>

          </div>
        )}

        {/* =====================================================
            ZONE UPLOAD
        ====================================================== */}

        {state === 'idle' &&
          !metadata && (

            <div
              onDrop={handleDrop}
              onDragOver={(e) =>
                e.preventDefault()
              }
              className="bg-white border-2 border-dashed border-gray-300 rounded-3xl p-8 text-center hover:border-brand-400 hover:bg-brand-50/30 transition"
            >

              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,audio/*,.mp3,.m4a,.aac,.wav,.ogg,.flac,.mp4"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center">

                <Upload className="w-10 h-10 text-white" />

              </div>

              <h3 className="text-2xl font-black mb-2">Ajouter une ressource</h3>
              <p className="text-gray-500 mb-6">Choisis le format à publier ou dépose directement ton fichier ici.</p>
              <div className="mx-auto grid max-w-xl gap-3 sm:grid-cols-2">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="group flex items-center gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-left transition hover:-translate-y-1 hover:border-orange-400 hover:shadow-lg">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-orange-500 text-white"><FileText className="h-6 w-6" /></span>
                  <span><strong className="block text-sm font-black text-slate-900">Ajouter un livre PDF</strong><span className="mt-1 block text-xs text-slate-500">Analyse automatique et téléchargement protégé</span></span>
                </button>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="group flex items-center gap-3 rounded-2xl border border-teal-200 bg-teal-50 p-4 text-left transition hover:-translate-y-1 hover:border-teal-400 hover:shadow-lg">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-teal-600 text-white"><Headphones className="h-6 w-6" /></span>
                  <span><strong className="block text-sm font-black text-slate-900">Ajouter un livre audio</strong><span className="mt-1 block text-xs text-slate-500">MP3, M4A ou AAC · upload direct</span></span>
                </button>
              </div>
              <div className="mt-6 inline-flex items-center gap-2 text-sm text-gray-500"><Sparkles className="h-4 w-4 text-amber-500" />Les informations seront modifiables avant publication.</div>
              <p className="mt-4 text-xs text-gray-400">PDF jusqu’à 50 MB · Audio jusqu’à 2 GB</p>

            </div>
          )}

        {/* =====================================================
            ANALYSE / PUBLICATION
        ====================================================== */}

        {(state === 'analyzing' ||
          state === 'publishing') && (

          <div className="bg-white border-2 border-gray-200 rounded-3xl p-8">

            <div className="text-center mb-6">

              <Loader2 className="w-12 h-12 mx-auto mb-3 text-brand-600 animate-spin" />

              <h3 className="text-xl font-black mb-1">

                {state === 'analyzing'
                  ? 'Analyse IA en cours...'
                  : 'Publication du livre...'}

              </h3>

              <p className="text-sm text-gray-500">
                {file?.name}
              </p>

              {file && (
                <p className="text-xs text-gray-400 mt-1">

                  {(
                    file.size /
                    1024 /
                    1024
                  ).toFixed(2)}{' '}
                  MB

                </p>
              )}

            </div>

            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">

              <div
                className="h-full bg-gradient-to-r from-brand-500 to-purple-600 transition-all duration-500"
                style={{
                  width: `${progress}%`,
                }}
              />

            </div>

            <div className="text-center text-xs text-gray-500 mt-2">
              {progress}%
            </div>

          </div>
        )}

        {/* =====================================================
            METADONNEES
        ====================================================== */}

        {metadata &&
          state !== 'success' && (

          <div className="space-y-6">

            {/* Message analyse */}

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">

              <Check className="w-5 h-5 text-emerald-600" />

              <div>

                <div className="font-bold text-emerald-900">
                  Analyse terminée !
                </div>

                <div className="text-sm text-emerald-700">
                  Vérifie et corrige les informations
                  avant de publier.
                </div>

              </div>

            </div>

            {/* Fichier */}

            {file && (

              <div className="bg-white border border-gray-200 rounded-2xl p-4">

                <div className="text-xs text-gray-500 mb-1">
                  Fichier sélectionné
                </div>

                <div className="font-semibold break-all">
                  {file.name}
                </div>

                <div className="text-xs text-gray-500 mt-1">

                  {(
                    file.size /
                    1024 /
                    1024
                  ).toFixed(2)}{' '}
                  MB

                </div>

              </div>
            )}

            {/* Formulaire */}

            <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">

              <h3 className="font-black text-lg mb-4 flex items-center gap-2">

                <Edit3 className="w-4 h-4" />

                Métadonnées du livre

              </h3>

              <div className="space-y-4">

                {/* Titre / auteur */}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div>

                    <label className="block text-sm font-semibold mb-1">
                      Titre *
                    </label>

                    <input
                      type="text"
                      value={metadata.title}
                      disabled={isPublishing}
                      onChange={(e) =>
                        setMetadata({
                          ...metadata,
                          title:
                            e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-brand-500 disabled:bg-gray-100"
                    />

                  </div>

                  <div>

                    <label className="block text-sm font-semibold mb-1">
                      Auteur *
                    </label>

                    <input
                      type="text"
                      value={metadata.author}
                      disabled={isPublishing}
                      onChange={(e) =>
                        setMetadata({
                          ...metadata,
                          author:
                            e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-brand-500 disabled:bg-gray-100"
                    />

                  </div>

                </div>

                {/* Description courte */}

                <div>

                  <label className="block text-sm font-semibold mb-1">
                    Description courte
                  </label>

                  <input
                    type="text"
                    value={metadata.description}
                    maxLength={200}
                    disabled={isPublishing}
                    onChange={(e) =>
                      setMetadata({
                        ...metadata,
                        description:
                          e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-brand-500 disabled:bg-gray-100"
                  />

                  <p className="text-xs text-gray-500 mt-1">

                    {metadata.description.length}
                    /200 caractères

                  </p>

                </div>

                {/* Description longue */}

                <div>

                  <label className="block text-sm font-semibold mb-1">
                    Description longue
                  </label>

                  <textarea
                    value={
                      metadata.longDescription
                    }
                    disabled={isPublishing}
                    onChange={(e) =>
                      setMetadata({
                        ...metadata,
                        longDescription:
                          e.target.value,
                      })
                    }
                    rows={5}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-brand-500 disabled:bg-gray-100"
                  />

                </div>

                {/* Catégorie / difficulté / droits */}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                  <div>

                    <label className="block text-sm font-semibold mb-1">
                      Catégorie
                    </label>

                    <select
                      value={
                        metadata.category
                      }
                      disabled={isPublishing}
                      onChange={(e) =>
                        setMetadata({
                          ...metadata,
                          category:
                            e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-brand-500 disabled:bg-gray-100"
                    >

                      {CATEGORIES.map(
                        (category) => (

                          <option
                            key={category}
                            value={category}
                          >
                            {category}
                          </option>

                        )
                      )}

                    </select>

                  </div>

                  <div>

                    <label className="block text-sm font-semibold mb-1">
                      Difficulté
                    </label>

                    <select
                      value={
                        metadata.difficulty
                      }
                      disabled={isPublishing}
                      onChange={(e) =>
                        setMetadata({
                          ...metadata,
                          difficulty:
                            e.target
                              .value as BookMetadata['difficulty'],
                        })
                      }
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-brand-500 disabled:bg-gray-100"
                    >

                      <option value="beginner">
                        Débutant
                      </option>

                      <option value="intermediate">
                        Intermédiaire
                      </option>

                      <option value="advanced">
                        Avancé
                      </option>

                    </select>

                  </div>

                  <div>

                    <label className="block text-sm font-semibold mb-1">
                      Droits
                    </label>

                    <select
                      value={
                        metadata.suggestedRights
                      }
                      disabled={isPublishing}
                      onChange={(e) =>
                        setMetadata({
                          ...metadata,
                          suggestedRights:
                            e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-brand-500 disabled:bg-gray-100"
                    >

                      {RIGHTS_OPTIONS.map(
                        (right) => (

                          <option
                            key={right.value}
                            value={right.value}
                          >
                            {right.icon}{' '}
                            {right.label}
                          </option>

                        )
                      )}

                    </select>

                  </div>

                </div>

                {/* Tags */}

                <div>

                  <label className="block text-sm font-semibold mb-1">
                    Tags
                  </label>

                  <input
                    type="text"
                    value={
                      metadata.tags.join(
                        ', '
                      )
                    }
                    disabled={isPublishing}
                    onChange={(e) =>
                      setMetadata({
                        ...metadata,
                        tags:
                          e.target.value
                            .split(',')
                            .map((tag) =>
                              tag.trim()
                            )
                            .filter(Boolean),
                      })
                    }
                    placeholder="python, programmation, débutant"
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-brand-500 disabled:bg-gray-100"
                  />

                  <p className="text-xs text-gray-500 mt-1">
                    Sépare les tags avec des virgules.
                  </p>

                </div>

                {/* Langue */}

                <div>

                  <label className="block text-sm font-semibold mb-1">
                    Langue
                  </label>

                  <input
                    type="text"
                    value={
                      metadata.language
                    }
                    disabled={isPublishing}
                    onChange={(e) =>
                      setMetadata({
                        ...metadata,
                        language:
                          e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-brand-500 disabled:bg-gray-100"
                  />

                </div>

                {/* Informations */}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">

                  <div className="bg-gray-50 rounded-lg p-3">

                    <div className="text-xs text-gray-500">
                      Pages
                    </div>

                    <div className="text-xl font-black">
                      {metadata.totalPages ||
                        'N/A'}
                    </div>

                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">

                    <div className="text-xs text-gray-500">
                      Chapitres
                    </div>

                    <div className="text-xl font-black">
                      {
                        metadata.totalChapters
                      }
                    </div>

                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">

                    <div className="text-xs text-gray-500">
                      Durée audio
                    </div>

                    <div className="text-xl font-black">
                      {
                        metadata.estimatedAudioHours
                      }h
                    </div>

                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">

                    <div className="text-xs text-gray-500">
                      Taille
                    </div>

                    <div className="text-xl font-black">

                      {file
                        ? (
                            file.size /
                            1024 /
                            1024
                          ).toFixed(1)
                        : '0'}{' '}
                      MB

                    </div>

                  </div>

                </div>

              </div>

            </div>

            {/* Couverture */}

            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 shrink-0 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold">Image de couverture</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Facultative. Sans image, la première page du PDF sera utilisée automatiquement.
                  </p>
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(event) => {
                      const selected = event.target.files?.[0] ?? null;
                      if (selected && selected.size > 5 * 1024 * 1024) {
                        setError('La couverture ne doit pas dépasser 5 MB.');
                        event.target.value = '';
                        return;
                      }
                      setError('');
                      setCoverFile(selected);
                    }}
                  />
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <button type="button" onClick={() => coverInputRef.current?.click()} className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-100">
                      {coverFile ? 'Changer l’image' : 'Choisir une image'}
                    </button>
                    {coverFile && <span className="text-sm text-gray-600 truncate max-w-xs">{coverFile.name}</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Livre audio */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 shrink-0 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center">
                  <Headphones className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold">Livre audio</h3>
                  {isFreeGuide(metadata) ? (
                    <p className="mt-1 text-sm text-amber-700">Les guides sont gratuits et ne proposent pas de version audio.</p>
                  ) : (
                    <>
                      <p className="mt-1 text-sm text-gray-500">Facultatif. MP3, M4A ou AAC, jusqu’à 2 GB. Les gros fichiers sont envoyés directement vers Cloudinary par morceaux.</p>
                      <input
                        ref={audioInputRef}
                        type="file"
                        accept="audio/*,.mp3,.m4a,.aac,.wav,.ogg,.flac,.mp4"
                        className="hidden"
                        onChange={(event) => {
                          const selected = event.target.files?.[0] ?? null;
                          const accepted = selected && (/\.(mp3|m4a|aac|wav|ogg|flac|mp4)$/i.test(selected.name) || selected.type.startsWith('audio/'));
                          if (selected && !accepted) {
                            setError('Choisis un fichier audio MP3, M4A ou AAC.');
                            event.target.value = '';
                            return;
                          }
                          if (selected && selected.size > MAX_AUDIO_SIZE) {
                            setError('Le fichier audio ne doit pas dépasser 2 GB.');
                            event.target.value = '';
                            return;
                          }
                          setError('');
                          setAudioFile(selected);
                        }}
                      />
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <button type="button" onClick={() => audioInputRef.current?.click()} className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-100">
                          {audioFile ? 'Changer l’audio' : 'Choisir un audio'}
                        </button>
                        {audioFile && <span className="max-w-xs truncate text-sm text-gray-600">{audioFile.name} · {(audioFile.size / 1024 / 1024).toFixed(1)} MB</span>}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Avertissement */}

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-800">

              <div className="font-semibold mb-1">
                📋 Prêt à publier
              </div>

              <p>
                Les modifications seront enregistrées
                dans Firestore et le PDF sera envoyé
                sur Cloudinary lorsque tu cliqueras
                sur « Valider et publier ».
              </p>

            </div>

            {/* Progression pendant publication */}

            {isPublishing && (

              <div className="bg-white border-2 border-gray-200 rounded-2xl p-5">

                <div className="flex items-center gap-3 mb-3">

                  <Loader2 className="w-5 h-5 text-brand-600 animate-spin" />

                  <span className="font-semibold">
                    Publication du livre...
                  </span>

                  <span className="ml-auto text-sm text-gray-500">
                    {progress}%
                  </span>

                </div>

                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">

                  <div
                    className="h-full bg-gradient-to-r from-brand-500 to-purple-600 transition-all duration-500"
                    style={{
                      width: `${progress}%`,
                    }}
                  />

                </div>

              </div>
            )}

            {/* Boutons */}

            <div className="flex flex-col sm:flex-row gap-3">

              <button
                type="button"
                onClick={reset}
                disabled={isPublishing}
                className="px-5 py-3 border-2 border-gray-200 rounded-xl font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={handlePublish}
                disabled={isPublishing}
                className="flex-1 bg-gradient-to-r from-brand-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition"
              >

                {isPublishing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Publication...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Valider et publier
                  </>
                )}

              </button>

            </div>

          </div>
        )}

        {/* =====================================================
            SUCCESS
        ====================================================== */}

        {state === 'success' &&
          metadata && (

          <div className="bg-white border-2 border-emerald-200 rounded-3xl p-8 text-center">

            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">

              <Check className="w-10 h-10 text-white" />

            </div>

            <h2 className="text-2xl font-black mb-2">
              Livre publié ! 🎉
            </h2>

            <p className="text-gray-600 mb-6">

              <strong>
                {metadata.title}
              </strong>{' '}
              a été ajouté à JcHub.

            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">

              {publishedSlug && (

                <Link
                  href={`/livres/${publishedSlug}`}
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-brand-600 to-purple-600 text-white px-5 py-2.5 rounded-xl font-semibold"
                >

                  <Eye className="w-4 h-4" />

                  Voir la page

                </Link>

              )}

              <Link
                href="/admin"
                className="inline-flex items-center justify-center px-5 py-2.5 border-2 border-gray-200 rounded-xl font-semibold hover:bg-gray-50"
              >
                Tableau de bord
              </Link>

              <button
                type="button"
                onClick={reset}
                className="px-5 py-2.5 border-2 border-gray-200 rounded-xl font-semibold hover:bg-gray-50"
              >
                Uploader un autre
              </button>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
