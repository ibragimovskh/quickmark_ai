
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
    const imageUrl = blockBlobClient.url + "?" + sasToken;
    res.status(200).send({ message: "File uploaded to Azure Blob Storage." });
    const readResults = await extractTextFromImage(computerVisionClient, imageUrl);
    printExtractedText(readResults)
  }catch(e) { 
    console.log("Error:", e);
    res.status(500).send("Error uploading file to Azure Blob Storage.");
  }

});

async function extractTextFromImage(computerVisionClient, imageUrl) {
  let result = await computerVisionClient.read(imageUrl);
  let operation = result.operationLocation.split('/').slice(-1)[0];

  while(result.status !== "succeeded") { 
    // this is called polling
    // from time to time, we need to check if operation was completed successfully
    await sleep(1000);
    result = await computerVisionClient.getReadResult(operation);
  } 
  return result.analyzeResult.readResults;
}


async function printExtractedText(readResults) { 
    for(page in readResults) { 
      if(readResults.length > 1) { 
        console.log(`==== Page: ${page}`);
      }
      let result = readResults[page]; 
      if(result.lines.length) { 
        for(let line of result.lines) { 
          console.log(
            line.words.map(w => w.text).join(' ')
          )
        }
      }else { 
        console.log("No recognized text.")
      }
    }
}


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));