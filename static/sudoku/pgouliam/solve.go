// pgouliam, evarthal, amoraitit

package sudoku

func SolveSudoku(board [][]rune) bool {
	for row := 0; row < 9; row++ {
		for col := 0; col < 9; col++ {
			if board[row][col] == '.' {
				for guess := '1'; guess <= '9'; guess++ {
					if isValid(board, row, col, guess) {
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
}
