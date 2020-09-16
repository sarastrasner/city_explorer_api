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
app.get('/weather', weatherHandler);
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

function weatherHandler(request, response) {
  try {
    const lat = request.query.latitude;
    const lon = request.query.longitude;
    let key = process.env.WEATHER_API_KEY;
    const url = `https://api.weatherbit.io/v2.0/forecast/daily?lat=${lat}&lon=${lon}&key=${key}`;
    superagent.get(url)
      .then(results => {
        let weatherData = results.body.data;
        let weatherDataSlice = weatherData.slice(0, 8);
        response.send(weatherDataSlice.map(value => new Weather(value.weather.description, value.datetime)));
      })
  }
  catch (error) {
    console.log('ERROR', error);
    response.status(500).send('So sorry, something went wrong.');
  }
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
function handleGetLocation(req, res) {
  if (locations[req.query.city]) {
    console.log('getting city from memory', req.query.city)
    res.status(200).json(locations[req.query.city]);
  }
  else {
    console.log('getting city from API', req.query.city)
    let url = `https://us1.locationiq.com/v1/search.php`;
    let queryObject = {
      key: process.env.GEOCODE_API_KEY,
      city: req.query.city,
      format: 'json',
      limit: 1
    };
    superagent.get(url).query(queryObject)
      // if
      .then(dishes => {
        let data = dishes.body[0];
        let location = {
          latitude: data.lat,
          longitude: data.lon,
          name: data.display_name
        };
        // Store in the DB, please, not memory
        // INSERT
        locations[req.query.city] = location;
        res.status(200).json(location);
      })
      // else
      .catch(err => {
        throw new Error(err.message);
      })
  }
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






