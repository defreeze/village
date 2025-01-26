/*
import React, { Component, useState, useEffect } from 'react'
import { BrowserRouter as Router, Route } from 'react-router-dom'
import firebaaaase from 'firebase'
import login from './components/login'
import 'bootstrap/dist/css/bootstrap.css';
import Home from './components/Home';

*/
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import 'bootstrap/dist/css/bootstrap.css';

import Login from './components/login'; // Capitalized for consistency
import Home from './components/Home';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDsc6iMiPIzezGfFQv3U_LjKTTua2xcnRQ",
  authDomain: "village-77c9f.firebaseapp.com",
  databaseURL: "https://village-77c9f-default-rtdb.firebaseio.com",
  projectId: "village-77c9f",
  storageBucket: "village-77c9f.firebasestorage.app",
  messagingSenderId: "934742515805",
  appId: "1:934742515805:web:3cbf4d9925ae2fc6cdadb4",
  measurementId: "G-RBEMMXKH98"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

function App() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setLoggedIn(!!user); // Set to true if a user is logged in, false otherwise
    });

    // Cleanup the listener when the component unmounts
    return () => unsubscribe();
  }, []);

  if (loggedIn) {
    return <Home />;
  }

  return (
    <Router>
      <Route path="/" exact component={Login} />
    </Router>
  );
}

export default App;
