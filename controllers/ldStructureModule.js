const { once } = require('events');
const { createReadStream } = require('fs');
const { createInterface } = require('readline');
const axios = require('axios');
const { promises: Fs } = require('fs');
const fs = require('fs');
var mime = require('mime-types');
const Joi = require('joi');

const dbHandler = require('../models/dbconnect');
const LDStructureDB = require('../models/ldStructureDBSchema');

module.exports.isFileValid = async function (file) {
  try {
    if (file.mimetype === 'text/plain') {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
    // console.log(error);
  }
}

module.exports.validateFormData = async function (formdata) {
  const schema = Joi.object({
    job_name: Joi.string().min(3),
    marker_name: Joi.number().integer().greater(-1).required(),
    r_squared: Joi.number().greater(0)
  });

  const dataToValidate = {
    job_name: formdata.job_name,
    marker_name: formdata.marker_name,
    r_squared: formdata.r_squared
  }

  return schema.validate(dataToValidate);
}

module.exports.saveJobsToDB = async function (req, jobUniqueID) {
  try {
    const newJob = new LDStructureDB({
      jobUniqueID: jobUniqueID,
      jobName: req.body.job_name,
      inputFilepath: req.file.path,
      markerName: req.body.marker_name,
      rSquared: req.body.r_squared,
      dateSubmitted: new Date(),
      username: req.user.username,
    });

    const savedJob = await newJob.save();
    return savedJob;
  } catch (error) {
    return error;
  }
}

module.exports.getAllJobsFromDB = async function () {
  try {
    return await LDStructureDB.find().sort({ dateSubmitted: -1 })
      ;
  } catch (error) {
    return error;
  }
}

module.exports.getJobFromDB = async function (jobUniqueID) {
  try {
    return await LDStructureDB.find({ jobUniqueID: jobUniqueID });
  } catch (error) {
    return error;
  }
}

module.exports.deleteAllJobsFromDB = async function () {
  try {
    return await LDStructureDB.deleteMany({});
  } catch (error) {
    return error;
  }
}

module.exports.deleteJobFromDB = async function (jobUniqueID) {
  try {
    return await LDStructureDB.deleteOne({ jobUniqueID: jobUniqueID });
  } catch (error) {
    return error;
  }
}

module.exports.createJobDir = async function (jobUniqueID) {
  const dir = './Jobs/Job' + jobUniqueID + '/';
  fs.mkdir(dir, { recursive: true }, (err) => {
    if (err) return err;
  });
  return dir;
}

module.exports.extractSnpsFromInputFile = async function (filepath, marker_name, outputDir, delimiter) {
  let snpsFilepath = outputDir + 'snps_file.txt';
  
  const readline = createInterface({
    input: createReadStream(filepath),
    crlfDelay: Infinity
  });
  i = 0;
  readline.on('line', async (line) => {
    if (line.trim().length !== 0) {
      let snpsid = line.split(delimiter)[marker_name - 1];
      if (i > 0) {
        snpsid = snpsid + '\n';
        await writeOutputToFile(snpsid, snpsFilepath);
      }
      i++;
    }
  });

  await once(readline, 'close');
  return snpsFilepath;
}

module.exports.getFileDelimiter = async function (filepath) {
  const readline = createInterface({
    input: createReadStream(filepath),
    crlfDelay: Infinity
  });
  i = 0;
  let delimiter = "";
  readline.on('line', async (line) => {
    if (line.trim().length !== 0) {
      if (i === 1) {
        if (line.split(" ").length > 3) { delimiter = " " }
        if (line.split("\t").length > 3) { delimiter = "\t"; }
        readline.close()
        readline.removeAllListeners()
      }
      i++;
    }
  });
  await once(readline, 'close');
  return delimiter;
}

module.exports.processExtractedSnps = async function (filepath, r2_value, processedFilepath, unProcessedFilepath) {
  let feedback = '';
  try {
    if (r2_value <= 0 || r2_value.length < 0) {
      r2_value = 0.9;
    }
    
    const readline = createInterface({
      input: createReadStream(filepath),
      crlfDelay: Infinity
    });

    await writeOutputFileHeader(processedFilepath);

    i = 0;
    for await (const snpsid of readline) {
      if (snpsid.trim().length !== 0) {
        await processSnpsID(snpsid, processedFilepath, unProcessedFilepath, r2_value);
      }
      i++;
      console.log(i)
      await sleep(10);
    }

    feedback = 'COMPLETED';

  } catch (err) {
    console.log(err);
    feedback = err;
  }
  return feedback;
}

module.exports.readFewProcessedFile = async function (filepath) {
  const readline = createInterface({
    input: createReadStream(filepath),
    crlfDelay: Infinity
  });
  i = 0;
  let fewData = Array();
  for await (const line of readline) {
    if (line.trim().length !== 0) {
      if (i < 20) {
        fewData.push(line);
      } else {
        readline.close()
        readline.removeAllListeners()
      }
      i++;
    }
  }

  return fewData;
}

module.exports.updateJobDocument = async function (filter, update) {
  try {
    await LDStructureDB.findOneAndUpdate(filter, update, { new: true });
    console.log('Status: ' + update.status)
  } catch (error) {
    console.log(error);
  }
}

module.exports.deleteJobDir = async function (jobUniqueID) {
  const dir = './Jobs/Job' + jobUniqueID;
  fs.rmdir(dir, { recursive: true }, (err) => {
    if (err) {
      throw err;
    }
    console.log(`${dir} is deleted!`);
  });
}

async function writeOutputFileHeader(processedFilepath) {
  const fileHeader = "Variant_1 \t Location \t Consequence \t Variant_2 \t Location \t Consequence \t R_Squared \t D_Prime \n";
  await writeOutputToFile(fileHeader, processedFilepath);
}

async function processSnpsID(snpsid, processedFilepath, unProcessedFilepath, r2_value) {
  const apiRequestFeedback = await sendRequestToEnsemblAPI(snpsid);
  if (Array.isArray(apiRequestFeedback) && apiRequestFeedback.length > 0) {
    // await writeOutputToFile(apiRequestFeedback[0].variation2+'\n', processedFilepath);        
    const filteredVariantsFeedback = await filterVariationsByR2(apiRequestFeedback, r2_value);
    if (filteredVariantsFeedback.key === '1') {
      await writeOutputToFile(filteredVariantsFeedback.message, processedFilepath);
    } else {
      await writeOutputToFile(filteredVariantsFeedback.message + '\n', unProcessedFilepath);
    }
  } else {
    await writeOutputToFile(apiRequestFeedback + ' : ' + snpsid + '\n', unProcessedFilepath);
  }
}

async function sendRequestToEnsemblAPI(snpsid) {
  try {
    const response = await axios({
      method: 'get',
      url: 'https://rest.ensembl.org/ld/human/' + snpsid + '/1000GENOMES:phase_3:KHV?'
    });
    return response.data;
  } catch (error) {
    return error;
  }
}

async function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function filterVariationsByR2(snps_array, r2_value) {
  resp = '';
  try {
    if (Array.isArray(snps_array) && snps_array.length > 0) {
      var variantsInfo = '';
      var variant1 = snps_array[0].variation1;
      var variant1Info = await fetchVariantInfo(variant1);
      var variant1Location = '';
      var variant1Consequence = '';

      if (Array.isArray(variant1Info) && variant1Info.length > 0) {
        variant1Location = variant1Info[0].seq_region_name + ':' + variant1Info[0].start;
        variant1Consequence = variant1Info[0].most_severe_consequence;
      }

      var variant1LocCon = variant1 + '\t' + variant1Location + '\t' + variant1Consequence;

      for (const snps_obj of snps_array) {
        if (snps_obj.r2 >= r2_value) {

          var d_prime = snps_obj.d_prime;
          var r2 = snps_obj.r2;

          var variant2 = snps_obj.variation2;
          var variant2Info = await fetchVariantInfo(variant2);
          var variant2Location = '';
          var variant2Consequence = '';

          if (Array.isArray(variant2Info) && variant2Info.length > 0) {
            variant2Location = variant2Info[0].seq_region_name + ':' + variant2Info[0].start;
            variant2Consequence = variant2Info[0].most_severe_consequence;
          }

          var variant2LocCon = variant2 + '\t' + variant2Location + '\t' + variant2Consequence;

          var variant1and2Info = variant1LocCon + '\t' + variant2LocCon + '\t' + r2 + '\t' + d_prime + '\n';
          variantsInfo = variantsInfo + variant1and2Info;
        }
      }

      resp = { 'key': '1', 'message': variantsInfo };
    } else {
      resp = { 'key': '2', 'message': 'Invalid output' };
    }

  } catch (error) {
    resp = { 'key': '2', 'message': error.message };
  }
  return resp;
}

async function fetchVariantInfo(snpsid) {
  try {
    const response = await axios({
      method: 'get',
      url: 'https://rest.ensembl.org/vep/human/id/' + snpsid + '?'
    });

    return response.data;

  } catch (error) {
    return error.message;
  }
}

async function writeOutputToFile(snps_data, pathToWriteData) {
  try {
    // create a stream
    const stream = fs.createWriteStream(pathToWriteData, { flags: 'a' });
    stream.write(snps_data);                                                      // append snps data to the file
    stream.end();

  } catch (error) {
    console.error('Error writing output to file');
  }

}