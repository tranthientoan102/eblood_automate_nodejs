const express = require('express');
const fileUpload = require('express-fileupload');
const path = require('path');
const fs = require('node:fs/promises');
const { exec } = require('child_process');

const app = express();
const port = 3000; // You can choose a different port

// Middleware to enable file uploads
app.use(fileUpload());
app.use(express.urlencoded({ extended: true })); // To parse URL-encoded request bodies

// Serve static files (like CSS if you add any)
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


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
    for (let i = 0; ; i++) { // Loop will run once
      if (modifiedContent.includes('"')) {
        modifiedContent = modifiedContent.replace(/"/g, '');
        result_processContent.details += `- [${i}]removed double quotes\n`;
      } else {
        break; // No more '"' found, break the loop
      }
    }
  
    // Replace all occurrences of '|0|'
    for (let i = 0; ; i++) { // Loop will run once
      if (modifiedContent.includes('|0|')) {
        modifiedContent = modifiedContent.replace(/\|0\|/g, '||');
        result_processContent.details += `- [${i}]replaced |0| with ||\n`;
      } else {
        break; // No more '|0|' found, break the loop
      }
    }
  
    return modifiedContent;
}

async function copyToNetwork(outputFilePath, networkLocation, result_copy) {
    if (networkLocation) {

        const copyPromise = new Promise((resolve, reject) => {    
            let cp = 'cp'
            if (process.platform === 'win32') {
                cp = 'copy'
            }
            const copyCommand = `${cp} "${outputFilePath}" "${networkLocation}"`;

            result_copy.details += `copyCommand: ${copyCommand}\n`;
            exec(copyCommand, (error, stdout, stderr) => {
                if (error) {
                    console.error(`  - Error copying ${outputFilePath} to network: ${error}`);
                    result_copy.details += `Error: ${error}\n`;
                } else if (stderr) {
                    console.error(`  - Network copy stderr for ${outputFilePath}: ${stderr}`);
                    result_copy.details += `Std error: ${stderr}\n`;
                } else {
                    console.log(`  - Copied ${outputFilePath} to network: ${networkLocation}`);
                    result_copy.details += `Done! ${stdout}\n`;
                    console.log(stdout);
                }
                resolve();
            });
        });
        return copyPromise

    } else {
        result_copy.details += 'Skipped (no network location)\n';
        return null
    }
}



app.post('/process', async (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    const uploadedFiles = Array.isArray(req.files.fileInput) ? req.files.fileInput : [req.files.fileInput];
    const headerText = req.body.headerText || 'a|b|c|d';
    const networkLocation = req.body.downloadLocation;
    const results = [];

    const copyPromises = []; // Array to store promises for each copy operation


    for (const file of uploadedFiles) {
        const originalName = file.name;
        try {
            const content = file.data.toString('utf8');
            console.log(`Processing: ${originalName}`);

            const result_processContent = { filename: originalName, action: '1_processContent', details: '' }
            const modifiedContent = processContent(headerText, content, result_processContent);
            results.push(result_processContent);
            
            const parsedPath = path.parse(originalName);
            const outputFileName = `${parsedPath.name}_output${parsedPath.ext}`;
            const outputFilePath = path.join(__dirname, 'temp_outputs', outputFileName); // Temporary save
            await fs.writeFile(outputFilePath, modifiedContent, 'utf8');
            results.push({ filename: originalName, action: '2_backup', details: 'Backup created' });

            let result_copy = { filename: originalName, action: '3_copy', details: '' }
            const copyPromise = copyToNetwork(outputFilePath, networkLocation, result_copy);
            results.push(result_copy);
            copyPromises.push(copyPromise);


        } catch (error) {
            console.error(`Error processing ${originalName}: ${error}`);
            result_general = { filename: originalName, action: '4_general', details: `Error: ${error}` };
            results.push(result_general);
        }
    }

    // let result_copy = { filename: "BBIS*", action: '3_copy', details: '' };
    // try {
    //     await copyToNetwork("BBIS*", networkLocation, result_copy);
        
    // } catch (error) {
    //     console.error('Error copying file:', error);
    //     result_copy.details += `Error: ${error.stderr || error.message}\n`;
    // }
    // results.push(result_copy);

    await Promise.allSettled(copyPromises);

    // Send the processing results back to the client
    res.json(results);
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
    // Create a temporary directory for outputs if it doesn't exist
    fs.mkdir(path.join(__dirname, 'temp_outputs'), { recursive: true }).catch(console.error);
});