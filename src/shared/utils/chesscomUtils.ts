// utils/chesscomUtils.ts
import { Game } from "../hooks/useGames";

export const parseChesscomPgn = (pgn: string): any => {
    const info: any = {};
    const lines = pgn.split("\n");

    for (const line of lines) {
        const tagMatch = line.match(/^\[(\w+)\s+"([^"]+)"\]$/);
        if (tagMatch) {
            const [, tag, value] = tagMatch;
            const lowerTag = tag.toLowerCase();
            info[lowerTag] = value;
        }
    }

    const movesLine = lines.find(
        (line) =>
            line.trim() &&
            !line.trim().startsWith("[") &&
            !line.trim().startsWith("%")
    );

    if (movesLine) {
        info.moves = movesLine.trim();
    }

    return info;
};

export const formatChesscomGame = (game: Game, pgn: string): string => {
    const parsed = parseChesscomPgn(pgn);
    let result = "";

    result += '<div class="pgn-header">';

    if (parsed.event)
        result += `<div class="pgn-info"><span class="pgn-label">Событие:</span> ${parsed.event}</div>`;
    if (parsed.date)
        result += `<div class="pgn-info"><span class="pgn-label">Дата:</span> ${parsed.date}</div>`;
    if (parsed.white)
        result += `<div class="pgn-info"><span class="pgn-label">Белые:</span> ${parsed.white}</div>`;
    if (parsed.black)
        result += `<div class="pgn-info"><span class="pgn-label">Черные:</span> ${parsed.black}</div>`;
    if (game.result) {
        const resultMap: { [key: string]: string } = {
            "1-0": "Победа белых",
            "0-1": "Победа черных",
            "1/2-1/2": "Ничья",
        };
        result += `<div class="pgn-info"><span class="pgn-label">Результат:</span> ${
            resultMap[game.result] || game.result
        }</div>`;
    }
    if (parsed.eco && parsed.opening)
        result += `<div class="pgn-info"><span class="pgn-label">Дебют:</span> ${parsed.eco} - ${parsed.opening}</div>`;
    if (game.timeControl)
        result += `<div class="pgn-info"><span class="pgn-label">Контроль времени:</span> ${game.timeControl}</div>`;

    result += "</div>";

    if (parsed.moves) {
        result += '<div class="pgn-moves-container">';
        result += `<div class="moves">${parsed.moves}</div>`;
        result += "</div>";
    }

    return result;
};
