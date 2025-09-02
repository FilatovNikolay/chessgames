import React, { useState } from "react";
import { Layout } from "antd";
import PgnLoader from "@features/load-pgn/ui/PgnLoader";
import { ChessPosition } from "@entities/chess";
import { LichessGames } from "@widgets/lichessGames/ui/LichessGames";

const MainPage: React.FC = () => {
    return (
        <Layout>
            <Layout.Content style={{ padding: "50px", textAlign: "center" }}>
                <LichessGames />
            </Layout.Content>
        </Layout>
    );
};

export default MainPage;
