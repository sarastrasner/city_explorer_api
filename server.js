'use strict'

//get environmental variables from .env
require('dotenv').config();

//pull in dependencies
const cors = require('cors');
const express = require('express');
const superagent = require('superagent');
let pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL);

//Application Setup
const PORT = process.env.PORT;
const app = express();
app.use(cors());

const dataBaseUrl = process.env.DATABASE_URL;
let locations = [];


//Routes
app.get('/location', handleGetLocation);
app.get('/weather', newWeatherHandler);
app.get('/trails', trailHandler);
app.use('*', notFound);
// constructor function

function Location(city, data) {
  this.search_query = city;
  this.formatted_query = data.display_name;
  this.latitude = data.lat;
  this.longitude = data.lon;
}
function Weather(description, time) {
  this.forecast = description;
  this.time = time;
}
function Trail(object) {
  this.name = object.name;
  this.location = object.location;
  this.length = object.length;
  this.stars = object.stars;
  this.star_votes = object.starVotes;
  this.summary = object.summary;
  this.trail_url = object.url;
  this.conditions = object.conditionDetails;
  this.condition_date = object.conditionDate.slice(0, 10);
  this.condition_time = object.conditionDate.slice(11, 19);
}


function newWeatherHandler(request, response){
  const city = request.query.search_query;
  const sql = `SELECT * FROM weather WHERE search_query=$1;`;
  const safeValues = [city];
  client.query(sql, safeValues)
    .then(resultsFromSql => {
      if(resultsFromSql.rowCount && Date.now() - 84600 < parseInt(resultsFromSql.rows[0].search_timestamp)){
        console.log('pulling from database', resultsFromSql);
        const weatherCity = resultsFromSql.rows;
        response.status(200).send(weatherCity);
      } else if (resultsFromSql.rowCount && Date.now() - 84600 > parseInt(resultsFromSql.rows[0].search_timestamp)) {
        console.log('we are in the else if statement');
        const sql = `DELETE FROM weather WHERE search_query = $1;`;
        const safeValue = [city];
        client.query(sql,safeValue)
          .then(() => {
            console.log('calling the API');
            const lat = request.query.latitude;
            const lon = request.query.longitude;
            let key = process.env.WEATHER_API_KEY;
            const url = `https://api.weatherbit.io/v2.0/forecast/daily?lat=${lat}&lon=${lon}&key=${key}`;
            console.log(url);
            console.log(request.query);
            superagent.get(url)
              .then(results => {
                let weatherData = results.body.data;
                let weatherDataSlice = weatherData.slice(0, 8);
                let newWeather = weatherDataSlice.map(value => new Weather(value.weather.description, value.datetime));
                newWeather.forEach((data) => {
                  let sql = 'INSERT INTO weather (search_query, forecast, forecast_time, search_timestamp) VALUES ($1, $2, $3, $4);';
                  const safeValues = [city, data.forecast, data.time, Date.now()];
                  client.query(sql,safeValues);
                }
                )
                response.status(200).send(newWeather);
              })
          })
      } else {
        console.log('calling the API');
        const lat = request.query.latitude;
        const lon = request.query.longitude;
        let key = process.env.WEATHER_API_KEY;
        const url = `https://api.weatherbit.io/v2.0/forecast/daily?lat=${lat}&lon=${lon}&key=${key}`;
        console.log(url);
        console.log(request.query);
        superagent.get(url)
          .then(results => {
            let weatherData = results.body.data;
            let weatherDataSlice = weatherData.slice(0, 8);
            let newWeather = weatherDataSlice.map(value => new Weather(value.weather.description, value.datetime));
            newWeather.forEach((data) => {
              let sql = 'INSERT INTO weather (search_query, forecast, forecast_time, search_timestamp) VALUES ($1, $2, $3, $4);';
              const safeValues = [city, data.forecast, data.time, Date.now()];
              client.query(sql,safeValues);
            }
            )
            response.status(200).send(newWeather);
          })
      }
    })
}



function trailHandler(request, response) {
  try {
    const lat = request.query.latitude;
    const lon = request.query.longitude;
    let key = process.env.TRAIL_API_KEY;
    const url = `https://www.hikingproject.com/data/get-trails?lat=${lat}&lon=${lon}&maxDistance=10&key=${key}`;
    superagent.get(url)
      .then(results => {
        let trailData = results.body.trails;
        response.send(trailData.map(value => new Trail(value)));
      })
  }
  catch (error) {
    console.log('ERROR', error);
    response.status(500).send('So sorry, something went wrong.');
  }
}
function notFound(request, response) {
  response.status(404).send('Sorry, Not Found');
}

function handleGetLocation(request, response){
  const city = request.query.city;

  //do we have this city in the database?
  const sql = `SELECT * FROM citydata WHERE search_query=$1;`;
  const safeValues = [city];

  client.query(sql, safeValues)
    .then(resultsFromSql => {
    // if we do, lets send them this city
      if(resultsFromSql.rowCount > 0){
        const chosenCity = resultsFromSql.rows[0];
        console.log('found the city in the database')
        response.status(200).send(chosenCity);
      } else {
        console.log('did not find the city - going to the API');
        const url = 'https://us1.locationiq.com/v1/search.php';
        const queryObject = {
          key: process.env.GEOCODE_API_KEY,
          city,
          format: 'JSON',
          limit: 1
        }
        superagent
          .get(url)
          .query(queryObject)
          .then(data => {
            console.log(data.body);
            const place = new Location(city, data.body[0]);
            console.log(city, place.formatted_query, place.latitude, place.longitude);
            const sql = 'INSERT INTO citydata (search_query, formatted_search_query, latitude, longitude) VALUES ($1, $2, $3, $4);';
            const safeValues = [city, place.formatted_query, place.latitude, place.longitude];

            console.log(safeValues)

            client.query(sql, safeValues);
            response.status(200).send(place);
          })
      }
    })
    .catch(err => {
      throw new Error(err.message);
    })
}



//server is listening
client.connect()
  .then(startServer)
  .catch(e => console.log(e))
function startServer() {
  app.listen(PORT, () => {
    console.log(`Server is ALIVE and listening on port ${PORT}`);
  });
}






