const express = require('express');
require('dotenv').config()
const app = express();
const cors = require('cors');
const worker = require('./routes/worker');
worker.worker();

// middlewares to use [json in formbody, cors]
app.use(express.json());
app.use(cors());

// middleware to send all ldstructure requests to ldStructureRouter
const ldStructureRouter = require('./routes/ldStructureRoutes');
app.use('/api/ldstructure', ldStructureRouter);

// middleware to serve /jobs directory to /jobs request
// app.use('/jobs', express.static(__dirname + '/jobs'));
app.use('/pv/analysis', express.static(__dirname + '/pv/analysis/'));

// get server port number or use 3000 if no port has been set
const port = process.env.PORT || 3000
app.listen(port, () => { console.log(`Listening on port ${port}...`) }); 