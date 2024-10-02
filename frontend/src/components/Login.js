import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

function Login({ setUser, setUserId }) {
  const handleLoginSuccess = (response) => {
    console.log('Login Success:', response);
    const idToken = response.credential;
    const decodedToken = jwtDecode(idToken);
    console.log('Decoded Token:', decodedToken);

    fetch(`${process.env.REACT_APP_API_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(() => {
        setUser(decodedToken);
        setUserId(decodedToken.sub);
      })
      .catch(error => {
        console.error('Error during login:', error);
      });
  };

  const handleLoginFailure = (response) => {
    console.log('Login Failed:', response);
  };

  return (
    <GoogleLogin
      onSuccess={handleLoginSuccess}
      onFailure={handleLoginFailure}
      cookiePolicy={'single_host_origin'}
      redirectUri="http://localhost:3000"
    />
  );
}

export default Login;
