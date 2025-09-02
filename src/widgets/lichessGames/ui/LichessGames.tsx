// components/LichessGames.tsx
import React, { useState } from "react";
import {
    formatGameTime,
    getGameResult,
    formatRatingDiff,
    getPlayerName,
    getPlayerRating,
} from "@shared/utils/gameFormatters";
import {
    formatPgnForDisplay,
    downloadPgn,
    formatPgnCompact,
} from "@shared/utils/pgnUtils";
import {
    PgnFormat,
    getPgnOptions,
    formatDescription,
} from "@shared/utils/pgnFormats";
import "./LichessGames.css";
import { useLichessGames } from "@shared/hooks/useLichessGames/useLichessGames";

export const LichessGames: React.FC = () => {
    const [inputUsername, setInputUsername] = useState("");
    const [selectedFormat, setSelectedFormat] = useState<PgnFormat>("basic");
    const [loadingPgn, setLoadingPgn] = useState<{ [key: string]: boolean }>(
        {}
    );
    const [pgnData, setPgnData] = useState<{ [key: string]: string }>({});
    const [expandedGame, setExpandedGame] = useState<string | null>(null);
    const [activeView, setActiveView] = useState<"games" | "json">("games");
    const [viewMode, setViewMode] = useState<"detailed" | "compact">(
        "detailed"
    );

    const { games, loading, error, refresh, fetchGamePgn, fetchGameAsJson } =
        useLichessGames({
            username: inputUsername,
            maxGames: 15,
        });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputUsername.trim()) {
            refresh();
            setPgnData({});
            setExpandedGame(null);
        }
    };

    const handleFetchPgn = async (
        gameId: string,
        format: PgnFormat = selectedFormat
    ) => {
        setLoadingPgn((prev) => ({ ...prev, [gameId]: true }));
        setActiveView("games");

        try {
            const options = getPgnOptions(format);
            const pgn = await fetchGamePgn(gameId, options);
            setPgnData((prev) => ({ ...prev, [gameId]: pgn }));
            setExpandedGame(gameId);
        } catch (err) {
            console.error("Failed to fetch PGN:", err);
            setPgnData((prev) => ({
                ...prev,
                [gameId]: "❌ Не удалось загрузить PGN",
            }));
        } finally {
            setLoadingPgn((prev) => ({ ...prev, [gameId]: false }));
        }
    };

    const handleFetchJson = async (gameId: string) => {
        setLoadingPgn((prev) => ({ ...prev, [gameId]: true }));
        setActiveView("json");

        try {
            const jsonData = await fetchGameAsJson(gameId);
            const jsonText = JSON.stringify(
                {
                    id: jsonData.id,
                    rated: jsonData.rated,
                    variant: jsonData.variant,
                    speed: jsonData.speed,
                    perf: jsonData.perf,
                    createdAt: jsonData.createdAt,
                    status: jsonData.status,
                    players: {
                        white: {
                            name: jsonData.players?.white?.user?.name,
                            rating: jsonData.players?.white?.rating,
                            ratingDiff: jsonData.players?.white?.ratingDiff,
                            accuracy:
                                jsonData.players?.white?.analysis?.accuracy,
                        },
                        black: {
                            name: jsonData.players?.black?.user?.name,
                            rating: jsonData.players?.black?.rating,
                            ratingDiff: jsonData.players?.black?.ratingDiff,
                            accuracy:
                                jsonData.players?.black?.analysis?.accuracy,
                        },
                    },
                    winner: jsonData.winner,
                    clock: jsonData.clock,
                    moves: jsonData.moves
                        ? `Количество ходов: ${
                              jsonData.moves.split(" ").length
                          }`
                        : "Нет ходов",
                    pgnLength: jsonData.pgn
                        ? `Длина PGN: ${jsonData.pgn.length} символов`
                        : "Нет PGN",
                },
                null,
                2
            );

            setPgnData((prev) => ({ ...prev, [gameId]: jsonText }));
            setExpandedGame(gameId);
        } catch (err) {
            console.error("Failed to fetch JSON:", err);
            setPgnData((prev) => ({
                ...prev,
                [gameId]: "❌ Не удалось загрузить JSON данные",
            }));
        } finally {
            setLoadingPgn((prev) => ({ ...prev, [gameId]: false }));
        }
    };

    const toggleGameExpansion = (gameId: string) => {
        if (expandedGame === gameId) {
            setExpandedGame(null);
        } else {
            if (activeView === "json") {
                handleFetchJson(gameId);
            } else {
                handleFetchPgn(gameId);
            }
        }
    };

    const handleFormatChange = (format: PgnFormat) => {
        setSelectedFormat(format);
        if (
            expandedGame &&
            pgnData[expandedGame] &&
            !pgnData[expandedGame].includes("❌")
        ) {
            handleFetchPgn(expandedGame, format);
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

        if (pgn.includes("❌")) {
            return <div className="error-text">{pgn}</div>;
        }

        if (activeView === "json") {
            return <pre>{pgn}</pre>;
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
                    <div className="loading-text">⏳ Загрузка партий...</div>
                    <div>Пожалуйста, подождите</div>
                </div>
            )}

            {error && (
                <div className="error-container">
                    <div className="error-message">❌ {error}</div>
                    <button
                        onClick={refresh}
                        disabled={loading}
                        className="retry-button"
                    >
                        🔄 Попробовать снова
                    </button>
                </div>
            )}

            {!loading && !error && inputUsername && (
                <>
                    <div className="games-header">
                        <h2>
                            Последние партии пользователя:{" "}
                            <span className="username">{inputUsername}</span>
                        </h2>

                        <div className="view-controls">
                            <button
                                onClick={refresh}
                                disabled={loading}
                                className="refresh-button"
                            >
                                Обновить
                            </button>

                            <button
                                onClick={() => setActiveView("games")}
                                className={`view-button ${
                                    activeView === "games" ? "active" : ""
                                }`}
                            >
                                PGN
                            </button>

                            <button
                                onClick={() => setActiveView("json")}
                                className={`view-button ${
                                    activeView === "json" ? "active" : ""
                                }`}
                            >
                                JSON
                            </button>

                            {activeView === "games" && (
                                <button
                                    onClick={toggleViewMode}
                                    className="view-mode-button"
                                >
                                    {viewMode === "detailed"
                                        ? "Компактно"
                                        : "Подробно"}
                                </button>
                            )}
                        </div>
                    </div>

                    {games.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">🤔</div>
                            <h3>Партии не найдены</h3>
                            <p>
                                Возможно, пользователь не играл recently или имя
                                введено неверно
                            </p>
                        </div>
                    ) : (
                        <div className="games-list">
                            {games.map((game: any) => (
                                <div key={game.id} className="game-card">
                                    <div className="game-header">
                                        <h3>
                                            🎮 Партия #
                                            {game.id?.slice(0, 8) || "unknown"}
                                        </h3>
                                        <span className="game-speed">
                                            {game.speed || "unknown"}
                                        </span>
                                    </div>

                                    <div className="players-info">
                                        <div className="player-row white-player">
                                            <span className="player-name">
                                                ⚪{" "}
                                                {getPlayerName(
                                                    game.players?.white
                                                )}
                                            </span>
                                            <span className="player-rating">
                                                {getPlayerRating(
                                                    game.players?.white
                                                )}
                                                {game.players?.white
                                                    ?.ratingDiff !==
                                                    undefined && (
                                                    <span
                                                        className={`rating-diff ${
                                                            game.players.white
                                                                .ratingDiff > 0
                                                                ? "positive"
                                                                : "negative"
                                                        }`}
                                                    >
                                                        (
                                                        {formatRatingDiff(
                                                            game.players.white
                                                                .ratingDiff
                                                        )}
                                                        )
                                                    </span>
                                                )}
                                            </span>
                                        </div>

                                        <div className="player-row black-player">
                                            <span className="player-name">
                                                ⚫{" "}
                                                {getPlayerName(
                                                    game.players?.black
                                                )}
                                            </span>
                                            <span className="player-rating">
                                                {getPlayerRating(
                                                    game.players?.black
                                                )}
                                                {game.players?.black
                                                    ?.ratingDiff !==
                                                    undefined && (
                                                    <span
                                                        className={`rating-diff ${
                                                            game.players.black
                                                                .ratingDiff > 0
                                                                ? "positive"
                                                                : "negative"
                                                        }`}
                                                    >
                                                        (
                                                        {formatRatingDiff(
                                                            game.players.black
                                                                .ratingDiff
                                                        )}
                                                        )
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="game-result">
                                        <span
                                            className={`result-badge ${
                                                game.winner || "draw"
                                            }`}
                                        >
                                            {getGameResult(game)}
                                        </span>

                                        <span className="game-time">
                                            {formatGameTime(game.createdAt)}
                                        </span>
                                    </div>

                                    <div className="game-actions">
                                        <button
                                            onClick={() =>
                                                toggleGameExpansion(game.id)
                                            }
                                            disabled={loadingPgn[game.id]}
                                            className={`toggle-button ${
                                                expandedGame === game.id
                                                    ? "active"
                                                    : ""
                                            }`}
                                        >
                                            {loadingPgn[game.id]
                                                ? "⏳"
                                                : expandedGame === game.id
                                                ? "Скрыть"
                                                : activeView === "json"
                                                ? "JSON"
                                                : "PGN"}
                                            {loadingPgn[game.id] &&
                                                " Загрузка..."}
                                        </button>

                                        {activeView === "games" && (
                                            <button
                                                onClick={() =>
                                                    handleFetchPgn(
                                                        game.id,
                                                        "with-analysis"
                                                    )
                                                }
                                                disabled={loadingPgn[game.id]}
                                                className="analysis-button"
                                            >
                                                С анализом
                                            </button>
                                        )}
                                    </div>

                                    {expandedGame === game.id &&
                                        pgnData[game.id] && (
                                            <div
                                                className={`pgn-container ${activeView}`}
                                            >
                                                {renderPgnContent(game.id)}
                                            </div>
                                        )}
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {!inputUsername && !loading && (
                <div className="welcome-state">
                    <div className="welcome-icon">👑</div>
                    <h3>Добро пожаловать в Lichess Games Viewer</h3>
                    <p>
                        Введите имя пользователя Lichess выше, чтобы посмотреть
                        его последние партии, получить PGN в разных форматах или
                        скачать игры для анализа.
                    </p>
                </div>
            )}
        </div>
    );
};
