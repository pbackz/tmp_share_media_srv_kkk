# Configuration Cloudflare R2 - Guide Complet

Ce guide vous permet de configurer Cloudflare R2 pour supporter des fichiers jusqu'à **1 GB** (et même plus si besoin).

## 🎯 Pourquoi Cloudflare R2 ?

✅ **Gratuit** : 10 GB de stockage/mois
✅ **Rapide** : CDN Cloudflare intégré
✅ **Sans frais de sortie** : Contrairement à AWS S3
✅ **Compatible S3** : API standard
✅ **Fichiers volumineux** : Jusqu'à 5 TB par fichier

## 📋 Étape 1 : Créer un compte Cloudflare

1. Allez sur [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Créez un compte (gratuit)
3. Vérifiez votre email

## 📦 Étape 2 : Créer un bucket R2

1. Dans le dashboard Cloudflare, cliquez sur **R2** dans le menu de gauche
2. Cliquez sur **Create bucket**
3. Nom du bucket : `temp-media-share` (ou ce que vous voulez)
4. Région : Laissez "Automatic" (ou choisissez proche de vos utilisateurs)
5. Cliquez sur **Create bucket**

## 🔑 Étape 3 : Obtenir les credentials API

1. Cliquez sur **Manage R2 API Tokens**
2. Cliquez sur **Create API token**
3. Configuration :
   - **Token name** : `temp-media-share-api`
   - **Permissions** : "Object Read & Write"
   - **TTL** : Laissez vide (pas d'expiration) ou configurez selon vos besoins
   - **Bucket** : Sélectionnez votre bucket `temp-media-share` ou "Apply to all buckets"
4. Cliquez sur **Create API Token**

5. **IMPORTANT** : Copiez ces informations immédiatement (elles ne seront plus affichées) :
   ```
   Access Key ID: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   Secret Access Key: yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
   ```

6. Notez aussi votre **Account ID** :
   - Il est visible dans l'URL : `https://dash.cloudflare.com/<ACCOUNT_ID>/r2/overview`
   - Ou dans les paramètres R2

## ⚙️ Étape 4 : Configuration sur Cloudflare Pages

### Via l'interface Cloudflare Pages :

1. Allez sur [Cloudflare Dashboard](https://dash.cloudflare.com)
2. **Workers & Pages** → Votre projet
3. Cliquez sur **Settings** → **Environment variables**
4. Ajoutez ces 4 variables (pour Production ET Preview) :

```
R2_ACCOUNT_ID=votre_account_id
R2_ACCESS_KEY_ID=votre_access_key_id
R2_SECRET_ACCESS_KEY=votre_secret_access_key
R2_BUCKET_NAME=temp-media-share
```

5. Cliquez **Save**

### Via Wrangler CLI :

```bash
# Ajouter les variables une par une
wrangler pages secret put R2_ACCOUNT_ID --project-name=temp-media-share
# Entrez la valeur quand demandé

wrangler pages secret put R2_ACCESS_KEY_ID --project-name=temp-media-share
wrangler pages secret put R2_SECRET_ACCESS_KEY --project-name=temp-media-share
wrangler pages secret put R2_BUCKET_NAME --project-name=temp-media-share
```

## 🚀 Étape 5 : Redéployer

```bash
cd ~/temp-media-share
git add .
git commit -m "Add Cloudflare R2 integration"
git push
```

Cloudflare Pages va automatiquement redéployer avec les nouvelles variables.

## 🧪 Étape 6 : Tester

1. Allez sur votre site Cloudflare Pages
2. Uploadez un fichier
3. Dans les logs Cloudflare (Deployments → View logs), vous devriez voir :
   ```
   Using Cloudflare R2 storage
   ```
4. Le fichier est maintenant stocké sur Cloudflare R2 !

## 🔍 Vérification

Pour vérifier que R2 est bien activé :

1. **Dans les logs Railway** : Cherchez "Using Cloudflare R2 storage"
2. **Dans Cloudflare Dashboard** :
   - Allez dans R2 > Votre bucket
   - Vous devriez voir vos fichiers uploadés

## 📊 Limites et quotas

### Plan gratuit Cloudflare R2 :
- 10 GB de stockage/mois
- 10 millions de requêtes Class A/mois (write, list)
- 10 millions de requêtes Class B/mois (read)
- **0€ de frais de sortie** (bandwidth gratuit)

Largement suffisant pour commencer!

### Avec R2 configuré :
- ✅ Taille max par fichier : **1 GB** (configurable jusqu'à 5 TB)
- ✅ Pas de limite de mémoire Railway
- ✅ Fichiers persistants (pas perdus au redémarrage)
- ✅ Accès rapide via CDN Cloudflare

## 🐛 Dépannage

### Erreur : "R2 not configured"
- Vérifiez que les 4 variables d'environnement sont bien définies
- Redémarrez le service Railway

### Erreur : "Access Denied"
- Vérifiez vos credentials
- Assurez-vous que l'API token a les permissions "Object Read & Write"
- Vérifiez que le bucket name est correct

### Fichiers non visibles dans R2
- Les métadonnées sont stockées en mémoire (temporaire)
- Pour une solution production, ajoutez une base de données (PostgreSQL, Redis)

## 🎓 Mode avancé

### Utiliser un domaine personnalisé pour R2

1. Dans Cloudflare R2, allez dans votre bucket
2. Cliquez sur **Settings** > **Public Access**
3. Connectez un domaine (ex: `files.votredomaine.com`)
4. Les fichiers seront accessibles via votre domaine

### Augmenter la limite à 5 GB

Modifiez `app/api/upload/route.ts` :
```typescript
const maxSize = useR2
  ? 5 * 1024 * 1024 * 1024 // 5GB with R2
  : 100 * 1024 * 1024;
```

Et `next.config.js` :
```javascript
bodySizeLimit: '5gb',
```

## ✅ C'est tout !

Votre application supporte maintenant des fichiers jusqu'à 1 GB avec Cloudflare R2, tout en conservant le fallback local pour le développement.

Pour toute question : [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
