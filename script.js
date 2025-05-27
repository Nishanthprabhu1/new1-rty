
const videoElement = document.getElementById('webcam');
const canvasElement = document.getElementById('overlay');
const canvasCtx = canvasElement.getContext('2d');

const earringImg = new Image();
earringImg.src = 'earrings/earring1.png';

function changeEarring(filename) {
  earringImg.src = `earrings/${filename}`;
}

const faceMesh = new FaceMesh({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
});

faceMesh.setOptions({
  maxNumFaces: 1,
  refineLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

let leftEarHistory = [];
let rightEarHistory = [];

function smooth(positions) {
  if (positions.length === 0) return null;
  const avg = positions.reduce((acc, pos) => ({
    x: acc.x + pos.x,
    y: acc.y + pos.y
  }), { x: 0, y: 0 });
  return {
    x: avg.x / positions.length,
    y: avg.y / positions.length
  };
}

faceMesh.onResults((results) => {
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) return;

  const landmarks = results.multiFaceLandmarks[0];
  const left = {
    x: landmarks[132].x * canvasElement.width,
    y: landmarks[132].y * canvasElement.height
  };
  const right = {
    x: landmarks[361].x * canvasElement.width,
    y: landmarks[361].y * canvasElement.height
  };

  leftEarHistory.push(left);
  rightEarHistory.push(right);
  if (leftEarHistory.length > 5) leftEarHistory.shift();
  if (rightEarHistory.length > 5) rightEarHistory.shift();

  const leftSmooth = smooth(leftEarHistory);
  const rightSmooth = smooth(rightEarHistory);

  const earringWidth = 50;
  const earringHeight = 60;
  const offsetY = 15;

  if (earringImg.complete) {
    if (leftSmooth)
      canvasCtx.drawImage(earringImg, leftSmooth.x - earringWidth / 2, leftSmooth.y - offsetY, earringWidth, earringHeight);
    if (rightSmooth)
      canvasCtx.drawImage(earringImg, rightSmooth.x - earringWidth / 2, rightSmooth.y - offsetY, earringWidth, earringHeight);
  }
});

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await faceMesh.send({ image: videoElement });
  },
  width: 640,
  height: 480,
});
camera.start();

videoElement.addEventListener('loadedmetadata', () => {
  canvasElement.width = videoElement.videoWidth;
  canvasElement.height = videoElement.videoHeight;
});
