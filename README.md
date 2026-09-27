# RRTE MALI APP — Semaine 1 (Fondations)

Application communautaire pour le groupe RRTE (Réunir Rester Travailler Ensemble) au Mali.

Ce que contient déjà ce projet :
- Page d'accueil publique
- Inscription membre (email + mot de passe + email de confirmation)
- Connexion membre
- Page "Annuaire" protégée (accessible uniquement aux membres connectés et approuvés)
- Pages publiques "Entreprises" et "Restaurants" (structure prête, contenu à venir)
- Firebase Auth + Firestore déjà branchés dans le code

---

## ÉTAPE 1 — Créer le projet Firebase (10 min)

1. Va sur https://console.firebase.google.com
2. Connecte-toi avec **bazarbams@gmail.com**
3. Clique **"Ajouter un projet"**
4. Nom du projet : `RRTE Mali App` (ou `rrte-mali-app`)
5. Désactive Google Analytics si proposé (pas nécessaire pour l'instant) → **Créer le projet**

### Activer l'authentification
1. Dans le menu de gauche : **Build → Authentication**
2. Clique **"Get started"**
3. Onglet **Sign-in method** → active **Email/Password** → Enregistrer

### Activer Firestore (base de données)
1. Menu de gauche : **Build → Firestore Database**
2. **Créer une base de données**
3. Choisis **"Mode production"**
4. Région : choisis **eur3 (europe-west)** (le plus proche du Mali)

### Récupérer les clés de configuration
1. Clique sur l'icône ⚙️ (Paramètres du projet) en haut à gauche
2. Descends jusqu'à **"Vos applications"**
3. Clique sur l'icône **`</>`** (Web) pour ajouter une app web
4. Nom de l'app : `RRTE Web App` → **Enregistrer**
5. Firebase affiche un bloc de code avec `firebaseConfig = {...}` — **garde cette page ouverte**, tu en auras besoin à l'étape 3.

---

## ÉTAPE 2 — Créer le dépôt GitHub (5 min)

1. Va sur https://github.com/new (connecté avec ton compte **AliDallas**)
2. Nom du repository : `rrte-mali-app`
3. Laisse-le en **Private** (recommandé, au moins au début)
4. Ne coche PAS "Add a README" (on a déjà le nôtre)
5. Clique **"Create repository"**

GitHub va t'afficher des commandes — **on s'en occupe ensemble à l'étape suivante**, dis-moi simplement une fois le repo créé et donne-moi l'URL (ex: `https://github.com/AliDallas/rrte-mali-app`).

---

## ÉTAPE 3 — Configurer les clés Firebase dans le projet

Une fois que tu as le bloc `firebaseConfig` de Firebase (étape 1), copie les valeurs ici. Crée un fichier `.env.local` à la racine du projet (copie de `.env.local.example`) avec ces valeurs :

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

**Envoie-moi ces valeurs** (elles ne sont pas secrètes, elles sont publiques par design dans une app Firebase web) et je les intègre.

---

## ÉTAPE 4 — Déployer sur Vercel (10 min)

1. Va sur https://vercel.com/signup
2. Choisis **"Continue with GitHub"** et connecte-toi avec **AliDallas**
3. Une fois connecté : **"Add New" → "Project"**
4. Sélectionne le repository `rrte-mali-app`
5. Vercel détecte automatiquement Next.js → ne change rien dans les paramètres de build
6. Avant de cliquer "Deploy", ajoute les **Environment Variables** (les mêmes que le `.env.local` de l'étape 3) :
   - Clique "Environment Variables"
   - Ajoute chaque `NEXT_PUBLIC_FIREBASE_...` une par une avec sa valeur
7. Clique **"Deploy"**

Après 1-2 minutes, ton app sera en ligne sur une URL du type `rrte-mali-app.vercel.app` 🎉

---

## Structure du projet

```
rrte-app/
├── app/
│   ├── page.tsx              → Page d'accueil
│   ├── layout.tsx            → Layout global + AuthProvider
│   ├── login/page.tsx        → Connexion
│   ├── signup/page.tsx       → Inscription
│   ├── annuaire/page.tsx     → Annuaire (protégé, membres actifs)
│   ├── entreprises/page.tsx  → Public
│   └── restaurants/page.tsx  → Public
├── lib/
│   ├── firebase.ts           → Configuration Firebase
│   └── AuthContext.tsx       → Gestion de l'authentification
├── firestore.rules           → Règles de sécurité Firestore
├── firebase.json
└── .env.local.example
```

## Comment fonctionne l'inscription pour l'instant

1. Une personne remplit le formulaire d'inscription (`/signup`)
2. Un compte Firebase Auth est créé + email de confirmation envoyé
3. Un document est créé dans Firestore (`users/{uid}`) avec `statut: "en_attente"`
4. **Pour l'instant**, l'approbation admin se fait manuellement dans la Console Firebase (Firestore → collection `users` → changer `statut` en `"actif"`)
5. Semaine 6 : interface d'administration dédiée pour approuver en un clic

## Prochaines étapes (Semaine 2)

- Import des 224 membres depuis le Google Form dans Firestore
- Page annuaire avec recherche et filtres
- Profils détaillés des membres
