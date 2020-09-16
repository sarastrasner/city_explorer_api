
DROP TABLE IF EXISTS citydata;

CREATE TABLE citydata (
  id SERIAL PRIMARY KEY,
  city_name VARCHAR(255),
  latitude INT,
  longitude INT
)