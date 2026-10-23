"use client";
import { useCallback, useEffect, useRef, useState } from "react";

// Global tracker to ensure NO MediaStream is ever orphaned or leaked across SPA navigations
const activeCameraStreams = new Set<MediaStream>();

function stopAllActiveStreams() {
  activeCameraStreams.forEach((stream) => {
    try {
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (_) {}
      });
    } catch (_) {}
  });
  activeCameraStreams.clear();
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", stopAllActiveStreams);
  window.addEventListener("beforeunload", stopAllActiveStreams);
  window.addEventListener("popstate", stopAllActiveStreams);
}

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const isStartingRef = useRef<boolean>(false);

  const [cameraOn, setCameraOn] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  // Helper to completely stop any stream and all its tracks
  const stopStream = useCallback((stream: MediaStream | null) => {
    if (!stream) return;
    try {
      const tracks = stream.getTracks();
      tracks.forEach((track) => {
        try {
          track.stop();
        } catch (_) {}
      });
    } catch (_) {}
    activeCameraStreams.delete(stream);
  }, []);

  const stopCamera = useCallback(() => {
    isStartingRef.current = false;

    // 1. Stop and release current streamRef
    if (streamRef.current) {
      stopStream(streamRef.current);
      streamRef.current = null;
    }

    // 2. Stop and release video element's srcObject if attached
    const video = videoRef.current;
    if (video) {
      if (video.srcObject) {
        stopStream(video.srcObject as MediaStream);
        video.srcObject = null;
      }
      try {
        video.pause();
      } catch (_) {}
    }

    // 3. Fallback: stop all streams tracked globally
    stopAllActiveStreams();

    if (isMountedRef.current) {
      setCameraOn(false);
    }
  }, [stopStream]);

  const startCamera = useCallback(async () => {
    try {
      if (typeof window === "undefined") return;

      if (!navigator?.mediaDevices?.getUserMedia) {
        console.warn("[CAMERA] navigator.mediaDevices.getUserMedia is not available");
        if (isMountedRef.current) setCameraOn(false);
        return;
      }

      // Prevent concurrent startCamera calls
      if (isStartingRef.current) return;
      isStartingRef.current = true;

      // Stop any existing streams first
      if (streamRef.current) {
        stopStream(streamRef.current);
        streamRef.current = null;
      }
      stopAllActiveStreams();

      console.log("[CAMERA] Initializing stream...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      activeCameraStreams.add(stream);

      // CRITICAL RACE CONDITION FIX:
      // If the component was unmounted or stopCamera was called while getUserMedia was resolving,
      // IMMEDIATELY stop the newly created stream tracks!
      if (!isMountedRef.current || !isStartingRef.current) {
        console.log("[CAMERA] Component unmounted or camera cancelled during init. Stopping stream.");
        stopStream(stream);
        return;
      }

      streamRef.current = stream;

      let video = videoRef.current;
      if (!video) {
        for (let i = 0; i < 15; i++) {
          await new Promise((r) => setTimeout(r, 100));
          if (!isMountedRef.current || !isStartingRef.current) {
            stopStream(stream);
            streamRef.current = null;
            return;
          }
          if (videoRef.current) {
            video = videoRef.current;
            break;
          }
        }
      }

      if (!video || !isMountedRef.current || !isStartingRef.current) {
        console.warn("[CAMERA] Video element ref was not found or component unmounted");
        stopStream(stream);
        streamRef.current = null;
        if (isMountedRef.current) setCameraOn(false);
        return;
      }

      video.srcObject = stream;
      video.muted = true;
      video.setAttribute("playsinline", "true");
      video.setAttribute("autoplay", "true");

      if (video.readyState >= 2) {
        try {
          await video.play();
        } catch (_) {}
      } else {
        await new Promise<void>((resolve) => {
          let resolved = false;
          const finish = () => {
            if (!resolved) {
              resolved = true;
              resolve();
            }
          };
          video!.onloadeddata = async () => {
            try {
              if (isMountedRef.current && isStartingRef.current) {
                await video?.play();
              }
            } catch (_) {}
            finish();
          };
          video!.onloadedmetadata = async () => {
            try {
              if (isMountedRef.current && isStartingRef.current) {
                await video?.play();
              }
            } catch (_) {}
            finish();
          };
          setTimeout(finish, 600);
        });
      }

      if (!isMountedRef.current || !isStartingRef.current) {
        stopStream(stream);
        streamRef.current = null;
        return;
      }

      setCameraOn(true);
      console.log("[CAMERA] Initialized successfully");
    } catch (err) {
      console.warn("[CAMERA] Init failed:", err);
      if (isMountedRef.current) setCameraOn(false);
    } finally {
      isStartingRef.current = false;
    }
  }, [stopStream]);

  const takePhoto = useCallback(
    (faceOk: boolean) => {
      const video = videoRef.current;

      if (!video || !faceOk) return;
      if (video.videoWidth === 0 || video.videoHeight === 0) return;

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(video, 0, 0);

      canvas.toBlob((blob) => {
        if (!blob) return;

        const file = new File([blob], "attendance.jpg", {
          type: "image/jpeg",
        });

        if (isMountedRef.current) {
          setFile(file);
          const url = URL.createObjectURL(blob);
          setPhoto(url);
        }

        stopCamera();
      }, "image/jpeg", 0.95);
    },
    [stopCamera]
  );

  const retakePhoto = useCallback(() => {
    setPhoto(null);
    setFile(null);
    startCamera();
  }, [startCamera]);

  // Guaranteed unmount and page lifecycle cleanup
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      stopCamera();
      stopAllActiveStreams();
    };
  }, [stopCamera]);

  return {
    videoRef,
    cameraOn,
    photo,
    file,
    startCamera,
    stopCamera,
    takePhoto,
    retakePhoto,
  };
}
