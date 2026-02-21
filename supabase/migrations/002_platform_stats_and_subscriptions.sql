-- Platform stats: single row, publicly readable, tracks aggregate metrics
create table if not exists platform_stats (
  id int primary key default 1 check (id = 1),
  total_users int not null default 0,
  total_sessions int not null default 0,
  weekly_active int not null default 0,
  updated_at timestamptz default now()
);

-- Seed the single row
insert into platform_stats (id) values (1) on conflict do nothing;

-- Allow anyone (including anon) to read platform stats
alter table platform_stats enable row level security;
create policy "Anyone can read stats" on platform_stats for select using (true);

-- Function to refresh stats (call periodically or via trigger)
create or replace function refresh_platform_stats()
returns void as $$
begin
  update platform_stats set
    total_users = (select count(*) from auth.users),
    total_sessions = (select coalesce(sum(total_sessions), 0) from user_streaks),
    weekly_active = (
      select count(distinct user_id) from user_progress
      where completed_at > now() - interval '7 days'
    ),
    updated_at = now()
  where id = 1;
end;
$$ language plpgsql security definer;

-- Auto-refresh stats when user_progress gets a new row
create or replace function trigger_refresh_stats()
returns trigger as $$
begin
  perform refresh_platform_stats();
  return new;
end;
$$ language plpgsql security definer;

create trigger on_progress_insert
  after insert on user_progress
  for each statement
  execute function trigger_refresh_stats();

-- Subscriptions: tracks Stripe subscription state per user
create table if not exists subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text not null default 'free',
  status text not null default 'active',
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table subscriptions enable row level security;

create policy "Users read own subscription"
  on subscriptions for select
  using (auth.uid() = user_id);

create policy "Users insert own subscription"
  on subscriptions for insert
  with check (auth.uid() = user_id);

-- Server needs to update subscriptions via service role, so no update policy for users
-- Only the webhook (using service_role key) can update
