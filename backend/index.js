
const cors = require('cors');
const express = require("express"); 

// Load the .env file if it exists
require("dotenv").config();

// API for working with Azure Blob Storage
const { BlobServiceClient } = require("@azure/storage-blob");
// initialize BlobServiceClient -> instance for using methods on service level
const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.BLOB_CONNECTION_STRING);
const containerName = "images";
// object that provides methods to interact with a specific container('imgages') in the Blob Storage service
const containerClient = blobServiceClient.getContainerClient(containerName);

// we use multer to handle "multipart/form-data" which is required for file uploads
const multer = require("multer");
const path = require('path');

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