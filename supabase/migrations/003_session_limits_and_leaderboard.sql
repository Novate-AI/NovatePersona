-- Daily session tracking
create table if not exists daily_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  session_date date not null default current_date,
  product text not null,
  created_at timestamptz default now(),
  unique(user_id, session_date, product, id)
);

create index idx_daily_sessions_user_date on daily_sessions(user_id, session_date);

alter table daily_sessions enable row level security;

create policy "Users read own sessions" on daily_sessions for select using (auth.uid() = user_id);
create policy "Users insert own sessions" on daily_sessions for insert with check (auth.uid() = user_id);

-- Function to count today's sessions for a user
create or replace function get_daily_session_count(p_user_id uuid)
returns int as $$
  select count(*)::int from daily_sessions 
  where user_id = p_user_id and session_date = current_date;
$$ language sql security definer;

-- Leaderboard view: top users by total sessions this week
create or replace view weekly_leaderboard as
select 
  us.user_id,
  us.total_sessions,
  us.current_streak,
  us.longest_streak
from user_streaks us
order by us.total_sessions desc
limit 50;

-- Allow anyone authenticated to read the leaderboard
-- (we already have RLS on user_streaks, so we create a function instead)
create or replace function get_leaderboard()
returns table(
  rank bigint,
  user_id uuid,
  display_name text,
  total_sessions int,
  current_streak int
) as $$
  select 
    row_number() over (order by us.total_sessions desc) as rank,
    us.user_id,
    coalesce(
      (select raw_user_meta_data->>'full_name' from auth.users where id = us.user_id),
      'Anonymous'
    ) as display_name,
    us.total_sessions,
    us.current_streak
  from user_streaks us
  where us.total_sessions > 0
  order by us.total_sessions desc
  limit 50;
$$ language sql security definer;
