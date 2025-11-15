# Déploiement sur Cloudflare Pages - Guide Complet

Ce guide vous explique comment déployer votre application de partage temporaire de médias sur **Cloudflare Pages** avec **Cloudflare R2** pour le stockage.

## 🎯 Pourquoi Cloudflare Pages ?

✅ **Gratuit** : 500 builds/mois, bande passante illimitée
✅ **Rapide** : CDN global Cloudflare
✅ **Intégration R2** : Stockage et hébergement dans un seul écosystème
✅ **Déploiement automatique** : Via Git
✅ **Domaines personnalisés** : Gratuit avec HTTPS

## 📋 Prérequis

1. Compte Cloudflare (gratuit)
2. Bucket Cloudflare R2 créé (voir [CLOUDFLARE_R2_SETUP.md](./CLOUDFLARE_R2_SETUP.md))
3. Code sur GitHub/GitLab

## 🚀 Méthode 1 : Déploiement via l'interface (Recommandé)

### Étape 1 : Préparer le code

```bash
# Si pas encore sur Git
git init
git add .
git commit -m "Initial commit"

# Créer repo GitHub
gh repo create temp-media-share --public --source=. --push

# Ou manuellement
git remote add origin https://github.com/USERNAME/temp-media-share.git
git branch -M main
git push -u origin main
```

### Étape 2 : Connecter à Cloudflare Pages

