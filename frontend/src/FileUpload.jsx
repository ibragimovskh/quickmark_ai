import {useState} from "react"; 

// for now, this works only if 1 file uploaded, not multiple
export default function FileUpload() { 
    const [file, setFile] = useState(null);

    function handleFileChange(e) { 
        setFile(e.target.files[0]);
    }

    async function handleFileSubmit(e) { 
        e.preventDefault(); 
        if(!file) return; // if no file was chosen 

        const formData = new FormData(); 
        // (dataType, dataItself)
        formData.append("file", file);
        try { 
            // Attempt to send the file to the server
            // here, you need to specify the destination of the server
            // otherwise, it will send it to localhost:5173
            const response = await fetch('http://localhost:3000/upload/', { 
                method: "POST", // for sending data
                body: formData
            });

            if (response.ok) {
                const responseData = await response.json(); // Convert response to JSON
                console.log('File Uploaded Successfully', responseData);
              } else {
                console.log('File upload failed', response);
              }
        }catch(e) { 
            console.error('Error during file upload:', e);
        }
    }


    return (
        // we always submit the form, not the input
        // that's why handleFileSubmit is on form
        <form onSubmit={handleFileSubmit} className="mt-6 ">
            <input type="file" onChange={handleFileChange} id="document" name="avatar" accept="image/png, image/jpeg"/>
            <button type="submit" className="border-solid border-2 border-indigo-600">Upload</button>
        </form>
    )
}

/**
 * 
 * 
 * for handleFileChange
 * e.preventDefault prevents the page reload
 * the function is async because we're using fetch which is an asynchronous function
 * how it works is whereever we use await, the function pauses there until it is resolved 
 * however, the main thread isn't blocked, so if we have
 * handleFileChange(); console.log(1)
 * 1 will be logged first, because fetching the file takes some time
 * we're using try catch, in case there is a network error 
 * and we're using if else, if status code is other than 200
 * fetch is a modern, promise-based API in JavaScript used for making network requests
 * 
 * so, we're using formData to give our data appropriate form, that can be send using fetch 
 * fetch is our tool to make requests to the backend, pretty much communication tool (send data, get response(status code))
 * on the backend side, we use express to work with that request, we listen to the certain port
 * 
 * when it comes to why we use both try catch and if else for error handling
 * try catch is for network and any other unexpected errors (did fetch work correct?)
 * if else is to check if file was uploaded successfully (not getting error from fetch doesn't mean that file was uploaded)
 */