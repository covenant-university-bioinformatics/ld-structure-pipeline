const express = require('express');
const app = express();
const cors = require('cors');

// middlewares to use [json in formbody, cors]
app.use(express.json());
app.use(cors());

// middleware to send all ldstructure requests to ldStructureRouter
const ldStructureRouter = require('./routes/ldStructureRoutes');
app.use('/api/ldstructure', ldStructureRouter);

// middleware to serve /jobs directory to /jobs request
app.use('/jobs', express.static(__dirname + '/jobs')); 

// get server port number or use 3000 if no port has been set
const port = process.env.PORT || 3000
app.listen(port, () => { console.log(`Listening on port ${port}...`) }); 