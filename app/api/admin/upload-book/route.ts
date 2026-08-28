import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-auth';
import {
  extractPdfFromBuffer,
  getPdfSample,
} from '@/lib/pdf-extract';
import { extractBookMetadata } from '@/lib/gemini';
import { v2 as cloudinary } from 'cloudinary';

export const runtime = 'nodejs';
export const maxDuration = 60;

type UploadResponse = {
  success: boolean;
  bookId?: string;
  bookSlug?: string;
  metadata?: any;
  message?: string;
  error?: string;
};

/*
|--------------------------------------------------------------------------
| CLOUDINARY
|--------------------------------------------------------------------------
*/

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/*
|--------------------------------------------------------------------------
| SLUG
|--------------------------------------------------------------------------
*/

function generateSlug(title: string): string {
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

/*
|--------------------------------------------------------------------------
| DROITS
|--------------------------------------------------------------------------
*/

function getRightsNote(rights: string): string {
  const notes: Record<string, string> = {
    public_domain: 'Domaine public',
    cc_by: 'CC BY — commercialisable avec attribution',
    cc_by_sa:
      'CC BY-SA — commercialisable avec attribution et partage à l’identique',
    cc_by_nc: 'CC BY-NC — utilisation non commerciale',
    cc_by_nc_sa:
      'CC BY-NC-SA — utilisation non commerciale',
    original: 'Œuvre originale',
  };

  return notes[rights] || 'À définir';
}

/*
|--------------------------------------------------------------------------
| PRIX
|--------------------------------------------------------------------------
*/

function getBookPrice(pages: number): number {
  if (pages < 100) {
    return 499;
  }

  if (pages <= 250) {
    return 999;
  }

  return 1999;
}

function isFreeGuide(metadata: {
  title?: string;
  category?: string;
}) {
  return /\bguide\b/i.test(
    `${metadata.title || ''} ${metadata.category || ''}`
  );
}

/*
|--------------------------------------------------------------------------
| UPLOAD PDF CLOUDINARY
|--------------------------------------------------------------------------
*/

async function uploadPdfToCloudinary(
  buffer: Buffer,
  publicId: string
): Promise<{
  publicId: string;
  secureUrl: string;
}> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        public_id: publicId,
        overwrite: false,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result) {
          reject(
            new Error(
              'Cloudinary n’a retourné aucun résultat.'
            )
          );
          return;
        }

        resolve({
          publicId: result.public_id,
          secureUrl: result.secure_url,
        });
      }
    );

    uploadStream.end(buffer);
  });
}

/*
|--------------------------------------------------------------------------
| UPLOAD COUVERTURE CLOUDINARY
|--------------------------------------------------------------------------
*/

async function uploadCoverToCloudinary(
  buffer: Buffer,
  publicId: string,
  isPdfFallback = false
): Promise<{
  publicId: string;
  secureUrl: string;
}> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        public_id: publicId,
        overwrite: false,
        eager: [
          {
            width: 600,
            height: 800,
            crop: 'fill',
            gravity: 'auto',
            format: 'webp',
            ...(isPdfFallback ? { page: 1 } : {}),
          },
        ],
      },
      (error, result) => {
        if (error || !result) {
          reject(
            error ??
              new Error(
                'Cloudinary n’a retourné aucune couverture.'
              )
          );
          return;
        }

        resolve({
          publicId: result.public_id,
          secureUrl:
            result.eager?.[0]?.secure_url ??
            result.secure_url,
        });
      }
    );

    uploadStream.end(buffer);
  });
}

/*
|--------------------------------------------------------------------------
| AUTH ADMIN
|--------------------------------------------------------------------------
*/

async function verifyAdmin(req: NextRequest) {
  return requireAdmin(req);
}

/*
|--------------------------------------------------------------------------
| POST
|--------------------------------------------------------------------------
*/

