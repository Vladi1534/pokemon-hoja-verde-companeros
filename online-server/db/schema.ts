import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
export const rooms = sqliteTable('rooms', {
  id: text('id').primaryKey(), invite: text('invite').notNull().unique(),
  revision: integer('revision').notNull().default(0), state: text('state').notNull(),
  updated: integer('updated').notNull(),
});
export const presence = sqliteTable('presence', {
  id: text('id').primaryKey(), room: text('room').notNull(), seq: integer('seq').notNull().default(0),
  position: text('position').notNull(), seen: integer('seen').notNull(),
}, table => [index('presence_room').on(table.room)]);
export const limits = sqliteTable('limits', {
  id: text('id').primaryKey(), count: integer('count').notNull(), expires: integer('expires').notNull(),
});