1. Allez sur [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Menu gauche → **Workers & Pages**
3. Cliquez sur **Create application**
4. Sélectionnez **Pages**
5. Cliquez **Connect to Git**

### Étape 3 : Configuration du projet

1. **Sélectionnez votre repository** : `temp-media-share`
2. **Configuration du build** :
   - **Project name** : `temp-media-share` (ou un nom cool)
   - **Production branch** : `main`
   - **Framework preset** : `Next.js` (auto-détecté)
   - **Build command** : `npm run build`
   - **Build output directory** : `.next`

3. Cliquez sur **Save and Deploy**

### Étape 4 : Ajouter les variables d'environnement

1. Une fois déployé, allez dans **Settings** → **Environment variables**
2. Ajoutez ces 4 variables (Production + Preview) :

```
R2_ACCOUNT_ID=votre_account_id
R2_ACCESS_KEY_ID=votre_access_key_id
R2_SECRET_ACCESS_KEY=votre_secret_access_key
R2_BUCKET_NAME=temp-media-share
```

3. Cliquez **Save**

### Étape 5 : Redéployer

1. Allez dans **Deployments**
2. Cliquez **Retry deployment** sur le dernier build
3. Attendez ~2 minutes

🎉 **Votre site est en ligne !**

## 🖥️ Méthode 2 : Déploiement via Wrangler CLI

### Installation

```bash
# Installer Wrangler globalement
npm install -g wrangler

# Se connecter à Cloudflare
wrangler login
```

### Configuration

```bash
# Installer l'adaptateur Next.js pour Cloudflare
npm install -D @cloudflare/next-on-pages
```

### Build et déploiement

```bash
# Build pour Cloudflare Pages
npx @cloudflare/next-on-pages@1

# Déployer
wrangler pages deploy .vercel/output/static --project-name=temp-media-share

# Avec variables d'environnement
wrangler pages publish .vercel/output/static \
  --project-name=temp-media-share \
  --env production
```

### Ajouter les variables via CLI

```bash
# Ajouter une variable
wrangler pages secret put R2_ACCOUNT_ID
# Entrez la valeur quand demandé

# Ou toutes en une fois
echo "R2_ACCOUNT_ID=xxx" | wrangler pages secret bulk .env.production
```

## 🔧 Configuration avancée

### Domaine personnalisé

1. Dans Cloudflare Pages → **Custom domains**
2. Cliquez **Set up a custom domain**
3. Entrez votre domaine (ex: `share.votredomaine.com`)
4. Suivez les instructions DNS
5. HTTPS est automatiquement configuré

### Build caching

Cloudflare Pages cache automatiquement :
- `node_modules`
- `.next/cache`

Pour forcer un rebuild complet :
```bash
wrangler pages deploy .vercel/output/static --skip-caching
```

### Déploiements preview

Chaque push sur une branche crée un déploiement preview :
- **Production** : `https://temp-media-share.pages.dev`
- **Preview** : `https://branch-name.temp-media-share.pages.dev`

### Fonctions Edge (Optionnel)

Pour des fonctionnalités avancées, créez `functions/` :

```typescript
// functions/api/hello.ts
export async function onRequest(context) {
  return new Response("Hello from Edge!");
}
```

## 🧪 Tester le déploiement

### 1. Vérifier que R2 est actif

Uploadez un fichier et vérifiez les logs :
1. Cloudflare Pages → **Deployments** → Dernier déploiement
2. Cliquez **View logs**
3. Cherchez : "Using Cloudflare R2 storage"

### 2. Tester avec gros fichiers

- Essayez un fichier de 100-500 MB
- Vérifiez dans Cloudflare R2 que le fichier apparaît

### 3. Vérifier l'expiration

- Uploadez avec durée courte (1h)
- Vérifiez que le fichier est supprimé après expiration

## 📊 Monitoring

### Analytics Cloudflare

1. Dans Cloudflare Pages → **Analytics**
2. Visualisez :
   - Nombre de requêtes
   - Bande passante utilisée
   - Temps de réponse
   - Erreurs

### Logs en temps réel

```bash
# Via Wrangler
wrangler pages deployment tail --project-name=temp-media-share
```

## 🔒 Sécurité

### Variables secrètes

Les variables d'environnement Cloudflare sont :
- ✅ Chiffrées au repos
- ✅ Jamais exposées dans les logs
- ✅ Accessibles uniquement en runtime

### Rate Limiting

Activez Cloudflare Rate Limiting :
1. Dashboard → **Security** → **WAF**
2. Créez une règle pour `/api/upload`
3. Limite : 10 requêtes/minute par IP

## 💰 Coûts

### Cloudflare Pages (Gratuit)
- ✅ 500 builds/mois
- ✅ Bande passante illimitée
- ✅ Requêtes illimitées
- ✅ Déploiements preview illimités

### Cloudflare R2 (Gratuit tier)
- ✅ 10 GB stockage/mois
- ✅ 10M requêtes Class A/mois
- ✅ 10M requêtes Class B/mois
- 💵 Au-delà : ~$0.015/GB

**Total pour commencer : 0€** 🎉

## 🐛 Dépannage

### Build échoue

**Erreur** : "Module not found"
```bash
# Localement, testez le build
npm run build

# Si ça marche, purgez le cache Cloudflare
wrangler pages deployment tail
```

### Variables non détectées

**Erreur** : "R2 not configured"
```bash
# Vérifiez les variables
wrangler pages secret list --project-name=temp-media-share

# Redéployez
git commit --allow-empty -m "Trigger rebuild"
git push
```

### Timeouts sur gros fichiers

Cloudflare Pages a une limite de 30s par requête :
- Utilisez du chunking pour fichiers >500MB
- Ou passez à Cloudflare Workers ($5/mois, 30s → illimité)

## 🚀 Optimisations

### Cache navigateur

Ajoutez dans `next.config.js` :
```javascript
async headers() {
  return [
    {
      source: '/api/file/:id',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ];
}
```

### Compression

Cloudflare compresse automatiquement :
- Brotli (pour navigateurs modernes)
- Gzip (fallback)

### CDN Cache

Cloudflare cache automatiquement :
- Images, CSS, JS
- Fichiers statiques

## 📚 Ressources

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Next.js on Cloudflare](https://developers.cloudflare.com/pages/framework-guides/nextjs/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- [Cloudflare R2](https://developers.cloudflare.com/r2/)

## ✅ Checklist finale

- [ ] Code sur GitHub
- [ ] Projet créé sur Cloudflare Pages
- [ ] Variables R2 configurées
- [ ] Premier déploiement réussi
- [ ] Upload test OK
- [ ] R2 stockage vérifié
- [ ] Domaine personnalisé (optionnel)
- [ ] Analytics activées

🎉 **Félicitations ! Votre app est en ligne sur Cloudflare !**
