# Admin en ligne (Decap CMS) — configuration en 5 étapes

Ce dossier `admin/` contient une interface d'administration accessible depuis
N'IMPORTE QUEL navigateur (pas seulement ton Mac), connectée à ton dépôt
GitHub. Contrairement à `admin.html` à la racine (qui édite directement un
fichier sur TON disque), celle-ci pousse un vrai commit Git à chaque
sauvegarde. Elle est déjà écrite et configurée (`admin/index.html` +
`admin/config.yml`) — il ne reste que des réglages en ligne, une seule fois.

## 1. Créer le dépôt GitHub

Sur github.com : "New repository" → nomme-le (ex: `portfolio`) → ne coche
RIEN (pas de README, pas de .gitignore, le dépôt local en a déjà) → "Create
repository". GitHub t'affiche une URL du type
`https://github.com/<ton-compte>/portfolio.git`.

Dans le terminal, depuis le dossier `portfolio` :

```bash
git remote add origin https://github.com/<ton-compte>/portfolio.git
git push -u origin master
```

## 2. Créer un compte Netlify et connecter le dépôt

Sur [netlify.com](https://netlify.com) → "Add new site" → "Import an
existing project" → connecte ton compte GitHub → choisis le dépôt
`portfolio`. Comme c'est un site 100% statique, laisse les champs "Build
command" et "Publish directory" tels quels (ou publish directory = `.`,
racine du dépôt) → "Deploy site". Ton site est en ligne sur une URL du type
`nom-au-hasard.netlify.app` (tu pourras la personnaliser après).

## 3. Activer Netlify Identity

Dans le tableau de bord Netlify du site → onglet **"Identity"** → "Enable
Identity". Une fois activé, va dans **Identity → Settings → Registration**
et passe sur **"Invite only"** (pour que seule toi puisse créer un compte
admin, personne d'autre).

## 4. Activer Git Gateway

Toujours dans Identity → **Services → Git Gateway** → "Enable Git Gateway".
C'est ce qui permet à Decap CMS de pousser des commits sur GitHub en ton nom,
sans que tu aies à gérer de token toi-même.

## 5. T'inviter toi-même

Identity → **Invite users** → entre ton adresse email → tu reçois un mail
d'invitation Netlify → clique dessus, choisis un mot de passe.

## C'est prêt

Va sur `https://ton-site.netlify.app/admin/` : tu arrives sur un écran de
connexion Netlify Identity. Connecte-toi avec le compte créé à l'étape 5 —
tu es dans l'interface Decap CMS, avec la liste de tes projets, éditables
depuis n'importe quel appareil. Chaque sauvegarde crée un commit Git sur
GitHub, et Netlify redéploie automatiquement le site à jour en quelques
secondes.

## Sécurité

- Seules les personnes que tu invites explicitement (étape 5) peuvent se
  connecter — "Invite only" empêche toute inscription libre.
- Chaque sauvegarde dans Decap CMS est un vrai commit visible dans l'historique
  Git du dépôt : tu peux toujours revenir en arrière avec `git revert` si besoin.
- `admin.html` (à la racine, l'outil local qu'on a construit ensemble) continue
  de fonctionner en parallèle sur ton Mac, en édition directe du fichier local —
  les deux écrivent le même format de fichier (`data/projects.json`).
