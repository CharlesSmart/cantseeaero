# Testing Guide for QR Code Camera Feature

## Overview

This guide explains how to test the QR code camera feature after the recent updates to fix the Socket.IO connection issues.

## Testing on Vercel

### Prerequisites

1. Deploy your application to Vercel
2. Ensure your Vercel deployment has the serverless function enabled
3. Have a mobile device with a camera ready for testing

### Testing Steps

1. **Open your application** in a desktop browser
2. **Click the "Phone Camera" button** to generate a QR code
3. **Scan the QR code** with your mobile device
4. **Allow camera access** when prompted on your mobile device
5. **Verify the connection** - you should see a "Phone connected successfully!" message on desktop
6. **Check the camera preview** - the live camera feed from your phone should appear on desktop
7. **Take a photo** - click the "Take Photo" button on desktop
8. **Verify the captured image** - the image should be processed as a new profile

## Troubleshooting

### Socket.IO Connection Issues

If you encounter Socket.IO connection issues (404 errors):

1. **Check browser console** for specific error messages
2. **Verify the Socket.IO path** is correctly set to `/api/signaling` in all components:
   - QRCodeModal.tsx
   - CameraPreview.tsx
   - MobileCameraPage.tsx

3. **Verify Vercel configuration** in `vercel.json`:
   - Ensure the routes are correctly configured for `/api/signaling`
   - Check that the serverless function is properly set up

4. **Check server logs** in the Vercel dashboard:
   - Look for any errors in the serverless function logs
   - Verify that the Socket.IO server is initializing correctly

### Camera Access Issues

If the mobile device cannot access the camera:

1. **Ensure HTTPS** - camera access requires HTTPS
2. **Check browser compatibility** - use a modern browser that supports WebRTC
3. **Verify permissions** - make sure camera permissions are granted
4. **Try a different device** - some devices may have restrictions on camera access

### WebRTC Connection Issues

If the WebRTC connection fails:

1. **Check network restrictions** - some networks block WebRTC traffic
2. **Try a different network** - mobile data might work better than some WiFi networks
3. **Verify browser compatibility** - ensure both browsers support WebRTC
4. **Check for errors** in the browser console related to ICE candidates or STUN/TURN servers

## Monitoring and Debugging

For more detailed debugging:

1. **Enable verbose logging** in the browser console:
   ```javascript
   localStorage.debug = '*';
   ```

2. **Monitor network traffic** using browser developer tools:
   - Look for WebSocket connections
   - Check for polling fallbacks if WebSockets fail

3. **Test on different browsers** to identify browser-specific issues

## Local Testing

For testing locally, refer to the `local-testing-guide.md` document, which provides detailed instructions for setting up a local development environment with HTTPS and tunneling. 