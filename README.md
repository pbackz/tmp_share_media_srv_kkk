# Partage Temporaire de Médias

Application web simple et moderne pour partager des fichiers via des liens temporaires sécurisés. Sans authentification requise, parfait pour un partage rapide et sécurisé.

## Fonctionnalités

- **Upload facile** : Glisser-déposer ou sélectionner un fichier
- **Liens temporaires** : Choisissez la durée de validité (1h, 6h, 24h, 3 jours, 1 semaine)
- **Prévisualisation** : Images, vidéos et PDFs affichés directement
- **Sécurisé** : Les fichiers sont automatiquement supprimés après expiration
- **Sans authentification** : Utilisation immédiate sans compte
- **Responsive** : Interface moderne qui s'adapte à tous les écrans
- **Cloudflare R2** : Stockage cloud fiable jusqu'à 1GB par fichier

## Technologies

- **Next.js 15** : Framework React avec App Router
- **TypeScript** : Pour un code robuste et maintenable
- **Tailwind CSS** : Design moderne et responsive
- **Nanoid** : Génération d'identifiants uniques
- **Cloudflare R2** : Stockage d'objets compatible S3
- **Cloudflare Pages** : Hébergement serverless global

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

## Déploiement sur Cloudflare Pages

### Prérequis

1. Un compte Cloudflare (gratuit)
2. Un bucket Cloudflare R2 configuré (voir `CLOUDFLARE_R2_SETUP.md`)

### Déploiement via l'interface Cloudflare

1. Poussez votre code sur GitHub :
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <votre-repo-github>
git push -u origin main
```

2. Sur [Cloudflare Dashboard](https://dash.cloudflare.com) :
   - Allez dans **Workers & Pages**
   - Cliquez sur **Create application** > **Pages**
   - Connectez votre repository GitHub
   - Configuration du build :
     - **Framework preset** : Next.js
     - **Build command** : `npm run build`
     - **Build output directory** : `.next`
   - Ajoutez les variables d'environnement (voir section ci-dessous)
   - Cliquez sur **Save and Deploy**

### Variables d'environnement

Dans les paramètres de votre projet Cloudflare Pages, ajoutez :

```
R2_ACCOUNT_ID=votre_account_id
R2_ACCESS_KEY_ID=votre_access_key_id
R2_SECRET_ACCESS_KEY=votre_secret_access_key
R2_BUCKET_NAME=temp-media-share
```

### Déploiement via Wrangler CLI

```bash
# Installer Wrangler
npm install -g wrangler

# Se connecter
wrangler login

# Déployer
npx @cloudflare/next-on-pages@1
wrangler pages deploy .vercel/output/static
```

## Configuration

### Limites de fichiers

Par défaut, la limite est de 1 GB par fichier avec Cloudflare R2. Pour la modifier :
- Éditez `next.config.js` : `bodySizeLimit`
- Éditez `app/api/upload/route.ts` : `maxSize`

### Durées d'expiration

Les durées sont configurables dans `app/page.tsx` (lignes avec les options de select).

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
│   ├── r2-storage.ts        # Gestion Cloudflare R2
│   └── storage-stream.ts    # Fallback stockage local
├── data/                    # Fichiers uploadés (auto-généré)
├── next.config.js
├── package.json
└── README.md
```

## Utilisation

### 1. Upload d'un fichier
- Accédez à la page d'accueil
- Sélectionnez un fichier (max 1 GB avec R2)
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
- ✅ Stockage cloud sécurisé (Cloudflare R2)

### Pour un usage en production, considérez :
- Rate limiting (Cloudflare Rate Limiting)
- Validation stricte des types MIME
- Scan antivirus des fichiers uploadés
- Base de données pour les métadonnées (Cloudflare D1)

## Améliorations futures possibles

- [ ] Cloudflare D1 pour les métadonnées
- [ ] Rate limiting avec Cloudflare
- [ ] Statistiques d'utilisation
- [ ] Génération de QR codes
- [ ] Protection par mot de passe optionnelle
- [ ] Prévisualisation pour plus de types de fichiers
- [ ] Cloudflare Workers Analytics

## Coûts (Cloudflare)

- **Cloudflare Pages** : Gratuit (500 builds/mois)
- **Cloudflare R2** : Gratuit jusqu'à 10GB stockage/mois
- **Domaine personnalisé** : Gratuit avec Cloudflare Pages

## Licence

MIT - Libre d'utilisation

## Support

Pour toute question, consultez :
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)
- [Next.js Docs](https://nextjs.org/docs)
