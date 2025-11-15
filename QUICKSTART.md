# Guide de démarrage rapide

## Démarrage local (2 minutes)

```bash
cd ~/temp-media-share
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000)

## Déploiement sur Vercel (5 minutes)

### Méthode 1 : CLI (Plus rapide)

```bash
# 1. Installer Vercel CLI
npm install -g vercel

# 2. Se connecter
vercel login

# 3. Déployer
cd ~/temp-media-share
vercel --prod
```

Votre site sera en ligne en quelques secondes!

### Méthode 2 : GitHub + Interface Vercel

1. **Initialiser Git et pousser sur GitHub** :
```bash
cd ~/temp-media-share
git init
git add .
git commit -m "Initial commit: Temp media share app"
gh repo create temp-media-share --public --source=. --push
# ou utilisez l'interface GitHub pour créer un repo et:
# git remote add origin https://github.com/USERNAME/temp-media-share.git
# git branch -M main
# git push -u origin main
```

2. **Déployer via Vercel** :
   - Allez sur [vercel.com](https://vercel.com)
   - Cliquez "New Project"
   - Importez votre repo GitHub
   - Cliquez "Deploy" (aucune configuration nécessaire!)

### Méthode 3 : Netlify

```bash
# 1. Installer Netlify CLI
npm install -g netlify-cli

# 2. Se connecter
netlify login

# 3. Déployer
cd ~/temp-media-share
netlify deploy --prod
```

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
   - Testez avec une durée courte (1 heure)

## Personnalisation rapide

### Changer les couleurs
Éditez `app/globals.css` :
```css
body {
  @apply bg-gradient-to-br from-purple-50 to-pink-100;
}
```

### Modifier la limite de taille
Éditez `app/api/upload/route.ts` ligne 15 :
```typescript
const maxSize = 20 * 1024 * 1024; // 20MB au lieu de 10MB
```

### Ajouter des durées d'expiration
Éditez `app/page.tsx` lignes 67-72 :
```tsx
<option value="12">12 heures</option>
<option value="48">2 jours</option>
```

## Problèmes courants

**Q: Les fichiers disparaissent après redémarrage?**
R: Normal! En développement, les fichiers sont dans `/data`. En production sur Vercel, utilisez Vercel Blob Storage.

**Q: "Module not found" lors du build?**
R: Relancez `npm install`

**Q: Le site est lent?**
R: Activez la compression et CDN (automatique sur Vercel)

## URL de démonstration

Une fois déployé, votre URL ressemblera à :
- Vercel: `https://temp-media-share.vercel.app`
- Netlify: `https://temp-media-share.netlify.app`

Vous pouvez configurer un domaine personnalisé dans les paramètres de votre plateforme d'hébergement.
