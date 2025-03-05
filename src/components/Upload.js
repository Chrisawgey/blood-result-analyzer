// src/components/Upload.js
import React, { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';
import { toast } from 'react-toastify';

// New CameraCapture Component
const CameraCapture = ({ setCapturedImage, setFile, setShowCameraModal }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);

  const startCamera = async () => {
    try {
      const userStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment'
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = userStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
        };
      }
      setStream(userStream);
    } catch (error) {
      console.error('Camera access error:', error);
      toast.error('Error accessing camera. Please check permissions.', { style: { color: 'black' } });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const takePicture = () => {
    if (!videoRef.current || !canvasRef.current) {
      toast.error('Camera is not ready yet!', { style: { color: 'black' } });
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      toast.error('Error capturing image. Please try again.', { style: { color: 'black' } });
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageData = canvas.toDataURL('image/png');
    
    // Convert data URL to Blob
    const byteCharacters = atob(imageData.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });

    setCapturedImage(imageData);
    setFile(new File([blob], 'captured-image.png', { type: 'image/png' }));
    
    stopCamera();
    setShowCameraModal(false);
    toast.success('Picture captured!', { style: { color: 'black' } });
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
    >
      <div 
        style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '10px',
          width: '90%',
          maxWidth: '500px'
        }}
      >
        <h3>Camera Capture</h3>
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          style={{ 
            width: '100%', 
            maxHeight: '400px', 
            backgroundColor: 'black' 
          }}
        ></video>
        <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginTop: '20px' 
        }}>
          {!stream ? (
            <button 
              onClick={startCamera}
              style={{
                backgroundColor: 'blue',
                color: 'white',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Start Camera
            </button>
          ) : (
            <>
              <button 
                onClick={takePicture}
                style={{
                  backgroundColor: 'green',
                  color: 'white',
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Capture
              </button>
              <button 
                onClick={() => {
                  stopCamera();
                  setShowCameraModal(false);
                }}
                style={{
                  backgroundColor: 'red',
                  color: 'white',
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

function Upload() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);

  // Handle file upload
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setCapturedImage(null); // Clear any previously captured image
      toast.success('File selected!', { style: { color: 'black' } });
    }
  };

  // Process the file (uploaded or captured)
  const handleUpload = () => {
    if (file) {
      setIsUploading(true);

      // Show the "Processing image..." toast and store its ID
      const uploadToastId = toast.info('Processing image...', {
        autoClose: false,
        style: { color: 'black' },
      });

      Tesseract.recognize(
        file,
        'eng',
        {
          logger: (m) => console.log(m),
        }
      )
        .then(({ data: { text } }) => {
          setText(text);
          console.log('Extracted Text:', text);

          // Dismiss the "Processing image..." toast
          toast.dismiss(uploadToastId);

          // Show success toast
          toast.success('Image processed successfully!', { style: { color: 'black' } });
        })
        .catch((err) => {
          console.error('Error during OCR:', err);

          // Dismiss the "Processing image..." toast
          toast.dismiss(uploadToastId);

          // Show error toast
          toast.error('An error occurred during processing.', { style: { color: 'black' } });
        })
        .finally(() => {
          setIsUploading(false);
        });
    } else {
      toast.warning('Please select a file or take a picture first.', { style: { color: 'black' } });
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h2>Upload Your Blood Test Results</h2>

      {/* File Upload Input */}
      <input type="file" onChange={handleFileChange} accept="image/*, .pdf" />

      {/* Take Picture Button */}
      <button
        onClick={() => setShowCameraModal(true)}
        style={{ marginLeft: '10px', backgroundColor: 'blue', color: 'white' }}
        disabled={showCameraModal || !!capturedImage}
      >
        Take Picture
      </button>

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        style={{
          marginLeft: '10px',
          backgroundColor: file ? 'green' : 'gray',
          color: 'white',
        }}
        disabled={isUploading || !file}
      >
        {isUploading ? 'Processing...' : 'Upload'}
      </button>

      {/* Camera Modal */}
      {showCameraModal && (
        <CameraCapture 
          setCapturedImage={setCapturedImage}
          setFile={setFile}
          setShowCameraModal={setShowCameraModal}
        />
      )}

      {/* Display Captured Image */}
      {capturedImage && (
        <div style={{ marginTop: '20px' }}>
          <h3>Captured Image</h3>
          <img
            src={capturedImage}
            alt="Captured"
            style={{ width: '300px', height: '200px', border: '1px solid black' }}
          />
          <button
            onClick={() => {
              setCapturedImage(null);
              setFile(null);
            }}
            style={{ marginTop: '10px', backgroundColor: 'red', color: 'white' }}
          >
            Retake Picture
          </button>
        </div>
      )}

      {/* Display Extracted Text */}
      {text && (
        <div style={{ marginTop: '20px', textAlign: 'left' }}>
          <h3>Extracted Text:</h3>
          <pre>{text}</pre>
        </div>
      )}
    </div>
  );
}

export default Upload;