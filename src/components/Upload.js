// src/components/Upload.js
import React, { useState, useRef, useEffect } from 'react';
import Tesseract from 'tesseract.js';
import { toast } from 'react-toastify';

function Upload() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Handle file upload
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setCapturedImage(null); // Clear any previously captured image
      toast.success('File selected!', { style: { color: 'black' } });
    }
  };

  // Improved startCamera method
  const startCamera = () => {
    // Check if getUserMedia is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error('Camera access not supported in this browser', { style: { color: 'black' } });
      console.error('getUserMedia is not supported in this browser');
      return;
    }

    // Request camera access with more specific constraints
    navigator.mediaDevices
      .getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment' // Prefer back camera on mobile devices
        } 
      })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          
          // Add event listeners to handle video loading
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play()
              .then(() => {
                console.log('Video playback started successfully');
                setShowCameraModal(true);
              })
              .catch(err => {
                console.error('Error playing video:', err);
                toast.error('Error starting camera', { style: { color: 'black' } });
              });
          };

          // Log stream details for debugging
          console.log('Camera stream started:', stream);
          const videoTracks = stream.getVideoTracks();
          console.log('Video tracks:', videoTracks);
        }
      })
      .catch((err) => {
        console.error('Detailed camera access error:', err);
        
        // Provide more specific error messaging
        if (err.name === 'NotAllowedError') {
          toast.error('Camera access was denied. Please check your browser permissions.', { style: { color: 'black' } });
        } else if (err.name === 'NotFoundError') {
          toast.error('No camera found on this device.', { style: { color: 'black' } });
        } else {
          toast.error(`Camera error: ${err.message}`, { style: { color: 'black' } });
        }
      });
  };

  // Stop the camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    }
  };

  // Capture the image from the camera
  const takePicture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      // Set canvas dimensions to match video stream
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw the current video frame onto the canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert the canvas image to a data URL and set it as the captured image
      const imageData = canvas.toDataURL('image/png');
      setCapturedImage(imageData);

      // Convert the canvas image to a file
      canvas.toBlob((blob) => {
        const file = new File([blob], 'captured-image.png', { type: 'image/png' });
        setFile(file);
      }, 'image/png');

      // Stop the camera stream
      stopCamera();
      setShowCameraModal(false); // Close the camera modal

      toast.success('Picture captured!', { style: { color: 'black' } });
    }
  };

  // Retake the picture
  const retakePicture = () => {
    setCapturedImage(null);
    setFile(null);
    startCamera(); // Restart the camera
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

  // Clean up the camera stream when the component unmounts
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h2>Upload Your Blood Test Results</h2>

      {/* File Upload Input */}
      <input type="file" onChange={handleFileChange} accept="image/*, .pdf" />

      {/* Take Picture Button */}
      <button
        onClick={startCamera}
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
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px' }}>
            <h3>Camera Preview</h3>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              style={{ width: '300px', height: '200px', border: '1px solid black' }}
            ></video>
            <button
              onClick={takePicture}
              style={{
                display: 'block',
                margin: '10px auto',
                backgroundColor: 'green',
                color: 'white',
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
                display: 'block',
                margin: '10px auto',
                backgroundColor: 'red',
                color: 'white',
              }}
            >
              Close Camera
            </button>
          </div>
        </div>
      )}

      {/* Canvas for Capturing Image (Hidden) */}
      <canvas ref={canvasRef} width="300" height="200" style={{ display: 'none' }}></canvas>

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
            onClick={retakePicture}
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