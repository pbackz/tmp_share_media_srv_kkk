"use client";

import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [shareLink, setShareLink] = useState<string>("");
  const [expiresIn, setExpiresIn] = useState<string>("1");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setShareLink("");
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("expiresIn", expiresIn);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const fullUrl = `${window.location.origin}/share/${data.id}`;
        setShareLink(fullUrl);
      } else {
        alert("Erreur lors de l'upload");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Erreur lors de l'upload");
    } finally {
      setUploading(false);
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
    <main className="container mx-auto px-4 py-16 max-w-2xl">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 text-center">
          Partage Temporaire
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Partagez vos fichiers avec des liens qui expirent automatiquement
        </p>

        <div className="space-y-6">
          {/* Upload Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sélectionnez un fichier
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
              accept="image/*,video/*,application/pdf,.doc,.docx,.txt"
            />
            {file && (
              <p className="mt-2 text-sm text-gray-600">
                Fichier sélectionné: <span className="font-semibold">{file.name}</span> (
                {(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          {/* Expiration Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Durée de validité du lien
            </label>
            <select
              value={expiresIn}
              onChange={(e) => setExpiresIn(e.target.value)}
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="1">1 heure</option>
              <option value="6">6 heures</option>
              <option value="24">24 heures</option>
              <option value="72">3 jours</option>
              <option value="168">1 semaine</option>
            </select>
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full bg-indigo-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-lg"
          >
            {uploading ? "Upload en cours..." : "Générer le lien de partage"}
          </button>

          {/* Share Link Display */}
          {shareLink && (
            <div className="mt-6 p-6 bg-green-50 rounded-lg border-2 border-green-200">
              <h3 className="font-semibold text-green-800 mb-2">
                Lien de partage généré!
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="flex-1 px-4 py-2 bg-white border border-green-300 rounded-lg text-sm"
                />
                <button
                  onClick={copyToClipboard}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Copier
                </button>
              </div>
              <p className="text-sm text-green-700 mt-2">
                Ce lien expirera dans {expiresIn === "1" ? "1 heure" :
                  expiresIn === "6" ? "6 heures" :
                  expiresIn === "24" ? "24 heures" :
                  expiresIn === "72" ? "3 jours" : "1 semaine"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-8 text-center text-gray-600 text-sm">
        <p>Taille maximale: 1 GB par fichier</p>
        <p className="mt-1">Les fichiers sont automatiquement supprimés après expiration</p>
      </div>
    </main>
  );
}
