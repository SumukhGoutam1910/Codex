import React from "react";

export function Footer() {
  return (
    <footer className="w-full bg-gray-950 border-t border-gray-800 py-8 text-gray-400">
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-lg font-semibold text-white tracking-wide">
          Fire & Smoke Detection WebApp
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <a href="/about" className="hover:text-white transition">About</a>
          <a href="/privacy" className="hover:text-white transition">Privacy</a>
          <a href="/contact" className="hover:text-white transition">Contact</a>
          <a href="https://github.com/SumukhGoutam1910/Codex" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">GitHub</a>
        </div>
        <div className="text-xs text-gray-500">&copy; {new Date().getFullYear()} Sumukh Goutam. All rights reserved.</div>
      </div>
    </footer>
  );
}
