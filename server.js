'use strict';

//get environmental variables from .env
require('dotenv').config();

//pull in dependencies
const express = require('express');
const superagent = require('superagent');
const cors = require('cors');
const pg = require('pg');
const client = new pg.Client();

//Application setup
const PORT = process.env.PORT;
const app = express();
app.use(cors());

//Routes
app.get('/location', handleLocation);
app.get('/weather', handleWeather);
app.get('/trails', handleTrails);
app.use('*', notFoundHandler);


function handleLocation(request, response) {
  try {
    let city = request.query.city;
    let key = process.env.GEOCODE_API_KEY;
    const url = `https://us1.locationiq.com/v1/search.php?key=${key}&q=${city}&format=json&limit=1`;
    superagent.get(url)
      .then(data => {
        const geoData = data.body[0];
        const location = new Location(city, geoData);
        response.send(location);
      })
  }
  catch(error) {
    console.log('ERROR', error);
    response.status(500).send('So sorry, something went wrong.');
  }
}

function Location(city, geoData) {
  this.search_query = city;
  this.formatted_query = geoData.display_name;
  this.latitude = geoData.lat;
  this.longitude = geoData.lon;
}

function Weather(description, time) {
  this.forecast = description;
  this.time = time;
}

function handleWeather(request, response) {
  try {
    const lat = request.query.latitude;
    const lon = request.query.longitude;
    let key = process.env.WEATHER_API_KEY;
    const url = `https://api.weatherbit.io/v2.0/forecast/daily?lat=${lat}&lon=${lon}&key=${key}`;
    superagent.get(url)
      .then(results => {
        let weatherData = results.body.data;
        let weatherDataSlice =  weatherData.slice(0, 8);
        response.send(weatherDataSlice.map(value => new Weather(value.weather.description, value.datetime)));
      })
  }
  catch (error) {
    console.log('ERROR', error);
    response.status(500).send('So sorry, something went wrong.');
  }
}

function TrailMaker(object){
  this.name = object.name;
  this.location = object.location;
  this.length = object.length;
  this.stars = object.stars;
  this.star_votes =object.star_votes;
  this. summary = object.summary;
  this.trail_url = object.trail_url;
  this.conditions = object.conditionDetails;
  this.condition_date = object.conditionDate.slice(0,9);
  this.condition_time = object.conditionDate.slice(11,19);
}

function handleTrails(request,response) {
  try {
    let lat = request.query.latitude;
    let lon = request.query.longitude;
    let key = process.env.TRAIL_API_KEY;
    const url = `https://www.hikingproject.com/data/get-trails?lat=${lat}&lon=${lon}&maxDistance=10&key=${key}`;
    superagent.get(url)
      .then(results => {
        let trailData = results.body.trails;
        console.log(trailData);
        response.send(trailData.map(value => new TrailMaker(value)))
      });
  }
  catch (error) {
    console.log('ERROR', error);
    response.status(500).send('So sorry, something went wrong.');
  }
}

function notFoundHandler(request, response) {
  response.status(500).send('Sorry. something went wrong');
}


function startServer() {
  app.listen(PORT, () => {
    console.log('Server is listening on port', PORT);
  });
}

client.connect()
  .then(startServer)
  .catch(e => console.log(e));