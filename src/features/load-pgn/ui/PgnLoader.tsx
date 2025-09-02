import React, { useState } from "react";
import { Input, Button } from "antd";
import { ChessPosition } from "@entities/chess";

interface PgnLoaderProps {
    onLoad: (position: ChessPosition) => void;
}

const PgnLoader: React.FC<PgnLoaderProps> = ({ onLoad }) => {
    const [pgn, setPgn] = useState("");

    const handleLoad = () => {
        onLoad({ pgn, orientation: "white" });
    };

    return (
        <div style={{ marginBottom: "20px" }}>
            <Input.TextArea
                value={pgn}
                onChange={(e) => setPgn(e.target.value)}
                placeholder="Вставьте PGN"
                rows={4}
            />
            <Button
                type="primary"
                onClick={handleLoad}
                style={{ marginTop: "10px" }}
            >
                Загрузить
            </Button>
        </div>
    );
};

export default PgnLoader;
