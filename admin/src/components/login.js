import React, { useState } from 'react';
import { Redirect } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignedIn, setIsSignedIn] = useState(false);

  // Get Firebase Auth instance
  const auth = getAuth();

  const onSignIn = () => {
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        console.log('Signed in:', userCredential.user);
        setIsSignedIn(true); // Update state when the user signs in successfully
      })
      .catch((error) => {
        console.error('Error signing in:', error.message);
      });
  };

  // Redirect to home if the user is signed in
  if (isSignedIn) {
    return <Redirect to="/home" />;
  }

  return (
    <div className="container vertical-center ">
      <div className="auth-wrapper">
        <div className="auth-inner">
          <h3>Sign In</h3>

          <div className="form-group">
            <label>Email address</label>
            <input
              type="email"
              className="form-control"
              placeholder="Enter email"
              onChange={(e) => setEmail(e.target.value)}
              value={email}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button className="btn btn-primary btn-block" onClick={onSignIn}>
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
