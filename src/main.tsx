// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import AppPage from './pages/AppPage.tsx'
import LandingPage from './pages/LandingPage.tsx'
import MobileCameraPage from './components/MobileCameraPage.tsx'
import './index.css'

const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />
  },
  {
    path: '/app',
    element: <AppPage />
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
