import React, { useState } from "react";
import { Layout } from "antd";
import PgnLoader from "@features/load-pgn/ui/PgnLoader";
import { GamesViewer } from "@widgets/lichessGames/ui/GamesViewer";

const MainPage: React.FC = () => {
    return (
        <Layout>
            <Layout.Content style={{ padding: "50px", textAlign: "center" }}>
                <GamesViewer />
            </Layout.Content>
        </Layout>
    );
};

export default MainPage;
