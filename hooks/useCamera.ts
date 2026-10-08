"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraOn, setCameraOn] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const startCamera = useCallback(async () => {
    try {
      if (typeof window === "undefined") return;

      console.log("[CAMERA] window.isSecureContext =", window.isSecureContext);
      console.log("[CAMERA] window.location.origin =", window.location.origin);
      console.log("[CAMERA] navigator.mediaDevices =", navigator.mediaDevices);
      console.log("[CAMERA] navigator.userAgent =", navigator.userAgent);

      if (!navigator?.mediaDevices) {
        console.warn("[CAMERA] navigator.mediaDevices is undefined -- browser may block API on insecure origin");
        setCameraOn(false);
        return;
      }

      console.log("[CAMERA] Initializing...");

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;

      let video = videoRef.current;
      if (!video) {
        for (let i = 0; i < 15; i++) {
          await new Promise((r) => setTimeout(r, 100));
          if (videoRef.current) {
            video = videoRef.current;
            break;
          }
        }
      }

      if (!video) {
        console.warn("[CAMERA] Video element ref was not found after waiting");
        setCameraOn(false);
        return;
      }

      video.srcObject = stream;
      video.muted = true;
      video.setAttribute("playsinline", "true");
      video.setAttribute("autoplay", "true");

      try {
        await video.play();
      } catch (playErr) {
        console.warn("[CAMERA] video.play() auto-play error, listening to metadata:", playErr);
        await new Promise<void>((resolve) => {
          video!.onloadedmetadata = async () => {
            try {
              await video!.play();
            } catch (e) {}
            resolve();
          };
          setTimeout(resolve, 500);
        });
      }

      setCameraOn(true);
      console.log("[CAMERA] Initialized successfully");
    } catch (err) {
      console.error("[CAMERA] Init failed:", err);
      setCameraOn(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    const video = videoRef.current;
    if (video) {
      video.srcObject = null; // 🔥 CLAVE
    }

    setCameraOn(false);
  }, []);

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

        setFile(file);

        const url = URL.createObjectURL(blob);
        setPhoto(url);

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

  // 🔥 cleanup automático si sales del componente
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

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