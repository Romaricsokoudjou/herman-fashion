import "server-only";
import { asc, desc } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { centers, formationOffers, formations, galleryItems, kbEntries, news, teachers, testimonials } from "@/db/schema";
import type { Permission } from "@/lib/permissions";
import { GALLERY_CATEGORIES, NEWS_CATEGORIES } from "@/lib/settings-fields";

export type EField = {
  name: string;
  label: string;
  type: "text" | "textarea" | "number" | "bool" | "select" | "image" | "url" | "datetime";
  required?: boolean;
  options?: string[];
  help?: string;
  upload?: "image" | "document";
  rows?: number;
};

export type Entity = {
  key: string;
  title: string;
  singular: string;
  perm: Permission;
  table: PgTable;
  fields: EField[];
  hidden?: string[]; // champs cachés autorisés (clé étrangère)
  order: unknown[];
  label: (r: Record<string, unknown>) => string;
  sub?: (r: Record<string, unknown>) => string;
  intro?: string;
};

const sort: EField = { name: "sortOrder", label: "Ordre d’affichage", type: "number" };

export const ENTITIES: Record<string, Entity> = {
  enseignants: {
    key: "enseignants", title: "Enseignants", singular: "un enseignant", perm: "content", table: teachers,
    intro: "Renseignez uniquement des informations réelles et validées : aucun nom, diplôme ou expérience n’est inventé par le site.",
    fields: [
      { name: "firstName", label: "Prénom", type: "text", required: true },
      { name: "lastName", label: "Nom", type: "text", required: true },
      { name: "specialty", label: "Spécialité", type: "text" },
      { name: "experience", label: "Expérience", type: "text" },
      { name: "expertise", label: "Domaine d’expertise", type: "text" },
      { name: "bio", label: "Présentation", type: "textarea" },
      { name: "photoUrl", label: "Photo professionnelle", type: "image", upload: "image" },
      { name: "isPublished", label: "Publié sur le site", type: "bool" },
      sort,
    ],
    order: [asc(teachers.sortOrder), asc(teachers.lastName)],
    label: (r) => `${r.firstName} ${r.lastName}`, sub: (r) => String(r.specialty ?? ""),
  },
  temoignages: {
    key: "temoignages", title: "Témoignages", singular: "un témoignage", perm: "content", table: testimonials,
    intro: "Publiez uniquement des témoignages authentiques, avec l’autorisation écrite de leurs auteurs. Un témoignage n’apparaît que si « Autorisation confirmée » ET « Publié » sont cochés.",
    fields: [
      { name: "name", label: "Nom", type: "text", required: true },
      { name: "location", label: "Ville ou pays", type: "text" },
      { name: "formationName", label: "Formation suivie", type: "text" },
      { name: "content", label: "Témoignage", type: "textarea", required: true },
      { name: "portraitUrl", label: "Portrait", type: "image", upload: "image" },
      { name: "videoUrl", label: "Lien vidéo (optionnel)", type: "url" },
      { name: "consentConfirmed", label: "Autorisation de publication confirmée", type: "bool" },
      { name: "isPublished", label: "Publié sur le site", type: "bool" },
      sort,
    ],
    order: [asc(testimonials.sortOrder)],
    label: (r) => String(r.name), sub: (r) => String(r.formationName ?? ""),
  },
  galerie: {
    key: "galerie", title: "Galerie", singular: "une photographie", perm: "content", table: galleryItems,
    fields: [
      { name: "category", label: "Catégorie", type: "select", options: GALLERY_CATEGORIES, required: true },
      { name: "imageUrl", label: "Image", type: "image", upload: "image", required: true },
      { name: "caption", label: "Légende", type: "text" },
      { name: "altText", label: "Texte alternatif (accessibilité / SEO)", type: "text" },
      { name: "isPublished", label: "Publié", type: "bool" },
      sort,
    ],
    order: [asc(galleryItems.category), asc(galleryItems.sortOrder)],
    label: (r) => String(r.caption || r.category), sub: (r) => String(r.category),
  },
  actualites: {
    key: "actualites", title: "Actualités", singular: "une actualité", perm: "content", table: news,
    intro: "Programmez une publication en choisissant le statut « Publié » et une date de publication future : elle apparaîtra automatiquement à cette date.",
    fields: [
      { name: "title", label: "Titre", type: "text", required: true },
      { name: "slug", label: "URL (laisser vide pour générer)", type: "text" },
      { name: "category", label: "Catégorie", type: "select", options: NEWS_CATEGORIES },
      { name: "excerpt", label: "Résumé", type: "textarea", rows: 2 },
      { name: "content", label: "Contenu", type: "textarea", rows: 8 },
      { name: "imageUrl", label: "Image", type: "image", upload: "image" },
      { name: "status", label: "Statut", type: "select", options: ["draft", "published"] },
      { name: "publishAt", label: "Date de publication", type: "datetime" },
    ],
    order: [desc(news.publishAt)],
    label: (r) => String(r.title), sub: (r) => `${r.status === "published" ? "Publié" : "Brouillon"} · ${r.publishAt ? new Date(r.publishAt as Date).toLocaleDateString("fr-FR") : ""}`,
  },
  centres: {
    key: "centres", title: "Centres de formation", singular: "un centre", perm: "content", table: centers,
    fields: [
      { name: "name", label: "Nom", type: "text", required: true },
      { name: "slug", label: "Identifiant (URL)", type: "text", required: true },
      { name: "address", label: "Adresse", type: "textarea", rows: 2, required: true },
      { name: "mapsUrl", label: "Lien Google Maps", type: "url" },
      { name: "phone", label: "Téléphone du centre", type: "text" },
      { name: "hours", label: "Horaires (si confirmés)", type: "textarea", rows: 2 },
      { name: "isActive", label: "Actif (choisissable à l’inscription)", type: "bool" },
      sort,
    ],
    order: [asc(centers.sortOrder)],
    label: (r) => String(r.name), sub: (r) => String(r.address),
  },
  faq: {
    key: "faq", title: "Base de connaissances de l’assistant IA", singular: "une question / réponse", perm: "ai", table: kbEntries,
    intro: "Ces entrées s’ajoutent automatiquement aux formations, tarifs, centres et coordonnées déjà lus en direct par l’assistant. Il ne répond jamais en dehors de ces informations.",
    fields: [
      { name: "category", label: "Catégorie", type: "text" },
      { name: "question", label: "Question", type: "text", required: true },
      { name: "answer", label: "Réponse officielle", type: "textarea", rows: 5, required: true },
      { name: "keywords", label: "Mots-clés (séparés par des espaces)", type: "text" },
      { name: "isActive", label: "Actif", type: "bool" },
      sort,
    ],
    order: [asc(kbEntries.sortOrder)],
    label: (r) => String(r.question), sub: (r) => String(r.category),
  },
  formations: {
    key: "formations", title: "Formations", singular: "une formation", perm: "formations", table: formations,
    fields: [
      { name: "name", label: "Nom de la formation", type: "text", required: true },
      { name: "slug", label: "URL (laisser vide pour générer)", type: "text" },
      { name: "summary", label: "Résumé (carte)", type: "textarea", rows: 2 },
      { name: "description", label: "Description complète", type: "textarea", rows: 6 },
      { name: "objectives", label: "Objectifs pédagogiques (1 par ligne)", type: "textarea", rows: 4 },
      { name: "skills", label: "Compétences acquises (1 par ligne)", type: "textarea", rows: 4 },
      { name: "program", label: "Programme pédagogique (1 élément par ligne, si fourni)", type: "textarea", rows: 4 },
      { name: "practicalWork", label: "Travaux pratiques", type: "textarea", rows: 3 },
      { name: "careers", label: "Débouchés professionnels", type: "textarea", rows: 3 },
      { name: "conditions", label: "Conditions d’inscription", type: "textarea", rows: 3 },
      { name: "imageUrl", label: "Photographie principale", type: "image", upload: "image" },
      { name: "extraImages", label: "Photographies supplémentaires (1 URL par ligne)", type: "textarea", rows: 3 },
      { name: "videoUrl", label: "Vidéo de démonstration (YouTube ou fichier)", type: "url" },
      { name: "isActive", label: "Formation active (visible et choisissable)", type: "bool" },
      sort,
    ],
    order: [asc(formations.sortOrder)],
    label: (r) => String(r.name), sub: (r) => (r.isActive ? "Active" : "Désactivée"),
  },
  offres: {
    key: "offres", title: "Durées et tarifs", singular: "une durée", perm: "formations", table: formationOffers, hidden: ["formationId"],
    fields: [
      { name: "durationLabel", label: "Libellé de la durée (ex. 3 mois)", type: "text", required: true },
      { name: "durationMonths", label: "Durée en mois (pour le tri)", type: "number" },
      { name: "trainingFee", label: "Frais de formation (FCFA)", type: "number", required: true },
      { name: "registrationFee", label: "Frais d’inscription et polo (FCFA)", type: "number", required: true },
      { name: "diploma", label: "Diplôme indiqué (AQP, CQP, DQP…)", type: "text" },
      { name: "installments", label: "Tranches des frais de formation (ex. 100000,30000,20000)", type: "text" },
      { name: "isActive", label: "Disponible", type: "bool" },
      sort,
    ],
    order: [asc(formationOffers.sortOrder)],
    label: (r) => String(r.durationLabel), sub: (r) => `Formation ${r.trainingFee} + inscription ${r.registrationFee} FCFA`,
  },
};
