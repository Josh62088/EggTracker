INSERT INTO egg_logs (date, eggs, usable_eggs, carton_id) VALUES
('2023-01-01', 12, 12, NULL),
('2023-01-02', 10, 9, NULL);

INSERT INTO cartons (expiration_date, capacity, date_collected) VALUES
('2023-01-15', 12, '2023-01-01'),
('2023-01-16', 12, '2023-01-02');