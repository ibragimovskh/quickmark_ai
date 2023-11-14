import { useState } from 'react'
import FileUpload from"./FileUpload"
import './App.css'


function App() {

  return (
    <>
      <h1 className='underline decoration-dotted '>Quickmark AI</h1>
      <FileUpload  /> {/* Pass the setter to the child component */}
    </>
  )
}

export default App
