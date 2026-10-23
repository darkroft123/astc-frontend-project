"use client";

import { RefObject } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  RefreshCcw,
} from "lucide-react";

interface AttendanceCameraCardProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  cameraOn: boolean;
  photo: string | null;
  faceInside: boolean;
  isEntryDone: boolean;
  onStartCamera: () => void;
  onRetakePhoto: () => void;
  onActionClick: (action: "PHOTO" | "NO_PHOTO") => void;
}

export function AttendanceCameraCard({
  videoRef,
  cameraOn,
  photo,
  faceInside,
  isEntryDone,
  onStartCamera,
  onRetakePhoto,
  onActionClick,
}: AttendanceCameraCardProps) {
  return (
    <div className="lg:col-span-6 flex flex-col items-center order-1 lg:order-2 w-full">
      <div className="bg-card border border-border/80 rounded-3xl p-5 w-full flex flex-col items-center space-y-4 shadow-sm">
        {/* Viewport de Cámara */}
        <div className="bg-muted rounded-2xl w-full h-[360px] sm:h-[430px] relative overflow-hidden flex items-center justify-center border border-border/60">
          {photo ? (
            <img
              src={photo}
              alt="Captura"
              className="w-full h-full object-cover transform -scale-x-100"
            />
          ) : (
            <>
              <video
                ref={videoRef as any}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transform -scale-x-100 ${
                  !cameraOn ? "opacity-0 absolute inset-0 pointer-events-none" : "block"
                }`}
              />

              {!cameraOn && (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-foreground bg-muted">
                  <AlertTriangle className="w-8 h-8 text-amber-500 mb-3 animate-bounce" />
                  <p className="font-sans font-bold text-sm">
                    Cámara no iniciada o bloqueada
                  </p>
                  <p className="font-sans text-xs text-muted-foreground mt-2 max-w-xs leading-relaxed">
                    Permita el acceso a la cámara en el navegador para continuar.
                  </p>
                  <button
                    onClick={onStartCamera}
                    className="mt-4 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold cursor-pointer"
                  >
                    Iniciar cámara
                  </button>
                </div>
              )}
            </>
          )}

          {/* Guía Facial Ovalada */}
          {cameraOn && !photo && (
            <div
              className={`w-[230px] h-[310px] rounded-[115px] border-2 border-dashed transition-all duration-300 pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${
                faceInside
                  ? "border-emerald-400 border-solid shadow-[0_0_25px_rgba(52,211,153,0.35)]"
                  : "border-white/25"
              }`}
            />
          )}

          {/* Floating Status Pill over Bottom of Video */}
          {cameraOn && !photo && (
            <div
              className={`absolute bottom-5 left-1/2 -translate-x-1/2 backdrop-blur-md rounded-full px-5 py-2.5 flex items-center gap-2.5 shadow-xl whitespace-nowrap text-xs transition-all ${
                faceInside
                  ? "bg-[#062419]/90 border border-emerald-500/50 text-emerald-300"
                  : "bg-[#16130D]/90 border border-amber-500/50 text-amber-300"
              }`}
            >
              {faceInside ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="font-sans font-medium">
                    Rostro detectado correctamente
                  </span>
                </>
              ) : (
                <>
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-amber-400 inline-block shrink-0" />
                  <span className="font-sans font-medium">
                    Buscando rostro... encuadre su cara en la guía
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Info under camera */}
        <div className="w-full text-left pt-1">
          <h3 className="font-sans text-base sm:text-lg font-bold text-foreground">
            {faceInside ? "Rostro alineado" : "Alineando rostro"}
          </h3>
          <p className="font-sans text-xs text-muted-foreground mt-0.5">
            {faceInside
              ? "Posición correcta. Ya puede confirmar el marcaje."
              : "Mantenga el rostro dentro de la guía unos segundos."}
          </p>
        </div>

        {/* Action buttons bar */}
        <div className="flex items-center justify-between w-full pt-2 gap-4">
          {!photo ? (
            <>
              <button
                onClick={() => onActionClick("NO_PHOTO")}
                className="font-sans text-xs text-muted-foreground hover:text-foreground transition-colors py-2 px-3 underline-offset-4 hover:underline font-medium cursor-pointer"
              >
                Registrar sin foto
              </button>

              <button
                onClick={() => onActionClick("PHOTO")}
                className="font-sans font-semibold text-sm px-8 py-3 rounded-2xl text-white transition-all shadow-lg shadow-indigo-500/25 active:scale-95 cursor-pointer"
                style={{
                  background: "linear-gradient(90deg, #5B8CFF 0%, #A855F7 52%, #22C3E6 100%)",
                }}
              >
                {faceInside
                  ? isEntryDone
                    ? "Marcar salida"
                    : "Marcar entrada"
                  : "Esperando rostro"}
              </button>
            </>
          ) : (
            <div className="flex items-center justify-between w-full">
              <button
                onClick={onRetakePhoto}
                className="flex items-center gap-2 bg-card border border-border/80 hover:bg-accent text-foreground text-xs font-semibold px-5 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                <RefreshCcw className="w-3.5 h-3.5" /> Repetir foto
              </button>
              <button
                onClick={() => onActionClick("PHOTO")}
                className="font-sans font-semibold text-sm px-8 py-3 rounded-2xl text-white transition-all shadow-lg shadow-indigo-500/25 cursor-pointer"
                style={{
                  background: "linear-gradient(90deg, #5B8CFF 0%, #A855F7 52%, #22C3E6 100%)",
                }}
              >
                Confirmar marcaje
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
