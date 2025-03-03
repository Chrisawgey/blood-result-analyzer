// src/components/Upload.js
import React, { useState } from 'react';
import Tesseract from 'tesseract.js';

function Upload() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = () => {
    if (file) {
      console.log('Uploading file:', file.name);
      Tesseract.recognize(
        file,
        'eng',
        {
          logger: m => console.log(m),
        }
      ).then(({ data: { text } }) => {
        setText(text);
        console.log('Extracted Text:', text);
      }).catch(err => {
        console.error('Error during OCR:', err);
      });
    } else {
      alert('Please select a file first.');
    }
  };

  return (
    <div>
      <h2>Upload Your Blood Test Results</h2>
      <input type="file" onChange={handleFileChange} accept="image/*, .pdf" />
      <button onClick={handleUpload}>Upload</button>
      {text && (
        <div className="text-result">
          <h3>Extracted Text:</h3>
          <pre>{text}</pre>
        </div>
      )}
    </div>
  );
}

export default Upload;