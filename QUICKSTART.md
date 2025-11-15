# Guide de démarrage rapide

## Démarrage local (2 minutes)

```bash
cd ~/temp-media-share
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000)

## Déploiement sur Cloudflare Pages (5 minutes)

### Méthode 1 : Via l'interface Cloudflare (Recommandé)

1. **Poussez sur GitHub** :
```bash
git init
git add .
git commit -m "Initial commit: Temp media share app"
gh repo create temp-media-share --public --source=. --push
```

2. **Déployez via Cloudflare** :
   - Allez sur [Cloudflare Dashboard](https://dash.cloudflare.com)
   - **Workers & Pages** → **Create application** → **Pages**
   - Connectez votre repo GitHub
   - Framework: **Next.js** (auto-détecté)
   - Cliquez **Save and Deploy**

3. **Ajoutez vos variables R2** (Settings → Environment variables) :
   ```
   R2_ACCOUNT_ID=xxx
   R2_ACCESS_KEY_ID=xxx
   R2_SECRET_ACCESS_KEY=xxx
   R2_BUCKET_NAME=temp-media-share
   ```

4. **Redéployez** et votre site sera en ligne!

### Méthode 2 : CLI avec Wrangler

```bash
# 1. Installer Wrangler
npm install -g wrangler

# 2. Se connecter
wrangler login

# 3. Construire pour Cloudflare Pages
npx @cloudflare/next-on-pages@1

# 4. Déployer
wrangler pages deploy .vercel/output/static --project-name=temp-media-share
```

## Configurer Cloudflare R2

Voir le guide complet : [CLOUDFLARE_R2_SETUP.md](./CLOUDFLARE_R2_SETUP.md)

**Résumé rapide** :
1. Dashboard Cloudflare → **R2** → **Create bucket** (`temp-media-share`)
2. **Manage R2 API Tokens** → **Create API token**
3. Copiez vos credentials
4. Ajoutez-les dans Cloudflare Pages Settings

## Tester l'application

1. **Téléverser un fichier** :
   - Glissez une image/PDF sur la page
   - Choisissez la durée (ex: 1 heure)
   - Cliquez "Générer le lien de partage"

2. **Partager** :
   - Copiez le lien généré
   - Ouvrez-le dans un nouvel onglet ou partagez-le

3. **Vérifier l'expiration** :
   - Les fichiers sont automatiquement supprimés après expiration

## Personnalisation rapide

### Changer les couleurs
Éditez `app/globals.css` :
```css
body {
  @apply bg-gradient-to-br from-purple-50 to-pink-100;
}
```

### Modifier la limite de taille
Éditez `app/api/upload/route.ts` ligne 22 :
```typescript
const maxSize = 2 * 1024 * 1024 * 1024; // 2GB au lieu de 1GB
```

### Ajouter des durées d'expiration
Éditez `app/page.tsx` :
```tsx
<option value="12">12 heures</option>
<option value="48">2 jours</option>
```

## Problèmes courants

**Q: Les fichiers disparaissent après redémarrage?**
R: Configurez Cloudflare R2 pour un stockage persistant cloud.

**Q: "Module not found" lors du build?**
R: Relancez `npm install`

**Q: Erreur "R2 not configured"?**
R: Ajoutez vos variables d'environnement R2 dans Cloudflare Pages Settings.

## URL de démonstration

Une fois déployé, votre URL ressemblera à :
- `https://temp-media-share.pages.dev`
- Ou avec domaine custom: `https://votredomaine.com`

Vous pouvez configurer un domaine personnalisé dans les paramètres Cloudflare Pages.

## Commandes utiles

```bash
# Développement local
npm run dev

# Build production
npm run build

# Vérifier le build
npm run start

# Déployer sur Cloudflare
npx @cloudflare/next-on-pages@1
wrangler pages deploy .vercel/output/static
```

## Support

- [Documentation Cloudflare Pages](https://developers.cloudflare.com/pages/)
- [Documentation Cloudflare R2](https://developers.cloudflare.com/r2/)
- [Guide complet R2](./CLOUDFLARE_R2_SETUP.md)
