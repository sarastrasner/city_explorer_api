DROP TABLE IF EXISTS weather;

DROP TABLE IF EXISTS citydata;


CREATE TABLE citydata (
  id SERIAL PRIMARY KEY,
  search_query VARCHAR(255),
  formatted_search_query VARCHAR(255),
  latitude decimal,
  longitude decimal
);

-- SELECT * FROM citydata;


CREATE TABLE weather (
  id SERIAL PRIMARY KEY,
  search_query VARCHAR(255),
  forecast VARCHAR(255),
  forecast_time VARCHAR(255),
  search_timestamp VARCHAR(255)
);

-- SELECT * FROM weather;

