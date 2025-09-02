// utils/gameFormatters.ts
export const getPlayerName = (player: any): string => {
    if (!player) return "Unknown";
    if (player.user?.name) return player.user.name;
    if (player.name) return player.name;
    if (player.user && typeof player.user === "string") return player.user;
    return "Unknown";
};

export const getPlayerRating = (player: any): number | string => {
    if (!player) return "?";
    if (player.user?.rating !== undefined) return player.user.rating;
    if (player.rating !== undefined) return player.rating;
    return "?";
};

export const formatGameTime = (timestamp?: number): string => {
    if (!timestamp) return "Неизвестно";
    return new Date(timestamp).toLocaleString("ru-RU");
};

export const getGameResult = (game: any): string => {
    if (!game?.winner) return "Ничья";
    return game.winner === "white" ? "Победа белых" : "Победа черных";
};

export const formatRatingDiff = (diff?: number): string => {
    if (diff === undefined || diff === null) return "";
    return diff > 0 ? `+${diff}` : diff.toString();
};
