// src/components/Analysis.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

function Analysis() {
  const [ocrText, setOcrText] = useState('');
  const [extractedData, setExtractedData] = useState({});
  const [imageData, setImageData] = useState('');
  const [hasData, setHasData] = useState(false);
  
  // User demographic state
  const [userProfile, setUserProfile] = useState({
    age: '',
    weight: '',
    height: '',
    sex: ''
  });
  
  // State to track if the profile is complete
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  
  // State for analysis results/insights
  const [analysisResults, setAnalysisResults] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    // Retrieve data from sessionStorage
    const storedText = sessionStorage.getItem('ocrText');
    const storedData = sessionStorage.getItem('extractedData');
    const storedImage = sessionStorage.getItem('imageData');
    const storedProfile = sessionStorage.getItem('userProfile');
    
    if (storedText && storedData) {
      setOcrText(storedText);
      setExtractedData(JSON.parse(storedData));
      setImageData(storedImage || '');
      setHasData(true);
    }
    
    // Load user profile if available
    if (storedProfile) {
      const profile = JSON.parse(storedProfile);
      setUserProfile(profile);
      setIsProfileComplete(checkProfileComplete(profile));
    }
  }, []);

  // Check if all required profile fields are filled
  const checkProfileComplete = (profile) => {
    return profile.age && profile.weight && profile.height && profile.sex;
  };

  // Handle profile form input changes
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    const updatedProfile = { ...userProfile, [name]: value };
    setUserProfile(updatedProfile);
    setIsProfileComplete(checkProfileComplete(updatedProfile));
    
    // Store in session storage
    sessionStorage.setItem('userProfile', JSON.stringify(updatedProfile));
  };

  // Normal ranges for common blood markers (for reference)
  const referenceRanges = {
    'Hemoglobin': { min: 12, max: 16, unit: 'g/dL' },
    'White Blood Cell': { min: 4.5, max: 11, unit: 'x10³/µL' },
    'Red Blood Cell': { min: 4.2, max: 5.8, unit: 'x10⁶/µL' },
    'Platelets': { min: 150, max: 450, unit: 'x10³/µL' },
    'Hematocrit': { min: 35, max: 47, unit: '%' },
    'Glucose': { min: 70, max: 99, unit: 'mg/dL' },
    'Cholesterol': { min: 0, max: 200, unit: 'mg/dL' },
    'HDL': { min: 40, max: 60, unit: 'mg/dL' },
    'LDL': { min: 0, max: 100, unit: 'mg/dL' },
    'Triglycerides': { min: 0, max: 150, unit: 'mg/dL' },
    'ALT': { min: 0, max: 40, unit: 'U/L' },
    'AST': { min: 0, max: 40, unit: 'U/L' },
    'Creatinine': { min: 0.6, max: 1.2, unit: 'mg/dL' },
    'BUN': { min: 8, max: 20, unit: 'mg/dL' },
    'Sodium': { min: 135, max: 145, unit: 'mEq/L' },
    'Potassium': { min: 3.5, max: 5.0, unit: 'mEq/L' },
    'Calcium': { min: 8.5, max: 10.5, unit: 'mg/dL' },
    'TSH': { min: 0.4, max: 4.0, unit: 'mIU/L' },
    'Vitamin D': { min: 30, max: 100, unit: 'ng/mL' },
    'Vitamin B12': { min: 200, max: 900, unit: 'pg/mL' }
  };

  // Function to get status based on reference range
  const getStatus = (marker, value) => {
    if (!referenceRanges[marker]) return "Unknown";
    
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return "Unknown";
    
    const { min, max } = referenceRanges[marker];
    
    if (numValue < min) return "Low";
    if (numValue > max) return "High";
    return "Normal";
  };

  // Function to get status color
  const getStatusColor = (status) => {
    switch(status) {
      case "Low":
        return "#ff9500"; // Warning color
      case "High":
        return "#ff3b30"; // Error color
      case "Normal":
        return "#28cd41"; // Success color
      default:
        return "#86868b"; // Secondary text color
    }
  };

  // Generate AI Analysis (in a real app, this would call an AI service)
  const generateAnalysis = () => {
    setIsAnalyzing(true);
    
    // In a production app, you would call your AI service here with the OCR data and user profile
    // For demonstration, we'll simulate an API call with setTimeout
    setTimeout(() => {
      // This is placeholder analysis text - in a real app, this would come from an AI service
      const abnormalMarkers = Object.entries(extractedData)
        .filter(([key, value]) => {
          if (key === 'Patient Name' || key === 'Test Date') return false;
          return getStatus(key, value) !== "Normal";
        })
        .map(([key, value]) => key);
      
      let analysisText = "";
      
      if (abnormalMarkers.length === 0) {
        analysisText = "Based on your blood test results, all markers appear to be within normal ranges. This suggests overall good health, though regular check-ups are still recommended.";
      } else {
        analysisText = `Based on your blood test results, there are ${abnormalMarkers.length} markers that appear outside normal ranges: ${abnormalMarkers.join(', ')}. `;
        
        // Add personalized analysis based on demographic information
        if (userProfile.age > 50) {
          analysisText += "Considering your age group (over 50), some variation in these markers can be common. ";
        }
        
        if (userProfile.sex === 'female') {
          analysisText += "For women, hormonal fluctuations can influence certain blood markers. ";
        } else if (userProfile.sex === 'male') {
          analysisText += "For men, certain markers like hemoglobin typically have different reference ranges. ";
        }
        
        const bmi = calculateBMI(userProfile.weight, userProfile.height);
        if (bmi > 25) {
          analysisText += "Your BMI suggests that weight management could help improve some blood markers. ";
        }
        
        analysisText += "It's recommended to discuss these results with your healthcare provider for a complete interpretation.";
      }
      
      setAnalysisResults(analysisText);
      setIsAnalyzing(false);
      toast.success("Analysis completed!");
    }, 2000);
  };
  
  // Calculate BMI for reference
  const calculateBMI = (weight, height) => {
    if (!weight || !height) return 0;
    const weightKg = parseFloat(weight);
    const heightM = parseFloat(height) / 100; // convert cm to m
    return (weightKg / (heightM * heightM)).toFixed(1);
  };

  return (
    <div className="analysis-container">
      <h2>Analysis Results</h2>
      
      {!hasData ? (
        <div className="media-container">
          <div style={{ padding: "20px", textAlign: "center" }}>
            <p>No data available yet. Upload your blood test results to get started.</p>
            <Link to="/upload">
              <button>Go to Upload</button>
            </Link>
          </div>
        </div>
      ) : (
        <div>
          {/* User Profile Form */}
          <div className="media-container" style={{ marginBottom: "20px" }}>
            <h3>Your Information</h3>
            <p style={{ fontSize: "0.9rem", color: "var(--secondary-text)" }}>
              Please provide your demographic information for a more accurate analysis of your blood test results.
            </p>
            
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
              gap: "15px",
              marginTop: "15px" 
            }}>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontSize: "0.9rem" }}>
                  Age (years)*
                </label>
                <input
                  type="number"
                  name="age"
                  value={userProfile.age}
                  onChange={handleProfileChange}
                  min="1"
                  max="120"
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "var(--border-radius)",
                    border: "1px solid var(--border-color)",
                    fontSize: "1rem"
                  }}
                  required
                />
              </div>
              
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontSize: "0.9rem" }}>
                  Weight (kg)*
                </label>
                <input
                  type="number"
                  name="weight"
                  value={userProfile.weight}
                  onChange={handleProfileChange}
                  min="1"
                  max="300"
                  step="0.1"
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "var(--border-radius)",
                    border: "1px solid var(--border-color)",
                    fontSize: "1rem"
                  }}
                  required
                />
              </div>
              
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontSize: "0.9rem" }}>
                  Height (cm)*
                </label>
                <input
                  type="number"
                  name="height"
                  value={userProfile.height}
                  onChange={handleProfileChange}
                  min="50"
                  max="250"
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "var(--border-radius)",
                    border: "1px solid var(--border-color)",
                    fontSize: "1rem"
                  }}
                  required
                />
              </div>
              
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontSize: "0.9rem" }}>
                  Sex*
                </label>
                <select
                  name="sex"
                  value={userProfile.sex}
                  onChange={handleProfileChange}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "var(--border-radius)",
                    border: "1px solid var(--border-color)",
                    fontSize: "1rem",
                    backgroundColor: "white"
                  }}
                  required
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            
            <div style={{ marginTop: "20px", textAlign: "center" }}>
              <button 
                onClick={generateAnalysis}
                disabled={!isProfileComplete || isAnalyzing}
              >
                {isAnalyzing ? "Analyzing..." : "Generate AI Analysis"}
              </button>
            </div>
          </div>
          
          {/* AI Analysis Results */}
          {analysisResults && (
            <div className="media-container" style={{ 
              marginBottom: "20px",
              borderLeft: "4px solid var(--primary-color)",
              backgroundColor: "rgba(0, 113, 227, 0.05)"
            }}>
              <h3>AI Analysis</h3>
              <div style={{ marginTop: "10px" }}>
                <p style={{ color: "var(--text-color)" }}>{analysisResults}</p>
              </div>
              <div style={{ 
                marginTop: "15px", 
                fontSize: "0.85rem", 
                color: "var(--secondary-text)", 
                fontStyle: "italic" 
              }}>
                Note: This analysis is generated based on the extracted blood test data and your provided information. 
                It is not a substitute for professional medical advice. Always consult with your healthcare provider.
              </div>
            </div>
          )}

          {/* Patient Information Section */}
          {(extractedData['Patient Name'] || extractedData['Test Date']) && (
            <div className="media-container" style={{ marginBottom: "20px" }}>
              <h3 style={{ marginBottom: "15px" }}>Patient Information</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
                {extractedData['Patient Name'] && (
                  <div>
                    <strong>Patient Name:</strong> {extractedData['Patient Name']}
                  </div>
                )}
                {extractedData['Test Date'] && (
                  <div>
                    <strong>Test Date:</strong> {extractedData['Test Date']}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Blood Test Results Section */}
          <div className="media-container">
            <h3>Blood Test Results</h3>
            
            {Object.keys(extractedData).length > 0 ? (
              <div className="results-table-container" style={{ overflow: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "15px" }}>
                  <thead>
                    <tr>
                      <th style={{ 
                        padding: "10px", 
                        textAlign: "left", 
                        borderBottom: "1px solid var(--border-color)" 
                      }}>Test</th>
                      <th style={{ 
                        padding: "10px", 
                        textAlign: "right", 
                        borderBottom: "1px solid var(--border-color)" 
                      }}>Result</th>
                      <th style={{ 
                        padding: "10px", 
                        textAlign: "center", 
                        borderBottom: "1px solid var(--border-color)" 
                      }}>Status</th>
                      <th style={{ 
                        padding: "10px", 
                        textAlign: "right", 
                        borderBottom: "1px solid var(--border-color)" 
                      }}>Reference Range</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(extractedData).map(([key, value]) => {
                      // Skip non-medical data like patient name and test date
                      if (key === 'Patient Name' || key === 'Test Date') return null;
                      
                      const refRange = referenceRanges[key];
                      const status = getStatus(key, value);
                      
                      return (
                        <tr key={key}>
                          <td style={{ 
                            padding: "10px", 
                            borderBottom: "1px solid var(--border-color)" 
                          }}>{key}</td>
                          <td style={{ 
                            padding: "10px", 
                            textAlign: "right", 
                            fontWeight: "bold",
                            borderBottom: "1px solid var(--border-color)" 
                          }}>
                            {value} {refRange?.unit}
                          </td>
                          <td style={{ 
                            padding: "10px", 
                            textAlign: "center", 
                            borderBottom: "1px solid var(--border-color)" 
                          }}>
                            <span style={{ 
                              display: "inline-block", 
                              padding: "4px 8px", 
                              borderRadius: "4px", 
                              backgroundColor: getStatusColor(status),
                              color: "white",
                              fontSize: "0.85rem",
                              fontWeight: "500"
                            }}>
                              {status}
                            </span>
                          </td>
                          <td style={{ 
                            padding: "10px", 
                            textAlign: "right", 
                            color: "var(--secondary-text)",
                            borderBottom: "1px solid var(--border-color)" 
                          }}>
                            {refRange ? `${refRange.min} - ${refRange.max} ${refRange.unit}` : 'N/A'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No specific blood markers were detected. The OCR process may need improvement.</p>
            )}
          </div>

          {/* Original Image */}
          {imageData && (
            <div className="media-container" style={{ marginTop: "20px" }}>
              <h3>Original Image</h3>
              <div style={{ textAlign: "center", margin: "15px 0" }}>
                <img 
                  src={imageData} 
                  alt="Blood Test Results" 
                  style={{ 
                    maxWidth: "100%", 
                    maxHeight: "400px", 
                    borderRadius: "var(--border-radius)",
                    boxShadow: "var(--box-shadow)"
                  }} 
                />
              </div>
            </div>
          )}

          {/* Raw OCR Text */}
          <div className="media-container" style={{ marginTop: "20px" }}>
            <h3>Raw OCR Text</h3>
            <div style={{ 
              backgroundColor: "var(--secondary-background)", 
              padding: "15px", 
              borderRadius: "8px",
              marginTop: "10px",
              maxHeight: "200px",
              overflow: "auto"
            }}>
              <pre style={{ 
                whiteSpace: "pre-wrap", 
                fontFamily: "monospace",
                margin: 0
              }}>
                {ocrText || "No OCR text available."}
              </pre>
            </div>
          </div>

          {/* Actions */}
          <div style={{ 
            display: "flex", 
            justifyContent: "center", 
            gap: "15px", 
            marginTop: "30px" 
          }}>
            <Link to="/upload">
              <button>Upload New Test</button>
            </Link>
            <button 
              onClick={() => window.print()} 
              style={{ backgroundColor: "#555555" }}
            >
              Print Results
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Analysis;