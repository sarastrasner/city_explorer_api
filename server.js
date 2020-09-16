'use strict';

// this will bring in my express libraray
const express = require('express');
const cors = require('cors');
const pg = require('pg');
const client = new pg.Client();

// bring in the dotenv library
// the job of this library is to find the .env file and get the variables out of it so we can use them in our JS file
require('dotenv').config();

// this gives us a variable that we can use to run all the methods that are in the express library
const app = express();

app.use(cors());


// the dotenv library lets us grab the PORT var from the .env using the magic words process.env.variableName
const PORT = process.env.PORT;

app.get('/', function (request, response) {
  response.send('Hello World');
});

app.get('/location', handleLocation);
app.get('/weather', handleWeather);
app.use('*', notFoundHandler);


function handleLocation(request, response) {
  try {
    const geoData = require('./data/location.json');
    const city = request.query.city;
    const locationData = new Location(city, geoData);
    response.send(locationData);
  }
  catch (error) {
    console.log('ERROR', error);
    response.status(500).send('Sorry, something went wrong.');
  }
}

function Location(city, geoData) {
  this.search_query = city;
  this.formatted_query = geoData[0].display_name;
  this.latitude = geoData[0].lat;
  this.longitude = geoData[0].lon;
}



function handleWeather(request,response) {
  console.log('We are in the handleWeather function!')
  try {
    const getWeatherData = require('./data/weather.json');
    const weatherData = [];
    getWeatherData.data.forEach(entry => {
      weatherData.push(new Weather(entry));
    });
    response.send(weatherData);
  }
  catch (error) {
    console.log('ERROR', error);
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


function startServer() {
  app.listen(PORT, () => {
    console.log('Server is listening on port', PORT);
  });
}

client.connect()
  .then(startServer)
  .catch(e => console.log(e));
