import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div>
      <h1>Welcome to Blood Result Analyzer</h1>
      <p>Get started by uploading your blood test results.</p>
      <Link to="/upload">
        <button>Upload Results</button>
      </Link>
    </div>
  );
}

export default Home;