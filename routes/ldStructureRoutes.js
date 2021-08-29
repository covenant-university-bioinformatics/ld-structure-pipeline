const express = require('express');
const router = express.Router()
const LDSController = require ('../controllers/ldStructureModule');
const multer  = require('multer')
const upload = multer({ dest: './Jobs/file_uploads/' })

router.post('/jobs', authenticateToken, upload.single('file'), async (req, res) => {
  // res.send(req.user.username)
  // Validate input file else return status 400 with error
  if(!await LDSController.isFileValid(req.file)) return res.status(400).send('Please upload a valid file');

  // Validate other form data else return status 400 with error
  const { error } = await LDSController.validateFormData(req.body);
  if(error) return res.status(400).send(error.details[0].message);

  // Store formdata in variables
  let filepath = req.file.path;
  let snpsColumn = req.body.marker_name;
  let r2_value = req.body.r_squared;

  // Save job parameters to DB
  const jobResult = await LDSController.saveJobsToDB(req.file, req.body, req.user);
  if(jobResult.errors) return res.status(400).send("jobResult.message");

  let outputDir = await LDSController.createJobDir();
  let delimiter = await LDSController.getFileDelimiter(filepath);
  let snpsFilepath = await LDSController.extractSnpsFromInputFile(filepath, snpsColumn, outputDir, delimiter);
  
  let result = await LDSController.processExtractedSnps(snpsFilepath, r2_value, outputDir, jobResult);
  res.send(result);
});

router.get('/jobs', authenticateToken, async (req, res) => {
  const result = await LDSController.getAllJobsFromDB();
  if(result.errors) return res.status(400).send(result.message);
  res.send(result.filter(job => job.username === req.user.username));
})

router.get('/jobs/:jobUniqueID', authenticateToken, async (req, res) => {
  let result = await LDSController.getJobFromDB(req.params.jobUniqueID);
  if(result.errors) return res.status(400).send(result.message);

  result = result.filter(job => job.username === req.user.username)

  const fewOutput = await LDSController.readFewProcessedFile(result[0].outputFilepath);
  if(fewOutput.errors) return res.status(400).send(fewOutput.message);
  res.send(fewOutput);
})

router.delete('/jobs', authenticateToken, async (req, res) => {
  const result = await LDSController.deleteAllJobsFromDB();
  if(result.errors) return res.status(400).send(result.message);
  // console.log(result);
  res.send(result.filter(job => job.username === req.user.username));
})

router.delete('/jobs/:jobUniqueID', authenticateToken, async (req, res) =>{
  const result = await LDSController.deleteJobFromDB(req.params.jobUniqueID);
  if(result.errors) return res.status(400).send(result.message);

  const resultAllJobs = await LDSController.getAllJobsFromDB();
  if(resultAllJobs.errors) return res.status(400).send(resultAllJobs.message);
  // console.log(result);
  res.send(resultAllJobs.filter(job => job.username === req.user.username));
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  if (token == null) return res.sendStatus(401)
  
  const jwt_decode = require('jwt-decode');
  req.user = jwt_decode(token);
  next() 

  // jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
  //     console.log(err)
  //     if (err) return res.sendStatus(403)
  //     req.user = user
  //     next() 
  // })
}

module.exports = router;