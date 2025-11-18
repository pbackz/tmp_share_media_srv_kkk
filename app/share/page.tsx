import { Suspense } from "react";
import ShareClient from "./ShareClient";

export default function SharePage() {
  return (
    <Suspense fallback={
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
          <p className="text-gray-600 mt-4">Chargement...</p>
        </div>
      </main>
    }>
      <ShareClient />
    </Suspense>
  );
}
