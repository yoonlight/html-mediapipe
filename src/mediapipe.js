import { Pose, POSE_CONNECTIONS, VERSION } from "@mediapipe/pose";
import { Camera } from "@mediapipe/camera_utils";
import { drawLandmarks, drawConnectors } from "@mediapipe/drawing_utils";

export const mediapipe = () => {
    const videoElement = document.getElementsByClassName('input_video')[0];
    const canvasElement  = document.querySelector("canvas")
    const canvasCtx = canvasElement.getContext('2d');

    const updateMediaSize = async () => {
        let stream = await navigator.mediaDevices.getUserMedia({ video: true });
    
        let { width, height } = stream.getTracks()[0].getSettings();
    
        console.log(`${width}x${height}`);
    
        canvasElement.width = width
        canvasElement.height = height
    }

    // 모바일 디바이스 방향 전환시 적용
    window.onresize = updateMediaSize

    updateMediaSize()

    function onResults(results) {
        if (!results.poseLandmarks) {
            return;
        }

        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        canvasCtx.drawImage(results.segmentationMask, 0, 0,
            canvasElement.width, canvasElement.height);

        // Only overwrite existing pixels.
        // canvasCtx.globalCompositeOperation = 'source-in';
        // canvasCtx.fillStyle = '#00FF00';
        // canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);

        // Only overwrite missing pixels.
        // canvasCtx.globalCompositeOperation = 'destination-atop';
        canvasCtx.drawImage(
            results.image, 0, 0, canvasElement.width, canvasElement.height);

        canvasCtx.globalCompositeOperation = 'source-over';
        drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS,
            { color: '#00FF00', lineWidth: 4 });
        drawLandmarks(canvasCtx, results.poseLandmarks,
            { color: '#FF0000', lineWidth: 2 });
        canvasCtx.restore();

    }

    const pose = new Pose({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/pose@${VERSION}/${file}`;
            // return `@mediapipe/pose/${file}`;
        }
    });
    pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: true,
        smoothSegmentation: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });
    pose.onResults(onResults);

    const camera = new Camera(videoElement, {
        onFrame: async () => {
            await pose.send({ image: videoElement });
        },
    });
    camera.start()
}
