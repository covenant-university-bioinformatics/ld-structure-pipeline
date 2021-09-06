const { SandboxedJob } = require('bullmq');
const LDSController = require('../controllers/ldStructureModule');

module.exports = async (job) => {

    // Create job output files
    let processedFilepath = job.data.outputDir + 'processed.txt';
    let unProcessedFilepath = job.data.outputDir + 'unProcessed.txt';
s
    // Update job status
    const filter = { jobUniqueID: job.data.jobUniqueID }
    var update = { status: 'RUNNING', outputFilepath: processedFilepath }
    await LDSController.updateJobDocument(filter, update)

    // Process the job
    let delimiter = await LDSController.getFileDelimiter(job.data.filepath);
    let snpsFilepath = await LDSController.extractSnpsFromInputFile(job.data.filepath, job.data.marker_name, job.data.outputDir, delimiter);
    let result = await LDSController.processExtractedSnps(snpsFilepath, job.data.r_squared, processedFilepath, unProcessedFilepath);

    
};