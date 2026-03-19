import { pgTable, text, jsonb, timestamp, uuid } from "drizzle-orm/pg-core";

export const feeds = pgTable("feeds", {
  id: uuid("id").primaryKey().defaultRandom(),
  originalUrl: text("original_url").notNull(),
  additionalUrls: jsonb("additional_urls").$type<string[]>(),
  selectedCourses: jsonb("selected_courses").notNull().$type<string[]>(),
  selectedGroups: jsonb("selected_groups").$type<Record<string, string[]>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
