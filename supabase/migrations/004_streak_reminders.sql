-- Streak reminder system: identifies users who haven't practised today
-- and whose streak is about to break

-- Table to track which reminders have been sent to avoid duplicates
create table if not exists streak_reminders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  reminder_date date not null default current_date,
  reminder_type text not null default 'streak_break',
  sent_at timestamptz default now(),
  unique(user_id, reminder_date, reminder_type)
);

alter table streak_reminders enable row level security;

create policy "Users read own reminders" on streak_reminders 
  for select using (auth.uid() = user_id);

-- Function: find users whose streaks are about to break (practised yesterday but not today)
create or replace function get_users_needing_streak_reminder()
returns table(
  user_id uuid,
  email text,
  full_name text,
  current_streak int,
  last_practice_date date
) as $$
  select
    us.user_id,
    au.email,
    coalesce(au.raw_user_meta_data->>'full_name', 'there') as full_name,
    us.current_streak,
    us.last_practice_date
  from user_streaks us
  join auth.users au on au.id = us.user_id
  where us.current_streak > 0
    and us.last_practice_date = current_date - interval '1 day'
    and not exists (
      select 1 from streak_reminders sr
      where sr.user_id = us.user_id
        and sr.reminder_date = current_date
        and sr.reminder_type = 'streak_break'
    );
$$ language sql security definer;

-- Function: mark a reminder as sent
create or replace function mark_reminder_sent(p_user_id uuid, p_type text default 'streak_break')
returns void as $$
  insert into streak_reminders (user_id, reminder_date, reminder_type)
  values (p_user_id, current_date, p_type)
  on conflict do nothing;
$$ language sql security definer;
