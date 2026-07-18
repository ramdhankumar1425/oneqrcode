import { nanoid } from "nanoid";
import {
  bigint,
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

/* ---------------------------------- enums --------------------------------- */

export const qrTypeEnum = pgEnum("qr_type", ["dynamic", "static"]);
export const deviceTypeEnum = pgEnum("device_type", [
  "desktop",
  "mobile",
  "tablet",
]);
export const osEnum = pgEnum("os", [
  "windows",
  "macos",
  "linux",
  "android",
  "ios",
  "other",
]);
export const browserEnum = pgEnum("browser", [
  "chrome",
  "firefox",
  "safari",
  "edge",
  "other",
]);

/* --------------------------------- qr_code -------------------------------- */

export const qrCode = pgTable(
  "qr_code",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    title: text("title").notNull(),
    // redirect slug — oqr.to/<shortCode>
    shortCode: text("short_code").notNull().unique(),
    // current destination; full change history lives in qr_redirect
    destinationUrl: text("destination_url").notNull(),
    type: qrTypeEnum("type").notNull().default("dynamic"),

    isActive: boolean("is_active").default(true).notNull(),
    // soft-delete: printed codes are archived, never physically removed
    archivedAt: timestamp("archived_at"),

    // denormalized counters (updated on the scan path — see scan-audit TODO)
    scanCount: bigint("scan_count", { mode: "number" }).default(0).notNull(),
    lastScannedAt: timestamp("last_scanned_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("qr_code_user_id_idx").on(table.userId)],
);

/* -------------------------------- qr_design ------------------------------- */

export const qrDesign = pgTable(
  "qr_design",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    // one design per code
    qrCodeId: text("qr_code_id")
      .notNull()
      .unique()
      .references(() => qrCode.id, { onDelete: "cascade" }),

    foregroundColor: text("foreground_color").notNull().default("#0c1f15"),
    backgroundColor: text("background_color").notNull().default("#ffffff"),
    logoUrl: text("logo_url"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [uniqueIndex("qr_design_qr_code_id_idx").on(table.qrCodeId)],
);

/* ------------------------------- qr_redirect ------------------------------ */
/* Append-only history: one row per destination change. */

export const qrRedirect = pgTable(
  "qr_redirect",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    qrCodeId: text("qr_code_id")
      .notNull()
      .references(() => qrCode.id, { onDelete: "cascade" }),
    destinationUrl: text("destination_url").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("qr_redirect_qr_code_id_created_at_idx").on(
      table.qrCodeId,
      table.createdAt,
    ),
  ],
);

/* --------------------------------- qr_scan -------------------------------- */
/* High-volume, append-only analytics. bigint identity PK. */

export const qrScan = pgTable(
  "qr_scan",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    qrCodeId: text("qr_code_id")
      .notNull()
      .references(() => qrCode.id, { onDelete: "cascade" }),

    ipHash: text("ip_hash").notNull(),
    country: text("country"), // ISO 3166-1 alpha-2
    deviceType: deviceTypeEnum("device_type").notNull().default("desktop"),
    os: osEnum("os").notNull().default("other"),
    browser: browserEnum("browser").notNull().default("other"),

    referrer: text("referrer"),
    utmSource: text("utm_source"),
    utmMedium: text("utm_medium"),
    utmCampaign: text("utm_campaign"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("qr_scan_qr_code_id_created_at_idx").on(
      table.qrCodeId,
      table.createdAt,
    ),
  ],
);
