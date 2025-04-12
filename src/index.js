import React from 'react';
import ReactDOM from 'react-dom/client';
import 'antd/dist/reset.css';
import App from './App';

import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

const root = ReactDOM.createRoot(document.getElementById('root'));

// Esperar a que Firebase Auth inicialice antes de renderizar
onAuthStateChanged(auth, () => {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});