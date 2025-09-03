// components/GamesViewer.tsx
import React, { useState } from "react";
import { useGames, Platform } from "@shared/hooks/useGames";
import {
    formatGameTime,
    getGameResult,
    getPlayerName,
} from "@shared/utils/gameFormatters";
import { formatPgnForDisplay, formatPgnCompact } from "@shared/utils/pgnUtils";
import "./GamesViewer.css";

export const GamesViewer: React.FC = () => {
    const [username, setUsername] = useState("Monkey_King");
    const [platform, setPlatform] = useState<Platform>("lichess");
    const [selectedGame, setSelectedGame] = useState<string | null>(null);
    const [pgnData, setPgnData] = useState<{ [key: string]: string }>({});
    const [loadingPgn, setLoadingPgn] = useState<{ [key: string]: boolean }>(
        {}
    );
    const [viewMode, setViewMode] = useState<"detailed" | "compact">(
        "detailed"
    );

    const { games, loading, error, refresh, fetchGamePgn } = useGames({
        username,
        platform,
        maxGames: 20,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (username.trim()) {
            refresh();
            setPgnData({});
            setSelectedGame(null);
        }
    };

    const handleGameSelect = async (gameId: string) => {
        setSelectedGame(gameId);

        if (!pgnData[gameId]) {
            setLoadingPgn((prev) => ({ ...prev, [gameId]: true }));
            try {
                const pgn = await fetchGamePgn(gameId, platform);
                setPgnData((prev) => ({ ...prev, [gameId]: pgn }));
            } catch (err) {
                setPgnData((prev) => ({
                    ...prev,
                    [gameId]: "Не удалось загрузить PGN",
                }));
            } finally {
                setLoadingPgn((prev) => ({ ...prev, [gameId]: false }));
            }
        }
    };

    const renderPgnContent = (gameId: string) => {
        const pgn = pgnData[gameId];

        if (!pgn) {
            return <div className="loading-text">Загрузка PGN...</div>;
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
        <div className="games-container">
            <div className="header">
                <h1>Chess Games Viewer</h1>

                <form onSubmit={handleSubmit} className="search-form">
                    <div className="platform-selector">
                        <label
                            className={platform === "lichess" ? "active" : ""}
                        >
                            <input
                                type="radio"
                                value="lichess"
                                checked={platform === "lichess"}
                                onChange={(e) =>
                                    setPlatform(e.target.value as Platform)
                                }
                            />
                            Lichess.org
                        </label>
                        <label
                            className={platform === "chesscom" ? "active" : ""}
                        >
                            <input
                                type="radio"
                                value="chesscom"
                                checked={platform === "chesscom"}
                                onChange={(e) =>
                                    setPlatform(e.target.value as Platform)
                                }
                            />
                            Chess.com
                        </label>
                    </div>

                    <div className="input-group">
                        <input
                            type="text"
                            placeholder={`Введите имя пользователя ${
                                platform === "lichess" ? "Lichess" : "Chess.com"
                            }`}
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="username-input"
                        />

                        <button
                            type="submit"
                            disabled={loading || !username.trim()}
                            className="search-button"
                        >
                            {loading ? "Загрузка..." : "Найти партии"}
                        </button>
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

            {!loading && !error && username && games.length === 0 && (
                <div className="empty-state">
                    <h3>Партии не найдены</h3>
                    <p>
                        Возможно, пользователь не играл recently или имя введено
                        неверно
                    </p>
                </div>
            )}

            {!loading && !error && username && games.length > 0 && (
                <div className="games-layout">
                    {/* Левая колонка - список партий */}
                    <div className="games-list-column">
                        <div className="games-list-header">
                            <h3>Партии пользователя: {username}</h3>
                            <span className="platform-badge">{platform}</span>
                        </div>

                        <div className="games-list">
                            {games.map((game: any) => (
                                <div
                                    key={game.id}
                                    className={`game-item ${
                                        selectedGame === game.id
                                            ? "selected"
                                            : ""
                                    }`}
                                    onClick={() => handleGameSelect(game.id)}
                                >
                                    <div className="game-item-header">
                                        <span className="game-speed">
                                            {game.speed ||
                                                game.timeClass ||
                                                "unknown"}
                                        </span>
                                        {game.rated && (
                                            <span className="rated-badge">
                                                Rated
                                            </span>
                                        )}
                                    </div>
                                    <div className="game-players">
                                        <span className="player white">
                                            {getPlayerName(game.white)}
                                        </span>
                                        <span className="vs">vs</span>
                                        <span className="player black">
                                            {getPlayerName(game.black)}
                                        </span>
                                    </div>
                                    <div className="game-result-time">
                                        <span
                                            className={`result ${
                                                game.result === "1-0"
                                                    ? "white"
                                                    : game.result === "0-1"
                                                    ? "black"
                                                    : "draw"
                                            }`}
                                        >
                                            {getGameResult({
                                                winner:
                                                    game.result === "1-0"
                                                        ? "white"
                                                        : game.result === "0-1"
                                                        ? "black"
                                                        : undefined,
                                            })}
                                        </span>
                                        <span className="game-time">
                                            {game.createdAt
                                                ? formatGameTime(game.createdAt)
                                                : "Неизвестно"}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Правая панель - детали партии */}
                    <div className="game-details-column">
                        <div className="game-details-panel">
                            <div className="details-header">
                                <h3>Детали партии</h3>
                                <div className="details-controls">
                                    <button
                                        onClick={() =>
                                            setViewMode(
                                                viewMode === "detailed"
                                                    ? "compact"
                                                    : "detailed"
                                            )
                                        }
                                        className="view-mode-button"
                                    >
                                        {viewMode === "detailed"
                                            ? "Компактно"
                                            : "Подробно"}
                                    </button>
                                    {selectedGame && (
                                        <button
                                            className="close-button"
                                            onClick={() =>
                                                setSelectedGame(null)
                                            }
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            </div>

                            {selectedGame ? (
                                <div className="details-content">
                                    {loadingPgn[selectedGame] ? (
                                        <div className="loading-text">
                                            Загрузка PGN...
                                        </div>
                                    ) : (
                                        renderPgnContent(selectedGame)
                                    )}
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
                </div>
            )}

            {!username && !loading && (
                <div className="welcome-state">
                    <h3>Добро пожаловать в Chess Games Viewer</h3>
                    <p>
                        Выберите платформу и введите имя пользователя, чтобы
                        посмотреть его последние партии.
                    </p>
                </div>
            )}
        </div>
    );
};
