import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { centers, formationOffers, formations, kbEntries, settings } from "@/db/schema";

// Données officielles communiquées par l'établissement (centres, 9 spécialités, 3 formules tarifaires).
// Les contenus rédactionnels sont des textes de départ modifiables depuis le tableau de bord.

const PLANS = [
  { label: "3 mois", months: 3, training: 150000, reg: 10000, diploma: "AQP", inst: "100000,30000,20000" },
  { label: "6 mois", months: 6, training: 250000, reg: 10000, diploma: "CQP", inst: "150000,70000,30000" },
  { label: "1 an", months: 12, training: 350000, reg: 10000, diploma: "DQP", inst: "200000,100000,50000" },
];

type F = { slug: string; name: string; img: string; summary: string; skills: string[]; objectives: string[]; practical: string; careers: string };

const FORMATIONS: F[] = [
  {
    slug: "coiffure-femme", name: "Coiffure femme", img: "coiffure-femme.jpg",
    summary: "Maîtrisez les techniques de coupe, de coiffage et de soin capillaire pour la clientèle féminine.",
    skills: ["Shampoing et soins capillaires", "Coupes et coiffages", "Tresses et coiffures protectrices", "Accueil et conseil client", "Hygiène et organisation du poste de travail"],
    objectives: ["Acquérir les gestes techniques de la coiffure féminine", "Savoir conseiller une cliente selon sa morphologie et ses besoins", "Travailler dans le respect des règles d’hygiène"],
    practical: "Exercices de coiffage sur têtes d’étude et mises en situation encadrées.",
    careers: "Coiffeuse en salon, coiffeuse à domicile, création de son propre salon.",
  },
  {
    slug: "onglerie-professionnelle", name: "Onglerie professionnelle", img: "onglerie-professionnelle.jpg",
    summary: "Apprenez la pose, l’entretien et la décoration des ongles dans les règles de l’art.",
    skills: ["Préparation et soin de l’ongle", "Pose de vernis et de gel", "Nail art", "Hygiène et désinfection du matériel"],
    objectives: ["Maîtriser les techniques d’onglerie", "Réaliser des poses soignées et durables", "Respecter les protocoles d’hygiène"],
    practical: "Pratique encadrée sur modèles et sur supports d’entraînement.",
    careers: "Prothésiste ongulaire, technicienne en salon, installation en indépendante.",
  },
  {
    slug: "esthetique-bio", name: "Esthétique bio", img: "esthetique-bio.jpg",
    summary: "Découvrez les soins du visage et du corps avec une approche naturelle et respectueuse de la peau.",
    skills: ["Analyse de la peau", "Soins du visage", "Soins du corps", "Utilisation de produits naturels", "Conseil beauté"],
    objectives: ["Comprendre les besoins de la peau", "Réaliser des soins esthétiques adaptés", "Conseiller la clientèle"],
    practical: "Réalisation de protocoles de soins en situation encadrée.",
    careers: "Esthéticienne en institut, spa ou à son compte.",
  },
  {
    slug: "make-up-professionnel", name: "Make-up professionnel", img: "make-up-professionnel.jpg",
    summary: "Développez votre art du maquillage, du maquillage du quotidien aux looks de mariage et d’événement.",
    skills: ["Colorimétrie et morphologie du visage", "Maquillage de jour et de soirée", "Maquillage de mariée", "Travail du teint et des carnations", "Hygiène du matériel"],
    objectives: ["Maîtriser les techniques du maquillage professionnel", "Adapter le maquillage à chaque cliente", "Constituer son portfolio"],
    practical: "Séances de maquillage sur modèles encadrées par les formateurs.",
    careers: "Maquilleuse professionnelle, maquilleuse événementielle, conseillère beauté.",
  },
  {
    slug: "massage-professionnel", name: "Massage professionnel", img: "massage-professionnel.jpg",
    summary: "Formez-vous aux techniques de massage de bien-être et de détente.",
    skills: ["Techniques de massage de bien-être", "Anatomie de base", "Installation et accueil du client", "Hygiène et déontologie"],
    objectives: ["Acquérir les gestes de base du massage", "Assurer le confort et la sécurité du client", "Proposer des séances de bien-être"],
    practical: "Pratique supervisée des différents enchaînements de massage.",
    careers: "Praticienne en spa ou institut, massage bien-être à son compte.",
  },
  {
    slug: "pedicure-manucure", name: "Pédicure et manucure", img: "pedicure-manucure.jpg",
    summary: "Apprenez les soins des mains et des pieds : beauté, confort et entretien.",
    skills: ["Soins des mains", "Soins des pieds", "Limage, cuticules et finitions", "Hygiène et stérilisation"],
    objectives: ["Réaliser une manucure et une pédicure complètes", "Respecter les règles d’hygiène", "Conseiller sur l’entretien à domicile"],
    practical: "Soins réalisés sur modèles dans un cadre encadré.",
    careers: "Technicienne manucure-pédicure en salon ou à son compte.",
  },
  {
    slug: "extension-de-cils", name: "Extension de cils", img: "extension-cils.jpg",
    summary: "Maîtrisez la pose d’extensions de cils avec précision et sécurité.",
    skills: ["Préparation et protection de l’œil", "Pose cil à cil", "Choix de la courbure et de la longueur", "Hygiène et sécurité"],
    objectives: ["Poser des extensions de cils avec précision", "Conseiller sur l’entretien", "Appliquer les protocoles de sécurité"],
    practical: "Entraînement sur supports puis sur modèles sous supervision.",
    careers: "Technicienne en extension de cils en institut ou à son compte.",
  },
  {
    slug: "microblading", name: "Microblading", img: "microblading.jpg",
    summary: "Découvrez la technique du microblading pour la restructuration des sourcils.",
    skills: ["Morphologie et visagisme du sourcil", "Techniques de microblading", "Choix des pigments", "Hygiène et sécurité"],
    objectives: ["Comprendre la technique du microblading", "Dessiner des sourcils harmonieux", "Appliquer les règles d’hygiène strictes"],
    practical: "Pratique progressive sur supports d’entraînement avant les modèles.",
    careers: "Praticienne en maquillage semi-permanent des sourcils.",
  },
  {
    slug: "microshading", name: "Microshading", img: "microshading.jpg",
    summary: "Apprenez la technique du microshading pour un effet poudré et naturel des sourcils.",
    skills: ["Techniques d’ombrage pointillé", "Choix des pigments", "Morphologie du sourcil", "Hygiène et sécurité"],
    objectives: ["Maîtriser la technique du microshading", "Obtenir un rendu naturel", "Respecter les protocoles de sécurité"],
    practical: "Pratique progressive sur supports d’entraînement avant les modèles.",
    careers: "Praticienne en maquillage semi-permanent des sourcils.",
  },
];

