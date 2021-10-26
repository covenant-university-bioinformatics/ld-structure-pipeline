// DB Connection ================================================================
const mongoose = require('mongoose');
mongoose.set('useFindAndModify', false);

// console.log("Mongo DB host: "+ process.env.MONGODB_HOST);
// console.log("Mongo DB Port: "+ process.env.MONGODB_PORT);

const url = `mongodb://${process.env.MONGODB_HOST}:${process.env.MONGODB_PORT}`;
// const url = `mongodb://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_PODNAME}-0.${process.env.MONGO_HOST}:27017,${process.env.MONGODB_PODNAME}-1.${process.env.MONGO_HOST}:27017,${process.env.MONGODB_PODNAME}-2.${process.env.MONGO_HOST}:27017/?authSource=admin&replicaSet=rs0`;
mongoose.connect(url,
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