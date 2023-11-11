
const cors = require('cors');
const express = require("express"); 

// Load the .env file if it exists
require("dotenv").config();

// API for working with Azure Blob Storage
const { BlobServiceClient } = require("@azure/storage-blob");
const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.BLOB_CONNECTION_STRING);



// we use multer to handle "multipart/form-data" which is required for file uploads
const multer = require("multer");
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Set the destination for file uploads
  },
  filename: function (req, file, cb) {
    // Create a new filename with the original name and extension
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// express instance is initiated, и он развёртывает объект, методы которого мы можем использовать
// in other words, express is a constructor, and app is an instance of that constructor
const app = express();
app.use(cors())

const corsOptions = { 
  origin: 'http://localhost:5173', // Allow only this origin to connect
  methods: ['POST'] // Only allow POST method from this origin
};


app.post('/upload/', cors(corsOptions), upload.single('file'), (req,res)=>{
  res.status(200).json({ message: "File uploaded successfully" }); 
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));