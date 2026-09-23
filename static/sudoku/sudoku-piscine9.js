/* sudoku-piscine9.js */

document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const inputText = document.getElementById('sudoku-input-text');
    const boardContainer = document.getElementById('sudoku-board');
    const codeDisplay = document.getElementById('code-display');
    const varsContainer = document.getElementById('variables-container');
    const algoSelect = document.getElementById('algorithm-select');
    const headerEl = document.querySelector('.sudoku-header');
    const mainContainerEl = document.querySelector('.sudoku-viz-container');

    const btnStart = document.getElementById('btn-start');
    const btnReset = document.getElementById('btn-reset');
    const btnBack = document.getElementById('btn-back');
    const btnPlayPause = document.getElementById('btn-play-pause');
    const btnNext = document.getElementById('btn-next');
    const btnEmpty = document.getElementById('btn-empty');
    const btnRandom = document.getElementById('btn-random');
    const speedSlider = document.getElementById('speed-slider');

    let cells = [];
    let initialBoard = Array(9).fill(0).map(() => Array(9).fill(0));

    // State machine
    let isLocked = false;
    let isPlaying = false;
    let isReviewMode = false;
    let playInterval = null;
    let steps = [];
    let currentStepIdx = -1;

    // Predefined Sudokus for Random button
    const PREDEFINED_SUDOKUS = [
        '"1.58.2..." ".9..764.5" "2..4..819" ".19..73.6" "762.83.9." "....61.5." "..76...3." "43..2.5.1" "6..3.89.."',
        '"..5.3..81" "9.285..6." "6....4.5." "..74.283." "34976...5" "..83..49." "15..87..2" ".9....6.." ".26.495.3"',
        '"34.91..2." ".96.8..41" "..8.2..7." ".6..57.39" "1.2.6.7.." "97..3..64" "45.2.8..6" ".8..9..5." "6.3..189."',
        '"..73..4.5" "....2.9.." "253.6487." ".9.74.36." "....3..8." "8362.9.47" "1..8.26.3" "6......18" ".8261...4"',
        '"935..7..8" "...3.8.7." "6..5..49." ".73..4..." "4..175.8." ".618..247" ".187....." "..6.8.75." "75.4.3862"',
        '"..5.2...1" ".8735..46" "4...6.5.." ".5.9....." ".7..3541." "69314.857" "7415..6.8" "...284..5" "5.....3.4"',
        '"..75...3." "8..23...9" ".3479.86." "..3..4198" ".4815...3" "..6.23..7" "351.6.78." "4..31...6" ".7...5..2"',
        '"53..7...." "6..195..." ".98....6." "8...6...3" "4..8.3..1" "7...2...6" ".6....28." "...419..5" "....8..79"',
        '".58..4.21" ".6.853..7" ".39.2...5" "8....1..6" "..37..21." "1.6.825.." "67.2..18." "9..4...5." ".8.9167.2"',
        '"71.4.9..2" ".8.5....." "9...3..1." "839..21.4" "..7.4.2.." "4.13..795" ".5..7...8" ".....5.3." "6..1.3.47"'
    ];
    let currentRandomIdx = 0;

    // --- ALGORITHMS DATA & GENERATORS ---

    const ALGORITHMS = {
        'agalanaki': {
            code: `var count int
var grid [9][9]byte
var solution [9][9]byte

func solve(pos int) {
	if count >= <span contenteditable="true" class="editable-count">2</span> {
		return
	}
	if pos == 81 {
		count++
		if count == 1 {
			solution = grid
		}
		return
	}
	r, c := pos/9, pos%9
	if grid[r][c] != 0 {
		solve(pos + 1)
		return
	}
	for v := byte(1); v <= 9; v++ {
		if <span class="preview-link" data-target="agalanaki_valid">canPlace</span>(r, c, v) {
			grid[r][c] = v
			solve(pos + 1)
			grid[r][c] = 0 // backtrack
			if count >= <span contenteditable="true" class="editable-count">2</span> {
				return
			}
		}
	}
}`,
            generator: function* (boardStart) {
                let grid = JSON.parse(JSON.stringify(boardStart));
                let count = 0;
                let targetCount = getTargetSolutions();

                function canPlace(r, c, v) {
                    for (let i = 0; i < 9; i++) {
                        if (grid[r][i] === v) return false;
                        if (grid[i][c] === v) return false;
                        let br = Math.floor(r / 3) * 3 + Math.floor(i / 3);
                        let bc = Math.floor(c / 3) * 3 + i % 3;
                        if (grid[br][bc] === v) return false;
                    }
                    return true;
                }

                function* solve(pos) {
                    yield { line: 5, vars: { pos, count }, activeCell: null, grid };
                    yield { line: 6, vars: { pos, count }, activeCell: null, grid };
                    if (count >= targetCount) {
                        yield { line: 7, vars: { pos, count }, activeCell: null, grid };
                        return;
                    }
                    yield { line: 9, vars: { pos, count }, activeCell: null, grid };
                    if (pos === 81) {
                        count++;
                        yield { line: 10, vars: { pos, count }, activeCell: null, grid };
                        yield { line: 11, vars: { pos, count }, activeCell: null, grid };
                        if (count === 1) {
                            yield { line: 12, vars: { pos, count }, activeCell: null, grid, isSolution: true };
                        }
                        yield { line: 14, vars: { pos, count }, activeCell: null, grid };
                        return;
                    }

                    let r = Math.floor(pos / 9);
                    let c = pos % 9;
                    yield { line: 16, vars: { pos, r, c, count }, activeCell: [r, c], grid };

                    yield { line: 17, vars: { pos, r, c, count }, activeCell: [r, c], grid };
                    if (grid[r][c] !== 0) {
                        yield { line: 18, vars: { pos, r, c, count }, activeCell: [r, c], grid };
                        yield* solve(pos + 1);
                        yield { line: 19, vars: { pos, r, c, count }, activeCell: [r, c], grid };
                        return;
                    }

                    for (let v = 1; v <= 9; v++) {
                        yield { line: 21, vars: { pos, r, c, v, count }, activeCell: [r, c], testingValue: v, grid };
                        yield { line: 22, vars: { pos, r, c, v, count }, activeCell: [r, c], testingValue: v, grid };
                        if (canPlace(r, c, v)) {
                            grid[r][c] = v;
                            yield { line: 23, vars: { pos, r, c, v, count }, activeCell: [r, c], grid };
                            yield { line: 24, vars: { pos, r, c, v, count }, activeCell: [r, c], grid };
                            yield* solve(pos + 1);
                            grid[r][c] = 0;
                            yield { line: 25, vars: { pos, r, c, v, count }, activeCell: [r, c], grid };
                            yield { line: 26, vars: { pos, r, c, v, count }, activeCell: [r, c], grid };
                            if (count >= targetCount) {
                                yield { line: 27, vars: { pos, r, c, v, count }, activeCell: [r, c], grid };
                                return;
                            }
                        }
                    }
                    yield { line: 31, vars: { pos, count }, activeCell: null, grid };
                }
                yield* solve(0);
            }
        },
        'avrabac': {
            code: `var sudoku [9][9]int

func solve() bool {
	for row := 0; row < 9; row++ {
		for col := 0; col < 9; col++ {
			if sudoku[row][col] == 0 {
				for num := 1; num <= 9; num++ {
					if <span class="preview-link" data-target="avrabac_valid">isValidMove</span>(row, col, num) {
						sudoku[row][col] = num
						if solve() {
							return true
						}
						sudoku[row][col] = 0
					}
				}
				return false
			}
		}
	}
	return true
}`,
            generator: function* (boardStart) {
                let sudoku = JSON.parse(JSON.stringify(boardStart));

                function isValidMove(r, c, v) {
                    for (let i = 0; i < 9; i++) {
                        if (sudoku[r][i] === v) return false;
                        if (sudoku[i][c] === v) return false;
                        let br = Math.floor(r / 3) * 3 + Math.floor(i / 3);
                        let bc = Math.floor(c / 3) * 3 + i % 3;
                        if (sudoku[br][bc] === v) return false;
                    }
                    return true;
                }

                function* solve() {
                    yield { line: 3, vars: {}, activeCell: null, grid: sudoku };
                    for (let row = 0; row < 9; row++) {
                        yield { line: 4, vars: { row }, activeCell: null, grid: sudoku };
                        for (let col = 0; col < 9; col++) {
                            yield { line: 5, vars: { row, col }, activeCell: [row, col], grid: sudoku };
                            yield { line: 6, vars: { row, col }, activeCell: [row, col], grid: sudoku };
                            if (sudoku[row][col] === 0) {
                                for (let num = 1; num <= 9; num++) {
                                    yield { line: 7, vars: { row, col, num }, activeCell: [row, col], testingValue: num, grid: sudoku };
                                    yield { line: 8, vars: { row, col, num }, activeCell: [row, col], testingValue: num, grid: sudoku };
                                    if (isValidMove(row, col, num)) {
                                        sudoku[row][col] = num;
                                        yield { line: 9, vars: { row, col, num }, activeCell: [row, col], grid: sudoku };
                                        yield { line: 10, vars: { row, col, num }, activeCell: [row, col], grid: sudoku };
                                        let res = yield* solve();
                                        if (res) {
                                            yield { line: 11, vars: { row, col, num }, activeCell: [row, col], grid: sudoku };
                                            return true;
                                        }
                                        sudoku[row][col] = 0;
                                        yield { line: 13, vars: { row, col, num }, activeCell: [row, col], grid: sudoku };
                                    }
                                }
                                yield { line: 16, vars: { row, col }, activeCell: [row, col], grid: sudoku };
                                return false;
                            }
                        }
                    }
                    yield { line: 20, vars: {}, activeCell: null, grid: sudoku };
                    return true;
                }
                yield* solve();
            }
        },
        'mrv': {
            code: `func solveMRV() bool {
	row, col := findMRVCell()
	if row == -1 {
		return true // No empty cells left
	}
	
	for num := 1; num <= 9; num++ {
		if isValid(row, col, num) {
			board[row][col] = num
			if solveMRV() {
				return true
			}
			board[row][col] = 0
		}
	}
	return false
}`,
            generator: function* (boardStart) {
                let board = JSON.parse(JSON.stringify(boardStart));

                function isValid(r, c, v) {
                    for (let i = 0; i < 9; i++) {
                        if (board[r][i] === v) return false;
                        if (board[i][c] === v) return false;
                        let br = Math.floor(r / 3) * 3 + Math.floor(i / 3);
                        let bc = Math.floor(c / 3) * 3 + i % 3;
                        if (board[br][bc] === v) return false;
                    }
                    return true;
                }

                function findMRVCell() {
                    let minCount = 10;
                    let bestR = -1;
                    let bestC = -1;
                    for (let r = 0; r < 9; r++) {
                        for (let c = 0; c < 9; c++) {
                            if (board[r][c] === 0) {
                                let count = 0;
                                for (let v = 1; v <= 9; v++) {
                                    if (isValid(r, c, v)) count++;
                                }
                                if (count < minCount) {
                                    minCount = count;
                                    bestR = r;
                                    bestC = c;
                                }
                            }
                        }
                    }
                    return [bestR, bestC];
                }

                function* solveMRV() {
                    yield { line: 1, vars: {}, activeCell: null, grid: board };
                    let [row, col] = findMRVCell();
                    yield { line: 2, vars: { row, col }, activeCell: row !== -1 ? [row, col] : null, grid: board };

                    yield { line: 3, vars: { row, col }, activeCell: row !== -1 ? [row, col] : null, grid: board };
                    if (row === -1) {
                        yield { line: 4, vars: { row, col }, activeCell: null, grid: board };
                        return true;
                    }

                    for (let num = 1; num <= 9; num++) {
                        yield { line: 7, vars: { row, col, num }, activeCell: [row, col], testingValue: num, grid: board };
                        yield { line: 8, vars: { row, col, num }, activeCell: [row, col], testingValue: num, grid: board };
                        if (isValid(row, col, num)) {
                            board[row][col] = num;
                            yield { line: 9, vars: { row, col, num }, activeCell: [row, col], grid: board };
                            yield { line: 10, vars: { row, col, num }, activeCell: [row, col], grid: board };
                            let res = yield* solveMRV();
                            if (res) {
                                yield { line: 11, vars: { row, col, num }, activeCell: [row, col], grid: board };
                                return true;
                            }
                            board[row][col] = 0;
                            yield { line: 13, vars: { row, col, num }, activeCell: [row, col], grid: board };
                        }
                    }
                    yield { line: 16, vars: { row, col }, activeCell: [row, col], grid: board };
                    return false;
                }
                yield* solveMRV();
            }
        },
        'gangelat': {
            code: `func Solve(pinakas [9][9]int) ([9][9]int, bool) {
	for i := 0; i < 9; i++ {
		for j := 0; j < 9; j++ {
			if pinakas[i][j] == 0 {
				for n := 1; n <= 9; n++ {
					if <span class="preview-link" data-target="gangelat_valid">canPlace</span>(pinakas, i, j, n) {
						pinakas[i][j] = n
						if lysh, ok := Solve(pinakas); ok {
							return lysh, true
						}
						pinakas[i][j] = 0
					}
				}
				return pinakas, false
			}
		}
	}
	return pinakas, true
}`,
            generator: function* (boardStart) {
                let pinakas = JSON.parse(JSON.stringify(boardStart));

                function canPlace(r, c, v) {
                    for (let i = 0; i < 9; i++) {
                        if (pinakas[r][i] === v) return false;
                        if (pinakas[i][c] === v) return false;
                        let br = Math.floor(r / 3) * 3 + Math.floor(i / 3);
                        let bc = Math.floor(c / 3) * 3 + i % 3;
                        if (pinakas[br][bc] === v) return false;
                    }
                    return true;
                }

                function* solve() {
                    yield { line: 1, vars: {}, activeCell: null, grid: pinakas };
                    for (let i = 0; i < 9; i++) {
                        yield { line: 2, vars: { i }, activeCell: null, grid: pinakas };
                        for (let j = 0; j < 9; j++) {
                            yield { line: 3, vars: { i, j }, activeCell: [i, j], grid: pinakas };
                            yield { line: 4, vars: { i, j }, activeCell: [i, j], grid: pinakas };
                            if (pinakas[i][j] === 0) {
                                for (let n = 1; n <= 9; n++) {
                                    yield { line: 5, vars: { i, j, n }, activeCell: [i, j], testingValue: n, grid: pinakas };
                                    yield { line: 6, vars: { i, j, n }, activeCell: [i, j], testingValue: n, grid: pinakas };
                                    if (canPlace(i, j, n)) {
                                        pinakas[i][j] = n;
                                        yield { line: 7, vars: { i, j, n }, activeCell: [i, j], grid: pinakas };
                                        yield { line: 8, vars: { i, j, n }, activeCell: [i, j], grid: pinakas };
                                        let res = yield* solve();
                                        if (res) {
                                            yield { line: 9, vars: { i, j, n }, activeCell: [i, j], grid: pinakas };
                                            return true;
                                        }
                                        pinakas[i][j] = 0;
                                        yield { line: 11, vars: { i, j, n }, activeCell: [i, j], grid: pinakas };
                                    }
                                }
                                yield { line: 14, vars: { i, j }, activeCell: [i, j], grid: pinakas };
                                return false;
                            }
                        }
                    }
                    yield { line: 18, vars: {}, activeCell: null, grid: pinakas };
                    return true;
                }
                yield* solve();
            }
        },
        'magora': {
            code: `func SolveSudoku(board *[9][9]int, solutions *int, solvedBoard *[9][9]int) {
	for row := 0; row < 9; row++ {
		for col := 0; col < 9; col++ {
			if board[row][col] == 0 {
				for num := 1; num <= 9; num++ {
					if <span class="preview-link" data-target="magora_valid">IsCorrect</span>(board, row, col, num) {
						board[row][col] = num
						SolveSudoku(board, solutions, solvedBoard)
						board[row][col] = 0
						if *solutions >= 2 {
							return
						}
					}
				}
				return
			}
		}
	}
	(*solutions)++
	if *solutions == 1 {
		*solvedBoard = *board
	}
}`,
            generator: function* (boardStart) {
                let board = JSON.parse(JSON.stringify(boardStart));
                let solutions = 0;

                function IsCorrect(r, c, v) {
                    for (let i = 0; i < 9; i++) {
                        if (board[r][i] === v) return false;
                        if (board[i][c] === v) return false;
                        let br = Math.floor(r / 3) * 3 + Math.floor(i / 3);
                        let bc = Math.floor(c / 3) * 3 + i % 3;
                        if (board[br][bc] === v) return false;
                    }
                    return true;
                }

                function* solve() {
                    yield { line: 1, vars: { solutions }, activeCell: null, grid: board };
                    for (let row = 0; row < 9; row++) {
                        yield { line: 2, vars: { solutions, row }, activeCell: null, grid: board };
                        for (let col = 0; col < 9; col++) {
                            yield { line: 3, vars: { solutions, row, col }, activeCell: [row, col], grid: board };
                            yield { line: 4, vars: { solutions, row, col }, activeCell: [row, col], grid: board };
                            if (board[row][col] === 0) {
                                for (let num = 1; num <= 9; num++) {
                                    yield { line: 5, vars: { solutions, row, col, num }, activeCell: [row, col], testingValue: num, grid: board };
                                    yield { line: 6, vars: { solutions, row, col, num }, activeCell: [row, col], testingValue: num, grid: board };
                                    if (IsCorrect(row, col, num)) {
                                        board[row][col] = num;
                                        yield { line: 7, vars: { solutions, row, col, num }, activeCell: [row, col], grid: board };
                                        yield { line: 8, vars: { solutions, row, col, num }, activeCell: [row, col], grid: board };
                                        yield* solve();
                                        board[row][col] = 0;
                                        yield { line: 9, vars: { solutions, row, col, num }, activeCell: [row, col], grid: board };
                                        yield { line: 10, vars: { solutions, row, col, num }, activeCell: [row, col], grid: board };
                                        if (solutions >= 2) {
                                            yield { line: 11, vars: { solutions, row, col, num }, activeCell: [row, col], grid: board };
                                            return;
                                        }
                                    }
                                }
                                yield { line: 15, vars: { solutions, row, col }, activeCell: [row, col], grid: board };
                                return;
                            }
                        }
                    }
                    solutions++;
                    yield { line: 20, vars: { solutions }, activeCell: null, grid: board };
                    yield { line: 21, vars: { solutions }, activeCell: null, grid: board };
                    if (solutions === 1) {
                        yield { line: 22, vars: { solutions }, activeCell: null, grid: board, isSolution: true };
                    }
                }
                yield* solve();
            }
        },
        'nisankou': {
            code: `func Solution(myBoard *Board) bool {
	for i := 0; i < 9; i++ {
		for j := 0; j < 9; j++ {
			if myBoard[i][j] == 0 {
				candidates := <span class="preview-link" data-target="nisankouCandidates">Canditates</span>(*myBoard, i, j)
				if len(candidates) == 0 {
					return false
				}
				for _, val := range candidates {
					myBoard[i][j] = val
					if Solution(myBoard) {
						return true
					}
					myBoard[i][j] = 0
				}
				return false
			}
		}
	}
	return true
}`,
            generator: function* (boardStart) {
                let myBoard = JSON.parse(JSON.stringify(boardStart));

                function Canditates(r, c) {
                    let cands = [];
                    for (let v = 1; v <= 9; v++) {
                        let ok = true;
                        for (let i = 0; i < 9; i++) {
                            if (myBoard[r][i] === v) ok = false;
                            if (myBoard[i][c] === v) ok = false;
                            let br = Math.floor(r / 3) * 3 + Math.floor(i / 3);
                            let bc = Math.floor(c / 3) * 3 + i % 3;
                            if (myBoard[br][bc] === v) ok = false;
                        }
                        if (ok) cands.push(v);
                    }
                    return cands;
                }

                function* solve() {
                    yield { line: 1, vars: {}, activeCell: null, grid: myBoard };
                    for (let i = 0; i < 9; i++) {
                        yield { line: 2, vars: { i }, activeCell: null, grid: myBoard };
                        for (let j = 0; j < 9; j++) {
                            yield { line: 3, vars: { i, j }, activeCell: [i, j], grid: myBoard };
                            yield { line: 4, vars: { i, j }, activeCell: [i, j], grid: myBoard };
                            if (myBoard[i][j] === 0) {
                                let candidates = Canditates(i, j);
                                yield { line: 5, vars: { i, j, candidates: `[${candidates.join(',')}]` }, activeCell: [i, j], grid: myBoard };
                                yield { line: 6, vars: { i, j, candidates: `[${candidates.join(',')}]` }, activeCell: [i, j], grid: myBoard };
                                if (candidates.length === 0) {
                                    yield { line: 7, vars: { i, j }, activeCell: [i, j], grid: myBoard };
                                    return false;
                                }
                                for (let idx = 0; idx < candidates.length; idx++) {
                                    let val = candidates[idx];
                                    yield { line: 9, vars: { i, j, val }, activeCell: [i, j], testingValue: val, grid: myBoard };
                                    myBoard[i][j] = val;
                                    yield { line: 10, vars: { i, j, val }, activeCell: [i, j], grid: myBoard };
                                    yield { line: 11, vars: { i, j, val }, activeCell: [i, j], grid: myBoard };
                                    let res = yield* solve();
                                    if (res) {
                                        yield { line: 12, vars: { i, j, val }, activeCell: [i, j], grid: myBoard };
                                        return true;
                                    }
                                    myBoard[i][j] = 0;
                                    yield { line: 14, vars: { i, j, val }, activeCell: [i, j], grid: myBoard };
                                }
                                yield { line: 16, vars: { i, j }, activeCell: [i, j], grid: myBoard };
                                return false;
                            }
                        }
                    }
                    yield { line: 20, vars: {}, activeCell: null, grid: myBoard };
                    return true;
                }
                yield* solve();
            }
        },
        'pgouliam': {
            code: `func SolveSudoku(board [][]rune) bool {
	for row := 0; row < 9; row++ {
		for col := 0; col < 9; col++ {
			if board[row][col] == '.' {
				for guess := '1'; guess <= '9'; guess++ {
					if <span class="preview-link" data-target="pgouliam_valid">isValid</span>(board, row, col, guess) {
						board[row][col] = guess
						if SolveSudoku(board) {
							return true
						}
						board[row][col] = '.'
					}
				}
				return false
			}
		}
	}
	return true
}`,
            generator: function* (boardStart) {
                let board = JSON.parse(JSON.stringify(boardStart));

                function isValid(r, c, v) {
                    for (let i = 0; i < 9; i++) {
                        if (board[r][i] === v) return false;
                        if (board[i][c] === v) return false;
                        let br = Math.floor(r / 3) * 3 + Math.floor(i / 3);
                        let bc = Math.floor(c / 3) * 3 + i % 3;
                        if (board[br][bc] === v) return false;
                    }
                    return true;
                }

                function* solve() {
                    yield { line: 1, vars: {}, activeCell: null, grid: board };
                    for (let row = 0; row < 9; row++) {
                        yield { line: 2, vars: { row }, activeCell: null, grid: board };
                        for (let col = 0; col < 9; col++) {
                            yield { line: 3, vars: { row, col }, activeCell: [row, col], grid: board };
                            yield { line: 4, vars: { row, col }, activeCell: [row, col], grid: board };
                            if (board[row][col] === 0) {
                                for (let guess = 1; guess <= 9; guess++) {
                                    yield { line: 5, vars: { row, col, guess }, activeCell: [row, col], testingValue: guess, grid: board };
                                    yield { line: 6, vars: { row, col, guess }, activeCell: [row, col], testingValue: guess, grid: board };
                                    if (isValid(row, col, guess)) {
                                        board[row][col] = guess;
                                        yield { line: 7, vars: { row, col, guess }, activeCell: [row, col], grid: board };
                                        yield { line: 8, vars: { row, col, guess }, activeCell: [row, col], grid: board };
                                        let res = yield* solve();
                                        if (res) {
                                            yield { line: 9, vars: { row, col, guess }, activeCell: [row, col], grid: board };
                                            return true;
                                        }
                                        board[row][col] = 0;
                                        yield { line: 11, vars: { row, col, guess }, activeCell: [row, col], grid: board };
                                    }
                                }
                                yield { line: 14, vars: { row, col }, activeCell: [row, col], grid: board };
                                return false;
                            }
                        }
                    }
                    yield { line: 18, vars: {}, activeCell: null, grid: board };
                    return true;
                }
                yield* solve();
            }
        },
        'mrv': {
            code: `func SolveSudoku(board *[9][9]int, solutions *int, solvedBoard *[9][9]int) {
	r, c := <span class="preview-link" data-target="mrvFindMRVCell">findMRVCell</span>(board)
	if r == -1 {
		*solutions++
		if *solutions == 1 {
			*solvedBoard = *board
		}
		return
	}
	
	for val := 1; val <= 9; val++ {
		if isValid(board, r, c, val) {
			board[r][c] = val
			
			SolveSudoku(board, solutions, solvedBoard)
			
			board[r][c] = 0
			if *solutions >= <span contenteditable="true" class="editable-count">2</span> {
				return
			}
		}
	}
}`,
            mrvCode: `func findMRVCell(board *[9][9]int) (int, int) {
	minCands := 10
	bestR, bestC := -1, -1
	for r := 0; r < 9; r++ {
		for c := 0; c < 9; c++ {
			if board[r][c] == 0 {
				cands := <span class="preview-link" data-target="mrvCountCandidates">countCandidates</span>(board, r, c)
				if cands < minCands {
					minCands = cands
					bestR, bestC = r, c
				}
			}
		}
	}
	return bestR, bestC
}`,
            generator: function* (boardStart) {
                let board = JSON.parse(JSON.stringify(boardStart));
                let targetCount = getTargetSolutions();

                function isValid(r, c, v) {
                    for (let i = 0; i < 9; i++) {
                        if (board[r][i] === v) return false;
                        if (board[i][c] === v) return false;
                        let br = Math.floor(r / 3) * 3 + Math.floor(i / 3);
                        let bc = Math.floor(c / 3) * 3 + i % 3;
                        if (board[br][bc] === v) return false;
                    }
                    return true;
                }

                function getCandidates(r, c) {
                    let cands = [];
                    for (let v = 1; v <= 9; v++) if (isValid(r, c, v)) cands.push(v);
                    return cands;
                }

                function findBest() {
                    let min = 10;
                    let br = -1, bc = -1, bcands = [];
                    for (let r = 0; r < 9; r++) {
                        for (let c = 0; c < 9; c++) {
                            if (board[r][c] === 0) {
                                let cands = getCandidates(r, c);
                                if (cands.length < min) {
                                    min = cands.length;
                                    br = r; bc = c; bcands = cands;
                                }
                            }
                        }
                    }
                    return [br, bc, bcands];
                }

                let solutions = 0;

                function* solve() {
                    let [r, c, cands] = findBest();
                    yield { line: 2, vars: { solutions }, activeCell: r !== -1 ? [r, c] : null, grid: board };

                    if (r === -1) {
                        solutions++;
                        yield { line: 4, vars: { solutions }, activeCell: null, grid: board };
                        if (solutions === 1) {
                            yield { line: 5, vars: { solutions }, activeCell: null, grid: board, isSolution: true };
                        }
                        return;
                    }

                    for (let val of cands) {
                        yield { line: 11, vars: { solutions, val }, activeCell: [r, c], testingValue: val, grid: board };

                        yield { line: 12, vars: { solutions, val }, activeCell: [r, c], testingValue: val, grid: board };
                        board[r][c] = val;
                        yield { line: 13, vars: { solutions, val }, activeCell: [r, c], grid: board };

                        yield { line: 15, vars: { solutions, val }, activeCell: [r, c], grid: board };
                        yield* solve();

                        board[r][c] = 0;
                        yield { line: 17, vars: { solutions, val }, activeCell: [r, c], grid: board };

                        if (solutions >= targetCount) {
                            yield { line: 18, vars: { solutions, val }, activeCell: [r, c], grid: board };
                            return;
                        }
                    }

                    yield { line: 22, vars: { solutions }, activeCell: [r, c], grid: board };
                }
                yield* solve();
            }
        },
        'dlx': {
            code: `// <span class="preview-link" data-target="dlxStruct">View Node Struct</span>
func solveDLX(solutions *int, solvedBoard *[9][9]int) {
	node := chooseColumn()
	if node == nil {
		*solutions++
		if *solutions == 1 {
			saveSolution(solvedBoard)
		}
		return
	}
	<span class="preview-link" data-target="dlxCoverUncover">cover</span>(node)
	
	for r := node.down; r != node; r = r.down {
		<span class="preview-link" data-target="dlxAddRemove">addToSolution</span>(r)
		
		for j := r.right; j != r; j = j.right {
			cover(j.column)
		}
		
		solveDLX(solutions, solvedBoard)
		
		removeFromSolution(r)
		for j := r.left; j != r; j = j.left {
			uncover(j.column)
		}
		
		if *solutions >= <span contenteditable="true" class="editable-count">2</span> {
			break
		}
	}
	
	uncover(node)
}`,
            generator: function* (boardStart) {
                // To visualize DLX without a massive 729x324 matrix in JS,
                // we'll use a very optimized backtracking with exact cover simulation.
                // We'll yield board states much faster.
                let board = JSON.parse(JSON.stringify(boardStart));
                let targetCount = getTargetSolutions();

                // We'll just yield the fast decisions.
                function isValid(r, c, v) {
                    for (let i = 0; i < 9; i++) {
                        if (board[r][i] === v) return false;
                        if (board[i][c] === v) return false;
                        let br = Math.floor(r / 3) * 3 + Math.floor(i / 3);
                        let bc = Math.floor(c / 3) * 3 + i % 3;
                        if (board[br][bc] === v) return false;
                    }
                    return true;
                }

                function getCandidates(r, c) {
                    let cands = [];
                    for (let v = 1; v <= 9; v++) if (isValid(r, c, v)) cands.push(v);
                    return cands;
                }

                function findBest() {
                    let min = 10;
                    let br = -1, bc = -1, bcands = [];
                    for (let r = 0; r < 9; r++) {
                        for (let c = 0; c < 9; c++) {
                            if (board[r][c] === 0) {
                                let cands = getCandidates(r, c);
                                if (cands.length < min) {
                                    min = cands.length;
                                    br = r; bc = c; bcands = cands;
                                }
                            }
                        }
                    }
                    return [br, bc, bcands];
                }

                let solutions = 0;

                function* solve() {
                    let [r, c, cands] = findBest();
                    yield { line: 5, vars: { solutions }, activeCell: r !== -1 ? [r, c] : null, grid: board };

                    if (r === -1) {
                        solutions++;
                        yield { line: 7, vars: { solutions }, activeCell: null, grid: board };
                        if (solutions === 1) {
                            yield { line: 8, vars: { solutions }, activeCell: null, grid: board, isSolution: true };
                        }
                        return;
                    }

                    yield { line: 9, vars: { solutions }, activeCell: [r, c], grid: board };

                    for (let val of cands) {
                        yield { line: 11, vars: { solutions, val }, activeCell: [r, c], testingValue: val, grid: board };
                        board[r][c] = val;
                        yield { line: 13, vars: { solutions, val }, activeCell: [r, c], grid: board };

                        yield { line: 15, vars: { solutions, val }, activeCell: [r, c], grid: board };

                        yield { line: 19, vars: { solutions, val }, activeCell: [r, c], grid: board };
                        yield* solve();

                        yield { line: 24, vars: { solutions, val }, activeCell: [r, c], grid: board };
                        board[r][c] = 0;
                        yield { line: 25, vars: { solutions, val }, activeCell: [r, c], grid: board };

                        if (solutions >= targetCount) {
                            yield { line: 27, vars: { solutions, val }, activeCell: [r, c], grid: board };
                            break;
                        }
                    }

                    yield { line: 31, vars: { solutions }, activeCell: [r, c], grid: board };
                }
                yield* solve();
            }
        }
    };

    // --- DOM INITIALIZATION ---

    function createBoard() {
        boardContainer.innerHTML = '';
        cells = [];
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const cell = document.createElement('div');
                cell.classList.add('vz-grid-cell');
                cell.dataset.r = r;
                cell.dataset.c = c;

                // Allow user input when not locked
                cell.addEventListener('click', (e) => {
                    if (isLocked) return;
                    e.stopPropagation(); // Prevent document click from closing it immediately
                    if (activeInputCell) {
                        clearInputMode();
                    }
                    activeInputCell = { r, c, cell };
                    cell.classList.add('waiting-input');
                    document.body.classList.add('dim-overlay-active');
                });

                boardContainer.appendChild(cell);
                cells.push(cell);
            }
        }
    }

    function decodeEntities(html) {
        var txt = document.createElement("textarea");
        txt.innerHTML = html;
        return txt.value;
    }

    function syntaxHighlightGoHTML(htmlLine) {
        if (htmlLine.includes('class="preview-link back-link"')) {
            return htmlLine; // Do not apply syntax highlighting to the back link, it breaks the HTML
        }

        let commentPart = '';
        let codePart = htmlLine;
        
        const commentIdx = htmlLine.indexOf('//');
        // Avoid coloring '//' inside HTML attributes like http://
        if (commentIdx !== -1 && !htmlLine.includes('http://') && !htmlLine.includes('https://')) {
            codePart = htmlLine.substring(0, commentIdx);
            commentPart = htmlLine.substring(commentIdx);
        }

        const temp = document.createElement('div');
        temp.innerHTML = codePart;
        
        function highlightText(text) {
            let highlighted = text;
            // Strings
            highlighted = highlighted.replace(/("[^"]*")/g, '<span style="color: #ce9178;">$1</span>');
            // Keywords
            highlighted = highlighted.replace(/\b(func|var|const|type|struct|package|import|if|else|return|for|range|break|continue)\b/g, '<span style="color: #c586c0;">$1</span>');
            // Types and builtins
            highlighted = highlighted.replace(/\b(int|string|bool|byte|rune|true|false|make|len|append|nil)\b/g, '<span style="color: #4ec9b0;">$1</span>');
            // Function calls
            highlighted = highlighted.replace(/\b([a-zA-Z_]\w*)(?=\s*\()/g, (match, p1) => {
                const recursiveFuncs = ['solve', 'solveMRV', 'Solve', 'SolveSudoku', 'Solution', 'solveDLX'];
                if (recursiveFuncs.includes(p1)) {
                    return `<span style="color: #dc143c; font-weight: bold;">${p1}</span>`;
                }
                return `<span style="color: #dcdcaa;">${p1}</span>`;
            });
            // Numbers
            highlighted = highlighted.replace(/\b(\d+)\b/g, '<span style="color: #b5cea8;">$1</span>');
            return highlighted;
        }

        let out = '';
        temp.childNodes.forEach(node => {
            if (node.nodeType === 1) { 
                let attrs = Array.from(node.attributes).map(a => `${a.name}="${a.value}"`).join(' ');
                let tagName = node.tagName.toLowerCase();
                let highlightedInner = highlightText(node.textContent);
                // If it's the link, we can enforce function color or keep it
                out += `<${tagName} ${attrs}>${highlightedInner}</${tagName}>`;
            } else { 
                out += highlightText(node.textContent || '');
            }
        });
        
        if (commentPart) {
            out += `<span style="color: #6a9955;">${commentPart}</span>`;
        }
        
        return out;
    }

    function renderCode(codeString) {
        const lines = codeString.split('\n');
        codeDisplay.innerHTML = lines.map((line, idx) => {
            let processedLine = line || ' ';
            processedLine = syntaxHighlightGoHTML(processedLine);
            return `<span class="code-line" id="code-line-${idx + 1}">${processedLine}</span>`;
        }).join('');
    }

    // --- DATA SYNCING ---

    function getTargetSolutions() {
        const el = document.querySelector('.editable-count');
        if (!el) return 2;
        let val = parseInt(el.innerText);
        if (isNaN(val) || val < 1) return 1;
        if (val > 50) return 50;
        return val;
    }

    function parseInputText(text) {
        let newBoard = Array(9).fill(0).map(() => Array(9).fill(0));
        let validChars = text.replace(/[^0-9.]/g, ''); // Extract all valid puzzle characters (digits and dots)

        if (validChars.length === 81) {
            // Direct 81 chars format (dots, zeroes, numbers), even if missing quotes
            for (let i = 0; i < 81; i++) {
                let char = validChars[i];
                if (char >= '1' && char <= '9') {
                    newBoard[Math.floor(i / 9)][i % 9] = parseInt(char);
                }
            }
            return newBoard;
        }

        // Expected format: ".96.4...1" "1...6...4"
        const regex = /"([^"]+)"/g;
        let match;
        let r = 0;
        while ((match = regex.exec(text)) !== null && r < 9) {
            const rowStr = match[1];
            for (let c = 0; c < 9 && c < rowStr.length; c++) {
                if (rowStr[c] >= '1' && rowStr[c] <= '9') {
                    newBoard[r][c] = parseInt(rowStr[c]);
                }
            }
            r++;
        }
        return newBoard;
    }

    let reformatTimeout = null;

    function updateBoardFromInput() {
        if (isLocked) return;
        const text = inputText.value;
        if (!text.trim()) return;

        let validChars = text.replace(/[^0-9.]/g, '');
        let is81 = (validChars.length === 81);

        initialBoard = parseInputText(text);

        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const val = initialBoard[r][c];
                const cell = cells[r * 9 + c];
                cell.textContent = val !== 0 ? val : '';
                
                // Clear any leftover simulation classes
                cell.className = 'vz-grid-cell';
                
                if (val !== 0) {
                    cell.classList.add('readonly');
                }
            }
        }
        let hasErrors = validateInitialBoard();

        if (reformatTimeout) clearTimeout(reformatTimeout);
        if (is81 && !hasErrors) {
            reformatTimeout = setTimeout(() => {
                let currentFormatted = [];
                for (let r = 0; r < 9; r++) {
                    let rowStr = '';
                    for (let c = 0; c < 9; c++) {
                        rowStr += initialBoard[r][c] !== 0 ? initialBoard[r][c] : '.';
                    }
                    currentFormatted.push(`"${rowStr}"`);
                }
                let targetText = currentFormatted.join(' ');
                if (inputText.value !== targetText) {
                    inputText.value = targetText;
                }
            }, 800);
        }
    }

    function updateInputTextFromBoard() {
        let lines = [];
        for (let r = 0; r < 9; r++) {
            let rowStr = '';
            for (let c = 0; c < 9; c++) {
                rowStr += initialBoard[r][c] !== 0 ? initialBoard[r][c] : '.';
            }
            lines.push(`"${rowStr}"`);
        }
        inputText.value = lines.join(' ');
    }

    function validateInitialBoard() {
        // Reset previous errors
        cells.forEach(cell => cell.classList.remove('glitch-error'));
        document.body.classList.remove('global-glitch');
        btnStart.disabled = false;

        let hasErrors = false;
        let errorCells = new Set();

        // Helper to check and mark duplicates in a group
        const checkGroup = (group) => {
            let seen = new Map();
            for (let item of group) {
                if (item.val === 0) continue;
                if (seen.has(item.val)) {
                    errorCells.add(seen.get(item.val));
                    errorCells.add(item);
                    hasErrors = true;
                } else {
                    seen.set(item.val, item);
                }
            }
        };

        // Check Rows & Cols
        for (let i = 0; i < 9; i++) {
            let rowGroup = [];
            let colGroup = [];
            for (let j = 0; j < 9; j++) {
                rowGroup.push({ r: i, c: j, val: initialBoard[i][j] });
                colGroup.push({ r: j, c: i, val: initialBoard[j][i] });
            }
            checkGroup(rowGroup);
            checkGroup(colGroup);
        }

        // Check 3x3 Squares
        for (let sr = 0; sr < 3; sr++) {
            for (let sc = 0; sc < 3; sc++) {
                let sqGroup = [];
                for (let i = 0; i < 3; i++) {
                    for (let j = 0; j < 3; j++) {
                        let r = sr * 3 + i;
                        let c = sc * 3 + j;
                        sqGroup.push({ r, c, val: initialBoard[r][c] });
                    }
                }
                checkGroup(sqGroup);
            }
        }

        if (hasErrors) {
            errorCells.forEach(item => {
                cells[item.r * 9 + item.c].classList.add('glitch-error');
            });
            document.body.classList.add('global-glitch');
            btnStart.disabled = true;
        }

        return hasErrors;
    }

    inputText.addEventListener('input', updateBoardFromInput);

    // --- VISUALIZATION ENGINE ---

    const PREVIEW_CODES = {
        'agalanaki_valid': `<span class="preview-link back-link" data-target="back">// &lt; back</span>\nfunc canPlace(r, c int, v byte) bool {\n\tfor i := 0; i < 9; i++ {\n\t\tif grid[r][i] == v || grid[i][c] == v {\n\t\t\treturn false\n\t\t}\n\t}\n\tbr, bc := (r/3)*3, (c/3)*3\n\tfor i := br; i < br+3; i++ {\n\t\tfor j := bc; j < bc+3; j++ {\n\t\t\tif grid[i][j] == v {\n\t\t\t\treturn false\n\t\t\t}\n\t\t}\n\t}\n\treturn true\n}`,
        'magora_valid': `<span class="preview-link back-link" data-target="back">// &lt; back</span>\nfunc IsCorrect(board *[9][9]int, row, col, num int) bool {\n\tfor i := 0; i < 9; i++ {\n\t\tif board[row][i] == num { return false }\n\t}\n\tfor j := 0; j < 9; j++ {\n\t\tif board[j][col] == num { return false }\n\t}\n\tboxrow := (row / 3) * 3\n\tboxcolumn := (col / 3) * 3\n\tfor i := 0; i < 3; i++ {\n\t\tfor j := 0; j < 3; j++ {\n\t\t\tif board[boxrow+i][boxcolumn+j] == num { return false }\n\t\t}\n\t}\n\treturn true\n}`,
        'gangelat_valid': `<span class="preview-link back-link" data-target="back">// &lt; back</span>\nfunc canPlace(pinakas [9][9]int, i int, j int, n int) bool {\n\tif pinakas[i][j] == 0 {\n\t\tfor k := 0; k <= 8; k++ {\n\t\t\tif pinakas[i][k] == n || pinakas[k][j] == n {\n\t\t\t\treturn false\n\t\t\t}\n\t\t}\n\t\tstartX := (i / 3) * 3\n\t\tstartY := (j / 3) * 3\n\t\tfor r := startX; r < startX+3; r++ {\n\t\t\tfor t := startY; t < startY+3; t++ {\n\t\t\t\tif pinakas[r][t] == n { return false }\n\t\t\t}\n\t\t}\n\t}\n\treturn true\n}`,
        'pgouliam_valid': `<span class="preview-link back-link" data-target="back">// &lt; back</span>\nfunc isValid(board [][]rune, row int, col int, guess rune) bool {\n\tfor i := 0; i < 9; i++ {\n\t\tif board[row][i] == guess { return false }\n\t}\n\tfor i := 0; i < 9; i++ {\n\t\tif board[i][col] == guess { return false }\n\t}\n\tstartRow := (row / 3) * 3\n\tstartCol := (col / 3) * 3\n\tfor i := 0; i < 3; i++ {\n\t\tfor j := 0; j < 3; j++ {\n\t\t\tif board[startRow+i][startCol+j] == guess { return false }\n\t\t}\n\t}\n\treturn true\n}`,
        'avrabac_valid': `<span class="preview-link back-link" data-target="back">// &lt; back</span>\nfunc isValidMove(row, col, num int) bool {\n\tfor i := 0; i < 9; i++ {\n\t\tif sudoku[row][i] == num { return false }\n\t}\n\tfor i := 0; i < 9; i++ {\n\t\tif sudoku[i][col] == num { return false }\n\t}\n\tstartRow := (row / 3) * 3\n\tstartCol := (col / 3) * 3\n\tfor i := startRow; i < startRow+3; i++ {\n\t\tfor j := startCol; j < startCol+3; j++ {\n\t\t\tif sudoku[i][j] == num { return false }\n\t\t}\n\t}\n\treturn true\n}`,
        'mrvFindMRVCell': `<span class="preview-link back-link" data-target="back">// &lt; back</span>\n` + ALGORITHMS['mrv'].mrvCode,
        'mrvCountCandidates': `<span class="preview-link back-link" data-target="back">// &lt; back</span>
func countCandidates(board *[9][9]int, r int, c int) int {
	cands := 0
	for v := 1; v <= 9; v++ {
		if isValid(board, r, c, v) {
			cands++
		}
	}
	return cands
}`,
        'nisankouCandidates': `<span class="preview-link back-link" data-target="back">// &lt; back</span>
func Canditates(myBoard Board, i int, j int) []int {
	row := make([]int, 0)
	column := make([]int, 0)
	square := make([]int, 0)

	for k := 0; k < 9; k++ {
		if myBoard[i][k] != 0 {
			row = append(row, myBoard[i][k])
		}
	}

	for l := 0; l < 9; l++ {
		if myBoard[l][j] != 0 {
			column = append(column, myBoard[l][j])
		}
	}

	startRow := (i / 3) * 3
	startColumn := (j / 3) * 3

	for m := startRow; m < startRow+3; m++ {
		for n := startColumn; n < startColumn+3; n++ {
			if myBoard[m][n] != 0 {
				square = append(square, myBoard[m][n])
			}
		}
	}

	invalidCanditates := make([]int, 0)
	invalidCanditates = append(invalidCanditates, row...)
	invalidCanditates = append(invalidCanditates, column...)
	invalidCanditates = append(invalidCanditates, square...)

	numbers := []int{1, 2, 3, 4, 5, 6, 7, 8, 9}
	canditates := make([]int, 0)

	for _, n := range numbers {
		found := !true // Simplified Contains check
		if !found {
			canditates = append(canditates, n)
		}
	}
	return canditates
}`,
        'dlxStruct': `<span class="preview-link back-link" data-target="back">// &lt; back</span>
type Node struct {
	left, right, up, down *Node
	column                *ColumnNode
	rowID                 int
}

type ColumnNode struct {
	Node
	size int
	name string
}`,
        'dlxCoverUncover': `<span class="preview-link back-link" data-target="back">// &lt; back</span>
func cover(c *ColumnNode) {
	c.right.left = c.left
	c.left.right = c.right
	for i := c.down; i != &c.Node; i = i.down {
		for j := i.right; j != i; j = j.right {
			j.down.up = j.up
			j.up.down = j.down
			j.column.size--
		}
	}
}

func uncover(c *ColumnNode) {
	for i := c.up; i != &c.Node; i = i.up {
		for j := i.left; j != i; j = j.left {
			j.column.size++
			j.down.up = j
			j.up.down = j
		}
	}
	c.right.left = &c.Node
	c.left.right = &c.Node
}`,
        'dlxAddRemove': `<span class="preview-link back-link" data-target="back">// &lt; back</span>
func addToSolution(r *Node) {
	// Pushes the row action into the current solution stack
	// In an exact cover matrix for Sudoku, this represents
	// placing a specific digit in a specific cell.
	solutionStack = append(solutionStack, r)
}

func removeFromSolution(r *Node) {
	// Pops the last row action during backtracking
	solutionStack = solutionStack[:len(solutionStack)-1]
}`
    };

    let codeStack = [];

    function loadAlgorithm() {
        const algoKey = algoSelect.value;
        const algo = ALGORITHMS[algoKey];

        codeStack = [algo.code];
        renderCode(codeStack[codeStack.length - 1]);
    }

    codeDisplay.addEventListener('click', (e) => {
        if (isLocked) return;

        const link = e.target.closest('.preview-link');
        if (link) {
            const target = link.dataset.target;
            if (target === 'back') {
                if (codeStack.length > 1) {
                    codeStack.pop();
                    renderCode(codeStack[codeStack.length - 1]);
                }
            } else if (PREVIEW_CODES[target]) {
                codeStack.push(PREVIEW_CODES[target]);
                renderCode(codeStack[codeStack.length - 1]);
            }
        }
    });

    codeDisplay.addEventListener('focusout', (e) => {
        if (e.target.classList && e.target.classList.contains('editable-count')) {
            let val = parseInt(e.target.innerText);
            if (isNaN(val) || val < 1) val = 1;
            if (val > 50) val = 50;
            e.target.innerText = val;
        }
    });

    codeDisplay.addEventListener('keydown', (e) => {
        if (e.target.classList && e.target.classList.contains('editable-count')) {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.target.blur();
            }
        }
    });
    algoSelect.addEventListener('change', () => {
        if (!isLocked) {
            loadAlgorithm();
        }
    });

    function generateAllSteps() {
        const algoKey = algoSelect.value;
        const algo = ALGORITHMS[algoKey];
        const gen = algo.generator(initialBoard);
        steps = [];

        // Unroll generator completely
        // In a real app we might do this lazily if there are millions of steps,
        // but for Sudoku visualization we'll limit to a safe amount to avoid crashing.
        // Calculate initial filled cells for depth estimation
        let initialFilled = 0;
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (initialBoard[r][c] !== 0) initialFilled++;
            }
        }

        let i = 0;
        let cumulativeVars = new Set();
        for (let step of gen) {
            // Calculate current depth by counting newly filled cells
            let currentFilled = 0;
            for (let r = 0; r < 9; r++) {
                for (let c = 0; c < 9; c++) {
                    if (step.grid[r][c] !== 0) currentFilled++;
                }
            }
            let calculatedDepth = currentFilled - initialFilled;
            if (step.testingValue !== undefined) calculatedDepth++; // testing implies +1 depth

            if (step.vars) {
                Object.keys(step.vars).forEach(k => cumulativeVars.add(k));
            }

            // Deep copy grid to save history
            steps.push({
                ...step,
                depth: Math.max(0, calculatedDepth),
                grid: JSON.parse(JSON.stringify(step.grid)),
                seenVars: Array.from(cumulativeVars)
            });
            i++;
            if (i > 100000) break; // Safety limit
        }
        console.log(`Generated ${steps.length} steps.`);
    }

    function renderStep(idx) {
        if (idx < 0 || idx >= steps.length) return;

        const step = steps[idx];

        // Update Depth
        const depthIndicator = document.getElementById('depth-indicator');
        if (depthIndicator) {
            depthIndicator.textContent = `Depth: ${step.depth || 0}`;
        }

        // 1. Update Board
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const cell = cells[r * 9 + c];
                const val = step.grid[r][c];
                const oldVal = cell.textContent;

                // Clear old highlights
                cell.classList.remove('vz-highlight-a', 'vz-highlight-b', 'vz-highlight-commit');

                // Set value
                if (initialBoard[r][c] === 0) {
                    if (val !== 0) {
                        cell.textContent = val;
                        cell.classList.add('user-input');
                        cell.classList.remove('testing-input', 'dissolve-out');
                    } else if (step.testingValue !== undefined && step.activeCell && step.activeCell[0] === r && step.activeCell[1] === c) {
                        cell.textContent = step.testingValue;
                        cell.classList.add('testing-input');
                        cell.classList.remove('user-input', 'dissolve-out');
                    } else {
                        // Backtracking or empty
                        if (oldVal !== '' && !cell.classList.contains('dissolve-out')) {
                            // Check speed: only animate if speed is slow enough (>20ms)
                            const speedVal = parseInt(speedSlider.value);
                            const t = (speedVal - 1) / 999;
                            const delay = speedVal === 1000 ? 0 : 2000 * Math.pow(1 - t, 3);

                            if (delay > 20) {
                                cell.dataset.val = oldVal;
                                cell.classList.add('dissolve-out');
                            }
                        }
                        cell.textContent = '';
                        cell.classList.remove('user-input', 'testing-input');
                    }
                } else {
                    // It's a readonly cell, but just to be sure we clear testing-input and user-input
                    cell.classList.remove('testing-input', 'dissolve-out', 'user-input', 'vz-highlight-a', 'vz-highlight-b', 'vz-highlight-c', 'vz-highlight-commit');
                    cell.classList.add('readonly');
                }

                // Highlight active cell
                if (step.activeCell && step.activeCell[0] === r && step.activeCell[1] === c) {
                    let justPlaced = false;
                    if (val !== 0 && initialBoard[r][c] === 0) {
                        if (idx > 0) {
                            const prevStep = steps[idx - 1];
                            if (prevStep.grid[r][c] === 0) {
                                justPlaced = true;
                            }
                        } else {
                            justPlaced = true;
                        }
                    }

                    if (justPlaced) {
                        cell.classList.add('vz-highlight-commit');
                    } else {
                        cell.classList.add('vz-highlight-a');
                    }
                }
            }
        }

        // 2. Update Code highlight
        document.querySelectorAll('.code-line').forEach(el => el.classList.remove('active'));
        const activeLineEl = document.getElementById(`code-line-${step.line}`);
        if (activeLineEl) {
            activeLineEl.classList.add('active');
            
            const pane = document.getElementById('pane-code');
            if (pane) {
                const paneHeight = pane.clientHeight;
                const elementTop = activeLineEl.offsetTop;
                const elementHeight = activeLineEl.offsetHeight;
                pane.scrollTo({
                    top: elementTop - (paneHeight / 2) + (elementHeight / 2),
                    behavior: 'smooth'
                });
            }
        }

        // 3. Update Variables
        varsContainer.innerHTML = '';
        if (step.seenVars) {
            for (const key of step.seenVars) {
                const value = (step.vars && step.vars[key] !== undefined) ? step.vars[key] : '&nbsp;';
                const pill = document.createElement('div');
                pill.className = 'gs-pill';
                pill.innerHTML = `<span class="gs-name">${key}</span><span class="gs-def" style="min-width: 15px; text-align: center;">${value}</span>`;
                varsContainer.appendChild(pill);
            }
        }

        // Update buttons
        btnBack.disabled = idx === 0;
        btnNext.disabled = idx === steps.length - 1;

        if (idx === steps.length - 1) {
            btnPlayPause.innerHTML = 'Finished -';
            btnPlayPause.disabled = true;
        } else {
            btnPlayPause.innerHTML = isPlaying ? '&#10074;&#10074; Pause' : '&#9654; Play';
            btnPlayPause.disabled = false;
        }
    }

    // --- CONTROLS ---

    btnStart.addEventListener('click', () => {
        if (!isLocked) {
            // Lock and generate
            isLocked = true;
            inputText.disabled = true;
            algoSelect.disabled = true;
            document.querySelectorAll('.editable-count').forEach(el => el.contentEditable = 'false');
            btnStart.textContent = 'Restart';
            btnStart.classList.remove('primary');
            btnStart.classList.add('secondary');
            btnReset.textContent = 'Stop';
            btnReset.classList.add('btn-stop');
            codeDisplay.classList.add('locked');
            btnEmpty.disabled = true;
            btnRandom.disabled = true;

            // Exit review mode if active
            if (isReviewMode) {
                isReviewMode = false;
                document.body.classList.remove('review-mode-active');
                renderCode(codeStack[codeStack.length - 1]);
            }

            // Reset code view to main algorithm if deep in links
            if (codeStack.length > 1) {
                codeStack = [codeStack[0]];
                renderCode(codeStack[0]);
            }

            // Collapse header
            headerEl.classList.add('collapsed');
            mainContainerEl.classList.add('header-collapsed');

            generateAllSteps();
            currentStepIdx = 0;
            renderStep(0);

            btnPlayPause.disabled = false;
            document.body.classList.add('awaiting-play');
        } else {
            // Restart same problem from step 0
            currentStepIdx = 0;
            renderStep(0);
            if (isPlaying) togglePlay();
            document.body.classList.add('awaiting-play');
        }
    });

    btnReset.addEventListener('click', () => {
        if (isLocked) {
            // Act as Stop — unlock everything
            isLocked = false;
            inputText.disabled = false;
            algoSelect.disabled = false;
            document.querySelectorAll('.editable-count').forEach(el => el.contentEditable = 'true');
            btnStart.textContent = 'Start / Lock';
            btnStart.classList.remove('secondary');
            btnStart.classList.add('primary');
            btnReset.textContent = 'Bocal Review';
            btnReset.classList.remove('btn-stop');
            codeDisplay.classList.remove('locked');

            // Un-collapse header
            headerEl.classList.remove('collapsed');
            mainContainerEl.classList.remove('header-collapsed');

            if (isPlaying) togglePlay();
            btnPlayPause.disabled = true;
            btnBack.disabled = true;
            btnNext.disabled = true;

            steps = [];
            currentStepIdx = -1;

            document.querySelectorAll('.code-line').forEach(el => el.classList.remove('active'));
            varsContainer.innerHTML = '';
            updateBoardFromInput();
            document.body.classList.remove('awaiting-play');

            btnEmpty.disabled = false;
            btnRandom.disabled = false;
        } else {
            // Act as Bocal Review
            isReviewMode = !isReviewMode;
            if (isReviewMode) {
                const algoKey = algoSelect.value;
                let text = '';
                if (typeof BOCAL_REVIEWS !== 'undefined' && BOCAL_REVIEWS[algoKey]) {
                    text = BOCAL_REVIEWS[algoKey];
                } else {
                    text = `// Bocal Review Error\n/*\nBocal review not available yet\n*/`;
                }
                document.body.classList.add('review-mode-active');
                btnReset.textContent = 'Return to Code';
                codeDisplay.innerHTML = `<div class="bocal-review-text">${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>`;
            } else {
                document.body.classList.remove('review-mode-active');
                btnReset.textContent = 'Bocal Review';
                renderCode(codeStack[codeStack.length - 1]);
            }
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isReviewMode && !isLocked) {
            btnReset.click();
        }
    });

    btnEmpty.addEventListener('click', () => {
        if (isLocked) return;
        inputText.value = '......... ......... ......... ......... ......... ......... ......... ......... .........';
        currentRandomIdx = 0;
        btnRandom.textContent = 'Preset 00';
        updateBoardFromInput();
    });

    btnRandom.addEventListener('click', () => {
        if (isLocked) return;
        inputText.value = PREDEFINED_SUDOKUS[currentRandomIdx];
        currentRandomIdx = (currentRandomIdx + 1) % PREDEFINED_SUDOKUS.length;
        btnRandom.textContent = 'Preset ' + (currentRandomIdx === 0 ? PREDEFINED_SUDOKUS.length : currentRandomIdx).toString().padStart(2, '0');
        updateBoardFromInput();
    });

    inputText.addEventListener('input', () => {
        btnRandom.textContent = 'Preset 00';
        currentRandomIdx = 0;
    });


    btnBack.addEventListener('click', () => {
        if (isPlaying) togglePlay();
        if (currentStepIdx > 0) {
            currentStepIdx--;
            renderStep(currentStepIdx);
        }
    });

    btnNext.addEventListener('click', () => {
        if (isPlaying) togglePlay();
        if (currentStepIdx < steps.length - 1) {
            currentStepIdx++;
            renderStep(currentStepIdx);
            document.body.classList.remove('awaiting-play');
        }
    });

    function togglePlay() {
        isPlaying = !isPlaying;
        if (currentStepIdx < steps.length - 1) {
            btnPlayPause.innerHTML = isPlaying ? '&#10074;&#10074; Pause' : '&#9654; Play';
            btnPlayPause.disabled = false;
        } else {
            btnPlayPause.innerHTML = 'Finished -';
            btnPlayPause.disabled = true;
        }
        
        if (isPlaying) {
            document.body.classList.remove('awaiting-play');
            playLoop();
        } else {
            clearTimeout(playInterval);
            cancelAnimationFrame(playInterval);
        }
    }

    function playLoop() {
        if (!isPlaying) return;
        if (currentStepIdx < steps.length - 1) {
            // Speed calculation
            const speedVal = parseInt(speedSlider.value);
            const t = (speedVal - 1) / 999;
            const delay = speedVal === 1000 ? 0 : 2000 * Math.pow(1 - t, 3);

            if (delay === 0) {
                // Ultra-fast mode: process up to 50 steps per frame
                let batch = 50;
                while (batch-- > 0 && currentStepIdx < steps.length - 1) {
                    currentStepIdx++;
                    if (steps[currentStepIdx].isSolution) break; // Break ultra-fast to show solution
                }
                renderStep(currentStepIdx);

                if (steps[currentStepIdx].isSolution && currentStepIdx < steps.length - 1) {
                    showSolutionEffect();
                    playInterval = setTimeout(playLoop, 1000); // 1 sec pause
                } else {
                    playInterval = requestAnimationFrame(playLoop);
                }
            } else {
                currentStepIdx++;
                renderStep(currentStepIdx);

                let nextDelay = delay;
                if (steps[currentStepIdx].isSolution) {
                    showSolutionEffect();
                    nextDelay = Math.max(1000, delay); // Ensure at least 1 sec pause
                }
                playInterval = setTimeout(playLoop, nextDelay);
            }
        } else {
            // Reached the end (Solution or no solution)
            togglePlay();
            showSolutionEffect();
        }
    }

    function showSolutionEffect() {
        const boardEl = document.getElementById('sudoku-board');
        boardEl.style.transition = 'box-shadow 0.5s';
        boardEl.style.boxShadow = '0 0 50px rgba(0, 255, 0, 0.8)';
        setTimeout(() => {
            boardEl.style.boxShadow = '';
        }, 1000);
    }

    btnPlayPause.addEventListener('click', togglePlay);

    let activeInputCell = null;
    function clearInputMode() {
        if (activeInputCell) {
            activeInputCell.cell.classList.remove('waiting-input');
            activeInputCell = null;
        }
        document.body.classList.remove('dim-overlay-active');
    }

    // Cancel input if clicking outside
    document.addEventListener('click', (e) => {
        if (activeInputCell && !e.target.closest('.waiting-input')) {
            clearInputMode();
        }
    });

    // --- KEYBOARD SHORTCUTS ---
    document.addEventListener('keydown', (e) => {
        if (activeInputCell) {
            e.preventDefault();
            const { r, c, cell } = activeInputCell;
            if (e.key >= '1' && e.key <= '9') {
                initialBoard[r][c] = parseInt(e.key);
                cell.textContent = e.key;
                cell.classList.remove('readonly');
                cell.classList.add('user-input');
            } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0' || e.key === ' ') {
                initialBoard[r][c] = 0;
                cell.textContent = '';
                cell.classList.remove('user-input');
                cell.classList.remove('readonly');
            } else if (e.key === 'Escape') {
                clearInputMode();
                return;
            } else {
                return;
            }
            updateInputTextFromBoard();
            validateInitialBoard();
            clearInputMode();
            return;
        }

        if (document.activeElement === inputText) return;

        if (!isLocked) {
            // Unlocked state shortcuts
            if (e.code === 'Space' || e.code === 'KeyW') {
                e.preventDefault();
                btnStart.click();
            }
            return;
        }

        // Locked state shortcuts
        if (e.code === 'Escape') {
            btnReset.click();
        } else if (e.code === 'Space' || e.code === 'KeyQ') {
            e.preventDefault();
            togglePlay();
        } else if (e.code === 'KeyS' || e.key === ',') { // s is BACK
            if (isPlaying) togglePlay();
            btnBack.click();
        } else if (e.code === 'KeyW' || e.key === '.') { // w is NEXT
            if (isPlaying) togglePlay();
            btnNext.click();
        } else if (e.code === 'KeyA') {
            speedSlider.value = Math.max(parseInt(speedSlider.min), parseInt(speedSlider.value) - 1);
        } else if (e.code === 'KeyD') {
            speedSlider.value = Math.min(parseInt(speedSlider.max), parseInt(speedSlider.value) + 1);
        } else if (e.code === 'KeyE') {
            speedSlider.value = speedSlider.max;
        }
    });

    // --- SPLITTER LOGIC ---
    const splitter = document.getElementById('pane-splitter');
    const paneBoard = document.getElementById('pane-board');
    let isDragging = false;

    splitter.addEventListener('pointerdown', (e) => {
        isDragging = true;
        splitter.setPointerCapture(e.pointerId);
    });

    splitter.addEventListener('pointermove', (e) => {
        if (!isDragging) return;

        // Check if mobile (column layout) or desktop (row layout)
        if (window.innerWidth <= 900) {
            // Mobile (top-bottom)
            const newHeight = Math.max(20, Math.min(80, (e.clientY / window.innerHeight) * 100));
            paneBoard.style.flex = `0 0 ${newHeight}%`;
        } else {
            // Desktop (left-right)
            const newWidth = Math.max(20, Math.min(80, (e.clientX / window.innerWidth) * 100));
            paneBoard.style.flex = `0 0 ${newWidth}%`;
        }
    });

    splitter.addEventListener('pointerup', (e) => {
        isDragging = false;
        splitter.releasePointerCapture(e.pointerId);
    });

    // --- INIT ---
    createBoard();

    // Set a default puzzle if empty
    if (!inputText.value.trim()) {
        inputText.value = '".96.4...1" "1...6...4" "5.481.39." "..795..43" ".3..8...." "4.5.23.18" ".1.63..59" ".59.7.83." "..359...7"';
    }
    updateBoardFromInput();
    loadAlgorithm();
});
