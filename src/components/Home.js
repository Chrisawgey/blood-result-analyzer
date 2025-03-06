import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="home-container">
      <h1>Blood Result Analyzer</h1>
      <p>
        Quickly analyze your blood test results by uploading an image or taking a photo.
        Our advanced OCR technology extracts the data and provides insights about your health markers.
      </p>
      
      <div className="home-cta">
        <Link to="/upload">
          <button>Get Started</button>
        </Link>
      </div>
    </div>
  );
}

export default Home;