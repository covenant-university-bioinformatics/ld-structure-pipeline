const { SandboxedJob } = require('bullmq');
const LDSController = require('../controllers/ldStructureModule');

module.exports = async (job) => {

    // Create job unique directory and output files
    let outputDir = await LDSController.createJobDir(job.data.jobUniqueID);
    let processedFilepath = outputDir + 'processed.txt';
    let unProcessedFilepath = outputDir + 'unProcessed.txt';

    // Update job status
    const filter = { jobUniqueID: job.data.jobUniqueID }
    var update = { status: 'RUNNING', outputFilepath: processedFilepath }
    await LDSController.updateJobDocument(filter, update)

    // Process the job
    let delimiter = await LDSController.getFileDelimiter(job.data.filepath);
    let snpsFilepath = await LDSController.extractSnpsFromInputFile(job.data.filepath, job.data.marker_name, outputDir, delimiter);
    let result = await LDSController.processExtractedSnps(snpsFilepath, job.data.r_squared, processedFilepath, unProcessedFilepath);
    
};