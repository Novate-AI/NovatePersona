-- User progress: stores best scores per scenario per user
create table if not exists user_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  product text not null,               -- 'nova-patient', 'nova-ielts', 'novatutor'
  scenario_code text not null,         -- e.g. 'chest_pain', 'part_1'
  score numeric not null default 0,
  grade text,
  metadata jsonb default '{}'::jsonb,  -- flexible extra data (checklist %, band scores, etc.)
  completed_at timestamptz default now(),
  created_at timestamptz default now(),

  unique(user_id, product, scenario_code)
);

-- User streaks: one row per user, updated on each practice session
create table if not exists user_streaks (
  user_id uuid references auth.users(id) on delete cascade primary key,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_practice_date date,
  total_sessions int not null default 0,
  updated_at timestamptz default now()
);

-- Row Level Security
alter table user_progress enable row level security;
alter table user_streaks enable row level security;

-- Users can only read/write their own data
create policy "Users read own progress"
  on user_progress for select
  using (auth.uid() = user_id);

create policy "Users insert own progress"
  on user_progress for insert
  with check (auth.uid() = user_id);

create policy "Users update own progress"
  on user_progress for update
  using (auth.uid() = user_id);

create policy "Users read own streaks"
  on user_streaks for select
  using (auth.uid() = user_id);

create policy "Users insert own streaks"
  on user_streaks for insert
  with check (auth.uid() = user_id);

create policy "Users update own streaks"
  on user_streaks for update
  using (auth.uid() = user_id);

-- Index for fast lookups
create index if not exists idx_user_progress_user_product
  on user_progress(user_id, product);
