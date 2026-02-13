-- Enable required extensions
create extension if not exists "uuid-ossp";

-- ============================================================================
-- PROFILES
-- ============================================================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  currency text not null default 'USD',
  timezone text not null default 'America/New_York',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-update updated_at
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at();

-- ============================================================================
-- CATEGORIES
-- ============================================================================
create table public.categories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade,
  name text not null,
  icon text not null default 'circle-dot',
  color text not null default '#6b7280',
  sort_order integer not null default 0,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

-- Users can see default categories and their own custom ones
create policy "Users can view categories" on public.categories
  for select using (is_default = true or auth.uid() = user_id);

create policy "Users can insert own categories" on public.categories
  for insert with check (auth.uid() = user_id and is_default = false);

create policy "Users can update own categories" on public.categories
  for update using (auth.uid() = user_id and is_default = false);

create policy "Users can delete own categories" on public.categories
  for delete using (auth.uid() = user_id and is_default = false);

-- ============================================================================
-- TAGS
-- ============================================================================
create table public.tags (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  color text not null default '#3b82f6',
  created_at timestamptz not null default now(),
  unique(user_id, name)
);

alter table public.tags enable row level security;

create policy "Users can view own tags" on public.tags
  for select using (auth.uid() = user_id);

create policy "Users can insert own tags" on public.tags
  for insert with check (auth.uid() = user_id);

create policy "Users can update own tags" on public.tags
  for update using (auth.uid() = user_id);

create policy "Users can delete own tags" on public.tags
  for delete using (auth.uid() = user_id);

-- ============================================================================
-- RECEIPTS
-- ============================================================================
create table public.receipts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  image_path text not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed', 'review')),
  raw_ocr_text text,
  confidence real,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.receipts enable row level security;

create policy "Users can view own receipts" on public.receipts
  for select using (auth.uid() = user_id);

create policy "Users can insert own receipts" on public.receipts
  for insert with check (auth.uid() = user_id);

create policy "Users can update own receipts" on public.receipts
  for update using (auth.uid() = user_id);

create policy "Users can delete own receipts" on public.receipts
  for delete using (auth.uid() = user_id);

create trigger receipts_updated_at
  before update on public.receipts
  for each row execute function public.update_updated_at();

-- ============================================================================
-- EXPENSES
-- ============================================================================
create table public.expenses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  receipt_id uuid references public.receipts on delete set null,
  category_id uuid references public.categories on delete set null,
  vendor text not null,
  description text,
  amount numeric(12, 2) not null,
  subtotal numeric(12, 2),
  tax numeric(12, 2),
  tip numeric(12, 2),
  date date not null default current_date,
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.expenses enable row level security;

create policy "Users can view own expenses" on public.expenses
  for select using (auth.uid() = user_id);

create policy "Users can insert own expenses" on public.expenses
  for insert with check (auth.uid() = user_id);

create policy "Users can update own expenses" on public.expenses
  for update using (auth.uid() = user_id);

create policy "Users can delete own expenses" on public.expenses
  for delete using (auth.uid() = user_id);

create trigger expenses_updated_at
  before update on public.expenses
  for each row execute function public.update_updated_at();

-- Index for common queries
create index expenses_user_date_idx on public.expenses (user_id, date desc);
create index expenses_user_category_idx on public.expenses (user_id, category_id);

-- ============================================================================
-- EXPENSE ITEMS (line items from receipt)
-- ============================================================================
create table public.expense_items (
  id uuid primary key default uuid_generate_v4(),
  expense_id uuid references public.expenses on delete cascade not null,
  name text not null,
  quantity numeric(10, 3) not null default 1,
  unit_price numeric(12, 2) not null,
  total_price numeric(12, 2) not null
);

alter table public.expense_items enable row level security;

create policy "Users can view own expense items" on public.expense_items
  for select using (
    exists (
      select 1 from public.expenses
      where expenses.id = expense_items.expense_id
      and expenses.user_id = auth.uid()
    )
  );

create policy "Users can insert own expense items" on public.expense_items
  for insert with check (
    exists (
      select 1 from public.expenses
      where expenses.id = expense_items.expense_id
      and expenses.user_id = auth.uid()
    )
  );

create policy "Users can update own expense items" on public.expense_items
  for update using (
    exists (
      select 1 from public.expenses
      where expenses.id = expense_items.expense_id
      and expenses.user_id = auth.uid()
    )
  );

create policy "Users can delete own expense items" on public.expense_items
  for delete using (
    exists (
      select 1 from public.expenses
      where expenses.id = expense_items.expense_id
      and expenses.user_id = auth.uid()
    )
  );

-- ============================================================================
-- EXPENSE TAGS (many-to-many)
-- ============================================================================
create table public.expense_tags (
  expense_id uuid references public.expenses on delete cascade not null,
  tag_id uuid references public.tags on delete cascade not null,
  primary key (expense_id, tag_id)
);

alter table public.expense_tags enable row level security;

create policy "Users can view own expense tags" on public.expense_tags
  for select using (
    exists (
      select 1 from public.expenses
      where expenses.id = expense_tags.expense_id
      and expenses.user_id = auth.uid()
    )
  );

create policy "Users can insert own expense tags" on public.expense_tags
  for insert with check (
    exists (
      select 1 from public.expenses
      where expenses.id = expense_tags.expense_id
      and expenses.user_id = auth.uid()
    )
  );

create policy "Users can delete own expense tags" on public.expense_tags
  for delete using (
    exists (
      select 1 from public.expenses
      where expenses.id = expense_tags.expense_id
      and expenses.user_id = auth.uid()
    )
  );

-- ============================================================================
-- SEED DEFAULT CATEGORIES
-- ============================================================================
insert into public.categories (name, icon, color, sort_order, is_default) values
  ('Groceries', 'shopping-cart', '#22c55e', 0, true),
  ('Dining', 'utensils', '#f97316', 1, true),
  ('Transportation', 'car', '#3b82f6', 2, true),
  ('Shopping', 'shopping-bag', '#a855f7', 3, true),
  ('Utilities', 'zap', '#eab308', 4, true),
  ('Healthcare', 'heart-pulse', '#ef4444', 5, true),
  ('Entertainment', 'tv', '#ec4899', 6, true),
  ('Travel', 'plane', '#06b6d4', 7, true),
  ('Education', 'graduation-cap', '#8b5cf6', 8, true),
  ('Other', 'circle-dot', '#6b7280', 9, true);

-- ============================================================================
-- STORAGE BUCKET for receipt images
-- ============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'receipts',
  'receipts',
  false,
  10485760, -- 10MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
);

-- Storage policies
create policy "Users can upload own receipts" on storage.objects
  for insert with check (
    bucket_id = 'receipts' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can view own receipts" on storage.objects
  for select using (
    bucket_id = 'receipts' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own receipts" on storage.objects
  for delete using (
    bucket_id = 'receipts' and
    (storage.foldername(name))[1] = auth.uid()::text
  );
