import {
  FaceDetector,
  FilesetResolver,
  type Detection,
} from "@mediapipe/tasks-vision";

import type { FaceBox } from "@/hooks/useImageUpload";

let faceDetectorPromise: Promise<FaceDetector> | null = null;

async function createFaceDetector(): Promise<FaceDetector> {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
  );

  return FaceDetector.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite",

      // Utilise le GPU du navigateur au lieu du delegate CPU XNNPACK.
      delegate: "GPU",
    },
    runningMode: "IMAGE",
    minDetectionConfidence: 0.5,
  });
}

async function getFaceDetector(): Promise<FaceDetector> {
  if (!faceDetectorPromise) {
    faceDetectorPromise = createFaceDetector().catch((error) => {
      faceDetectorPromise = null;
      throw error;
    });
  }

  return faceDetectorPromise;
}

function detectionToFaceBox(
  detection: Detection,
  imageWidth: number,
  imageHeight: number,
): FaceBox | null {
  const boundingBox = detection.boundingBox;

  if (!boundingBox || imageWidth <= 0 || imageHeight <= 0) {
    return null;
  }

  return {
    x: boundingBox.originX / imageWidth,
    y: boundingBox.originY / imageHeight,
    width: boundingBox.width / imageWidth,
    height: boundingBox.height / imageHeight,
  };
}

export async function detectFace(
  imageElement: HTMLImageElement,
): Promise<FaceBox | null> {
  if (
    !imageElement.complete ||
    imageElement.naturalWidth <= 0 ||
    imageElement.naturalHeight <= 0
  ) {
    throw new Error("L’image n’est pas complètement chargée.");
  }

  const detector = await getFaceDetector();
  const result = detector.detect(imageElement);

  const detection = result.detections[0];

  if (!detection) {
    return null;
  }

  return detectionToFaceBox(
    detection,
    imageElement.naturalWidth,
    imageElement.naturalHeight,
  );
}

export const faceDetectionService = {
  detectFace,
};
