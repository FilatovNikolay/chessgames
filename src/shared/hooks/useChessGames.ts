// hooks/useChessGames.ts
import { useState, useEffect, useCallback } from "react";
import axios, { AxiosError } from "axios";

export interface ChessPlayer {
    username?: string;
    rating?: number;
}

export interface ChessGame {
    id: string;
    url?: string;
    pgn?: string;
    time_control?: string;
    end_time?: number;
    rated?: boolean;
    time_class?: string;
    white: ChessPlayer;
    black: ChessPlayer;
    result?: string;
}

export interface UseChessGamesProps {
    username: string;
    maxGames?: number;
}

export interface UseChessGamesResult {
    games: ChessGame[];
    loading: boolean;
    error: string | null;
    refresh: () => void;
}

export const useChessGames = ({
    username,
    maxGames = 10,
}: UseChessGamesProps): UseChessGamesResult => {
    const [games, setGames] = useState<ChessGame[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchGames = useCallback(async () => {
        if (!username.trim()) {
            setError("Имя пользователя не указано");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Получаем архивные месяцы
            const archivesResponse = await axios.get(
                `https://api.chess.com/pub/player/${username}/games/archives`,
                { timeout: 10000 }
            );

            const archives = archivesResponse.data.archives;
            if (!archives || archives.length === 0) {
                setGames([]);
                return;
            }

            // Берем последние 3 месяца для поиска игр
            const recentArchives = archives.slice(-3);
            let allGames: ChessGame[] = [];

            for (const archiveUrl of recentArchives) {
                try {
                    const response = await axios.get(archiveUrl, {
                        timeout: 10000,
                    });
                    const monthGames: ChessGame[] = response.data.games.map(
                        (game: any) => ({
                            id:
                                game.uuid ||
                                Math.random().toString(36).substr(2, 9),
                            url: game.url,
                            pgn: game.pgn,
                            time_control: game.time_control,
                            end_time: game.end_time,
                            rated: game.rated,
                            time_class: game.time_class,
                            white: {
                                username: game.white.username,
                                rating: game.white.rating,
                            },
                            black: {
                                username: game.black.username,
                                rating: game.black.rating,
                            },
                            result:
                                game.white.result === "win"
                                    ? "1-0"
                                    : game.black.result === "win"
                                    ? "0-1"
                                    : "1/2-1/2",
                        })
                    );

                    allGames = [...allGames, ...monthGames];
                } catch (error) {
                    console.warn(
                        "Error fetching games from archive:",
                        archiveUrl,
                        error
                    );
                }
            }

            // Сортируем по времени и берем последние
            const sortedGames = allGames
                .sort((a, b) => (b.end_time || 0) - (a.end_time || 0))
                .slice(0, maxGames);

            setGames(sortedGames);
        } catch (err) {
            const axiosError = err as AxiosError;

            if (axiosError.response?.status === 404) {
                setError("Пользователь не найден на Chess.com");
            } else if (axiosError.response?.status === 403) {
                setError("Доступ к играм пользователя ограничен");
            } else if (axiosError.response?.status === 429) {
                setError("Слишком много запросов. Попробуйте позже");
            } else if (axiosError.code === "NETWORK_ERROR") {
                setError("Ошибка сети. Проверьте подключение к интернету");
            } else {
                setError(
                    axiosError.message ||
                        "Произошла ошибка при получении данных"
                );
            }

            console.error("Error fetching Chess.com games:", err);
        } finally {
            setLoading(false);
        }
    }, [username, maxGames]);

    useEffect(() => {
        if (username) {
            fetchGames();
        }
    }, [username, fetchGames]);

    const refresh = useCallback(() => {
        fetchGames();
    }, [fetchGames]);

    return {
        games,
        loading,
        error,
        refresh,
    };
};
