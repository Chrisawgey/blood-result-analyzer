// src/components/Analysis.js
import React from 'react';
import { Link } from 'react-router-dom';

function Analysis() {
  return (
    <div className="upload-container">
      <h2>Analysis Results</h2>
      <p>
        Your blood test analysis will appear here after you've uploaded and processed your results.
      </p>
      
      <div className="media-container">
        <div style={{ padding: "20px", textAlign: "center" }}>
          <p>No data available yet. Upload your blood test results to get started.</p>
          <Link to="/upload">
            <button>Go to Upload</button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Analysis;