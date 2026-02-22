-- ============================================================================
-- BUDGETS
-- ============================================================================
create table public.budgets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  category_id uuid references public.categories on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Partial unique indexes to prevent duplicate budgets per scope
create unique index budgets_user_overall_idx
  on public.budgets (user_id)
  where category_id is null;

create unique index budgets_user_category_idx
  on public.budgets (user_id, category_id)
  where category_id is not null;

alter table public.budgets enable row level security;

create policy "Users can view own budgets" on public.budgets
  for select using (auth.uid() = user_id);

create policy "Users can insert own budgets" on public.budgets
  for insert with check (auth.uid() = user_id);

create policy "Users can update own budgets" on public.budgets
  for update using (auth.uid() = user_id);

create policy "Users can delete own budgets" on public.budgets
  for delete using (auth.uid() = user_id);

create trigger budgets_updated_at
  before update on public.budgets
  for each row execute function public.update_updated_at();
