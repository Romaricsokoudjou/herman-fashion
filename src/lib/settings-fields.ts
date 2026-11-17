// Définition unique des paramètres administrables (valeurs par défaut + formulaire admin).
// Aucune coordonnée n'est modifiée silencieusement : les valeurs communiquées sont reprises telles quelles.

export const AGREMENT_REF = "ARRÊTÉ/ORDRE N°000651/MINEFOP/SG/DFOP/SDGSF/CSACD/CBAC";

export type FieldType = "text" | "textarea" | "image" | "url" | "select" | "bool";
export type SettingField = {
  key: string;
  label: string;
  type: FieldType;
  default: string;
  help?: string;
  options?: { value: string; label: string }[];
  upload?: "image" | "document";
};
export type SettingGroup = { id: string; title: string; description?: string; fields: SettingField[] };

const video = (n: number, title: string): SettingField[] => [
  { key: `video${n}Title`, label: `Vidéo ${n} — titre`, type: "text", default: title },
  { key: `video${n}Url`, label: `Vidéo ${n} — lien YouTube ou fichier vidéo`, type: "url", default: "", help: "Lien YouTube (watch/embed/youtu.be) ou URL d’un fichier .mp4. Laisser vide tant que la vidéo officielle n’existe pas." },
  { key: `video${n}Thumb`, label: `Vidéo ${n} — miniature`, type: "image", default: "", upload: "image" },
];

