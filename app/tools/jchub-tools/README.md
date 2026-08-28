# 🛠️ JcHub Dev Tools — Standalone

**8 outils dev prêts à l'emploi** pour React/Next.js/Tailwind. Copie-colle dans ton projet.

## 📦 Contenu

| Fichier | Description | Dep externe |
|---|---|---|
| `JwtDecoder.tsx` | Décode header/payload/signature d'un JWT | Non |
| `HashGenerator.tsx` | MD5, SHA-1, SHA-256, SHA-512 | Non |
| `TimestampConverter.tsx` | Unix ↔ Date, ISO 8601, UTC | Non |
| `UrlEncoder.tsx` | encodeURI / decodeURI / encodeURIComponent | Non |
| `ColorConverter.tsx` | HEX ↔ RGB ↔ HSL avec aperçu live | Non |
| `QrCodeGenerator.tsx` | QR codes avec presets (URL, email, WiFi) | `qrcode` |
| `MarkdownPreview.tsx` | Éditeur + preview live (parser custom) | Non |
| `NumberBaseConverter.tsx` | BIN ↔ OCT ↔ DEC ↔ HEX | Non |

## ⚙️ Installation

```bash
# Deps communes
npm install lucide-react

# Seulement pour QR Code
npm install qrcode
npm install --save-dev @types/qrcode
```

## 🚀 Utilisation

### 1. Copier les fichiers

Copie les `.tsx` dans ton projet (par exemple `components/tools/`).

### 2. Importer et utiliser

```tsx
import { JwtDecoder } from '@/components/tools/JwtDecoder';
import { HashGenerator } from '@/components/tools/HashGenerator';
// etc.

export default function MyPage() {
  return <JwtDecoder />;
}
```

### 3. Pour Next.js App Router

Les composants sont en `'use client'` (client-side), donc tu peux les utiliser directement dans des pages.

## 📋 Stack requise

- **React 18+**
- **Tailwind CSS** (tous les styles utilisent les classes Tailwind)
- **TypeScript** (tous les fichiers sont `.tsx` typés)
- **lucide-react** (icônes)

## 🎨 Personnalisation

Tous les composants utilisent :
- Couleurs Tailwind par défaut (modifiables dans `tailwind.config.ts`)
- Classes utilitaires (faciles à override)
- Lucide icons (remplaçables par d'autres libs)

## 💡 Exemples d'usage

### Page avec onglets

```tsx
'use client';
import { useState } from 'react';
import { JwtDecoder } from '@/components/tools/JwtDecoder';
import { HashGenerator } from '@/components/tools/HashGenerator';

export default function ToolsPage() {
  const [tab, setTab] = useState('jwt');
  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('jwt')}>JWT</button>
        <button onClick={() => setTab('hash')}>Hash</button>
      </div>
      {tab === 'jwt' ? <JwtDecoder /> : <HashGenerator />}
    </div>
  );
}
```

### Standalone dans un site statique

```html
<!-- Dans une page HTML classique -->
<script type="module">
  import { JwtDecoder } from './tools/JwtDecoder.tsx';
  // ...
</script>
```

## 📝 Notes

- **Web Crypto API** : utilisée pour SHA (build-in navigateur, ultra-rapide)
- **MD5** : implémenté en pur JS (legacy, déprécié mais toujours utile)
- **Markdown parser** : custom (pas de dep), gère titres/lists/quote/code/links
- **QR Code** : utilise la lib `qrcode` (à installer séparément)

## 📄 Licence

Open source — utilise, modifie, redistribue librement.
