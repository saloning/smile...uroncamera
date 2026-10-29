# little moments — Photobooth

## Run in VS Code
1. Open this folder in Visual Studio Code.
2. Install the **Live Server** extension if you don't already have it.
3. Right-click `index.html` and choose **Open with Live Server**.
4. Click **Enable camera** and allow webcam permission.
5. Take photos, select a layout and file format, then **Download** or **Print**.

Camera access requires a secure context (localhost or HTTPS). Opening the file directly with `file://` may not work. PDF downloads require an internet connection for the jsPDF library loaded from CDN.

Photos are kept locally in browser memory, not sent to a server. Reloading clears them. A photo strip includes up to the first four current photos; take four for a full strip. Printing opens your browser's print dialog; choose a physical printer or Save as PDF.
