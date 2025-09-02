import React from "react";
import ReactDOM from "react-dom/client";
import App from "@app/App";
import "antd/dist/reset.css";
import "./index.css";
import "./assets/css/lichess-pgn-viewer.scss";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
