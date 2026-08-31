-- Every existing meaning becomes the entry's rank-1 sense, verbatim.
-- Splitting on commas is deliberately NOT done here
INSERT INTO senses (entry_id, rank, meaning_en)
SELECT id, 1, meaning_en FROM entries;