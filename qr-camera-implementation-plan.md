# QR Code Camera Implementation Plan

## Overview

This document outlines the implementation plan for adding a feature that enables users to connect their phone via a QR code and use the phone's camera to take photos for use in the application.

## Feature Requirements

1. Add a "Connect Phone Camera" button next to the "Upload Image" button
2. When clicked, display a QR code that users can scan with their phone
3. The QR code leads to a web page that requests camera access
4. The phone camera's live preview is streamed back to the main application
5. The main application displays the live preview
6. Add a button to trigger the phone to take a photo
7. The captured photo is sent to the main application and processed as a new profile

## Technical Architecture

### 1. Frontend Components

#### New Components
1. **QRCodeModal.tsx**
   - Displays QR code for connecting phone
   - Shows connection status
   - Provides instructions for users

2. **PhoneCameraButton.tsx**
   - Button component to trigger the QR code modal
   - Placed next to the Upload Image button

3. **CameraPreview.tsx**
   - Displays the live camera feed from the phone
   - Includes capture button and controls

4. **MobileCameraPage.tsx**
   - Separate page that loads on the phone
   - Requests camera permissions
   - Streams camera feed back to main app
   - Handles photo capture

#### Modified Components
1. **ImageUploader.tsx**
   - Add PhoneCameraButton next to Upload Image button

2. **App.tsx**
   - Add state management for camera connection
   - Handle incoming camera stream and captured photos

### 2. Backend Services

#### WebRTC Implementation
- Use WebRTC for real-time communication between devices
- Establish peer-to-peer connection for streaming camera feed
- Handle signaling for WebRTC connection setup

#### Signaling Server
- Create a simple signaling server using WebSockets
- Facilitate connection between main app and phone
- Exchange session descriptions and ICE candidates

### 3. Data Flow

1. **Connection Establishment**
   - User clicks "Connect Phone Camera" button
   - QR code is generated with unique session ID
   - User scans QR code with phone
   - Phone opens web page with session ID
   - Signaling server connects the two devices

2. **Camera Stream**
   - Phone requests camera access
   - Camera feed is streamed to main app via WebRTC
   - Main app displays the live preview

3. **Photo Capture**
   - User clicks capture button on main app
   - Capture command sent to phone
   - Phone captures high-resolution photo
   - Photo is sent to main app
   - Main app processes photo as a new profile

## Implementation Steps

### Phase 1: Setup and Basic Components

1. Install required dependencies:
   ```bash
   npm install qrcode.react socket.io-client simple-peer uuid
   ```

2. Create the QRCodeModal component
3. Create the PhoneCameraButton component
4. Modify ImageUploader to include the new button
5. Setup basic state management in App.tsx

### Phase 2: Signaling Server

1. Create a simple Express server with Socket.IO
2. Implement session management
3. Handle WebRTC signaling messages
4. Deploy the signaling server

### Phase 3: Mobile Camera Page

1. Create the MobileCameraPage component
2. Implement camera access and permissions
3. Setup WebRTC connection from the phone side
4. Add photo capture functionality

### Phase 4: Main App Integration

1. Create the CameraPreview component
2. Implement WebRTC connection from the main app side
3. Handle incoming camera stream
4. Process captured photos
5. Integrate with existing profile management

### Phase 5: Testing and Refinement

1. Test on various devices and browsers
2. Optimize performance
3. Improve error handling
4. Enhance user experience

## Technical Considerations

### WebRTC Compatibility
- Ensure compatibility across major browsers
- Implement fallbacks for browsers with limited WebRTC support

### Security
- Use secure WebSocket connections (WSS)
- Implement session expiration
- Consider privacy implications of camera access

### Performance
- Optimize video stream quality based on network conditions
- Handle connection interruptions gracefully
- Consider bandwidth limitations

### User Experience
- Provide clear instructions for users
- Show connection status and error messages
- Ensure responsive design for the mobile camera page

## Dependencies

- **qrcode.react**: For generating QR codes
- **socket.io-client**: For WebSocket communication
- **simple-peer**: WebRTC library for peer-to-peer connections
- **uuid**: For generating unique session IDs

## Questions for Consideration

1. Should we implement a fallback method for devices that don't support WebRTC?
2. Do we need to store the captured images temporarily on the server?
3. How should we handle poor network conditions?
4. Should we implement image preprocessing on the phone before sending?
5. What security measures should we implement to protect the camera stream? 