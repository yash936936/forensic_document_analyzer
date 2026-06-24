import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite"; // Import the official Vite plugin
import path from "path";

export default defineConfig({
  plugins: [
    react(), 
    tailwindcss() // Add it to your plugins array
  ],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  server: { port: 5173 },
});