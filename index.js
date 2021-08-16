/* eslint-disable prefer-const */
/* eslint-disable max-len */
/* eslint-disable no-shadow */
/* eslint-disable no-unused-vars */
import express, { request, response } from 'express';
import methodOverride from 'method-override';
// eslint-disable-next-line import/no-unresolved
import { read, add, write } from './jsonFileStorage.js';

const app = express();

app.set('view engine', 'ejs');
// Override POST requests with query param ?_method=PUT to be PUT requests
app.use(methodOverride('_method'));
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

// CB for all UFO sightings & render index page
const getSightingsIndex = (request, response) => {
  read('data.json', (err, data) => {
    console.log(data.sightings.length);
    response.render('index', data);
  });
};

// CB to handle sighting by index params and render
const handleSightingRequest = (request, response) => {
  read('data.json', (err, data) => {
    const { index } = request.params;
    const sighting = data.sightings[index - 1];
    console.log(index);
    // check if index exists
    if (index <= data.sightings.length && index > 0) {
      //  only 1 obj(sightings[index]) is parsed to sightings.ejs
      response.render('singlesighting', sighting);
    } else {
      response.status(400).send('Invalid Sightings');
    }
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
    const index = data.sightings.length + 1;
    response.redirect(`/sighting/${index}`);
  });
};

// CB to render sighting submission page
const renderSightingSubmission = (request, response) => {
  read('data.json', (err, data) => {
    response.render('submitsighting');
  }); };

// CB to render page for editing current data
const renderEditPage = (request, response) => {
  // retrieve selected sighting from DB and render it
  read('data.json', (err, data) => {
    const { index } = request.params;
    const sighting = data.sightings[index - 1];
    // Pass the sighting index to edit form for put request URL
    sighting.index = index;
    // convert sighting back to obj to be rendered in ejs
    const ejsData = { sighting };
    // if (index <= data.sightings.length && index > 0) {
    //   response.render('edit', ejsData);
    // } else {
    //   response.status(400).send('Invalid Sightings');
    // }
  });
};

// CB to edit page and redirect to newly edited page
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

// CB to del sighting
const deleteSighting = (request, response) => {
  // Remove element from DB at given index
  const { index } = request.params;
  read('data.json', (err, data) => {
    data.sightings.splice(index, 1);
    write('data.json', data, (err) => {
      response.redirect('/');
    });
  });
};

// CB to render list of shapes in sightings
const listOfShapesSighted = (request, response) => {
  read('data.json', (err, data) => {
    const { sightings } = data;
    // filter out the unique shapes in the DB
    const listOfShape = [...new Set(sightings.map((item) => item.shape))].sort();
    // convert array of shapes back to obj to pas to shapelist.ejs
    const listOfShapeObj = { listOfShape };
    response.render('shapelist', listOfShapeObj);
  });
};

const sortSightingByShapes = (request, response) => {
  let results = [];
  read('data.json', (err, data) => {
    const { sightings } = data;
    // console.log('data: ', data);
    // console.log('sightings: ', sightings);
    const { shape } = request.params;
    results = sightings.filter((sighting) => sighting.shape.toLowerCase() === shape);
    // create obj to be passed to ejs to be rendered
    let obj = { };
    // pass different sets of data into obj
    obj.results = results;
    console.log('shape: ', shape);
    console.log('results: ', results);
    // for (let i = 0; i < sightings.length; i += 1) {
    //   if (sightings[i].shape.match(shape)) {
    response.render('sightingsbyshape', { obj, sightings });
  //     } else {
  //       response.status(400).send('Invalid Shape');
  //     }
  //   }
  });
};

app.get('/', getSightingsIndex);
app.get('/sighting/:index', handleSightingRequest);
app.get('/submitsighting', renderSightingSubmission);
app.post('/sighting', addSightingSubmission);
app.put('/sighting/:index', editPage);
app.get('/sighting/:index/edit', renderEditPage);
app.delete('/sighting/:index', deleteSighting);
app.get('/shapes', listOfShapesSighted);
app.get('/shapes/:shape', sortSightingByShapes);
app.listen(3004);
