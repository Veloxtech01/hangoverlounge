import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { router } from './router.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <>
    <Toaster
      toastOptions={{
        style: {
          background: '#241A15',
          color: '#F0E3CC',
          border: '1px solid #453626',
        },
        success: {
          iconTheme: { primary: '#C9A867', secondary: '#241A15' },
        },
        error: {
          iconTheme: { primary: '#C9A867', secondary: '#241A15' },
        },
      }}
    />
    <RouterProvider router={router} />
  </>
);
