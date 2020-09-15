'use strict';

//get environmental variables from .env
require('dotenv').config();

//pull in dependencies
const express = require('express');
const superagent = require('superagent');
const cors = require('cors');


//Application setup
const PORT = process.env.PORT;
const app = express();
app.use(cors());

//Routes
app.get('/location', handleLocation);
app.get('/weather', handleWeather);
app.use('*', notFoundHandler);


function handleLocation(request, response) {
  try {
    let city = request.query.city;
    let key = process.env.GEOCODE_API_KEY;
    const url = `https://us1.locationiq.com/v1/search.php?key=${key}&q=${city}&format=json&limit=1`;
    superagent.get(url)
      .then(data => {
        console.log(data);
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



function handleWeather(request,response) {
  let key = process.env.WEATHER_API_KEY;
  let lat = request.query.latitude;
  let lon = request.query.longitude;
  const url = `http://api.weatherbit.io/v2.0/forecast/daily?lat=${lat}&lon=${lon}`;
  superagent.get(url)
    .then (data => {
      console.log(data);


    })
  try {
    const getWeatherData = require('./data/weather.json');
    const weatherData = [];
    getWeatherData.data.map(entry => {
      weatherData.push(new Weather(entry));
    });
    response.send(weatherData);
  }
  catch (error) {
    console.log('ERROR');
    response.status(500).send('Sorry, something went wrong.');
  }
}


function Weather (entry) {
  this.forecast = entry.weather.description;
  this.time = entry.datetime;
}


function notFoundHandler(request, response) {
  response.status(500).send('Sorry. something went wrong');
}


// turn on the server
app.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
});
