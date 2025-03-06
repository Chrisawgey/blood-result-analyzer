// src/components/Upload.js
import React, { useState, useRef, useEffect } from 'react';
import Tesseract from 'tesseract.js';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

// Helper function to preprocess and improve OCR results
const preprocessAndAnalyzeResults = (text) => {
  if (!text) return { text: '', extractedData: {} };
  
  // Common blood test markers to look for
  const commonMarkers = [
    { name: 'Hemoglobin', regex: /hemoglobin\s*:?\s*(\d+\.?\d*)/i },
    { name: 'White Blood Cell', regex: /(wbc|white\s*blood\s*cells?|leukocytes)\s*:?\s*(\d+\.?\d*)/i, index: 2 },
    { name: 'Red Blood Cell', regex: /(rbc|red\s*blood\s*cells?|erythrocytes)\s*:?\s*(\d+\.?\d*)/i, index: 2 },
    { name: 'Platelets', regex: /(platelets?|plt)\s*:?\s*(\d+)/i, index: 2 },
    { name: 'Hematocrit', regex: /(hematocrit|hct)\s*:?\s*(\d+\.?\d*)/i, index: 2 },
    { name: 'Glucose', regex: /(glucose|glu)\s*:?\s*(\d+\.?\d*)/i, index: 2 },
    { name: 'Cholesterol', regex: /(cholesterol|chol)\s*:?\s*(\d+\.?\d*)/i, index: 2 },
    { name: 'HDL', regex: /hdl\s*:?\s*(\d+\.?\d*)/i },
    { name: 'LDL', regex: /ldl\s*:?\s*(\d+\.?\d*)/i },
    { name: 'Triglycerides', regex: /(triglycerides|trig)\s*:?\s*(\d+\.?\d*)/i, index: 2 },
    { name: 'ALT', regex: /alt\s*:?\s*(\d+\.?\d*)/i },
    { name: 'AST', regex: /ast\s*:?\s*(\d+\.?\d*)/i },
    { name: 'Creatinine', regex: /(creatinine|cre)\s*:?\s*(\d+\.?\d*)/i, index: 2 },
    { name: 'BUN', regex: /(bun|blood\s*urea\s*nitrogen)\s*:?\s*(\d+\.?\d*)/i, index: 2 },
    { name: 'Sodium', regex: /(sodium|na)\s*:?\s*(\d+\.?\d*)/i, index: 2 },
    { name: 'Potassium', regex: /(potassium|k)\s*:?\s*(\d+\.?\d*)/i, index: 2 },
    { name: 'Calcium', regex: /(calcium|ca)\s*:?\s*(\d+\.?\d*)/i, index: 2 },
    { name: 'TSH', regex: /tsh\s*:?\s*(\d+\.?\d*)/i },
    { name: 'Vitamin D', regex: /(vitamin\s*d|25-?oh\s*vitamin\s*d)\s*:?\s*(\d+\.?\d*)/i, index: 2 },
    { name: 'Vitamin B12', regex: /(vitamin\s*b12|b12)\s*:?\s*(\d+\.?\d*)/i, index: 2 }
  ];

  // Clean up common OCR errors
  let cleanedText = text
    .replace(/[|]/g, "I") // Replace pipe with I
    .replace(/[1|l|i](\d+)/g, "L$1") // Fix L vs I in lab values
    .replace(/rng\/[dq][l1|]/gi, "mg/dL") // Fix mg/dL
    .replace(/iu\/[l1|]/gi, "IU/L") // Fix IU/L
    .replace(/(\d),(\d)/g, "$1.$2"); // Fix commas that should be decimal points

  // Extract data
  const extractedData = {};
  
  commonMarkers.forEach(marker => {
    const match = cleanedText.match(marker.regex);
    if (match) {
      const valueIndex = marker.index || 1;
      if (match[valueIndex]) {
        extractedData[marker.name] = match[valueIndex];
      }
    }
  });

  // Look for date patterns
  const dateRegex = /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/g;
  const dates = [...cleanedText.matchAll(dateRegex)];
  
  if (dates.length > 0) {
    // Take the first date found
    extractedData["Test Date"] = dates[0][0];
  }

  // Look for patient name patterns
  const nameRegex = /(patient|name)\s*:?\s*([A-Za-z\s]+)[\n\r]/i;
  const nameMatch = cleanedText.match(nameRegex);
  
  if (nameMatch && nameMatch[2]) {
    extractedData["Patient Name"] = nameMatch[2].trim();
  }

  return {
    text: cleanedText,
    extractedData
  };
};

