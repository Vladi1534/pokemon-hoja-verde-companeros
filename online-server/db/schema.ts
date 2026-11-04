import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
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

export const trainers = sqliteTable('social_trainers', {
  id: text('id').primaryKey(), code: text('code').notNull().unique(),
  name: text('name').notNull(), avatar: text('avatar').notNull(), starter: integer('starter').notNull(),
  seen: integer('seen').notNull().default(0), room: text('room'),
});
export const friendships = sqliteTable('friendships', {
  id: text('id').primaryKey(), a: text('a').notNull(), b: text('b').notNull(),
  sender: text('sender').notNull(), status: text('status').notNull(), created: integer('created').notNull(),
}, table => [index('friends_a').on(table.a), index('friends_b').on(table.b)]);
export const friendInvitations = sqliteTable('friend_invitations', {
  id: text('id').primaryKey(), sender: text('sender').notNull(), recipient: text('recipient').notNull(),
  room: text('room').notNull(), expires: integer('expires').notNull(), status: text('status').notNull(),
}, table => [uniqueIndex('friend_invite_pair').on(table.sender,table.recipient),index('friend_invite_recipient').on(table.recipient)]);
