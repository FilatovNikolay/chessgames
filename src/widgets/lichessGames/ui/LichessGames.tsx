// components/LichessGames.tsx
import React, { useState } from "react";
import {
    formatGameTime,
    getGameResult,
    formatRatingDiff,
    getPlayerName,
    getPlayerRating,
} from "@shared/utils/gameFormatters";
import { formatPgnForDisplay, formatPgnCompact } from "@shared/utils/pgnUtils";
import {
    PgnFormat,
    getPgnOptions,
    formatDescription,
} from "@shared/utils/pgnFormats";
import "./LichessGames.css";
import { useLichessGames } from "@shared/hooks/useLichessGames/useLichessGames";

export const LichessGames: React.FC = () => {
    const [inputUsername, setInputUsername] = useState("Monkey_King");
    const [selectedFormat, setSelectedFormat] =
        useState<PgnFormat>("with-evals");
    const [loadingPgn, setLoadingPgn] = useState<{ [key: string]: boolean }>(
        {}
    );
    const [pgnData, setPgnData] = useState<{ [key: string]: string }>({});
    const [selectedGame, setSelectedGame] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<"detailed" | "compact">(
        "detailed"
    );

    const { games, loading, error, refresh, fetchGamePgn } = useLichessGames({
        username: inputUsername,
        maxGames: 20,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputUsername.trim()) {
            refresh();
            setPgnData({});
            setSelectedGame(null);
        }
    };

    const handleFetchPgn = async (
        gameId: string,
        format: PgnFormat = selectedFormat
    ) => {
        setLoadingPgn((prev) => ({ ...prev, [gameId]: true }));

        try {
            const options = getPgnOptions(format);
            const pgn = await fetchGamePgn(gameId, options);
            setPgnData((prev) => ({ ...prev, [gameId]: pgn }));
            setSelectedGame(gameId);
        } catch (err) {
            console.error("Failed to fetch PGN:", err);
            setPgnData((prev) => ({
                ...prev,
                [gameId]: "Не удалось загрузить PGN",
            }));
        } finally {
            setLoadingPgn((prev) => ({ ...prev, [gameId]: false }));
        }
    };

    const handleGameSelect = (gameId: string) => {
        setSelectedGame(gameId);
        if (!pgnData[gameId]) {
            handleFetchPgn(gameId);
        }
    };

    const handleFormatChange = (format: PgnFormat) => {
        setSelectedFormat(format);
        if (selectedGame && pgnData[selectedGame]) {
            handleFetchPgn(selectedGame, format);
        }
    };

    const toggleViewMode = () => {
        setViewMode(viewMode === "detailed" ? "compact" : "detailed");
    };

    const formatOptions: PgnFormat[] = [
        "basic",
        "with-evals",
        "with-analysis",
        "moves-only",
        "literate",
        "tournament",
        "minimal",
    ];

    // Функция для рендеринга HTML контента
    const renderPgnContent = (gameId: string) => {
        const pgn = pgnData[gameId];

        if (!pgn) {
            return <div className="loading-text">Загрузка...</div>;
        }

        if (pgn.includes("Не удалось")) {
            return <div className="error-text">{pgn}</div>;
        }

        if (viewMode === "detailed") {
            return (
                <div
                    dangerouslySetInnerHTML={{
                        __html: formatPgnForDisplay(pgn),
                    }}
                />
            );
        } else {
            return (
                <div
                    dangerouslySetInnerHTML={{ __html: formatPgnCompact(pgn) }}
                />
            );
        }
    };

    return (
        <div className="lichess-container">
            <div className="header">
                <h1>Lichess Games Viewer</h1>

                <form onSubmit={handleSubmit} className="search-form">
                    <div className="input-group">
                        <input
                            type="text"
                            placeholder="Введите имя пользователя Lichess"
                            value={inputUsername}
                            onChange={(e) => setInputUsername(e.target.value)}
                            className="username-input"
                        />

                        <button
                            type="submit"
                            disabled={loading || !inputUsername.trim()}
                            className="search-button"
                        >
                            {loading ? "Загрузка..." : "Найти партии"}
                        </button>
                    </div>

                    <div className="format-selector">
                        <label>Формат PGN:</label>
                        <select
                            value={selectedFormat}
                            onChange={(e) =>
                                handleFormatChange(e.target.value as PgnFormat)
                            }
                            className="format-select"
                        >
                            {formatOptions.map((format) => (
                                <option key={format} value={format}>
                                    {format}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="format-description">
                        {formatDescription[selectedFormat]}
                    </div>
                </form>
            </div>

            {loading && (
                <div className="loading-container">
                    <div className="loading-text">Загрузка партий...</div>
                </div>
            )}

            {error && (
                <div className="error-container">
                    <div className="error-message">{error}</div>
                    <button
                        onClick={refresh}
                        disabled={loading}
                        className="retry-button"
                    >
                        Попробовать снова
                    </button>
                </div>
            )}

            {!loading && !error && inputUsername && (
                <div className="games-layout">
                    {/* Список партий слева */}
                    <div className="games-list">
                        <h3>Партии пользователя: {inputUsername}</h3>
                        {games.length === 0 ? (
                            <div className="empty-state">
                                <p>Партии не найдены</p>
                            </div>
                        ) : (
                            <div className="games-column">
                                {games.map((game: any) => (
                                    <div
                                        key={game.id}
                                        className={`game-item ${
                                            selectedGame === game.id
                                                ? "selected"
                                                : ""
                                        }`}
                                        onClick={() =>
                                            handleGameSelect(game.id)
                                        }
                                    >
                                        <div className="game-item-header">
                                            <span className="game-id">
                                                #{game.id?.slice(0, 8)}
                                            </span>
                                            <span className="game-speed">
                                                {game.speed || "unknown"}
                                            </span>
                                        </div>
                                        <div className="game-players">
                                            {getPlayerName(game.players?.white)}{" "}
                                            vs{" "}
                                            {getPlayerName(game.players?.black)}
                                        </div>
                                        <div className="game-result-time">
                                            <span
                                                className={`result ${
                                                    game.winner || "draw"
                                                }`}
                                            >
                                                {getGameResult(game)}
                                            </span>
                                            <span className="game-time">
                                                {formatGameTime(game.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Детали партии справа */}
                    <div className="game-details">
                        {selectedGame ? (
                            <div className="details-container">
                                <div className="details-header">
                                    <h3>Детали партии</h3>
                                    <button
                                        onClick={toggleViewMode}
                                        className="view-mode-button"
                                    >
                                        {viewMode === "detailed"
                                            ? "Компактно"
                                            : "Подробно"}
                                    </button>
                                </div>
                                <div className="pgn-container">
                                    {renderPgnContent(selectedGame)}
                                </div>
                            </div>
                        ) : (
                            <div className="no-selection">
                                <p>
                                    Выберите партию из списка для просмотра
                                    деталей
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {!inputUsername && !loading && (
                <div className="welcome-state">
                    <h3>Добро пожаловать в Lichess Games Viewer</h3>
                    <p>
                        Введите имя пользователя Lichess выше, чтобы посмотреть
                        его последние партии.
                    </p>
                </div>
            )}
        </div>
    );
};
