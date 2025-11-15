# Guide de déploiement sur Cloudflare Pages

Ce guide vous explique comment corriger l'erreur 500 et déployer correctement votre application sur Cloudflare Pages avec R2 et KV.

## Problème identifié

L'erreur 500 sur `/api/upload` est causée par :
1. Les variables d'environnement non configurées dans Cloudflare Pages
2. Le stockage des métadonnées en mémoire qui est réinitialisé à chaque requête sur l'Edge Runtime

## Solution

### Étape 1 : Créer un KV Namespace pour les métadonnées

1. Connectez-vous à votre dashboard Cloudflare
2. Allez dans **Workers & Pages** > **KV**
3. Cliquez sur **Create namespace**
4. Nommez-le `temp-media-share-metadata`
5. Notez l'ID du namespace créé

### Étape 2 : Configurer les variables d'environnement dans Cloudflare Pages

1. Allez dans **Pages** > **Votre projet (flash-share.uk)**
2. Cliquez sur **Settings** > **Environment variables**
3. Ajoutez les variables suivantes (pour Production ET Preview) :

```
R2_ACCOUNT_ID = votre_account_id_cloudflare
R2_ACCESS_KEY_ID = votre_r2_access_key_id
R2_SECRET_ACCESS_KEY = votre_r2_secret_access_key
R2_BUCKET_NAME = temp-media-share
```

**Comment obtenir ces valeurs :**

- `R2_ACCOUNT_ID` : Trouvez-le dans l'URL de votre dashboard (ex: `https://dash.cloudflare.com/ACCOUNT_ID/...`)
- `R2_ACCESS_KEY_ID` et `R2_SECRET_ACCESS_KEY` :
  1. Allez dans **R2** > **Manage R2 API Tokens**
  2. Cliquez sur **Create API Token**
  3. Donnez les permissions "Object Read & Write"
  4. Notez l'Access Key ID et le Secret Access Key

### Étape 3 : Lier le KV Namespace à votre projet

1. Dans **Pages** > **Votre projet** > **Settings** > **Functions**
2. Scrollez jusqu'à **KV namespace bindings**
3. Cliquez sur **Add binding**
4. Variable name : `METADATA_KV`
5. KV namespace : Sélectionnez `temp-media-share-metadata`
6. Cliquez sur **Save**

### Étape 4 : Vérifier que le bucket R2 existe

1. Allez dans **R2** > **Overview**
2. Vérifiez que le bucket `temp-media-share` existe
3. Si ce n'est pas le cas, créez-le avec le nom exact `temp-media-share`

### Étape 5 : Redéployer l'application

Les modifications de code ont déjà été faites. Il vous suffit de :

```bash
git add .
git commit -m "fix: Update R2 storage to use KV and fix environment variables"
git push
```

Cloudflare Pages redéploiera automatiquement.

## Vérification

Après le déploiement :

1. Allez sur https://flash-share.uk/
2. Essayez d'uploader un fichier
3. L'upload devrait maintenant fonctionner

## Logs de débogage

Pour voir les logs en temps réel :

1. Allez dans **Pages** > **Votre projet**
2. Cliquez sur le dernier déploiement
3. Cliquez sur **View logs** ou **Functions logs**
4. Les logs `console.log()` y apparaîtront

## Architecture mise à jour

- **Fichiers** : Stockés dans Cloudflare R2
- **Métadonnées** : Stockées dans Cloudflare KV (avec expiration automatique)
- **Runtime** : Cloudflare Edge Runtime
- **Limite de taille** : 1GB par fichier
- **Durée de conservation** : 1h à 168h (7 jours)

## Fallback local

Le code inclut un fallback pour le développement local :
- Si KV n'est pas disponible, les métadonnées sont stockées en mémoire
- Si les variables d'environnement ne sont pas trouvées, `process.env` est utilisé

## Troubleshooting

### Erreur "R2 not configured"

Vérifiez que les 4 variables d'environnement sont bien définies dans Cloudflare Pages.

### Erreur "KV not available"

Vérifiez que le binding `METADATA_KV` est bien configuré dans les settings du projet Pages.

### Fichiers qui disparaissent après quelques minutes

C'est normal si vous n'utilisez pas KV - la mémoire de l'Edge Runtime est éphémère. Configurez KV pour résoudre ce problème.

### Upload qui échoue avec erreur 500

Consultez les logs Functions dans le dashboard Cloudflare Pages pour voir l'erreur exacte.

## Support

Pour plus d'aide :
- [Documentation Cloudflare R2](https://developers.cloudflare.com/r2/)
- [Documentation Cloudflare KV](https://developers.cloudflare.com/kv/)
- [Documentation Next.js sur Cloudflare](https://developers.cloudflare.com/pages/framework-guides/nextjs/)