let seeding: Promise<void> | null = null;

export function ensureSeeded(): Promise<void> {
  if (!seeding) {
    seeding = run().catch((e) => {
      seeding = null;
      throw e;
    });
  }
  return seeding;
}

async function run() {
  const done = await db.select().from(settings).where(eq(settings.key, "seeded")).limit(1);
  if (done.length) return;

  await db.insert(centers).values([
    {
      slug: "ange-raphael", name: "Centre Ange Raphaël",
      address: "Ange Raphaël, en face de Santa Lucia, Douala, Cameroun.",
      mapsUrl: "https://maps.app.goo.gl/QMwqZmXKME88vSZ98?g_st=ic", sortOrder: 1,
    },
    {
      slug: "deido", name: "Centre Deido",
      address: "Carrefour École publique de Deido, en face de la station MRS, Douala, Cameroun.",
      mapsUrl: "https://maps.app.goo.gl/BpdXVPmtQd7YRa858?g_st=ic", sortOrder: 2,
    },
  ]);

  for (const [i, f] of FORMATIONS.entries()) {
    const [row] = await db
      .insert(formations)
      .values({
        slug: f.slug, name: f.name, summary: f.summary,
        description: `${f.summary}\n\nLa formation « ${f.name} » est dispensée à Herman FASHION avec une pédagogie axée sur la pratique, afin de vous préparer aux exigences du secteur de la beauté et du bien-être.`,
        objectives: f.objectives.join("\n"), skills: f.skills.join("\n"),
        practicalWork: f.practical, careers: f.careers,
        imageUrl: `/images/formations/${f.img}`, sortOrder: i + 1,
      })
      .returning({ id: formations.id });
    await db.insert(formationOffers).values(
      PLANS.map((p, j) => ({
        formationId: row.id, durationLabel: p.label, durationMonths: p.months,
        trainingFee: p.training, registrationFee: p.reg, diploma: p.diploma,
        installments: p.inst, sortOrder: j + 1,
      })),
    );
  }

  await db.insert(kbEntries).values([
    {
      category: "Inscription", question: "Comment s’inscrire à Herman FASHION ?",
      answer: "1) Créez votre compte ou connectez-vous, 2) sélectionnez une ou plusieurs formations, 3) choisissez la durée de chaque formation, 4) choisissez votre centre (Ange Raphaël ou Deido), 5) vérifiez le récapitulatif, 6) confirmez, puis cliquez sur « PROCÉDER AU PAIEMENT ». Votre inscription est confirmée seulement après vérification réelle du paiement par l’établissement.",
      keywords: "inscrire inscription procédure étapes comment", sortOrder: 1,
    },
    {
      category: "Paiement", question: "Comment payer ma formation ?",
      answer: "Le paiement s’effectue via notre page de paiement sécurisée Chariow, accessible depuis votre récapitulatif d’inscription. Les frais de formation se règlent en trois tranches ; les frais d’inscription et polo sont distincts. Un paiement n’est considéré comme confirmé qu’après vérification par l’établissement.",
      keywords: "payer paiement tranche chariow règlement", sortOrder: 2,
    },
    {
      category: "Inscription", question: "Puis-je choisir plusieurs formations ?",
      answer: "Oui. Vous pouvez sélectionner une ou plusieurs formations au cours d’une même démarche d’inscription, avec une durée pour chacune. Pour plusieurs formations, le montant total définitif suit les règles tarifaires configurées par l’administration ; si elles ne sont pas encore définies, l’établissement validera le montant avec vous.",
      keywords: "plusieurs formations cumul multiple", sortOrder: 3,
    },
  ]);

  await db.insert(settings).values({ key: "seeded", value: new Date().toISOString() });
}

export async function resetCounter() {
  await db.execute(sql`select 1`);
}
