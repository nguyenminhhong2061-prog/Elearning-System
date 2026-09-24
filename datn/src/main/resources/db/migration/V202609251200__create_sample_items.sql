-- Table backing the template module `modules/sample` (entity SampleItem).
-- It is not part of the agreed 38-table schema in V1, but Hibernate validates every entity at startup
-- (ddl-auto=validate), so the template needs its table to exist.
-- When the `sample` module is removed, drop this table in a new migration.
CREATE TABLE sample_items (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name         VARCHAR(100) NOT NULL,
  description  VARCHAR(500) NULL,
  status       VARCHAR(20)  NOT NULL,
  created_at   TIMESTAMPTZ  NOT NULL
);
