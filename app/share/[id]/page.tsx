"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface FileInfo {
  originalName: string;
  mimeType: string;
  size: number;
  expiresAt: number;
}

export default function SharePage() {
  const params = useParams();
  const id = params.id as string;
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFileInfo = async () => {
      try {
        const response = await fetch(`/api/file/${id}`, { method: "HEAD" });

        if (!response.ok) {
          setError("Ce fichier n'existe pas ou a expiré");
          setLoading(false);
          return;
        }

        const originalName = response.headers.get("content-disposition")?.match(/filename="(.+)"/)?.[1] || "fichier";
        const mimeType = response.headers.get("content-type") || "";
        const size = parseInt(response.headers.get("content-length") || "0");

        setFileInfo({
          originalName,
          mimeType,
          size,
          expiresAt: 0,
        });
        setLoading(false);
      } catch (error) {
        console.error("Error fetching file info:", error);
        setError("Erreur lors du chargement du fichier");
        setLoading(false);
      }
    };

    fetchFileInfo();
  }, [id]);

  const downloadFile = () => {
    const link = document.createElement("a");
    link.href = `/api/file/${id}`;
    link.download = fileInfo?.originalName || "download";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderMedia = () => {
    if (!fileInfo) return null;

    const fileUrl = `/api/file/${id}`;

    if (fileInfo.mimeType.startsWith("image/")) {
      return (
        <div className="mt-6">
          <img
            src={fileUrl}
            alt={fileInfo.originalName}
            className="max-w-full h-auto rounded-lg shadow-lg mx-auto"
          />
        </div>
      );
    }

    if (fileInfo.mimeType.startsWith("video/")) {
      return (
        <div className="mt-6">
          <video
            controls
            className="max-w-full h-auto rounded-lg shadow-lg mx-auto"
          >
            <source src={fileUrl} type={fileInfo.mimeType} />
            Votre navigateur ne supporte pas la lecture de vidéos.
          </video>
        </div>
      );
    }

    if (fileInfo.mimeType === "application/pdf") {
      return (
        <div className="mt-6">
          <iframe
            src={fileUrl}
            className="w-full h-[600px] rounded-lg shadow-lg"
            title={fileInfo.originalName}
          />
        </div>
      );
    }

    return (
      <div className="mt-6 text-center">
        <div className="inline-flex items-center justify-center w-32 h-32 bg-gray-100 rounded-full mb-4">
          <svg
            className="w-16 h-16 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        </div>
        <p className="text-gray-600">Prévisualisation non disponible pour ce type de fichier</p>
      </div>
    );
  };

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
          <p className="text-gray-600 mt-4">Chargement...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
            <svg
              className="w-10 h-10 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Fichier introuvable</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <a
            href="/"
            className="inline-block bg-indigo-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Retour à l'accueil
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-16 max-w-4xl">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-1">
              {fileInfo?.originalName}
            </h1>
            <p className="text-gray-600">
              {fileInfo && (fileInfo.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <button
            onClick={downloadFile}
            className="flex items-center gap-2 bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Télécharger
          </button>
        </div>

        {renderMedia()}

        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <a
            href="/"
            className="text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Partager vos propres fichiers
          </a>
        </div>
      </div>
    </main>
  );
}
