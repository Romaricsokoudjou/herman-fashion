# CFP HERMAN FASHION 4.0 — Documentation

## 1. Architecture technique
- **Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4.**
- **PostgreSQL + Drizzle ORM** (`src/db/schema.ts`) : une seule base de données, un seul système d’authentification.
- **Authentification maison sécurisée** : mots de passe hachés (bcrypt, 12 tours), sessions en base (jeton aléatoire, seul son hash SHA-256 est stocké), cookie `httpOnly` + `sameSite=lax` (+ `secure` derrière HTTPS), verrouillage après 5 échecs, limitation de débit, réinitialisation par jeton à usage unique (1 h).
- **Permissions côté serveur** : chaque page et chaque action serveur appelle `requireUser()` / `requireStaff(permission)`. Rôles : super administrateur, administrateur, gestionnaire des inscriptions, gestionnaire financier, gestionnaire de contenu (`src/lib/permissions.ts`).
- **Médias** : les fichiers téléversés depuis l’administration sont stockés en base (table `media`, servis par `/api/media/<id>`), donc sauvegardés avec la base et compatibles Vercel.
- **Structure** : `src/app/(site)` site public + espace apprenant · `src/app/admin` administration · `src/app/api` API (chat, reçus, export CSV, upload, webhook Chariow, santé).
- **Données officielles** (9 formations, 3 formules tarifaires, 2 centres) injectées une seule fois au premier démarrage (`src/lib/seed.ts`), puis **entièrement modifiables dans l’administration**.

## 2. Parcours d’inscription et paiement
1. Compte / connexion → 2. sélection d’une ou plusieurs formations (cases à cocher) → 3. durée par formation → 4. centre (Ange Raphaël / Deido) → 5. récapitulatif (calculé **côté serveur** depuis les tarifs en base) → 6. confirmation → 7. bouton **PROCÉDER AU PAIEMENT** (redirection Chariow) → 8. vérification → 9. confirmation.
- Chaque formation choisie est une ligne `registration_items` rattachée à une même `registrations`.
- **Règle de cumul** (Paramètres → Paiement et tarification) : tant qu’elle est « non définie », aucun total définitif n’est affiché pour plusieurs formations ; l’administrateur fixe le montant dans la fiche d’inscription, ce qui ouvre le paiement.
- **Aucun paiement n’est jamais marqué payé automatiquement.** La redirection Chariow crée un paiement « Redirigé » ; la déclaration du candidat le passe à « En attente de vérification ». Seul un administrateur habilité (financier/admin) le confirme (montant + attestation de vérification) → génération du n° d’inscription `HF-AAAA-XXXXXX`, du reçu `RC-AAAA-XXXXXX`, mise à jour du statut, e-mails.
- **Chariow Pulse (webhook)** : `POST /api/payments/chariow/webhook`. Définir `CHARIOW_PULSE_SECRET` (secret `whsec_…` du Pulse). Signature HMAC-SHA256 du corps brut (`x-chariow-signature: sha256=<hex>`) vérifiée, idempotence par `x-pulse-delivery-id`. Une vente signée est rapprochée du paiement du candidat (e-mail) et affichée « ✔ Chariow » ; la confirmation finale reste administrative.
- Les autres moyens (MTN MoMo, Orange Money, Visa, Mastercard) sont affichés « pas encore disponibles » ; architecture prête : ajouter un fournisseur (ex. CinetPay) = nouvelle route webhook + `provider` dans `payments`.
- Les reçus : `/api/receipts/<id>` (ouvrir/imprimer en PDF) et `?download=1` (téléchargement).

## 3. Assistant HERMAN AI
- `src/lib/ai.ts` reconstruit la **base de connaissances à chaque question** à partir de la base de données (formations, durées, tarifs, centres, coordonnées, règle de cumul, FAQ). Toute modification admin est donc immédiate.
- Sans clé API : moteur de réponses fondé uniquement sur ces données (jamais d’invention ; sinon « information non disponible » + conseiller/WhatsApp).
- Avec `OPENAI_API_KEY` (et optionnellement `OPENAI_MODEL`, `OPENAI_BASE_URL` pour tout service compatible) : réponses conversationnelles contraintes par un prompt strict (aucune invention, jamais de confirmation de paiement).
- Historique conservé (table `conversations`/`chat_messages`), transfert vers un conseiller (visible dans Admin → HERMAN AI et Messages), bouton WhatsApp.

## 4. Variables d’environnement
| Variable | Rôle |
|---|---|
| `DATABASE_URL` | Connexion PostgreSQL (obligatoire) |
| `ADMIN_SETUP_KEY` | (recommandé) clé exigée par `/admin/installation` |
| `CHARIOW_PULSE_SECRET` | Vérification des ventes Chariow |
| `RESEND_API_KEY`, `EMAIL_FROM` | Envoi réel des e-mails (sinon file « non envoyé » dans Admin → Journal) |
| `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_BASE_URL` | Assistant IA conversationnel |
| `NEXT_PUBLIC_SITE_URL` | URL publique (liens des e-mails) |
Ne jamais committer ces valeurs (`.env` est ignoré par Git).

