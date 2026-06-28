-- Performance indexes for My Film Collection
-- Run these in the Supabase dashboard → SQL Editor (one time).
--
-- The app loads the collection with:
--   select(...).order("created_at", { ascending: false }).range(from, to)
-- Without an index, Postgres sorts the whole table on every load. This index
-- lets it read rows straight from the index in the order the app wants, which
-- speeds up both the first-page paint and the background "rest of collection"
-- fetch.
CREATE INDEX IF NOT EXISTS films_created_at_desc_idx
  ON films (created_at DESC);

-- Optional: if you store many films per user and ever scope queries by owner,
-- a composite index keeps the per-user ordering fast too. Safe to skip if the
-- table has no user/owner column.
-- CREATE INDEX IF NOT EXISTS films_owner_created_at_idx
--   ON films (user_id, created_at DESC);

-- Note: lookups by primary key (id) — used when hydrating a film's plot/backdrop
-- on modal open — are already covered by the table's primary-key index, so no
-- extra index is needed there.