export const SETTING_GROUPS: SettingGroup[] = [
  {
    id: "identite",
    title: "Identité visuelle",
    fields: [
      { key: "logoUrl", label: "Logo", type: "image", default: "/images/logo/logo-herman-fashion.svg", upload: "image" },
      { key: "heroImageUrl", label: "Bannière principale (image HD)", type: "image", default: "/banners/banniere-principale.jpg", upload: "image" },
      { key: "heroVideoUrl", label: "Vidéo de fond de la bannière (optionnel, .mp4)", type: "url", default: "" },
      { key: "institutionImageUrl", label: "Photo de présentation (locaux / salles / apprenants)", type: "image", default: "/images/apprenants/apprenants-placeholder.jpg", upload: "image" },
    ],
  },
  {
    id: "contact",
    title: "Coordonnées officielles",
    description: "Les numéros ont été communiqués par l’établissement : ils doivent être vérifiés avant publication définitive.",
    fields: [
      { key: "phone1", label: "Téléphone 1", type: "text", default: "+237 674 497 946" },
      { key: "phone2", label: "Téléphone 2", type: "text", default: "+237 695 227 101" },
      { key: "whatsappUrl", label: "Lien WhatsApp", type: "url", default: "https://wa.me/237674407046" },
      { key: "whatsappMessage", label: "Message WhatsApp prérempli", type: "textarea", default: "Bonjour Herman FASHION, je souhaite obtenir des renseignements sur vos formations et les modalités d’inscription." },
      { key: "email", label: "Adresse e-mail officielle", type: "text", default: "", help: "À renseigner par l’administration." },
      { key: "hours", label: "Horaires d’ouverture", type: "textarea", default: "", help: "À renseigner une fois confirmés." },
      { key: "contactsVerified", label: "Coordonnées vérifiées par l’administration", type: "bool", default: "false" },
    ],
  },
  {
    id: "social",
    title: "Réseaux sociaux",
    fields: [
      { key: "facebookUrl", label: "Facebook", type: "url", default: "https://www.facebook.com/share/1EGFz2juN3/?mibextid=wwXIfr" },
      { key: "tiktokUrl", label: "TikTok", type: "url", default: "https://www.tiktok.com/@herman.fashion97?_r=1&_t=ZS-9BPLcS63WFh" },
    ],
  },
  {
    id: "institution",
    title: "Présentation institutionnelle",
    fields: [
      { key: "vision", label: "Notre vision", type: "textarea", default: "Faire de Herman FASHION un lieu de référence où les talents des métiers de la beauté et du bien-être sont révélés et accompagnés vers l’excellence professionnelle." },
      { key: "mission", label: "Notre mission", type: "textarea", default: "Former des professionnels grâce à un enseignement pratique, adapté aux exigences du secteur de la beauté et du bien-être." },
      { key: "quality", label: "Notre engagement envers la qualité", type: "textarea", default: "Un enseignement structuré, des travaux pratiques et un suivi rigoureux pour garantir des compétences utilisables dès la sortie de formation." },
      { key: "approach", label: "Notre approche pédagogique", type: "textarea", default: "Une pédagogie centrée sur la pratique : démonstrations, mises en situation et exercices encadrés dans chaque spécialité." },
      { key: "support", label: "Accompagnement des apprenants", type: "textarea", default: "Une équipe disponible pour orienter les candidats, accompagner l’inscription et répondre aux questions des apprenants." },
      { key: "ambition", label: "Notre ambition", type: "textarea", default: "Contribuer à l’avenir des métiers de la beauté et du bien-être au Cameroun en formant des talents compétents et passionnés." },
    ],
  },
  {
    id: "agrement",
    title: "Agrément ministériel",
    description: `Référence officielle (non modifiable) : ${AGREMENT_REF}`,
    fields: [
      { key: "agrementDocUrl", label: "Document officiel de l’agrément (PDF ou image)", type: "url", default: "", upload: "document", help: "Téléversez le document officiel : le bouton « Consulter notre agrément officiel » l’ouvrira." },
    ],
  },
  { id: "video1", title: "Vidéo 1 — Présentation", fields: video(1, "Présentation de Herman FASHION") },
  { id: "video2", title: "Vidéo 2 — Immersion dans les formations", fields: video(2, "Immersion dans les formations") },
  { id: "video3", title: "Vidéo 3 — Témoignages et expériences", fields: video(3, "Témoignages et expériences") },
  {
    id: "paiement",
    title: "Paiement et tarification",
    fields: [
      { key: "chariowUrl", label: "Lien de paiement Chariow", type: "url", default: "https://dycwotra.mychariow.shop/prd_2iywa1pa" },
      {
        key: "cumulRule",
        label: "Règle de cumul (plusieurs formations)",
        type: "select",
        default: "undefined",
        options: [
          { value: "undefined", label: "Non définie — validation administrative requise pour le total" },
          { value: "registration_each", label: "Frais d’inscription facturés pour chaque formation" },
          { value: "registration_once", label: "Frais d’inscription facturés une seule fois" },
        ],
        help: "Tant que la règle n’est pas définie, aucun montant total définitif n’est affiché pour plusieurs formations.",
      },
      { key: "paymentPolicy", label: "Politique de paiement et de remboursement", type: "textarea", default: "" },
    ],
  },
  {
    id: "legal",
    title: "Informations légales",
    fields: [
      { key: "rccm", label: "Numéro RCCM", type: "text", default: "", help: "À renseigner avec le numéro officiel. Ne jamais inventer." },
      { key: "legalNotice", label: "Mentions légales (complément)", type: "textarea", default: "" },
      { key: "privacyText", label: "Politique de confidentialité (complément)", type: "textarea", default: "" },
      { key: "termsText", label: "Conditions générales d’utilisation (complément)", type: "textarea", default: "" },
      { key: "registrationConditions", label: "Conditions d’inscription", type: "textarea", default: "" },
      { key: "adminInfo", label: "Informations administratives", type: "textarea", default: "" },
    ],
  },
  {
    id: "seo",
    title: "Référencement & statistiques",
    fields: [
      { key: "gaId", label: "Google Analytics — identifiant (G-XXXXXXX)", type: "text", default: "", help: "Chargé uniquement après consentement aux cookies." },
      { key: "gscVerification", label: "Google Search Console — code de vérification", type: "text", default: "" },
      { key: "siteUrl", label: "URL publique du site (https://…)", type: "url", default: "" },
    ],
  },
];

export const SETTING_DEFAULTS: Record<string, string> = Object.fromEntries(
  SETTING_GROUPS.flatMap((g) => g.fields.map((f) => [f.key, f.default])),
);

export const GALLERY_CATEGORIES = [
  "Nos locaux",
  "Nos salles de cours",
  "Nos enseignants",
  "Nos apprenants",
  "Travaux pratiques",
  "Réalisations beauté",
  "Événements",
  "Cérémonies",
  "Vie de l’établissement",
];

export const NEWS_CATEGORIES = [
  "Nouvelles de l’établissement",
  "Ouverture des inscriptions",
  "Activités pédagogiques",
  "Événements",
  "Réalisations des apprenants",
  "Informations institutionnelles",
];
