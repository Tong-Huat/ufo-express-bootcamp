import express, { request, response } from 'express';
import methodOverride from 'method-override';
import { read, add, write } from './jsonFileStorage.js';

const app = express();

app.set('view engine', 'ejs');
// Override POST requests with query param ?_method=PUT to be PUT requests
app.use(methodOverride('_method'));
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

// CB for all UFO sightings & render index page
const handleIncomingRequest = (request, response) => {
  read('data.json', (err, data) => {
    console.log(data.sightings.length);
    response.render('index', data);
  });
};

// CB to handle sighting by index params and render
const handleSightingRequest = (request, response) => {
  read('data.json', (err, data) => {
    const { index } = request.params;
    const sighting = data.sightings[index];
    console.log(index);
    //  only 1 obj(sightings[index]) is parsed to sightings.ejs
    response.render('singlesighting', sighting);
  });
};

// CB to handle addition of sighting
const addSightingSubmission = (request, response) => {
// Add new sighting data in request.body to sightings array in data.json.
  add('data.json', 'sightings', request.body, (err) => {
    if (err) {
      response.status(500).send('DB write error.');
    }
  });
  // redirect to newly created sighting
  read('data.json', (err, data) => {
    const index = data.sightings.length;
    response.redirect(`/sighting/${index}`);
  });
};

// CB to render sighting submission page
const renderSightingSubmission = (request, response) => {
  response.render('sighting');
};

const renderEditPage = (request, response) => {
  // retrieve selected sighting from DB and render it
  read('data.json', (err, data) => {
    const { index } = request.params;
    const sighting = data.sightings[index];
    // Pass the sighting index to edit form for put request URL
    sighting.index = index;
    // convert sighting back to obj to be rendered in ejs
    const ejsData = { sighting };
    response.render('edit', ejsData);
  });
};

const editPage = (request, response) => {
  const { index } = request.params;
  read('data.json', (err, data) => {
    // Replace the data in the object at the given index
    data.sightings[index] = request.body;
    write('data.json', data, (err) => {
      response.redirect(`/sighting/${index}`);
    });
  });
};

app.get('/', handleIncomingRequest);
app.get('/sighting/:index', handleSightingRequest);
app.get('/sighting', renderSightingSubmission);
app.post('/sighting', addSightingSubmission);
app.put('/sighting/:index', editPage);
app.get('/sighting/:index/edit', renderEditPage);
app.listen(3004);
