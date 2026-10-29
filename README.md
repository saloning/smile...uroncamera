# Little Moments — Photobooth

Open `index.html` with VS Code Live Server or publish the four files at the root of a GitHub Pages repository. Camera access requires HTTPS or localhost.

## Features
- Live camera with front/back switching
- Five selectable filters, applied to captured JPEGs
- Auto timer switch: when on, click **Start auto session** once to capture four photos, with a three-second countdown for each
- Manual capture when auto timer is off
- Photo strip, individual image, or collage exported as JPEG or PDF; print dialog
- Photos remain in the browser and are not uploaded

PDF export uses jsPDF from a CDN, so internet access is required for PDF downloads.


Face effects: Hearts, Blush, Glasses, Crown, and Sparkles follow the first detected face using MediaPipe Face Mesh. An internet connection is required to load the face-tracking library. Face effects are baked into downloaded photos; no face images are sent to your own server. Tracking is processed in the browser.

Mobile notes:
- Open the published GitHub Pages HTTPS URL on iPhone Safari or Android Chrome.
- Tap Enable camera and grant permission. Flip camera switches front/rear cameras.
- Face filters use MediaPipe Face Mesh from a CDN and need internet access.
- The face overlay scales with the video preview when the phone rotates or resizes.
- Face tracking performance varies by phone and browser; older devices may run slowly.
- Photos are processed locally in the browser; no photos are uploaded by this app.

Color filters: applied to the live video using CSS filters (including -webkit-filter), and to saved JPEGs with pixel processing for iOS canvas compatibility. Front selfie camera preview and photo are mirrored; back camera preview and photo are not mirrored.

Latest updates:
- A compact flip-camera button sits next to Take photo. Rear camera is not mirrored.
- Cool color effect is processed directly into captured pixels for mobile JPEG/PDF output.
- Save to device uses the native mobile share sheet when file sharing is supported, or downloads the selected JPEG/PDF otherwise. On iPhone choose Save Image or Save to Files from the share sheet; browsers cannot silently write into Photos.
