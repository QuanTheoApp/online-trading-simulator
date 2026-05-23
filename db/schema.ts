import { pgTable, text, serial, decimal, timestamp, integer, uniqueIndex } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email'),
  username: text('username').notNull(),
  fullName: text('full_name'),
  pin: text('pin'),
  usdBalance: decimal('usd_balance', { precision: 20, scale: 8 }).notNull().default('100000'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (t) => [
  uniqueIndex('users_email_unique_idx').on(t.email),
])

export const trades = pgTable('trades', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  symbol: text('symbol').notNull(),
  side: text('side').notNull(),
  quantity: decimal('quantity', { precision: 20, scale: 8 }).notNull(),
  price: decimal('price', { precision: 20, scale: 8 }).notNull(),
  total: decimal('total', { precision: 20, scale: 8 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})

export const holdings = pgTable('holdings', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  symbol: text('symbol').notNull(),
  quantity: decimal('quantity', { precision: 20, scale: 8 }).notNull().default('0'),
  avgEntryPrice: decimal('avg_entry_price', { precision: 20, scale: 8 }).notNull().default('0'),
}, (t) => [
  uniqueIndex('holdings_user_symbol_idx').on(t.userId, t.symbol),
])

export const wallets = pgTable('wallets', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  icon: text('icon').default('📊'),
  initialBalance: decimal('initial_balance', { precision: 20, scale: 8 }).notNull().default('10000'),
  usdBalance: decimal('usd_balance', { precision: 20, scale: 8 }).notNull().default('10000'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const walletHoldings = pgTable('wallet_holdings', {
  id: serial('id').primaryKey(),
  walletId: integer('wallet_id').notNull().references(() => wallets.id, { onDelete: 'cascade' }),
  symbol: text('symbol').notNull(),
  quantity: decimal('quantity', { precision: 20, scale: 8 }).notNull().default('0'),
  avgEntryPrice: decimal('avg_entry_price', { precision: 20, scale: 8 }).notNull().default('0'),
}, (t) => [
  uniqueIndex('wallet_holdings_wallet_symbol_idx').on(t.walletId, t.symbol),
])
