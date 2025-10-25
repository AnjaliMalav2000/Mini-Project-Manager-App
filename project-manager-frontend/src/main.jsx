import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx'; // Correctly import the main component named 'App'

// This file is the entry point, rendering the App component into the HTML div with id="root".
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App /> 
  </React.StrictMode>,
);

