"use client";

import { useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [shareLink, setShareLink] = useState<string>("");
  const [expiresIn, setExpiresIn] = useState<string>("1");
  const [showHandbrakeHelp, setShowHandbrakeHelp] = useState(false);
  const [handbrakeMessage, setHandbrakeMessage] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setShareLink("");
      setShowHandbrakeHelp(false);

      // Check file size and type
      const maxSize = 1024 * 1024 * 1024; // 1GB
      const isMKV = selectedFile.name.toLowerCase().endsWith('.mkv');
      const isVideo = selectedFile.type.startsWith('video/');
      const isTooBig = selectedFile.size > maxSize;

      if (isTooBig && isVideo) {
        setHandbrakeMessage(
          `Votre vidéo (${(selectedFile.size / 1024 / 1024 / 1024).toFixed(2)} GB) dépasse la limite de 1 GB. ` +
          `Utilisez HandBrake pour la compresser et réduire sa taille jusqu'à 80% sans perte de qualité visible.`
        );
        setShowHandbrakeHelp(true);
      } else if (isTooBig) {
        setHandbrakeMessage(
          `Votre fichier (${(selectedFile.size / 1024 / 1024 / 1024).toFixed(2)} GB) dépasse la limite de 1 GB.`
        );
        setShowHandbrakeHelp(true);
      } else if (isMKV) {
        setHandbrakeMessage(
          `Fichier MKV détecté. HandBrake peut le convertir en MP4 (meilleure compatibilité) ` +
          `ou en MP3 si vous voulez juste l'audio.`
        );
        setShowHandbrakeHelp(true);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    // Create abort controller for this upload
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setUploading(true);
    setUploadProgress(0);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("expiresIn", expiresIn);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        signal: abortController.signal,
      });

      if (response.ok) {
        const data = await response.json();
        const fullUrl = `${window.location.origin}/share/${data.id}`;
        setShareLink(fullUrl);
        setUploadProgress(100);
      } else {
        alert("Erreur lors de l'upload");
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log("Upload annulé par l'utilisateur");
        alert("Upload annulé");
      } else {
        console.error("Upload error:", error);
        alert("Erreur lors de l'upload");
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
      abortControllerRef.current = null;
    }
  };

  const handleCancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const copyToClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareLink);
        alert("Lien copié dans le presse-papier!");
      } else {
        // Fallback pour les navigateurs qui ne supportent pas l'API Clipboard
        const textArea = document.createElement("textarea");
        textArea.value = shareLink;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand("copy");
          alert("Lien copié dans le presse-papier!");
        } catch (err) {
          console.error("Erreur lors de la copie:", err);
          alert("Impossible de copier automatiquement. Veuillez copier manuellement le lien.");
        }
        document.body.removeChild(textArea);
      }
    } catch (err) {
      console.error("Erreur lors de la copie:", err);
      alert("Impossible de copier automatiquement. Veuillez copier manuellement le lien.");
    }
  };

  return (
    <main className="container mx-auto px-4 py-16 max-w-2xl relative z-10">
      <div className="glass-dark rounded-2xl neon-glow p-8">
        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400 mb-2 text-center neon-text">
          ⚡ FLASH SHARE ⚡
        </h1>
        <p className="text-cyan-300 text-center mb-8 text-lg">
          Partage simplement tes fichiers avec des liens qui expirent automatiquement
        </p>

        <div className="space-y-6">
          {/* Upload Section */}
          <div>
            <label className="block text-sm font-medium text-purple-300 mb-2">
              📁 Sélectionnez un fichier
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              className="block w-full text-sm text-cyan-300 file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600/30 file:text-cyan-300 hover:file:bg-purple-500/40 file:neon-glow cursor-pointer border border-purple-500/30 rounded-lg p-2 bg-black/30"
              accept=".jpg,.jpeg,.png,.gif,.webp,.svg,.mp4,.webm,.mov,.pdf,.txt,.mp3,.wav"
            />
            {file && (
              <p className="mt-2 text-sm text-cyan-200">
                Fichier sélectionné: <span className="font-semibold text-purple-300">{file.name}</span> (
                <span className="text-cyan-400">{(file.size / 1024 / 1024).toFixed(2)} MB</span>)
              </p>
            )}
          </div>

          {/* HandBrake Help Alert */}
          {showHandbrakeHelp && (
            <div className="bg-purple-900/30 border-2 border-purple-500/50 rounded-lg p-4 neon-glow">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-cyan-300 mb-1">
                    💡 Astuce : Utilisez HandBrake
                  </h4>
                  <p className="text-sm text-purple-200 mb-3">
                    {handbrakeMessage}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href="https://handbrake.fr/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-purple-500 hover:to-cyan-500 transition-all neon-glow-cyan"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Télécharger HandBrake (gratuit)
                    </a>
                    <button
                      onClick={() => setShowHandbrakeHelp(false)}
                      className="px-4 py-2 text-sm text-cyan-300 hover:text-cyan-100 font-medium border border-cyan-500/50 rounded-lg hover:border-cyan-400"
                    >
                      Continuer quand même
                    </button>
                  </div>
                  <p className="text-xs text-purple-300 mt-2">
                    HandBrake est gratuit, open-source et disponible sur Windows, Mac et Linux
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Expiration Time */}
          <div>
            <label className="block text-sm font-medium text-purple-300 mb-2">
              ⏱️ Durée de validité du lien
            </label>
            <select
              value={expiresIn}
              onChange={(e) => setExpiresIn(e.target.value)}
              className="block w-full px-4 py-3 border border-purple-500/50 rounded-lg bg-black/30 text-cyan-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 neon-glow transition-all"
            >
              <option value="1" className="bg-gray-900">⚡ 1 heure</option>
              <option value="6" className="bg-gray-900">🕐 6 heures</option>
              <option value="24" className="bg-gray-900">📅 24 heures</option>
              <option value="72" className="bg-gray-900">📆 3 jours</option>
              <option value="168" className="bg-gray-900">🗓️ 1 semaine</option>
            </select>
          </div>

          {/* Upload Button */}
          {!uploading ? (
            <button
              onClick={handleUpload}
              disabled={!file}
              className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:from-purple-500 hover:to-cyan-500 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed transition-all glow-pulse"
            >
              ⚡ GÉNÉRER LE LIEN ⚡
            </button>
          ) : (
            <div className="space-y-3">
              {/* Upload Progress */}
              <div className="w-full bg-black/50 rounded-full h-3 overflow-hidden border border-purple-500/50">
                <div
                  className="bg-gradient-to-r from-purple-600 to-cyan-600 h-full transition-all duration-300 animate-pulse neon-glow"
                  style={{ width: '100%' }}
                />
              </div>

              <div className="flex gap-3">
                <div className="flex-1 bg-purple-900/30 border border-cyan-500/50 text-cyan-300 py-4 px-6 rounded-lg font-semibold text-lg text-center neon-glow-cyan">
                  <div className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Upload en cours...
                  </div>
                </div>

                <button
                  onClick={handleCancelUpload}
                  className="px-6 py-4 bg-red-600/80 border border-red-500 text-white rounded-lg font-semibold hover:bg-red-500 transition-all neon-glow whitespace-nowrap"
                >
                  ❌ Annuler
                </button>
              </div>
            </div>
          )}

          {/* Share Link Display */}
          {shareLink && (
            <div className="mt-6 p-6 bg-gradient-to-r from-purple-900/40 to-cyan-900/40 rounded-lg border-2 border-cyan-500/50 neon-glow-cyan">
              <h3 className="font-semibold text-cyan-300 mb-4 text-xl neon-text-cyan">
                ✨ Lien de partage généré! ✨
              </h3>

              {/* QR Code Section */}
              <div className="flex flex-col md:flex-row gap-6 items-center">
                {/* QR Code */}
                <div className="bg-white p-4 rounded-lg shadow-md neon-glow">
                  <QRCodeSVG
                    value={shareLink}
                    size={180}
                    level="H"
                    includeMargin={true}
                    fgColor="#8b5cf6"
                  />
                  <p className="text-xs text-gray-700 text-center mt-2 font-semibold">
                    📱 Scannez pour partager
                  </p>
                </div>

                {/* Link and Info */}
                <div className="flex-1 w-full">
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={shareLink}
                      readOnly
                      className="flex-1 px-4 py-2 bg-black/40 border border-cyan-500/50 rounded-lg text-sm text-cyan-200"
                    />
                    <button
                      onClick={copyToClipboard}
                      className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded-lg hover:from-cyan-500 hover:to-purple-500 transition-all font-medium whitespace-nowrap neon-glow"
                    >
                      📋 Copier
                    </button>
                  </div>
                  <p className="text-sm text-purple-200">
                    ⏱️ Ce lien expirera dans <span className="text-cyan-300 font-bold">{expiresIn === "1" ? "1 heure" :
                      expiresIn === "6" ? "6 heures" :
                      expiresIn === "24" ? "24 heures" :
                      expiresIn === "72" ? "3 jours" : "1 semaine"}</span>
                  </p>
                  <p className="text-xs text-cyan-400 mt-2">
                    💡 Utilisez le QR code pour partager facilement sur mobile
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-8 text-center text-purple-300 text-sm space-y-2">
        <p className="flex items-center justify-center gap-2">
          <span className="text-cyan-400">⚡</span>
          Les fichiers sont automatiquement supprimés après expiration
          <span className="text-cyan-400">⚡</span>
        </p>
        <p className="text-cyan-400/60 text-xs">
          © {new Date().getFullYear()}{" "}
          <a
            href="https://github.com/pbackz/tmp_share_media_srv_kkk"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-cyan-400 transition-colors underline"
          >
            pbackz
          </a>
        </p>
      </div>
    </main>
  );
}
