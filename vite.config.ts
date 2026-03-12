import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  preview: {
    host: "0.0.0.0",
    allowedHosts: [
      "nursinghomesnearme.com.au",
      "www.nursinghomesnearme.com.au",
      ".up.railway.app",
      "localhost",
      "127.0.0.1",
    ],
  },
});
