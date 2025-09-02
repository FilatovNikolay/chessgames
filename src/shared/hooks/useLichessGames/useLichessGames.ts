// hooks/useLichessGames.ts
import { useState, useEffect, useCallback } from "react";
import axios, { AxiosError } from "axios";

export interface LichessPlayer {
    user?: {
        name: string;
        rating?: number;
    };
    rating?: number;
    ratingDiff?: number;
    name?: string;
}

export interface LichessGame {
    id: string;
    rated?: boolean;
    variant?: string;
    speed?: string;
    perf?: string;
    createdAt?: number;
    lastMoveAt?: number;
    status?: string;
    players: {
        white: LichessPlayer;
        black: LichessPlayer;
    };
    winner?: "white" | "black";
    moves?: string;
    clock?: {
        initial: number;
        increment: number;
        totalTime: number;
    };
    pgn?: string;
}

export interface PgnOptions {
    moves?: boolean;
    tags?: boolean;
    clocks?: boolean;
    evals?: boolean;
    accuracy?: boolean;
    opening?: boolean;
    literate?: boolean;
}

export interface UseLichessGamesProps {
    username: string;
    maxGames?: number;
}

export interface UseLichessGamesResult {
    games: LichessGame[];
    loading: boolean;
    error: string | null;
    refresh: () => void;
    fetchGamePgn: (gameId: string, options?: PgnOptions) => Promise<string>;
    fetchGameAsJson: (gameId: string) => Promise<any>;
}

export const useLichessGames = ({
    username,
    maxGames = 10,
}: UseLichessGamesProps): UseLichessGamesResult => {
    const [games, setGames] = useState<LichessGame[]>([]);
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
            const params = new URLSearchParams({
                max: maxGames.toString(),
                moves: "false",
                pgnInJson: "false",
                tags: "false",
                clocks: "false",
                evals: "false",
            });

            const response = await axios.get(
                `https://lichess.org/api/games/user/${username}?${params}`,
                {
                    headers: {
                        Accept: "application/x-ndjson",
                    },
                    timeout: 15000,
                }
            );

            const gamesData: LichessGame[] = [];
            const lines = response.data.trim().split("\n");

            for (const line of lines) {
                if (line.trim()) {
                    try {
                        const game = JSON.parse(line) as LichessGame;
                        if (game.id && game.players) {
                            gamesData.push(game);
                        }
                    } catch (parseError) {
                        console.warn("Failed to parse game line:", parseError);
                    }
                }
            }

            setGames(gamesData);
        } catch (err) {
            const axiosError = err as AxiosError;

            if (axiosError.response?.status === 404) {
                setError("Пользователь не найден");
            } else if (axiosError.response?.status === 429) {
                setError("Слишком много запросов. Попробуйте позже");
            } else if (axiosError.code === "NETWORK_ERROR") {
                setError("Ошибка сети. Проверьте подключение к интернету");
            } else if (axiosError.response?.status === 400) {
                setError(
                    "Неверный запрос. Возможно, пользователь не существует"
                );
            } else {
                setError(
                    axiosError.message ||
                        "Произошла ошибка при получении данных"
                );
            }

            console.error("Error fetching Lichess games:", err);
        } finally {
            setLoading(false);
        }
    }, [username, maxGames]);

    const fetchGamePgn = useCallback(
        async (gameId: string, options: PgnOptions = {}): Promise<string> => {
            try {
                const defaultOptions: PgnOptions = {
                    moves: true,
                    tags: true,
                    clocks: true,
                    evals: false,
                    accuracy: false,
                    opening: false,
                    literate: false,
                    ...options,
                };

                const params = new URLSearchParams();
                Object.entries(defaultOptions).forEach(([key, value]) => {
                    if (value !== undefined) {
                        params.append(key, value ? "1" : "0");
                    }
                });

                const url = `https://lichess.org/game/export/${gameId}.pgn${
                    params.toString() ? `?${params}` : ""
                }`;

                const response = await axios.get(url, {
                    headers: {
                        Accept: "application/x-chess-pgn",
                    },
                    timeout: 10000,
                });

                return response.data;
            } catch (err) {
                console.error("Error fetching PGN:", err);
                throw new Error("Не удалось получить PGN партии");
            }
        },
        []
    );

    const fetchGameAsJson = useCallback(
        async (gameId: string): Promise<any> => {
            try {
                const response = await axios.get(
                    `https://lichess.org/api/game/${gameId}`,
                    {
                        params: {
                            moves: true,
                            pgnInJson: true,
                            tags: true,
                            clocks: true,
                            evals: true,
                            accuracy: true,
                            opening: true,
                        },
                        headers: {
                            Accept: "application/json",
                        },
                        timeout: 10000,
                    }
                );

                return response.data;
            } catch (err) {
                console.error("Error fetching game JSON:", err);
                throw new Error(
                    "Не удалось получить данные игры в JSON формате"
                );
            }
        },
        []
    );

    useEffect(() => {
        fetchGames();
    }, [fetchGames]);

    const refresh = useCallback(() => {
        fetchGames();
    }, [fetchGames]);

    return {
        games,
        loading,
        error,
        refresh,
        fetchGamePgn,
        fetchGameAsJson,
    };
};
