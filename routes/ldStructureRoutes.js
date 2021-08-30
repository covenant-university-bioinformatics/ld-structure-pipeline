const express = require('express');
const router = express.Router()
const LDSController = require('../controllers/ldStructureModule');
const config = require('./config')

const multer = require('multer')
const upload = multer({ dest: './Jobs/file_uploads/' })

const { Queue } = require('bullmq');
const queue = new Queue(config.queueName);

router.post('/jobs', authenticateToken, upload.single('file'), async (req, res) => {
  // Add jobs to the queue
  await queue.add(req.body.job_name);

  // Process the jobs in workers
  const { Worker } = require('bullmq');
  const worker = new Worker(config.queueName, async job => {
    if (job.name === req.body.job_name) {
      // Validate input file
      if (!await LDSController.isFileValid(req.file)) return res.status(400).send('Please upload a valid file');

      // Validate other form data
      const { error } = await LDSController.validateFormData(req.body);
      if (error) return res.status(400).send(error.details[0].message);

      // Save job parameters to DB
      const jobResult = await LDSController.saveJobsToDB(req);
      if (jobResult.errors) return res.status(400).send(jobResult.message);

      // Process job
      let outputDir = await LDSController.createJobDir();
      let delimiter = await LDSController.getFileDelimiter(req.file.path);
      let snpsFilepath = await LDSController.extractSnpsFromInputFile(req, outputDir, delimiter);
      let result = await LDSController.processExtractedSnps(snpsFilepath, req.body.r_squared, outputDir, jobResult);
      // res.send(result);
    }
  }, 
  {
    connection: config.connection,
    concurrency: config.concurrency,
  });

  // Listen to jobs for completion
  worker.on("completed", (job) => {
    console.log(`Completed job ${job.id} successfully`)
    res.send('done processing');
  });
  worker.on("failed", (job, err) => {
    console.log(`Failed job ${job.id} with ${err}`)
    res.send('error processing', err);
  });

});

router.get('/jobs', authenticateToken, async (req, res) => {
  const result = await LDSController.getAllJobsFromDB();
  if (result.errors) return res.status(400).send(result.message);
  res.send(result.filter(job => job.username === req.user.username));
})

router.get('/jobs/:jobUniqueID', authenticateToken, async (req, res) => {
  let result = await LDSController.getJobFromDB(req.params.jobUniqueID);
  if (result.errors) return res.status(400).send(result.message);

  result = result.filter(job => job.username === req.user.username)

  const fewOutput = await LDSController.readFewProcessedFile(result[0].outputFilepath);
  if (fewOutput.errors) return res.status(400).send(fewOutput.message);
  res.send(fewOutput);
})

router.delete('/jobs', authenticateToken, async (req, res) => {
  const result = await LDSController.deleteAllJobsFromDB();
  if (result.errors) return res.status(400).send(result.message);
  // console.log(result);
  res.send(result.filter(job => job.username === req.user.username));
})

router.delete('/jobs/:jobUniqueID', authenticateToken, async (req, res) => {
  const result = await LDSController.deleteJobFromDB(req.params.jobUniqueID);
  if (result.errors) return res.status(400).send(result.message);

  const resultAllJobs = await LDSController.getAllJobsFromDB();
  if (resultAllJobs.errors) return res.status(400).send(resultAllJobs.message);
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

const { QueueEvents } = require('bullmq');
const queueEvents = new QueueEvents(config.queueName);

queueEvents.on('waiting', ({ jobId }) => {
    console.log(`A job with ID ${jobId} is waiting`);
});

queueEvents.on('active', ({ jobId, prev }) => {
    console.log(`Job ${jobId} is now active; previous status was ${prev}`);
});

queueEvents.on('completed', ({ jobId, returnvalue }) => {
    console.log(`${jobId} has completed and returned ${returnvalue}`);
});

queueEvents.on('failed', ({ jobId, failedReason }) => {
    console.log(`${jobId} has failed with reason ${failedReason}`);
});

module.exports = router;