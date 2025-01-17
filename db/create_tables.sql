CREATE TABLE IF NOT EXISTS egg_logs(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    eggs INTEGER NOT NULL,
    usable_eggs INTEGER,
    carton_id INTEGER
    carton_assignment INTEGER
);

CREATE TABLE IF NOT EXISTS cartons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    expiration_date TEXT NOT NULL,
    capacity INTEGER NOT NULL,
    date_collected TEXT
);

CREATE TABLE IF NOT EXISTS waste (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    eggs INTEGER NOT NULL
);

