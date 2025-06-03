# Local Development Setup Guide

## 1. Generate SSL Certificates
```bash
# Install OpenSSL (if needed)
brew install openssl

# Generate self-signed certs
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes -subj '/CN=localhost'

# Add to .gitignore
echo "\n# Local certs\nkey.pem\ncert.pem" >> .gitignore
```

## 2. Environment Setup
```bash
# Create .env.development
cat <<EOT > .env.development
VITE_DEV_IP=192.168.4.25  # Your local IP
VITE_DEV_PORT=5173         # Vite default port
VITE_ENV=development
EOT
```

## 3. CameraConnect Component Modifications
```typescript:src/components/CameraConnect.tsx
const getQRUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return `${window.location.origin}/mobile-camera?sessionId=${sessionId}`;
  }

  // Development configuration ADD THIS BUT REMOVE FOR PRODUCTION
  const protocol = window.location.protocol;
  const host = import.meta.env.VITE_DEV_IP;
  const port = import.meta.env.VITE_DEV_PORT;
  
  return `${protocol}//${host}:${port}/mobile-camera?sessionId=${sessionId}`;
};
```

## 4. Vite Configuration
```typescript:vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

export default defineConfig({
  plugins: [react()],
  server: {
    https: {
      key: fs.readFileSync('./key.pem'),
      cert: fs.readFileSync('./cert.pem')
    },
    host: '0.0.0.0',
  }
})
```
Turn off <StrictMode> in the index.tsx - stops a double loop teardown thing happening

## 5. Production Preparation
1. Remove cert references from `vite.config.ts`
2. Update `.env.production`:
```bash
VITE_ENV=production
# Keep empty or set production values
VITE_DEV_IP=
VITE_DEV_PORT=
```

## Key Commands
```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Local network access - vibe code generated, but not sure you actually need to do this.
npx local-ssl-proxy --key key.pem --cert cert.pem --source 3001 --target 5173
```

## Troubleshooting Tips
- Verify IP with `ipconfig getifaddr en0` (Mac)
- Add firewall exception for dev port
- Trust certificate in browser settings
- Mobile devices: Install cert & use http://<local-ip>:<port> temporarily if HTTPS fails
