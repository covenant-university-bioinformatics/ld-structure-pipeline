// DB Connection ================================================================
const mongoose = require('mongoose');
mongoose.set('useFindAndModify', false);
const url = 'mongodb://localhost/LDStructureDB';

mongoose.connect(url, {useNewUrlParser:true, useUnifiedTopology: true})
const con = mongoose.connection

con.on('open', () =>{
  console.log('Connected to db...');
})
// ==============================================================================