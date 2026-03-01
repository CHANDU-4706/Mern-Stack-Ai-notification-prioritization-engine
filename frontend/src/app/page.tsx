"use client";

import LoginPage from "./login/page";

export default function Home() {
  return (
    <main className="min-h-screen bg-black overflow-hidden relative">
      {/* FORCE STATUS BANNER */}
      <div className="absolute top-0 left-0 right-0 bg-indigo-600 text-white text-[10px] font-bold py-1 px-4 z-[9999] text-center uppercase tracking-widest">
        MERN Production Environment
      </div>
      <LoginPage />
    </main>
  );
}
