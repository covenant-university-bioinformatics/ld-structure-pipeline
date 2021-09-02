// DB Connection ================================================================
const mongoose = require('mongoose');
mongoose.set('useFindAndModify', false);
const url = 'mongodb://localhost/LDStructureDB';

mongoose.connect(`mongodb://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_PODNAME}-0.${process.env.MONGO_HOST}:27017,${process.env.MONGODB_PODNAME}-1.${process.env.MONGO_HOST}:27017,${process.env.MONGODB_PODNAME}-2.${process.env.MONGO_HOST}:27017/?authSource=admin&replicaSet=rs0`,
    {
      dbName: 'LDStructureDB',
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
      useUnifiedTopology: true,
    },)
const con = mongoose.connection

con.on('open', () =>{
  console.log('Connected to db...');
})
// ==============================================================================