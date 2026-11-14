# Watchful Motion Lens

Build a fully functional, modern, responsive web application for my CodeAlpha AI Internship — Task 4: Object Detection and Tracking.

Project Title: Real-Time Object Detection & Tracking System

Tech Stack: 

- Frontend: React + Tailwind CSS + WebRTC

- Detection: TensorFlow.js with COCO-SSD model or YOLOv8 via ONNX in browser

- Tracking: Simple IOU Tracker or Deep SORT JS version

- Must run 100% in browser, no Python backend needed for demo

Objective:

Create an AI-powered web app that detects objects from live webcam or uploaded video and tracks them in real time with bounding boxes, labels, confidence scores, and unique tracking IDs.

Core Requirements:

1. UI/UX

- Clean, modern, dark/light mode toggle

- Two main tabs: "Live Camera" and "Upload Video"

- Show FPS counter and total objects detected

2. Live Webcam Detection

- Button: "Start Camera" 

- Request webcam permission

- Show live video feed

- Run object detection on each frame using TensorFlow.js COCO-SSD

- Draw bounding boxes with: Object Name, Confidence %, Unique Tracking ID

- Maintain tracking IDs across frames

3. Video Upload

- Button: "Upload Video" 

- Support MP4, WebM, MOV

- Process uploaded video frame by frame

- Apply same detection + tracking + bounding boxes

- Add "Download Processed Video" button

4. Extra Features

- Dropdown to select detection model: COCO-SSD, YOLOv8-nano

- Show detection stats sidebar: List of detected objects with count

- Mobile responsive

Important: 

This is for CodeAlpha Internship Task 4. Use client-side JS libraries only. Do not use Python/OpenCV backend. Deploy as single page app.

Deliver complete working code with comments.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://watchful-motion-lens.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/017cb215-185b-4bdd-a5ae-d15b2e3de6df).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
