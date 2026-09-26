// ma****, mp********, mn******

package sudoku

func SolveSudoku(board *[9][9]int, solutions *int, solvedBoard *[9][9]int) {
	for row := 0; row < 9; row++ {
		for col := 0; col < 9; col++ {

			if board[row][col] == 0 {
				for num := 1; num <= 9; num++ {

					if IsCorrect(board, row, col, num) {
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
}
