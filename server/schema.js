'use strict';
const { pgTable, text, varchar, timestamp, jsonb, integer, boolean, real, index, uniqueIndex } = require('drizzle-orm/pg-core');
const users = pgTable('users', {
  id: text('id').primaryKey(), username: varchar('username',{length:32}).notNull(), email: varchar('email',{length:254}).notNull(),
  passwordHash: text('password_hash').notNull(), createdAt: timestamp('created_at',{withTimezone:true}).notNull().defaultNow(), updatedAt: timestamp('updated_at',{withTimezone:true}).notNull().defaultNow()
}, t=>[uniqueIndex('users_username_uq').on(t.username),uniqueIndex('users_email_uq').on(t.email)]);
const sessions = pgTable('sessions', {
  id:text('id').primaryKey(), userId:text('user_id').notNull().references(()=>users.id,{onDelete:'cascade'}), tokenHash:text('token_hash').notNull().unique(),
  expiresAt:timestamp('expires_at',{withTimezone:true}).notNull(), createdAt:timestamp('created_at',{withTimezone:true}).notNull().defaultNow()
},t=>[index('sessions_user_idx').on(t.userId),index('sessions_expiry_idx').on(t.expiresAt)]);
const desktopSettings = pgTable('desktop_settings', {
  id:text('id').primaryKey(), userId:text('user_id').notNull().references(()=>users.id,{onDelete:'cascade'}).unique(), theme:text('theme').notNull().default('blue'),
  wallpaper:text('wallpaper').notNull().default('bliss'), desktopLayout:jsonb('desktop_layout').notNull().default({}), preferences:jsonb('preferences').notNull().default({}), updatedAt:timestamp('updated_at',{withTimezone:true}).notNull().defaultNow()
});
const characters = pgTable('characters', {
  id:text('id').primaryKey(),userId:text('user_id').notNull().references(()=>users.id,{onDelete:'cascade'}),name:varchar('name',{length:32}).notNull(),color:varchar('color',{length:7}).notNull().default('#202020'),
  personality:jsonb('personality').notNull().default({}),profile:jsonb('profile').notNull().default({}),needs:jsonb('needs').notNull().default({}),energy:real('energy').notNull().default(.8),emotion:text('emotion').notNull().default('calm'),
  currentState:text('current_state').notNull().default('Idle'),currentGoal:text('current_goal').notNull().default(''),position:jsonb('position').notNull().default({}),version:integer('version').notNull().default(1),createdAt:timestamp('created_at',{withTimezone:true}).notNull().defaultNow(),updatedAt:timestamp('updated_at',{withTimezone:true}).notNull().defaultNow()
},t=>[index('characters_user_idx').on(t.userId),index('characters_user_updated_idx').on(t.userId,t.updatedAt)]);
const characterMemories = pgTable('character_memories', {
  id:text('id').primaryKey(),characterId:text('character_id').notNull().references(()=>characters.id,{onDelete:'cascade'}),userId:text('user_id').notNull().references(()=>users.id,{onDelete:'cascade'}),
  memoryType:text('memory_type').notNull().default('event'),content:text('content').notNull(),importance:real('importance').notNull().default(.3),confidence:real('confidence').notNull().default(.8),metadata:jsonb('metadata').notNull().default({}),
  createdAt:timestamp('created_at',{withTimezone:true}).notNull().defaultNow(),lastAccessed:timestamp('last_accessed',{withTimezone:true}).notNull().defaultNow()
},t=>[index('memories_character_created_idx').on(t.characterId,t.createdAt),index('memories_user_idx').on(t.userId)]);
const characterRelationships = pgTable('character_relationships', {
  id:text('id').primaryKey(),userId:text('user_id').notNull().references(()=>users.id,{onDelete:'cascade'}),characterA:text('character_a').notNull().references(()=>characters.id,{onDelete:'cascade'}),
  characterB:text('character_b').notNull().references(()=>characters.id,{onDelete:'cascade'}),relationshipType:text('relationship_type').notNull().default('acquaintance'),affinity:real('affinity').notNull().default(0),interactionCount:integer('interaction_count').notNull().default(0),metadata:jsonb('metadata').notNull().default({}),updatedAt:timestamp('updated_at',{withTimezone:true}).notNull().defaultNow()
},t=>[uniqueIndex('relationships_pair_uq').on(t.userId,t.characterA,t.characterB),index('relationships_user_idx').on(t.userId)]);
const characterGoals = pgTable('character_goals', {
  id:text('id').primaryKey(),userId:text('user_id').notNull().references(()=>users.id,{onDelete:'cascade'}),characterId:text('character_id').notNull().references(()=>characters.id,{onDelete:'cascade'}),
  goalType:text('goal_type').notNull(),priority:real('priority').notNull().default(.5),progress:real('progress').notNull().default(0),status:text('status').notNull().default('active'),metadata:jsonb('metadata').notNull().default({}),updatedAt:timestamp('updated_at',{withTimezone:true}).notNull().defaultNow()
},t=>[index('goals_character_idx').on(t.characterId,t.status)]);
const animationProjects = pgTable('animation_projects', {
  id:text('id').primaryKey(),userId:text('user_id').notNull().references(()=>users.id,{onDelete:'cascade'}),characterId:text('character_id').references(()=>characters.id,{onDelete:'set null'}),name:varchar('name',{length:120}).notNull(),fps:integer('fps').notNull().default(24),loop:boolean('loop').notNull().default(false),timeline:jsonb('timeline').notNull().default({}),metadata:jsonb('metadata').notNull().default({}),version:integer('version').notNull().default(1),createdAt:timestamp('created_at',{withTimezone:true}).notNull().defaultNow(),updatedAt:timestamp('updated_at',{withTimezone:true}).notNull().defaultNow()
},t=>[index('animations_user_idx').on(t.userId,t.updatedAt)]);
const drawingAssets = pgTable('drawing_assets', {
  id:text('id').primaryKey(),userId:text('user_id').notNull().references(()=>users.id,{onDelete:'cascade'}),characterId:text('character_id').references(()=>characters.id,{onDelete:'set null'}),name:varchar('name',{length:120}).notNull(),format:text('format').notNull().default('vector-json'),vectorData:jsonb('vector_data').notNull(),metadata:jsonb('metadata').notNull().default({}),version:integer('version').notNull().default(1),createdAt:timestamp('created_at',{withTimezone:true}).notNull().defaultNow(),updatedAt:timestamp('updated_at',{withTimezone:true}).notNull().defaultNow()
},t=>[index('drawings_user_idx').on(t.userId,t.updatedAt)]);
module.exports={users,sessions,desktopSettings,characters,characterMemories,characterRelationships,characterGoals,animationProjects,drawingAssets};
