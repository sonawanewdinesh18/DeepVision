import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css'; // Single design-system entry — tokens + global styles
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
