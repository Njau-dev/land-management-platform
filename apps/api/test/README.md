# Authentication integration tests

The suite uses the database configured by `DATABASE_URL`. Each run creates users
with a unique `phase2-<run>-...@example.test` email and deletes only those exact
users in `afterAll`; refresh-token rows are removed by their user foreign key.
It never truncates tables or deletes seed data.
