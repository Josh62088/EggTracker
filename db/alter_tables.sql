ALTER TABLE egg_logs ADD COLUMN carton_assignment INTEGER;

CREATE TABLE egg_logs(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    eggs INTEGER NOT NULL,
    usable_eggs INTEGER,
    carton_id INTEGER,
);

INSERT INTO egg_logs (id, date, eggs, usable_eggs, carton_id)
SELECT id, date, eggs, usable_eggs, NULL FROM temp_egg_logs;
DROP TABLE temp_egg_logs;