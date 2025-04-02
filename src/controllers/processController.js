const fs = require('node:fs/promises');
const os = require('os');
const path = require('path');
const { exec } = require('child_process');
const { sendUpdates } = require('./processUpdateController'); // Import the function

function processContent(headerToAdd, content, result_processContent) {
    const lines = content.split('\n');
    let modifiedContent = content;

    if (lines.length > 0 && lines[0].trim() !== headerToAdd) {
        modifiedContent = `${headerToAdd}\n${content}`;
        result_processContent.details += `added header ${headerToAdd}\n`;
    } else {
        result_processContent.details += `skip adding header\n`;
    }

    result_processContent.details += `find and replace\n`;

    // Replace all occurrences of '"'
    for (let i = 0; ; i++) {
        if (modifiedContent.includes('"')) {
            modifiedContent = modifiedContent.replace(/"/g, '');
            result_processContent.details += `- [${i}]removed double quotes\n`;
        } else {
            break;
        }
    }

    // Replace all occurrences of '|0|'
    for (let i = 0; ; i++) {
        if (modifiedContent.includes('|0|')) {
            modifiedContent = modifiedContent.replace(/\|0\|/g, '||');
            result_processContent.details += `- [${i}]replaced |0| with ||\n`;
        } else {
            break;
        }
    }

    // Replace all occurrences of '??:??'
    for (let i = 0; ; i++) {
        if (modifiedContent.includes('??:??')) {
            modifiedContent = modifiedContent.replace(/\?\?\:\?\?/g, '00:00');
            result_processContent.details += `- [${i}]replaced ??:?? with 00:00\n`;
        } else {
            break;
        }
    }

    return modifiedContent;
}

async function copyToNetwork(outputFilePath, networkLocation, originalName) {
    if (networkLocation) {
        // build the path to the network location - OS independent
        copyToFilePath = path.join(networkLocation, originalName);

        const copyPromise = new Promise((resolve, reject) => {
            let result_copy = { filename: originalName, action: '3_copy', details: '' };

            let cp = 'cp';
            if (process.platform === 'win32') {
                cp = 'copy';
            }
            const copyCommand = `${cp} "${outputFilePath}" "${copyToFilePath}"`;
            console.log(`copyCommand: ${copyCommand}`);

            result_copy.details += `copyCommand: ${copyCommand}\n`;
            exec(copyCommand, (error, stdout, stderr) => {
                if (error) {
                    console.error(`  - Error copying ${outputFilePath} to network: ${error}`);
                    result_copy.details += `Error: ${error}\n`;
                } else if (stderr) {
                    console.error(`  - Network copy stderr for ${outputFilePath}: ${stderr}`);
                    result_copy.details += `Std error: ${stderr}\n`;
                } else {
                    console.log(`  - Copied ${outputFilePath} to network: ${copyToFilePath}`);
                    result_copy.details += `Done! ${stdout}\n`;
                    console.log(stdout);
                }
                sendUpdates(result_copy); // Send update to client
                resolve();
            });
        });
        return copyPromise;
    } else {
        result_copy.details += 'Skipped (no network location)\n';
        return null;
    }
}

async function processHandler(req, res) {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    const uploadedFiles = Array.isArray(req.files.fileInput) ? req.files.fileInput : [req.files.fileInput];
    const headerText = req.body.headerText || 'a|b|c|d';
    const networkLocation = req.body.downloadLocation;

    // Set up SSE response headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // const sendUpdate = (data) => {
    //     res.write(`data: ${JSON.stringify(data)}\n\n`);
    // };

    const copyPromises = []; // Array to store promises for each copy operation

    for (const file of uploadedFiles) {
        const originalName = file.name;
        const fileExtension = path.extname(file.name).toLowerCase();

        try {
            switch (fileExtension) {
                case '.txt':
                    const content = file.data.toString('utf8');
                    console.log(`Processing: ${originalName}`);

                    const result_processContent = { filename: originalName, action: '1_processContent', details: '' };
                    const modifiedContent = processContent(headerText, content, result_processContent);
                    sendUpdates(result_processContent); // Send update to client

                    const parsedPath = path.parse(originalName);
                    const outputFileName = `${parsedPath.name}_output${parsedPath.ext}`;
                    const outputPath = path.join(os.homedir(), 'Downloads');
                    const outputFilePath = path.join(outputPath, outputFileName); // Temporary save
                    await fs.writeFile(outputFilePath, modifiedContent, 'utf8');
                    sendUpdates({ filename: originalName, action: '2_backup', details: 'Output created' });

                    // let result_copy = { filename: originalName, action: '3_copy', details: '' };
                    const copyPromise = copyToNetwork(outputFilePath, networkLocation, originalName);
                    copyPromises.push(copyPromise);
                    break;
                case '.xlsx':
                    const xlsxFilePath = path.join(os.homedir(), 'Downloads', originalName);
                    const copyPromise_xlsx = copyToNetwork(xlsxFilePath, networkLocation, originalName);
                    copyPromises.push(copyPromise_xlsx);
                    break;
                default:
                    console.log(`Unsupported file extension: ${fileExtension}. Skipping.`);
                    sendUpdates({ filename: originalName, action: 'unsupported', details: `Unsupported file extension: ${fileExtension}` });
            }
        } catch (error) {
            console.error(`Error processing ${originalName}: ${error}`);
            const result_general = { filename: originalName, action: '4_general', details: `Error: ${error}` };
            sendUpdates(result_general); // Send error update to client
        }
    }
    sendUpdates({details: 'waiting for all promises'}); // Send final update to client
    await Promise.allSettled(copyPromises);

    // Notify the client that processing is complete
    // res.write('data: [DONE]\n\n');
    sendUpdates({details:'[DONE]'}); // Send final update to client
    res.end();
}

module.exports = {
    processHandler,
};