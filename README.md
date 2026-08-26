# Portfolio statique (sans serveur)

## Structure

- `index.html` — page d'accueil
- `work.html` / `in-progress.html` — pages listant les projets depuis `data/projects.json`
- `project.html` — page d'un projet, affiche ton HTML libre (dans une iframe isolée)
- `admin/` — interface d'administration en ligne (Decap CMS), voir `README-decap.md`
- `data/projects.json` — la "base de données", un simple fichier JSON
- `css/*.css`, `js/*.js` — code du site (à ne toucher que si tu veux changer le design)
- `images/` — images et vidéos de tes projets

## Comment ça marche

Tu n'as jamais besoin de retoucher `index.html`, `work.html`, `in-progress.html` ou
`project.html`. Pour ajouter ou modifier un projet, utilise l'interface d'administration
en ligne à `https://<ton-site>.netlify.app/admin/` (voir `README-decap.md` pour la mise
en place complète). Chaque modification y crée directement un commit sur ton dépôt
GitHub, qui redéploie automatiquement le site.

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

## Mise en ligne

Le site est hébergé sur Netlify, connecté à ton dépôt GitHub : chaque `git push`
redéploie automatiquement le site. Voir `README-decap.md` pour la configuration de
l'admin en ligne (Decap CMS + Netlify Identity + Git Gateway).
