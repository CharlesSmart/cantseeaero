// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App.tsx'
import MobileCameraPage from './components/MobileCameraPage.tsx'
import './index.css'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />
  },
  {
    path: '/mobile-camera',
    element: <MobileCameraPage />
  }
]);

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
    <RouterProvider router={router} />
  // </StrictMode>,
)
