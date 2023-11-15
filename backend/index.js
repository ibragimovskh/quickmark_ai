
const cors = require('cors');
const express = require("express"); 

// Load the .env file if it exists
require("dotenv").config();

// API for working with Azure Blob Storage
const { BlobServiceClient } = require("@azure/storage-blob");
// initialize BlobServiceClient -> instance for using methods on service level
const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.BLOB_CONNECTION_STRING);
const containerName = "images";
// can't anonymously access blob storage without a token
const sasToken = process.env.SAS_TOKEN;
const imageUrl = "https://aiclassroom.blob.core.windows.net/images/file-1699991780927.jpg?" + sasToken; 
// object that provides methods to interact with a specific container('imgages') in the Blob Storage service
const containerClient = blobServiceClient.getContainerClient(containerName);

// we use multer to handle "multipart/form-data" which is required for file uploads
const multer = require("multer");
const path = require('path');


const { TextAnalysisClient } = require("@azure/ai-language-text");
const { ComputerVisionClient } = require('@azure/cognitiveservices-computervision');
const { DefaultAzureCredential } = require('@azure/identity');
const ApiKeyCredentials = require('@azure/ms-rest-js').ApiKeyCredentials;


const key = process.env.VISION_KEY;
const endpoint = process.env.VISION_ENDPOINT;
const computerVisionClient = new ComputerVisionClient(
  new ApiKeyCredentials({ inHeader: { 'Ocp-Apim-Subscription-Key': key } }), endpoint);

  const async = require('async');
  const fs = require('fs');
  const https = require('https');
  const createReadStream = require('fs').createReadStream
  const sleep = require('util').promisify(setTimeout);

  function computerVision() {
    async.series([
      async function () {
  
        /**
         * OCR: READ PRINTED & HANDWRITTEN TEXT WITH THE READ API
         * Extracts text from images using OCR (optical character recognition).
         */
        console.log('-------------------------------------------------');
        console.log('READ PRINTED, HANDWRITTEN TEXT AND PDF');
        console.log();
  
        // URL images containing printed and/or handwritten text. 
        // The URL can point to image files (.jpg/.png/.bmp) or multi-page files (.pdf, .tiff).
  
        // Recognize text in printed image from a URL
        console.log('Read printed text from URL...', imageUrl.split('/').pop());
        const printedResult = await readTextFromURL(computerVisionClient, imageUrl);
        printRecText(printedResult);
  
        // Perform read and await the result from URL
        async function readTextFromURL(client, url) {
          // To recognize text in a local image, replace client.read() with readTextInStream() as shown:
          let result = await client.read(url);
          // Operation ID is last path segment of operationLocation (a URL)
          let operation = result.operationLocation.split('/').slice(-1)[0];
  
          // Wait for read recognition to complete
          // result.status is initially undefined, since it's the result of read
          while (result.status !== "succeeded") { await sleep(1000); result = await client.getReadResult(operation); }
          return result.analyzeResult.readResults; // Return the first page of result. Replace [0] with the desired page if this is a multi-page file such as .pdf or .tiff.
        }
  
        // Prints all text from Read result
        function printRecText(readResults) {
          console.log('Recognized text:');
          for (const page in readResults) {
            if (readResults.length > 1) {
              console.log(`==== Page: ${page}`);
            }
            const result = readResults[page];
            if (result.lines.length) {
              for (const line of result.lines) {
                console.log(line.words.map(w => w.text).join(' '));
              }
            }
            else { console.log('No recognized text.'); }
          }
        }
  
        /**
         * 
         * Download the specified file in the URL to the current local folder
         * 
         */
        function downloadFilesToLocal(url, localFileName) {
          return new Promise((resolve, reject) => {
            console.log('--- Downloading file to local directory from: ' + url);
            const request = https.request(url, (res) => {
              if (res.statusCode !== 200) {
                console.log(`Download sample file failed. Status code: ${res.statusCode}, Message: ${res.statusMessage}`);
                reject();
              }
              var data = [];
              res.on('data', (chunk) => {
                data.push(chunk);
              });
              res.on('end', () => {
                console.log('   ... Downloaded successfully');
                fs.writeFileSync(localFileName, Buffer.concat(data));
                resolve();
              });
            });
            request.on('error', function (e) {
              console.log(e.message);
              reject();
            });
            request.end();
          });
        }
  
        /**
         * END - Recognize Printed & Handwritten Text
         */
        console.log();
        console.log('-------------------------------------------------');
        console.log('End of quickstart.');
  
      },
      function () {
        return new Promise((resolve) => {
          resolve();
        })
      }
    ], (err) => {
      throw (err);
    });
  }
  
  computerVision();

// async function some() { 

//   const imageUrl = "https://aiclassroom.blob.core.windows.net/images/file-1699991780927.jpg";
//   //object with text read by azure computer vision
//   const readResults = await computerVisionClient.read(imageUrl);
//   const operationId = readResults.operationLocation.split('/').slice(-1)[0];
  
//   let result = await computerVisionClient.getReadResult(operationId);
//   while (result.status !== 'succeeded') {
//     result = await computerVisionClient.getReadResult(operationId);
//   }
//   // Extracted Text
//   const textResults = result.analyzeResult.readResults;
//   console.log(textResults)
  
// };
// some();





// We use buffer, because our images our small
// Which makes it easier to save the file locally and then streamline it to azure blob storage
// If the file is bigger than 4MB, it is easier to send it to azure blob storage directly 
// we also refer to buffer as temporary storage, as it is not used for large files 
// shortly, мы пакуем картинку локально, и отсылаем буфер в азюр блоб
const upload = multer({ 
  // store buffer in memory until next process
  storage: multer.memoryStorage(),
  // we don't want our file to be too large
  limits: { 
    fileSize: 4 * 1024 * 1024, // Limit file size to 4MB
  }
});



// express instance is initiated, и он развёртывает объект, методы которого мы можем использовать
// in other words, express is a constructor, and app is an instance of that constructor
const app = express();
app.use(cors())

const corsOptions = { 
  origin: 'http://localhost:5173', // Allow only this origin to connect
  methods: ['POST'] // Only allow POST method from this origin
};

// our callback is async because we're involving azure blob storage which is async
app.post('/upload/', cors(corsOptions), upload.single('file'), async (req,res)=>{
  
  if(!req.file) { 
    return res.status(400).send("No file uploaded.");
  }

  try { 
    // here we're using the request that was sent by form in FormUpload
    let blobName = "file-" + Date.now() + path.extname(req.file.originalname);
    // here, we're creating an instance of BlobClient with name blobName
    let blockBlobClient = containerClient.getBlockBlobClient(blobName); 
    // actually uploading the file onto blob storage (fileData, fileSize)
    // await actually pauses this code until we get success or error
    await blockBlobClient.upload(req.file.buffer, req.file.size);
    res.status(200).send({ message: "File uploaded to Azure Blob Storage." });
  }catch(e) { 
    console.log("Error:", e);
    res.status(500).send("Error uploading file to Azure Blob Storage.");
  }

});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));