import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import './fonts';
import App from './App';
import './styles.css';

// Staff dashboard lives at /admin and is loaded only there
const Admin = lazy(() => import('./admin/Admin'));
const isAdmin = window.location.pathname.replace(/\/+$/, '') === '/admin';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isAdmin ? <Suspense fallback={null}><Admin /></Suspense> : <App />}
  </StrictMode>
);
