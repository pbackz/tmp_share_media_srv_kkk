# Partage Temporaire de Médias

Application web simple et moderne pour partager des fichiers via des liens temporaires sécurisés. Sans authentification requise, parfait pour un partage rapide et sécurisé.

## Fonctionnalités

- **Upload facile** : Glisser-déposer ou sélectionner un fichier
- **Liens temporaires** : Choisissez la durée de validité (1h, 6h, 24h, 3 jours, 1 semaine)
- **Prévisualisation** : Images, vidéos et PDFs affichés directement
- **Sécurisé** : Les fichiers sont automatiquement supprimés après expiration
- **Sans authentification** : Utilisation immédiate sans compte
- **Responsive** : Interface moderne qui s'adapte à tous les écrans

## Technologies

- **Next.js 15** : Framework React avec App Router
- **TypeScript** : Pour un code robuste et maintenable
- **Tailwind CSS** : Design moderne et responsive
- **Nanoid** : Génération d'identifiants uniques
- **Vercel** : Hébergement serverless

## Installation locale

1. Clonez le projet ou accédez au dossier :
```bash
cd temp-media-share
```

2. Installez les dépendances :
```bash
npm install
```

3. Lancez le serveur de développement :
```bash
npm run dev
```

4. Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur

## Déploiement sur Vercel

### Option 1 : Via l'interface Vercel (Recommandé)

1. Créez un compte sur [Vercel](https://vercel.com)
2. Installez Vercel CLI :
```bash
npm install -g vercel
```

3. Dans le dossier du projet, lancez :
```bash
vercel
```

4. Suivez les instructions :
   - Login avec votre compte Vercel
   - Confirmez le nom du projet
   - Acceptez les paramètres par défaut

5. Votre application sera déployée en quelques secondes!

### Option 2 : Via GitHub

1. Poussez votre code sur GitHub :
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <votre-repo-github>
git push -u origin main
```

2. Sur [Vercel](https://vercel.com) :
   - Cliquez sur "New Project"
   - Importez votre repository GitHub
   - Vercel détectera automatiquement Next.js
   - Cliquez sur "Deploy"

### Option 3 : Autres plateformes SaaS

#### Netlify
1. Installez Netlify CLI : `npm install -g netlify-cli`
2. Lancez : `netlify deploy --prod`

#### Railway
1. Créez un compte sur [Railway](https://railway.app)
2. Connectez votre repo GitHub
3. Railway détectera automatiquement Next.js

## Configuration

### Limites de fichiers

Par défaut, la limite est de 10 MB par fichier. Pour la modifier :
- Éditez `next.config.js` : `bodySizeLimit`
- Éditez `app/api/upload/route.ts` : `maxSize`

### Durées d'expiration

Les durées sont configurables dans `app/page.tsx` (ligne 67-72).

## Structure du projet

```
temp-media-share/
├── app/
│   ├── api/
│   │   ├── upload/          # API d'upload
│   │   └── file/[id]/       # API de récupération
│   ├── share/[id]/          # Page de visualisation
│   ├── layout.tsx           # Layout principal
│   ├── page.tsx             # Page d'accueil
│   └── globals.css          # Styles globaux
├── lib/
│   └── storage.ts           # Gestion du stockage
├── data/                    # Fichiers uploadés (auto-généré)
├── next.config.js
├── package.json
└── README.md
```

## Utilisation

### 1. Upload d'un fichier
- Accédez à la page d'accueil
- Sélectionnez un fichier (max 10 MB)
- Choisissez la durée de validité
- Cliquez sur "Générer le lien de partage"

### 2. Partage du lien
- Copiez le lien généré
- Partagez-le avec qui vous voulez
- Le lien expirera automatiquement après la durée choisie

### 3. Accès au fichier partagé
- Les destinataires cliquent sur le lien
- Ils peuvent visualiser ou télécharger le fichier
- Le fichier est automatiquement supprimé après expiration

## Sécurité

- ✅ Pas d'authentification requise (volontaire pour simplicité)
- ✅ Liens uniques générés aléatoirement (nanoid)
- ✅ Expiration automatique des fichiers
- ✅ Nettoyage automatique des fichiers expirés
- ✅ Validation de la taille des fichiers
- ⚠️ Pour un usage en production, considérez :
  - Rate limiting pour éviter les abus
  - Validation stricte des types MIME
  - Scan antivirus des fichiers uploadés
  - Stockage cloud (S3, Cloudflare R2) au lieu du système de fichiers

## Limitations de la version actuelle

- Stockage local (fichiers perdus si le serveur redémarre sur Vercel)
- Pas de rate limiting
- Pas de scan antivirus

## Améliorations futures possibles

- [ ] Intégration avec Vercel Blob Storage ou AWS S3
- [ ] Rate limiting avec Upstash
- [ ] Statistiques d'utilisation
- [ ] Génération de QR codes
- [ ] Protection par mot de passe optionnelle
- [ ] Prévisualisation pour plus de types de fichiers

## Licence

MIT - Libre d'utilisation

## Support

Pour toute question ou problème, ouvrez une issue sur le repository.
