// utils/pgnUtils.ts
export interface PgnInfo {
    event?: string;
    site?: string;
    date?: string;
    round?: string;
    white?: string;
    black?: string;
    result?: string;
    whiteElo?: string;
    blackElo?: string;
    timeControl?: string;
    termination?: string;
    moves?: string;
    eco?: string;
    opening?: string;
}

export interface MoveAnalysis {
    move: string;
    eval?: number;
    clock?: string;
    isBlack?: boolean;
    moveNumber?: number;
}

export const parsePgn = (pgn: string): PgnInfo => {
    const info: PgnInfo = {};
    const lines = pgn.split("\n");

    for (const line of lines) {
        const tagMatch = line.match(/^\[(\w+)\s+"([^"]+)"\]$/);
        if (tagMatch) {
            const [, tag, value] = tagMatch;
            const lowerTag = tag.toLowerCase();
            info[lowerTag as keyof PgnInfo] = value;
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

const parseEval = (evalStr: string): number | undefined => {
    const match = evalStr.match(/\[%eval\s+([-+]?\d*\.?\d+)/);
    if (match && match[1]) {
        const value = parseFloat(match[1]);
        return isNaN(value) ? undefined : value;
    }
    return undefined;
};

const parseClock = (clockStr: string): string | undefined => {
    const match = clockStr.match(/\[%clk\s+([\d:]+)/);
    return match ? match[1] : undefined;
};

const formatEval = (evalValue?: number): string => {
    if (evalValue === undefined) return "";

    if (Math.abs(evalValue) > 10) {
        const moves = Math.abs(evalValue);
        return evalValue > 0
            ? `M${Math.floor(moves)}`
            : `-M${Math.floor(moves)}`;
    }

    const sign = evalValue > 0 ? "+" : "";
    return `${sign}${evalValue.toFixed(2)}`;
};

// Функция для получения класса CSS для оценки
const getEvalClass = (evalValue?: number): string => {
    if (evalValue === undefined) return "eval-neutral";

    // Положительная оценка - в пользу белых (светлый фон)
    if (evalValue > 2) return "eval-white-very-good";
    if (evalValue > 0.5) return "eval-white-good";
    if (evalValue > 0.1) return "eval-white-slightly-good";

    // Отрицательная оценка - в пользу черных (темный фон)
    if (evalValue < -2) return "eval-black-very-good";
    if (evalValue < -0.5) return "eval-black-good";
    if (evalValue < -0.1) return "eval-black-slightly-good";

    return "eval-neutral";
};

export const parseMovesWithAnalysis = (movesText: string): MoveAnalysis[] => {
    const moves: MoveAnalysis[] = [];

    // Регулярное выражение для поиска ходов с анализом
    const moveRegex = /(\d+\.\s*)?(\.{3})?\s*([^{}]+?)\s*({[^}]*})/g;

    let match;
    let moveNumber = 1;

    while ((match = moveRegex.exec(movesText)) !== null) {
        const [fullMatch, numberPart, blackDots, move, analysis] = match;

        const isBlack = !!blackDots;
        const cleanMove = move.trim();

        // Парсим анализ
        const evalMatch = analysis.match(/\[%eval\s+([-+]?\d*\.?\d+)/);
        const clockMatch = analysis.match(/\[%clk\s+([\d:]+)/);

        const evalValue = evalMatch ? parseEval(evalMatch[0]) : undefined;
        const clockTime = clockMatch ? parseClock(clockMatch[0]) : undefined;

        // Определяем номер хода
        let currentMoveNumber = moveNumber;
        if (numberPart) {
            const numMatch = numberPart.match(/(\d+)\./);
            if (numMatch) {
                currentMoveNumber = parseInt(numMatch[1], 10);
            }
        }

        moves.push({
            move: cleanMove,
            eval: evalValue,
            clock: clockTime,
            isBlack,
            moveNumber: currentMoveNumber,
        });

        // Увеличиваем номер хода после хода черных
        if (isBlack) {
            moveNumber++;
        }
    }

    return moves;
};

export const formatMovesBeautifully = (
    moves: MoveAnalysis[],
    maxMoves: number = 300
): string => {
    let result = "";
    let currentMoveNumber = 0;

    for (let i = 0; i < Math.min(moves.length, maxMoves * 2); i++) {
        const move = moves[i];

        if (!move.isBlack && move.moveNumber !== currentMoveNumber) {
            // Новый номер хода - начинаем новую строку
            if (result) result += "\n";
            result += `<span class="move-number">${move.moveNumber}.</span> `;
            currentMoveNumber = move.moveNumber || 0;
        }

        // Добавляем ход
        result += `<span class="move">${move.move}</span>`;

        // Добавляем анализ в скобках
        const analysisParts = [];
        if (move.eval !== undefined) {
            analysisParts.push(
                `<span class="eval ${getEvalClass(move.eval)}">${formatEval(
                    move.eval
                )}</span>`
            );
        }
        if (move.clock) {
            analysisParts.push(`<span class="clock">${move.clock}</span>`);
        }

        if (analysisParts.length > 0) {
            result += ` <span class="analysis">(${analysisParts.join(
                " "
            )})</span>`;
        }

        result += " ";
    }

    if (moves.length > maxMoves * 2) {
        result += `<div class="more-moves">... и еще ${
            moves.length - maxMoves * 2
        } ходов</div>`;
    }

    return result;
};

export const formatPgnForDisplay = (
    pgn: string,
    maxMoves: number = 300
): string => {
    const parsed = parsePgn(pgn);
    let result = "";

    // Мета-информация
    result += '<div class="pgn-header">';

    if (parsed.event)
        result += `<div class="pgn-info"><span class="pgn-label">Событие:</span> ${parsed.event}</div>`;
    if (parsed.date)
        result += `<div class="pgn-info"><span class="pgn-label">Дата:</span> ${parsed.date}</div>`;
    if (parsed.white)
        result += `<div class="pgn-info"><span class="pgn-label">Белые:</span> ${parsed.white}</div>`;
    if (parsed.black)
        result += `<div class="pgn-info"><span class="pgn-label">Черные:</span> ${parsed.black}</div>`;
    if (parsed.result) {
        const resultMap: { [key: string]: string } = {
            "1-0": "Победа белых",
            "0-1": "Победа черных",
            "1/2-1/2": "Ничья",
            "*": "Не завершена",
        };
        result += `<div class="pgn-info"><span class="pgn-label">Результат:</span> ${
            resultMap[parsed.result] || parsed.result
        }</div>`;
    }
    if (parsed.eco && parsed.opening)
        result += `<div class="pgn-info"><span class="pgn-label">Дебют:</span> ${parsed.eco} - ${parsed.opening}</div>`;
    if (parsed.timeControl)
        result += `<div class="pgn-info"><span class="pgn-label">Контроль времени:</span> ${parsed.timeControl}</div>`;

    result += "</div>";

    // Ходы с анализом
    if (parsed.moves) {
        result += '<div class="pgn-moves-container">';

        try {
            const movesWithAnalysis = parseMovesWithAnalysis(parsed.moves);
            const formattedMoves = formatMovesBeautifully(
                movesWithAnalysis,
                maxMoves
            );
            result += formattedMoves;
        } catch (error) {
            console.error("Error parsing moves:", error);
            // Fallback
            let moves = parsed.moves;
            const moveParts = moves.split(" ");
            if (moveParts.length > maxMoves * 2) {
                moves = moveParts.slice(0, maxMoves * 2).join(" ") + "...";
            }
            result += `<div>Ходы: ${moves}</div>`;
        }

        result += "</div>";
    }

    return result;
};

export const formatPgnCompact = (
    pgn: string,
    maxMoves: number = 300
): string => {
    const parsed = parsePgn(pgn);
    let result = "";

    // Основная информация
    if (parsed.white && parsed.black) {
        result += `<div class="compact-header"><strong>${parsed.white} - ${parsed.black}</strong></div>`;
    }
    if (parsed.result) {
        result += `<div class="compact-info">Результат: ${parsed.result}</div>`;
    }
    if (parsed.eco && parsed.opening) {
        result += `<div class="compact-info">Дебют: ${parsed.eco} ${parsed.opening}</div>`;
    }

    // Ходы
    if (parsed.moves) {
        result += '<div class="compact-moves">';
        try {
            const movesWithAnalysis = parseMovesWithAnalysis(parsed.moves);
            const limitedMoves = movesWithAnalysis.slice(0, maxMoves * 2);

            let currentNumber = 0;
            for (const move of limitedMoves) {
                if (!move.isBlack && move.moveNumber !== currentNumber) {
                    result += `<span class="compact-move-number">${move.moveNumber}.</span> `;
                    currentNumber = move.moveNumber || 0;
                }

                result += `<span class="compact-move">${move.move}</span>`;

                if (move.eval !== undefined) {
                    result += `(<span class="eval ${getEvalClass(
                        move.eval
                    )}">${formatEval(move.eval)}</span>)`;
                }
                if (move.clock) {
                    result += `[${move.clock}]`;
                }

                result += " ";
            }

            if (movesWithAnalysis.length > maxMoves * 2) {
                result += "...";
            }
        } catch (error) {
            let moves = parsed.moves;
            const moveParts = moves.split(" ");
            if (moveParts.length > maxMoves * 2) {
                moves = moveParts.slice(0, maxMoves * 2).join(" ") + "...";
            }
            result += moves;
        }
        result += "</div>";
    }

    return result;
};