// Camera Capture Component
const CameraCapture = ({ setCapturedImage, setFile, setShowCameraModal }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [activeCamera, setActiveCamera] = useState(null);
  const [hasFlash, setHasFlash] = useState(false);
  const [flashOn, setFlashOn] = useState(false);

  // Get available cameras
  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices()
        .then(devices => {
          const videoDevices = devices.filter(device => device.kind === 'videoinput');
          setCameras(videoDevices);
          if (videoDevices.length > 0) {
            setActiveCamera(videoDevices[0].deviceId);
          }
        })
        .catch(err => {
          console.error('Error enumerating devices:', err);
        });
    }
  }, []);

  const startCamera = async () => {
    try {
      // Check if there's an environment facing camera
      let facingMode = 'environment'; // Prefer back camera
      const constraints = { 
        video: { 
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          deviceId: activeCamera ? { exact: activeCamera } : undefined,
          facingMode: facingMode
        } 
      };
      
      const userStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = userStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
        };
      }
      
      setStream(userStream);
      
      // Check if flash (torch) is available
      const track = userStream.getVideoTracks()[0];
      const capabilities = track.getCapabilities();
      setHasFlash(capabilities.torch || false);
      
    } catch (error) {
      console.error('Camera access error:', error);
      toast.error('Error accessing camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const toggleFlash = async () => {
    if (!stream) return;
    
    try {
      const track = stream.getVideoTracks()[0];
      
      if (track) {
        const newFlashState = !flashOn;
        await track.applyConstraints({
          advanced: [{ torch: newFlashState }]
        });
        setFlashOn(newFlashState);
      }
    } catch (error) {
      console.error('Error toggling flash:', error);
      toast.error('Unable to control camera flash');
    }
  };
  
  const switchCamera = async () => {
    if (cameras.length <= 1) return;
    
    stopCamera();
    
    // Find the next camera in the list
    const currentIndex = cameras.findIndex(camera => camera.deviceId === activeCamera);
    const nextIndex = (currentIndex + 1) % cameras.length;
    setActiveCamera(cameras[nextIndex].deviceId);
    
    // Slight delay to allow previous camera to close
    setTimeout(() => {
      startCamera();
    }, 300);
  };

  const takePicture = () => {
    if (!videoRef.current || !canvasRef.current) {
      toast.error('Camera is not ready yet!');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      toast.error('Error capturing image. Please try again.');
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Apply some image enhancement for better OCR
    try {
      // Increase contrast slightly
      context.globalAlpha = 1;
      context.globalCompositeOperation = 'source-over';
      
      // Get the image data
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Simple contrast enhancement
      const contrast = 1.2; // Adjust as needed
      const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
      
      for (let i = 0; i < data.length; i += 4) {
        // Apply contrast to RGB channels
        data[i] = factor * (data[i] - 128) + 128;     // Red
        data[i + 1] = factor * (data[i + 1] - 128) + 128; // Green
        data[i + 2] = factor * (data[i + 2] - 128) + 128; // Blue
      }
      
      // Put the modified image data back
      context.putImageData(imageData, 0, 0);
    } catch (e) {
      console.error('Error enhancing image:', e);
      // Continue without enhancement if there's an error
    }
    
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
    toast.success('Picture captured!');
  };

  return (
    <div className="camera-modal">
      <div className="camera-container">
        <div className="camera-header">
          <h3>Capture Blood Test Results</h3>
          <button 
            onClick={() => {
              stopCamera();
              setShowCameraModal(false);
            }}
            style={{
              backgroundColor: 'transparent',
              color: '#1d1d1f',
              padding: '8px',
              margin: '0'
            }}
          >
            ✕
          </button>
        </div>
        
        <div className="camera-body">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline
          ></video>
          <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
          
          {stream && (
            <div style={{
              position: 'absolute',
              bottom: '80px',
              left: '0',
              right: '0',
              display: 'flex',
              justifyContent: 'center',
              padding: '10px'
            }}>
              <div style={{
                backgroundColor: 'rgba(0,0,0,0.5)',
                borderRadius: '20px',
                padding: '5px 15px'
              }}>
                <p style={{color: 'white', margin: '0'}}>
                  Position the test results in frame
                </p>
              </div>
            </div>
          )}
        </div>
        
        <div className="camera-footer">
          {!stream ? (
            <button 
              onClick={startCamera}
              style={{
                margin: '0 auto',
                display: 'block'
              }}
            >
              Start Camera
            </button>
          ) : (
            <>
              <button 
                onClick={() => {
                  stopCamera();
                  setShowCameraModal(false);
                }}
                style={{
                  backgroundColor: '#86868b'
                }}
              >
                Cancel
              </button>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                {cameras.length > 1 && (
                  <button 
                    onClick={switchCamera}
                    style={{
                      backgroundColor: '#555555',
                      padding: '10px',
                      borderRadius: '50%',
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}
                  >
                    <span style={{ fontSize: '18px' }}>⟳</span>
                  </button>
                )}
                
                {hasFlash && (
                  <button 
                    onClick={toggleFlash}
                    style={{
                      backgroundColor: flashOn ? '#ffcc00' : '#555555',
                      padding: '10px',
                      borderRadius: '50%',
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}
                  >
                    <span style={{ fontSize: '18px' }}>⚡</span>
                  </button>
                )}
              </div>
              
              <button 
                onClick={takePicture}
                style={{
                  backgroundColor: '#28cd41',
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '0'
                }}
              >
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  border: '2px solid white'
                }}></div>
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
  const [extractedData, setExtractedData] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [fileName, setFileName] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);
  const navigate = useNavigate();

  // Handle file upload
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setCapturedImage(null); // Clear any previously captured image
      toast.success('File selected!');
    }
  };

  // Process the file (uploaded or captured)
  const handleUpload = () => {
    if (file) {
      setIsUploading(true);
      setProcessingProgress(0);

      // Show the "Processing image..." toast and store its ID
      const uploadToastId = toast.info('Processing image...', {
        autoClose: false
      });

      Tesseract.recognize(
        file,
        'eng',
        {
          logger: (m) => {
            console.log(m);
            if (m.status === 'recognizing text') {
              setProcessingProgress(parseInt(m.progress * 100));
            }
          },
        }
      )
        .then(({ data: { text } }) => {
          console.log('Raw OCR Text:', text);
          
          // Preprocess and analyze the results
          const { text: cleanedText, extractedData } = preprocessAndAnalyzeResults(text);
          
          setText(cleanedText);
          setExtractedData(extractedData);
          
          // Store data in sessionStorage for the Analysis component
          sessionStorage.setItem('ocrText', cleanedText);
          sessionStorage.setItem('extractedData', JSON.stringify(extractedData));
          sessionStorage.setItem('imageData', capturedImage || '');

          // Dismiss the "Processing image..." toast
          toast.dismiss(uploadToastId);

          // Show success toast
          toast.success('Image processed successfully!');
          
          // Redirect to analysis page after a short delay
          setTimeout(() => {
            navigate('/analysis');
          }, 1500);
        })
        .catch((err) => {
          console.error('Error during OCR:', err);

          // Dismiss the "Processing image..." toast
          toast.dismiss(uploadToastId);

          // Show error toast
          toast.error('An error occurred during processing.');
        })
        .finally(() => {
          setIsUploading(false);
        });
    } else {
      toast.warning('Please select a file or take a picture first.');
    }
  };

  return (
    <div className="upload-container">
      <h2>Upload Your Blood Test Results</h2>
      <p>Upload an image of your results or take a photo directly with your camera.</p>

      <div className="upload-options">
        {/* File Upload Input with custom styling */}
        <label className="custom-file-upload">
          <input type="file" onChange={handleFileChange} accept="image/*, .pdf" />
          Choose File
        </label>

        {/* Take Picture Button */}
        <button
          onClick={() => setShowCameraModal(true)}
          disabled={showCameraModal}
        >
          Use Camera
        </button>
      </div>

      {/* Show selected filename */}
      {fileName && !capturedImage && (
        <div className="file-selected">
          Selected: {fileName}
        </div>
      )}

      {/* Display Captured Image */}
      {capturedImage && (
        <div className="captured-image-container">
          <h3>Captured Image</h3>
          <img
            src={capturedImage}
            alt="Captured Blood Test Results"
            className="captured-image"
          />
          <button
            onClick={() => {
              setCapturedImage(null);
              setFile(null);
              setFileName('');
            }}
            style={{ backgroundColor: '#ff3b30' }}
          >
            Remove Image
          </button>
        </div>
      )}

      {/* Upload Button */}
      <div className="upload-action">
        <button
          onClick={handleUpload}
          disabled={isUploading || !file}
        >
          {isUploading ? `Analyzing... ${processingProgress}%` : 'Analyze Results'}
        </button>
      </div>
      
      {isUploading && (
        <div style={{ marginTop: '20px', width: '100%', maxWidth: '500px', margin: '20px auto' }}>
          <div style={{ 
            height: '6px', 
            backgroundColor: '#e0e0e0', 
            borderRadius: '3px', 
            overflow: 'hidden',
            position: 'relative'
          }}>
            <div style={{ 
              height: '100%', 
              width: `${processingProgress}%`, 
              backgroundColor: '#0071e3',
              transition: 'width 0.3s ease'
            }}></div>
          </div>
          <p style={{ textAlign: 'center', color: '#86868b', fontSize: '0.9rem', marginTop: '8px' }}>
            {processingProgress === 0 ? 'Initializing OCR engine...' :
             processingProgress < 30 ? 'Analyzing image...' :
             processingProgress < 60 ? 'Recognizing text...' :
             processingProgress < 90 ? 'Extracting data...' : 
             'Finalizing results...'}
          </p>
        </div>
      )}

      {/* Camera Modal */}
      {showCameraModal && (
        <CameraCapture 
          setCapturedImage={setCapturedImage}
          setFile={setFile}
          setShowCameraModal={setShowCameraModal}
        />
      )}
    </div>
  );
}

export default Upload;