import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  customType,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
});

const now = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

/* ───────────── Utilisateurs & sessions ───────────── */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  phone: text("phone").notNull(),
  lastName: text("last_name").notNull(),
  firstName: text("first_name").notNull(),
  email: text("email").notNull().unique(),
  country: text("country").notNull(),
  city: text("city").notNull(),
  passwordHash: text("password_hash").notNull(),
  // learner | super_admin | admin | registrations_manager | finance_manager | content_manager
  role: text("role").notNull().default("learner"),
  isActive: boolean("is_active").notNull().default(true),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  failedLogins: integer("failed_logins").notNull().default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  createdAt: now(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(), // sha256 du jeton
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: now(),
});

export const authTokens = pgTable("auth_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // reset | verify
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: now(),
});

/* ───────────── Paramètres & médias ───────────── */
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const media = pgTable("media", {
  id: uuid("id").primaryKey().defaultRandom(),
  filename: text("filename").notNull(),
  mime: text("mime").notNull(),
  size: integer("size").notNull(),
  data: bytea("data").notNull(),
  createdAt: now(),
});

/* ───────────── Catalogue ───────────── */
export const centers = pgTable("centers", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  mapsUrl: text("maps_url").notNull().default(""),
  phone: text("phone").notNull().default(""),
  hours: text("hours").notNull().default(""),
  imageUrl: text("image_url").notNull().default(""),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const formations = pgTable("formations", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  summary: text("summary").notNull().default(""),
  description: text("description").notNull().default(""),
  objectives: text("objectives").notNull().default(""), // 1 ligne = 1 élément
  skills: text("skills").notNull().default(""),
  program: text("program").notNull().default(""),
  practicalWork: text("practical_work").notNull().default(""),
  careers: text("careers").notNull().default(""),
  conditions: text("conditions").notNull().default(""),
  imageUrl: text("image_url").notNull().default(""),
  extraImages: text("extra_images").notNull().default(""), // 1 URL par ligne
  videoUrl: text("video_url").notNull().default(""),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: now(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const formationOffers = pgTable("formation_offers", {
  id: uuid("id").primaryKey().defaultRandom(),
  formationId: uuid("formation_id").notNull().references(() => formations.id, { onDelete: "cascade" }),
  durationLabel: text("duration_label").notNull(),
  durationMonths: integer("duration_months").notNull().default(0),
  trainingFee: integer("training_fee").notNull(),
  registrationFee: integer("registration_fee").notNull(),
  diploma: text("diploma").notNull().default(""),
  installments: text("installments").notNull().default(""), // "100000,30000,20000"
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

/* ───────────── Inscriptions & paiements ───────────── */
export const registrations = pgTable(
  "registrations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    centerId: uuid("center_id").references(() => centers.id, { onDelete: "set null" }),
    centerName: text("center_name").notNull().default(""),
    // pending | payment_confirmed | payment_failed | validated | to_complete
    status: text("status").notNull().default("pending"),
    registrationNumber: text("registration_number").unique(),
    pricingMode: text("pricing_mode").notNull().default("definitive"), // definitive | needs_validation
    trainingTotal: integer("training_total").notNull().default(0),
    registrationTotal: integer("registration_total").notNull().default(0),
    totalAmount: integer("total_amount"),
    fingerprint: text("fingerprint").notNull().default(""),
    adminNote: text("admin_note").notNull().default(""),
    createdAt: now(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("registrations_user_idx").on(t.userId)],
);

export const registrationItems = pgTable(
  "registration_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    registrationId: uuid("registration_id").notNull().references(() => registrations.id, { onDelete: "cascade" }),
    formationId: uuid("formation_id").references(() => formations.id, { onDelete: "set null" }),
    offerId: uuid("offer_id").references(() => formationOffers.id, { onDelete: "set null" }),
    formationName: text("formation_name").notNull(),
    durationLabel: text("duration_label").notNull(),
    diploma: text("diploma").notNull().default(""),
    trainingFee: integer("training_fee").notNull(),
    registrationFee: integer("registration_fee").notNull(),
    installments: text("installments").notNull().default(""),
  },
  (t) => [uniqueIndex("reg_item_unique").on(t.registrationId, t.formationId)],
);

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  registrationId: uuid("registration_id").notNull().references(() => registrations.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").notNull().default("chariow"),
  amount: integer("amount"),
  // initiated | pending_verification | confirmed | failed
  status: text("status").notNull().default("initiated"),
  userReference: text("user_reference").notNull().default(""),
  providerReference: text("provider_reference").notNull().default(""),
  providerVerified: boolean("provider_verified").notNull().default(false),
  receiptNumber: text("receipt_number").unique(),
  note: text("note").notNull().default(""),
  verifiedBy: uuid("verified_by"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  createdAt: now(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const chariowEvents = pgTable("chariow_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  deliveryId: text("delivery_id").notNull().unique(),
  eventType: text("event_type").notNull(),
  saleId: text("sale_id").notNull().default(""),
  customerEmail: text("customer_email").notNull().default(""),
  payload: jsonb("payload").notNull(),
  matchedPaymentId: uuid("matched_payment_id"),
  createdAt: now(),
});

/* ───────────── Contenus ───────────── */
export const teachers = pgTable("teachers", {
  id: uuid("id").primaryKey().defaultRandom(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  specialty: text("specialty").notNull().default(""),
  experience: text("experience").notNull().default(""),
  bio: text("bio").notNull().default(""),
  expertise: text("expertise").notNull().default(""),
  photoUrl: text("photo_url").notNull().default(""),
  isPublished: boolean("is_published").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const testimonials = pgTable("testimonials", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  location: text("location").notNull().default(""),
  formationName: text("formation_name").notNull().default(""),
  content: text("content").notNull(),
  portraitUrl: text("portrait_url").notNull().default(""),
  videoUrl: text("video_url").notNull().default(""),
  consentConfirmed: boolean("consent_confirmed").notNull().default(false),
  isPublished: boolean("is_published").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const galleryItems = pgTable("gallery_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  category: text("category").notNull(),
  imageUrl: text("image_url").notNull(),
  caption: text("caption").notNull().default(""),
  altText: text("alt_text").notNull().default(""),
  isPublished: boolean("is_published").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const news = pgTable("news", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  category: text("category").notNull().default("Nouvelles de l’établissement"),
  excerpt: text("excerpt").notNull().default(""),
  content: text("content").notNull().default(""),
  imageUrl: text("image_url").notNull().default(""),
  status: text("status").notNull().default("draft"), // draft | published
  publishAt: timestamp("publish_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: now(),
});

export const kbEntries = pgTable("kb_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  category: text("category").notNull().default("FAQ"),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  keywords: text("keywords").notNull().default(""),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  visitorKey: text("visitor_key").notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  status: text("status").notNull().default("open"), // open | handoff | closed
  handoffContact: text("handoff_contact").notNull().default(""),
  handoffNote: text("handoff_note").notNull().default(""),
  createdAt: now(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: now(),
});

export const contactMessages = pgTable("contact_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().default(""),
  phone: text("phone").notNull().default(""),
  subject: text("subject").notNull().default(""),
  message: text("message").notNull(),
  isHandled: boolean("is_handled").notNull().default(false),
  createdAt: now(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorId: uuid("actor_id"),
  actorLabel: text("actor_label").notNull().default(""),
  action: text("action").notNull(),
  target: text("target").notNull().default(""),
  detail: text("detail").notNull().default(""),
  createdAt: now(),
});

export const emailOutbox = pgTable("email_outbox", {
  id: uuid("id").primaryKey().defaultRandom(),
  toEmail: text("to_email").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  status: text("status").notNull().default("not_configured"), // sent | failed | not_configured
  error: text("error").notNull().default(""),
  createdAt: now(),
});
