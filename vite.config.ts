import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@app": path.resolve(__dirname, "./src/app"),
            "@entities": path.resolve(__dirname, "./src/entities"),
            "@features": path.resolve(__dirname, "./src/features"),
            "@shared": path.resolve(__dirname, "./src/shared"),
            "@widgets": path.resolve(__dirname, "./src/widgets"),
            "@pages": path.resolve(__dirname, "./src/pages"),
            "~lichess-pgn-viewer": path.resolve(
                __dirname,
                "./node_modules/lichess-pgn-viewer"
            ),
        },
    },
    css: {
        preprocessorOptions: {
            scss: {
                // additionalData: `@import "src/assets/css/lichess-pgn-viewer.scss";`,
            },
        },
    },
});
