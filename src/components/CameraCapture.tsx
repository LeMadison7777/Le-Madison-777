import { useEffect, useRef, useState } from "react";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

export default function CameraCapture({
  onCapture,
  onClose,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState("");
  const [isStarting, setIsStarting] = useState(false);

  // Arrête toutes les pistes de la caméra.
  const stopCamera = () => {
    const activeStream = streamRef.current;

    if (activeStream) {
      activeStream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setStream(null);
  };

  // Nettoyage automatique lorsque le composant est démonté.
  useEffect(() => {
    return () => {
      const activeStream = streamRef.current;

      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // Associe le flux vidéo à l'élément HTML video.
  useEffect(() => {
    if (!stream || !videoRef.current) return;

    const video = videoRef.current;
    video.srcObject = stream;

    video.play().catch(() => {
      setError("Impossible de démarrer l'aperçu de la caméra.");
    });

    return () => {
      video.srcObject = null;
    };
  }, [stream]);

  // Active la caméra uniquement après une action de l'utilisateur.
  const startCamera = async () => {
    setError("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setError(
        "Votre navigateur ne permet pas d'accéder à la caméra. Vérifiez votre connexion sécurisée."
      );
      return;
    }

    setIsStarting(true);

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
        },
        audio: false,
      });

      streamRef.current = mediaStream;
      setStream(mediaStream);
    } catch (err) {
      const errorName =
        err instanceof Error ? err.name : "";

      if (
        errorName === "NotAllowedError" ||
        errorName === "PermissionDeniedError"
      ) {
        setError(
          "L'autorisation d'accès à la caméra a été refusée. Vérifiez les permissions de votre navigateur."
        );
      } else if (errorName === "NotFoundError") {
        setError("Aucune caméra n'a été détectée sur votre appareil.");
      } else {
        setError(
          "Impossible d'accéder à la caméra. Veuillez réessayer."
        );
      }
    } finally {
      setIsStarting(false);
    }
  };

  // Capture une image et la convertit en fichier JPEG.
  const capturePhoto = () => {
    const video = videoRef.current;

    if (!video || !streamRef.current) {
      setError("La caméra n'est pas active.");
      return;
    }

    const width = video.videoWidth;
    const height = video.videoHeight;

    if (!width || !height) {
      setError("L'image vidéo n'est pas encore disponible.");
      return;
    }

    const canvas = document.createElement("canvas");

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    if (!context) {
      setError("Impossible de traiter l'image.");
      return;
    }

    context.drawImage(video, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError("Impossible de générer la photographie.");
          return;
        }

        const file = new File(
          [blob],
          `madclothes-camera-${Date.now()}.jpg`,
          {
            type: "image/jpeg",
          }
        );

        stopCamera();
        onCapture(file);
      },
      "image/jpeg",
      0.92
    );
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="camera-capture-title"
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b p-5">
          <h2
            id="camera-capture-title"
            className="text-lg font-semibold text-gray-900"
          >
            Photographier un article
          </h2>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Fermer la caméra"
            className="rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-100"
          >
            Fermer
          </button>
        </div>

        <div className="space-y-4 p-5">
          {error && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          {stream ? (
            <>
              <div className="overflow-hidden rounded-xl bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  aria-label="Aperçu de la caméra"
                  className="aspect-video w-full object-cover"
                />
              </div>

              <button
                type="button"
                onClick={capturePhoto}
                className="w-full rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700"
              >
                Prendre la photo
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-4 rounded-xl bg-gray-50 p-8 text-center">
              <p className="text-sm text-gray-600">
                Utilisez la caméra de votre appareil pour photographier
                directement votre article.
              </p>

              <button
                type="button"
                onClick={startCamera}
                disabled={isStarting}
                className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isStarting
                  ? "Activation de la caméra..."
                  : "Activer la caméra"}
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}