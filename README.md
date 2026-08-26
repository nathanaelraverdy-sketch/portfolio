# Portfolio statique (sans serveur)

## Structure

- `index.html` — page publique, liste les projets depuis `data/projects.json`
- `project.html` — page d'un projet, affiche ton HTML libre (dans une iframe isolée)
- `admin.html` — interface d'administration : ajouter / modifier / supprimer un projet
- `data/projects.json` — la "base de données", un simple fichier JSON
- `css/style.css`, `js/*.js` — code du site (à ne toucher que si tu veux changer le design)
- `images/` — mets ici les images de tes projets (facultatif)

## Comment ça marche

Tu n'as jamais besoin de retoucher `index.html` ou `project.html`. Pour ajouter un
projet :

1. Ouvre `admin.html` dans **Chrome** (ou un navigateur basé sur Chromium : Edge, Brave…).
2. Clique sur **"Ouvrir data/projects.json"**.
   - Sur Chrome/Edge, ça ouvre le fichier en mode "édition directe" : quand tu cliques
     sur "Enregistrer les modifications", le fichier sur ton disque est mis à jour
     directement, sans rien télécharger.
   - Sur un autre navigateur, le fichier est chargé en mémoire, et à la fin tu cliques
     sur "Enregistrer les modifications" pour **télécharger** le nouveau fichier, que tu
     remplaces ensuite manuellement dans le dossier `data/`.
3. Remplis le formulaire : titre, tags, date, résumé, et surtout le champ
   **"Contenu HTML complet"** — c'est là que tu colles ton propre code HTML/CSS/JS pour
   la page du projet. Il sera affiché tel quel (dans une iframe isolée, donc ton code
   ne peut jamais casser le reste du site, ni inversement).
4. Clique sur "Ajouter le projet", puis sur "Enregistrer les modifications".
5. Ouvre/rafraîchis `index.html` : le projet apparaît automatiquement.

Aucune ligne de code à écrire dans le site lui-même, à chaque nouveau projet — juste
un formulaire, et du HTML dans une case si tu veux du sur-mesure.

## Tester en local

Comme le site charge `data/projects.json` via `fetch`, certains navigateurs bloquent
ça si tu ouvres juste `index.html` en double-cliquant (protocole `file://`). Le plus
simple est de lancer un petit serveur **local**, uniquement pour la prévisualisation
(ce n'est pas un serveur que tu dois maintenir en ligne) :

```bash
cd portfolio
python3 -m http.server 8000
# puis ouvre http://localhost:8000
```

## Mettre en ligne sans serveur

Le site est 100% statique (juste des fichiers HTML/CSS/JS/JSON), donc tu peux
l'héberger gratuitement sur n'importe quel hébergeur de fichiers statiques :

- **GitHub Pages** : pousse ce dossier dans un dépôt GitHub, active "Pages" dans les
  réglages du dépôt → ton site est en ligne à `https://<toi>.github.io/<repo>/`.
- **Netlify** ou **Vercel** : glisse-dépose le dossier sur leur interface, ou connecte
  ton dépôt GitHub — déploiement automatique à chaque `git push`.
- **Cloudflare Pages** : même principe.

Dans tous les cas : pas de base de données, pas de backend à héberger ou payer,
juste des fichiers statiques.

⚠️ Une fois en ligne, `admin.html` reste accessible à qui a l'URL. Si tu ne veux pas
que d'autres personnes puissent y accéder (même s'ils ne peuvent modifier que le
fichier téléchargé, pas ton site en ligne, sauf via le mode "édition directe" en
local), le plus simple est de ne pas déployer `admin.html` en ligne : garde-le en
local sur ta machine, édite `data/projects.json` chez toi, et ne pousse/déploie que
les fichiers mis à jour.
