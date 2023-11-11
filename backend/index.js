const express = require("express"); 
// we use multer to handle "multipart/form-data" which is required for file uploads
const multer = require("multer");
const upload = multer({ dest: 'uploads/' }); // configure storage options

// What exactly happens when I do this? 
const app = express();

app.post('upload/', upload.single('file'), (req,res)=>{
  res.status(200).json({ message: "File uploaded successfully" }); 
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));