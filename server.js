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
// app.get('trails', handleTrails);
app.use('*', notFoundHandler);


function handleLocation(request, response) {
  try {
    let city = request.query.city;
    let key = process.env.GEOCODE_API_KEY;
    const url = `https://us1.locationiq.com/v1/search.php?key=${key}&q=${city}&format=json&limit=1`;
    superagent.get(url)
      .then(data => {
        // console.log(data);
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
    console.log(url);
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



function notFoundHandler(request, response) {
  response.status(500).send('Sorry. something went wrong');
}

// turn on the server
app.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
});