## 5. Guide d’administration
- **Premier accès** : ouvrir `/admin/connexion` → « Créer le premier super administrateur » (page disponible tant qu’aucun admin n’existe ; faites-le immédiatement après le déploiement, avec `ADMIN_SETUP_KEY` défini).
- **Tableau de bord** : statistiques réelles (inscriptions, encaissé, en attente, échoués, répartition par formation et par centre).
- **Inscriptions** : recherche, filtres (formation/centre/statut), détail multi-formations, export CSV (ouvrable dans Excel), statut, montant définitif, note visible par l’apprenant (accès aux cours).
- **Finance & paiements** : historique, confirmation/échec, paiement hors ligne, notifications Chariow.
- **Contenus** : enseignants, témoignages (publication = autorisation confirmée + publié), actualités (brouillon/publié/programmé), galerie (9 catégories), centres.
- **Paramètres du site** : logo, bannière, vidéos (3 emplacements), coordonnées (case « vérifiées »), réseaux sociaux, agrément (document PDF/image), RCCM, textes légaux, Google Analytics / Search Console.
- **Administrateurs** : attribuer/retirer un rôle à un compte existant (super administrateur uniquement).

## 6. Remplacer une image
- **Via l’administration (recommandé)** : champ image → « Téléverser » → Enregistrer.
- **Via le dossier `public/`** : remplacer le fichier en conservant son nom (ex. `public/images/formations/coiffure-femme.jpg`, `public/banners/banniere-principale.jpg`, `public/images/logo/logo-herman-fashion.svg`), puis redéployer. Les images actuelles sont des **photographies de remplacement** (stock Pexels) à substituer par les photos réelles de l’établissement.

## 7. Modifier formations et tarifs
Admin → Formations & tarifs → ouvrir la formation → bloc « Durées et tarifs » : ajouter/modifier/désactiver une durée (frais de formation, inscription et polo, diplôme, tranches « 100000,30000,20000 »). Ne créer que les durées réellement proposées pour la spécialité. Les inscriptions existantes conservent le tarif en vigueur à la date d’inscription.

## 8. Sauvegarde
- Quotidienne : `pg_dump "$DATABASE_URL" -Fc -f herman-fashion-$(date +%F).dump` (contient aussi les médias téléversés).
- Restauration : `pg_restore --clean --if-exists -d "$DATABASE_URL" fichier.dump`.
- Activer les sauvegardes automatiques du fournisseur de base (Neon, Supabase, Railway…) et conserver une copie hors site.

## 9. Déploiement (GitHub + Vercel)
1. Pousser le dépôt sur GitHub (le `.env` n’est jamais versionné).
2. Créer deux projets/environnements Vercel : **Development/Preview** (base de test) et **Production** (base de production), avec leurs variables propres.
3. Provisionner PostgreSQL (Neon/Supabase/Vercel Postgres), renseigner `DATABASE_URL`, puis exécuter `npx drizzle-kit push` une fois par environnement.
4. Connecter le nom de domaine (HTTPS automatique), renseigner `NEXT_PUBLIC_SITE_URL` et l’URL du site dans Paramètres.
5. Dans Chariow : créer le Pulse « vente réussie » vers `https://VOTRE-DOMAINE/api/payments/chariow/webhook` et copier son secret dans `CHARIOW_PULSE_SECRET`.
6. Créer le super administrateur, renseigner e-mail, horaires, RCCM, document d’agrément, GA/GSC, puis cocher « coordonnées vérifiées ».
Santé : `GET /api/health`.

## 10. Éléments à renseigner / vérifier par l’établissement
- Vérifier les deux téléphones et le numéro WhatsApp : **le lien WhatsApp communiqué (237 674 407 046) diffère du premier téléphone (+237 674 497 946)** — non modifié, à confirmer.
- Adresse e-mail officielle, horaires, numéro RCCM, document d’agrément, textes légaux complémentaires, politique de remboursement.
- Enseignants, témoignages (avec autorisation), photographies réelles, 3 vidéos officielles, programme pédagogique de chaque formation.
- Confirmer, pour chaque spécialité, les durées réellement proposées (les 3 formules officielles sont préchargées pour les 9 spécialités).
- Règle de cumul des frais pour plusieurs formations.
- Coiffure homme : non ajoutée (à créer depuis l’administration après validation).

## 11. Plan de test (à exécuter avant mise en production)
Visuel (logo, bannière, mobile/desktop) · compte (création, connexion, déconnexion, réinitialisation, profil, pages privées) · inscription (1 / plusieurs formations, retrait, durées, centre, récapitulatif, base, vue admin) · financier (paiement en attente → confirmation, échec, doublon, reçu, statut) · IA (formations, tarifs, durées, centres, inscription, question inconnue → WhatsApp, aucune invention) · institutionnel (agrément, coordonnées, Facebook/TikTok, cartes Google Maps, documents).
