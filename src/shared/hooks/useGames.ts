// hooks/useGames.ts
import { useState, useEffect, useCallback } from "react";
import { useLichessGames, LichessGame } from "./useLichessGames";
import { useChessGames, ChessGame } from "./useChessGames";

export type Platform = "lichess" | "chesscom";

export interface Game {
    id: string;
    platform: Platform;
    white: {
        name: string;
        rating?: number;
    };
    black: {
        name: string;
        rating?: number;
    };
    result: string;
    speed?: string;
    timeClass?: string;
    rated?: boolean;
    createdAt?: number;
    timeControl?: string;
}

export interface UseGamesProps {
    username: string;
    platform: Platform;
    maxGames?: number;
}

export interface UseGamesResult {
    games: Game[];
    loading: boolean;
    error: string | null;
    refresh: () => void;
    fetchGamePgn: (gameId: string, gamePlatform: Platform) => Promise<string>;
}

export const useGames = ({
    username,
    platform,
    maxGames = 10,
}: UseGamesProps): UseGamesResult => {
    const [games, setGames] = useState<Game[]>([]);
    const [error, setError] = useState<string | null>(null);

    const lichess = useLichessGames({
        username: platform === "lichess" ? username : "",
        maxGames: platform === "lichess" ? maxGames : 0,
    });

    const chesscom = useChessGames({
        username: platform === "chesscom" ? username : "",
        maxGames: platform === "chesscom" ? maxGames : 0,
    });

    const transformLichessGame = (game: LichessGame): Game => ({
        id: game.id,
        platform: "lichess",
        white: {
            name:
                game.players.white.user?.name ||
                game.players.white.name ||
                "Unknown",
            rating:
                game.players.white.user?.rating || game.players.white.rating,
        },
        black: {
            name:
                game.players.black.user?.name ||
                game.players.black.name ||
                "Unknown",
            rating:
                game.players.black.user?.rating || game.players.black.rating,
        },
        result:
            game.winner === "white"
                ? "1-0"
                : game.winner === "black"
                ? "0-1"
                : "1/2-1/2",
        speed: game.speed,
        rated: game.rated,
        createdAt: game.createdAt,
        timeControl: game.clock
            ? `${game.clock.initial / 60}+${game.clock.increment}`
            : undefined,
    });

    const transformChesscomGame = (game: ChessGame): Game => ({
        id: game.id,
        platform: "chesscom",
        white: {
            name: game.white.username || "Unknown",
            rating: game.white.rating,
        },
        black: {
            name: game.black.username || "Unknown",
            rating: game.black.rating,
        },
        result: game.result || "1/2-1/2",
        timeClass: game.time_class,
        rated: game.rated,
        timeControl: game.time_control,
        createdAt: game.end_time ? game.end_time * 1000 : undefined,
    });

    const fetchGamePgn = useCallback(
        async (gameId: string, gamePlatform: Platform): Promise<string> => {
            try {
                if (gamePlatform === "lichess") {
                    const response = await fetch(
                        `https://lichess.org/game/export/${gameId}.pgn`
                    );
                    return await response.text();
                } else {
                    // Для Chess.com пытаемся найти PGN в уже загруженных данных
                    const game = chesscom.games.find((g) => g.id === gameId);
                    return game?.pgn || "PGN не доступен";
                }
            } catch (error) {
                console.error("Error fetching PGN:", error);
                throw new Error("Не удалось загрузить PGN");
            }
        },
        [chesscom.games]
    );

    const refresh = useCallback(() => {
        if (platform === "lichess") {
            lichess.refresh();
        } else {
            chesscom.refresh();
        }
    }, [platform, lichess, chesscom]);

    useEffect(() => {
        if (platform === "lichess") {
            setGames(lichess.games.map(transformLichessGame));
            setError(lichess.error);
        } else {
            setGames(chesscom.games.map(transformChesscomGame));
            setError(chesscom.error);
        }
    }, [
        platform,
        lichess.games,
        lichess.error,
        chesscom.games,
        chesscom.error,
    ]);

    return {
        games,
        loading: platform === "lichess" ? lichess.loading : chesscom.loading,
        error,
        refresh,
        fetchGamePgn,
    };
};
