import React, { useState } from 'react';
import PropTypes from 'prop-types';
import '../styles/Login.css';
import { useNavigate } from 'react-router-dom';

function Login({ setUser, setUserId }) {
  const [name, setName] = useState('');
  const navigate = useNavigate();

  const handleNameLogin = (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      alert('Please enter your name');
      return;
    }
    
    // Create a simple user ID based on name and timestamp to avoid collisions
    const userId = `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    
    // Create a user object similar to what we'd get from Google
    const user = {
      sub: userId,
      email: `${name.toLowerCase().replace(/\s+/g, '.')}@local.example`,
      name: name,
      picture: 'https://example.com/profile.jpg',
    };

    console.log('DIRECT LOGIN ATTEMPT: Bypassing API call');

    // BYPASS API CALL - Directly update state and navigate
    // This helps us determine if the issue is with the fetch or with the state/navigation
    try {
      localStorage.setItem('userId', userId);
    } catch (storageError) {
      console.warn('Could not save userId to localStorage:', storageError);
    }
    
    // Update state
    setUser(user);
    setUserId(userId);
    
    // Directly navigate 
    console.log('LOGIN BYPASS: Directly navigating to study options');
    navigate('/study-options');

    // KEEP THE COMMENTED CODE BELOW FOR REFERENCE
    /*
    console.log('Logging in with:', { userId, apiUrl: process.env.REACT_APP_API_URL });

    // Send login request to backend
    fetch(`${process.env.REACT_APP_API_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken: userId }),
    })
      .then(response => {
        console.log('Login fetch response received:', response);
        if (!response.ok) {
          response.text().then(text => {
             console.error('Login failed response body (non-OK status):', text);
          });
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        console.log('Login response OK, attempting response.json()');
        // Try to parse JSON, but catch errors
        return response.json().catch(parseError => {
          console.error('Failed to parse response as JSON:', parseError);
          // Attempt to log the raw text if JSON parsing fails
          response.text().then(text => {
            console.error('Raw response text that failed JSON parsing:', text);
          });
          throw new Error('Invalid JSON response from server'); // Re-throw specific error
        });
      })
      .then(data => {
        console.log('Login successful, user data received:', data);
        
        // Store user ID in localStorage for persistence
        try {
          localStorage.setItem('userId', userId);
        } catch (storageError) {
          console.warn('Could not save userId to localStorage:', storageError);
        }
        
        // Update state to trigger redirect
        setUser(user);
        setUserId(userId);
        
        // Directly navigate to study options
        console.log('Login successful, navigating to study options page');
        navigate('/study-options');
      })
      .catch(error => {
        console.error('FETCH LOGIN FAILED CATCH BLOCK:', error);
        alert('Login failed. Please check console and network tab for details.');
      });
     */
  };

  return (
    <div className="login-container">
      <h2>Welcome to Exam Cram</h2>
      <p>Enter your name to start practicing</p>
      
      <form onSubmit={handleNameLogin} className="login-form">
        <input
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="name-input"
          style={{
            padding: '10px',
            marginBottom: '10px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            width: '100%',
            fontSize: '16px'
          }}
        />
        <button 
          type="submit"
          className="login-button"
          style={{
            padding: '10px 20px',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            width: '100%'
          }}
        >
          Start Practicing
        </button>
      </form>
    </div>
  );
}

Login.propTypes = {
  setUser: PropTypes.func.isRequired,
  setUserId: PropTypes.func.isRequired,
};

export default Login;
