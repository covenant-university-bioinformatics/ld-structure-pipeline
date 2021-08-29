const mongoose = require('mongoose')

const ldStructureDBSchema = new mongoose.Schema({
  
  jobUniqueID: {
    type: String,
    required: true
  },
  jobName: {
    type: String,
    required: true
  },
  inputFilepath: {
    type: String,
    required: true
  },
  markerName: {
    type: Number,
    required: true
  },
  rSquared: {
    type: Number,
    required: true,
    default: 0.9
  },
  dateSubmitted: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    required: true,
    default: 'NOTSTARTED'
  },
  outputFilepath: {
    type: String,
    required: false
  },
  username: {
    type: String,
    required: true
  }
})

module.exports = mongoose.model('LDStructureDB', ldStructureDBSchema);