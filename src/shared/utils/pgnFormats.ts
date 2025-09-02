// utils/pgnFormats.ts

import { PgnOptions } from "@shared/hooks/useLichessGames/useLichessGames";

export type PgnFormat =
    | "basic"
    | "with-evals"
    | "with-analysis"
    | "moves-only"
    | "literate"
    | "tournament"
    | "minimal";

export const getPgnOptions = (format: PgnFormat): PgnOptions => {
    const options: { [key in PgnFormat]: PgnOptions } = {
        basic: {
            moves: true,
            tags: true,
            clocks: true,
            evals: false,
            accuracy: false,
            opening: false,
            literate: false,
        },
        "with-evals": {
            moves: true,
            tags: true,
            clocks: true,
            evals: true,
            accuracy: false,
            opening: false,
            literate: false,
        },
        "with-analysis": {
            moves: true,
            tags: true,
            clocks: true,
            evals: true,
            accuracy: true,
            opening: true,
            literate: false,
        },
        "moves-only": {
            moves: true,
            tags: false,
            clocks: false,
            evals: false,
            accuracy: false,
            opening: false,
            literate: false,
        },
        literate: {
            moves: true,
            tags: true,
            clocks: true,
            evals: true,
            accuracy: true,
            opening: true,
            literate: true,
        },
        tournament: {
            moves: true,
            tags: true,
            clocks: true,
            evals: false,
            accuracy: false,
            opening: true,
            literate: false,
        },
        minimal: {
            moves: true,
            tags: false,
            clocks: false,
            evals: false,
            accuracy: false,
            opening: false,
            literate: false,
        },
    };

    return options[format];
};

export const formatDescription: { [key in PgnFormat]: string } = {
    basic: "Стандартный PGN с тегами и ходами",
    "with-evals": "PGN с компьютерными оценками позиций",
    "with-analysis": "Полный анализ с точностью и дебютом",
    "moves-only": "Только ходы без мета-информации",
    literate: "С литературными комментариями",
    tournament: "Для турниров с информацией о дебюте",
    minimal: "Минимальный вариант (только ходы)",
};
