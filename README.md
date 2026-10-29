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