export async function POST(
  req: NextRequest
): Promise<NextResponse<UploadResponse>> {
  try {
    /*
    |--------------------------------------------------------------------------
    | 1. Vérifier admin
    |--------------------------------------------------------------------------
    */

    const decoded = await verifyAdmin(req);

    const adminDb = getAdminDb();

    /*
    |--------------------------------------------------------------------------
    | 2. Récupérer FormData
    |--------------------------------------------------------------------------
    */

    const formData = await req.formData();

    const fileValue = formData.get('pdf');

    if (!(fileValue instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Aucun fichier PDF fourni.',
        },
        {
          status: 400,
        }
      );
    }

    const file = fileValue;

    const coverValue = formData.get('cover');
    const coverFile =
      coverValue instanceof File ? coverValue : null;

    if (
      coverFile &&
      (
        !coverFile.type.startsWith('image/') ||
        coverFile.size > 5 * 1024 * 1024
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'La couverture doit être une image de 5 MB maximum.',
        },
        {
          status: 400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | 3. Vérifier PDF
    |--------------------------------------------------------------------------
    */

    if (
      !file.name
        .toLowerCase()
        .endsWith('.pdf')
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Le fichier doit être un PDF.',
        },
        {
          status: 400,
        }
      );
    }

    const MAX_SIZE = 50 * 1024 * 1024;

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Le PDF ne doit pas dépasser 50 MB.',
        },
        {
          status: 400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | 4. Action
    |--------------------------------------------------------------------------
    */

    const action = String(
      formData.get('action') || 'analyze'
    );

    /*
    |--------------------------------------------------------------------------
    | 5. Lire PDF
    |--------------------------------------------------------------------------
    */

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let pdfData;

    try {
      pdfData = await extractPdfFromBuffer(buffer);
    } catch (error) {
      console.error('Erreur PDF:', error);

      return NextResponse.json(
        {
          success: false,
          error: 'Impossible de lire le PDF.',
        },
        {
          status: 400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | 6. Extraire texte
    |--------------------------------------------------------------------------
    */

    const textSample = getPdfSample(
      pdfData.text,
      6000
    );

    /*
    |--------------------------------------------------------------------------
    | 7. Informations PDF
    |--------------------------------------------------------------------------
    */

    const existingInfo = {
      title: pdfData.info?.Title || '',
      author: pdfData.info?.Author || '',
      keywords: pdfData.info?.Keywords || '',
    };

    /*
    |--------------------------------------------------------------------------
    | 8. Gemini
    |--------------------------------------------------------------------------
    */

    let aiMetadata;

    try {
      aiMetadata = await extractBookMetadata(
        textSample,
        existingInfo
      );
    } catch (error) {
      console.error(
        'Gemini indisponible:',
        error
      );

      const fileTitle = file.name
        .replace(/\.pdf$/i, '')
        .replace(/[_-]+/g, ' ');

      aiMetadata = {
        title:
          existingInfo.title ||
          fileTitle ||
          'Livre sans titre',

        author:
          existingInfo.author ||
          'Auteur inconnu',

        description:
          'Livre ajouté à JcHub.',

        longDescription:
          pdfData.info?.Subject ||
          'Description à compléter.',

        category: 'Autre',

        tags: existingInfo.keywords
          ? existingInfo.keywords
              .split(',')
              .map((tag: string) => tag.trim())
              .filter(Boolean)
              .slice(0, 10)
          : [],

        language: 'fr',

        estimatedAudioHours:
          Math.round(
            ((pdfData.numPages * 2) / 60) * 10
          ) / 10,

        difficulty: 'intermediate',

        totalChapters: Math.max(
          1,
          Math.floor(pdfData.numPages / 15)
        ),

        suggestedRights: 'original',
      };
    }

    /*
    |--------------------------------------------------------------------------
    | 9. Nettoyer les métadonnées
    |--------------------------------------------------------------------------
    */

    aiMetadata = {
      title: String(
        aiMetadata.title ||
          'Livre sans titre'
      ).trim(),

      author: String(
        aiMetadata.author ||
          'Auteur inconnu'
      ).trim(),

      description: String(
        aiMetadata.description ||
          'Livre ajouté à JcHub.'
      ).trim(),

      longDescription: String(
        aiMetadata.longDescription ||
          'Description à compléter.'
      ).trim(),

      category: String(
        aiMetadata.category ||
          'Autre'
      ).trim(),

      tags: Array.isArray(aiMetadata.tags)
        ? aiMetadata.tags
            .map((tag: unknown) =>
              String(tag).trim()
            )
            .filter(Boolean)
        : [],

      language: String(
        aiMetadata.language || 'fr'
      ).trim(),

      estimatedAudioHours:
        Number(
          aiMetadata.estimatedAudioHours
        ) || 0,

      difficulty: [
        'beginner',
        'intermediate',
        'advanced',
      ].includes(aiMetadata.difficulty)
        ? aiMetadata.difficulty
        : 'intermediate',

      totalChapters:
        Number(
          aiMetadata.totalChapters
        ) ||
        Math.max(
          1,
          Math.floor(
            pdfData.numPages / 15
          )
        ),

      suggestedRights: String(
        aiMetadata.suggestedRights ||
          'original'
      ),
    };

    /*
    |--------------------------------------------------------------------------
    | 10. Métadonnées modifiées par l’admin
    |--------------------------------------------------------------------------
    */

    const metadataValue =
      formData.get('metadata');

    if (metadataValue) {
      try {
        const override = JSON.parse(
          String(metadataValue)
        );

        aiMetadata = {
          ...aiMetadata,
          ...override,
        };
      } catch {
        return NextResponse.json(
          {
            success: false,
            error: 'Métadonnées invalides.',
          },
          {
            status: 400,
          }
        );
      }
    }

    /*
    |--------------------------------------------------------------------------
    | 11. MODE ANALYSE
    |
    | Aucun Firestore.
    | Aucun Cloudinary.
    |--------------------------------------------------------------------------
    */

    if (action === 'analyze') {
      return NextResponse.json(
        {
          success: true,
          metadata: {
            ...aiMetadata,
            totalPages: pdfData.numPages,
          },
          message:
            'Analyse terminée. Le livre n’a pas encore été publié.',
        },
        {
          status: 200,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | 12. MODE PUBLICATION
    |--------------------------------------------------------------------------
    */

    if (action !== 'publish') {
      return NextResponse.json(
        {
          success: false,
          error: 'Action inconnue.',
        },
        {
          status: 400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | 13. Vérifications
    |--------------------------------------------------------------------------
    */

    if (!aiMetadata.title?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Le titre est obligatoire.',
        },
        {
          status: 400,
        }
      );
    }

    if (!aiMetadata.author?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'L’auteur est obligatoire.',
        },
        {
          status: 400,
        }
      );
    }

    const isGuide = isFreeGuide(aiMetadata);
    const audioPublicId = String(formData.get('audioPublicId') || '').trim();

    /*
    |--------------------------------------------------------------------------
    | 14. Slug
    |--------------------------------------------------------------------------
    */

    const slug = generateSlug(
      aiMetadata.title
    );

    if (!slug) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Impossible de générer le slug.',
        },
        {
          status: 400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | 15. Vérifier doublon
    |--------------------------------------------------------------------------
    */

    const bookRef = adminDb
      .collection('books')
      .doc(slug);

    const existingBook =
      await bookRef.get();

    if (existingBook.exists) {
      return NextResponse.json(
        {
          success: false,
          error:
            `Le livre "${slug}" existe déjà.`,
        },
        {
          status: 409,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | 16. Cloudinary
    |--------------------------------------------------------------------------
    */

    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Cloudinary n’est pas configuré.',
        },
        {
          status: 500,
        }
      );
    }

    let audioResult: {
      publicId: string;
      secureUrl: string;
      duration: number | null;
      bytes: number | null;
      format: string | null;
    } | null = null;

    if (audioPublicId) {
      if (isGuide) {
        return NextResponse.json(
          { success: false, error: 'Un guide gratuit ne peut pas avoir de version audio.' },
          { status: 400 }
        );
      }

      const expectedAudioId = `jchub/books/audio/${slug}-full`;
      if (audioPublicId !== expectedAudioId) {
        return NextResponse.json(
          { success: false, error: 'Le fichier audio ne correspond pas à ce livre.' },
          { status: 400 }
        );
      }

      try {
        const resource = await cloudinary.api.resource(audioPublicId, {
          resource_type: 'video',
        });
        audioResult = {
          publicId: resource.public_id,
          secureUrl: resource.secure_url,
          duration: typeof resource.duration === 'number' ? resource.duration : null,
          bytes: typeof resource.bytes === 'number' ? resource.bytes : null,
          format: typeof resource.format === 'string' ? resource.format : null,
        };
      } catch (error) {
        console.error('Cloudinary audio:', error);
        return NextResponse.json(
          { success: false, error: 'Le fichier audio n’a pas pu être vérifié sur Cloudinary.' },
          { status: 400 }
        );
      }
    }

    /*
    |--------------------------------------------------------------------------
    | 17. Upload PDF
    |--------------------------------------------------------------------------
    */

    const pdfPublicId =
      `jchub/books/pdfs/${slug}`;

    let cloudinaryResult;

    try {
      cloudinaryResult =
        await uploadPdfToCloudinary(
          buffer,
          pdfPublicId
        );
    } catch (error) {
      console.error(
        'Cloudinary:',
        error
      );

      return NextResponse.json(
        {
          success: false,
          error:
            'Erreur pendant l’upload du PDF vers Cloudinary.',
        },
        {
          status: 500,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | 18. Upload couverture
    |--------------------------------------------------------------------------
    */

    const coverPublicId =
      `jchub/books/covers/${slug}`;

    let coverResult;

    try {
      const coverBuffer = coverFile
        ? Buffer.from(
            await coverFile.arrayBuffer()
          )
        : buffer;

      coverResult =
        await uploadCoverToCloudinary(
          coverBuffer,
          coverPublicId,
          !coverFile
        );
    } catch (error) {
      console.error(
        'Cloudinary couverture:',
        error
      );

      return NextResponse.json(
        {
          success: false,
          error:
            'Erreur pendant la création de la couverture.',
        },
        {
          status: 500,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | 19. Document Firestore
    |--------------------------------------------------------------------------
    */

    const bookDoc = {
      slug,

      title:
        aiMetadata.title,

      author:
        aiMetadata.author,

      description:
        aiMetadata.description,

      longDescription:
        aiMetadata.longDescription,

      category:
        aiMetadata.category,

      tags:
        aiMetadata.tags,

      tags_array:
        aiMetadata.tags,

      language:
        aiMetadata.language,

      totalPages:
        pdfData.numPages,

      estimatedAudioHours:
        aiMetadata.estimatedAudioHours,

      difficulty:
        aiMetadata.difficulty,

      totalChapters:
        aiMetadata.totalChapters,

      rights:
        aiMetadata.suggestedRights,

      rightsNote:
        getRightsNote(
          aiMetadata.suggestedRights
        ),

      pricing:
        isGuide
          ? 'free'
          : 'freemium',

      oneTimePriceXAF:
        isGuide
          ? 0
          : getBookPrice(
              pdfData.numPages
            ),

      /*
      |--------------------------------------------------------------------------
      | CLOUDINARY
      |--------------------------------------------------------------------------
      */

      pdfPublicId:
        cloudinaryResult.publicId,

      pdfUrl:
        cloudinaryResult.secureUrl,

      coverPublicId:
        coverResult.publicId,

      cover:
        coverResult.secureUrl,

      /*
      |--------------------------------------------------------------------------
      | AUDIO
      |--------------------------------------------------------------------------
      */

      audioStatus:
        isGuide
          ? 'not_available'
          : audioResult
            ? 'available'
            : 'coming_soon',

      audioUrl: audioResult?.secureUrl ?? null,

      audioPublicId: audioResult?.publicId ?? null,

      audioDurationSeconds: audioResult?.duration ?? null,

      audioFileSize: audioResult?.bytes ?? null,

      audioFormat: audioResult?.format ?? null,

      /*
      |--------------------------------------------------------------------------
      | STATUT
      |--------------------------------------------------------------------------
      */

      status:
        'available',

      isFeatured:
        false,

      /*
      |--------------------------------------------------------------------------
      | ADMIN
      |--------------------------------------------------------------------------
      */

      uploadedBy:
        decoded.id,

      uploadedAt:
        new Date(),

      createdAt:
        new Date(),

      updatedAt:
        new Date(),

      /*
      |--------------------------------------------------------------------------
      | FICHIER ORIGINAL
      |--------------------------------------------------------------------------
      */

      originalFileName:
        file.name,

      originalFileSize:
        file.size,

      pdfPageCount:
        pdfData.numPages,
    };

    /*
    |--------------------------------------------------------------------------
    | 20. FIRESTORE
    |--------------------------------------------------------------------------
    */

    await bookRef.set(
      bookDoc
    );

    /*
    |--------------------------------------------------------------------------
    | 21. LOG ADMIN
    |--------------------------------------------------------------------------
    */

    await adminDb
      .collection('admin_logs')
      .add({
        action:
          'book_publish',

        adminUid:
          decoded.id,

        bookSlug:
          slug,

        bookTitle:
          aiMetadata.title,

        timestamp:
          new Date(),

        aiMetadata,

        pdf: {
          fileName:
            file.name,

          fileSize:
            file.size,

          cloudinaryPublicId:
            cloudinaryResult.publicId,
        },

        audio: audioResult && {
          cloudinaryPublicId: audioResult.publicId,
          duration: audioResult.duration,
          fileSize: audioResult.bytes,
        },
      });

    /*
    |--------------------------------------------------------------------------
    | 22. RÉPONSE
    |--------------------------------------------------------------------------
    */

    return NextResponse.json(
      {
        success: true,

        bookId:
          slug,

        bookSlug:
          slug,

        metadata: {
          ...bookDoc,

          totalPages:
            pdfData.numPages,

          cloudinaryPublicId:
            cloudinaryResult.publicId,

          pdfUrl:
            cloudinaryResult.secureUrl,
        },

        message:
          `Livre "${aiMetadata.title}" publié avec succès !`,
      },
      {
        status: 201,
      }
    );
  } catch (error: any) {
    console.error(
      'Erreur upload-book:',
      error
    );

    /*
    |--------------------------------------------------------------------------
    | ERREURS AUTH
    |--------------------------------------------------------------------------
    */

    if (
      error?.message ===
      'UNAUTHORIZED'
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Authentification requise.',
        },
        {
          status: 401,
        }
      );
    }

    if (
      error?.message ===
      'INVALID_TOKEN'
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Session Firebase invalide ou expirée.',
        },
        {
          status: 401,
        }
      );
    }

    if (
      error?.message ===
      'FORBIDDEN'
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Accès administrateur requis.',
        },
        {
          status: 403,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | ERREUR GÉNÉRALE
    |--------------------------------------------------------------------------
    */

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          'Erreur interne du serveur.',
      },
      {
        status: 500,
      }
    );
  }
}

/*
|--------------------------------------------------------------------------
| GET — HEALTH CHECK
|--------------------------------------------------------------------------
*/

export async function GET() {
  return NextResponse.json({
    status: 'ok',

    endpoint:
      'upload-book',

    description:
      'Analyse et publication intelligente des livres.',

    actions: [
      'analyze',
      'publish',
    ],

    required: {
      method: 'POST',

      auth:
        'Bearer <firebase-id-token>',

      body:
        'multipart/form-data',

      fields: [
        'pdf',
        'metadata',
        'action',
      ],
    },

    cloudinaryConfigured:
      Boolean(
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
      ),
  });
}
