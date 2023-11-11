// CORS = Cross-Origin Resource Sharing
// cors restricts web pages from making requests to the domain different from the one that you have rn
// in our case, that would be lhost:5173 and lhost:3000 
// to calm down cors security feature, we need to use cors middleware
// to give our request appropriate headers
const cors = require('cors');
const express = require("express"); 
// we use multer to handle "multipart/form-data" which is required for file uploads
const multer = require("multer");
const upload = multer({ dest: 'uploads/' }); // configure storage options

// What exactly happens when I do this? 
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