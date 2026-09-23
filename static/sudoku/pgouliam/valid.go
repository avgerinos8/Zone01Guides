package sudoku

func isValid(board [][]rune, row int, col int, guess rune) bool {
	for i := 0; i < 9; i++ {
		if board[row][i] == guess {
			return false
		}
	}

	for i := 0; i < 9; i++ {
		if board[i][col] == guess {
			return false
		}
	}

	startRow := (row / 3) * 3
	startCol := (col / 3) * 3

	for i := 0; i < 3; i++ {
		for j := 0; j < 3; j++ {
			if board[startRow+i][startCol+j] == guess {
				return false
			}
		}
	}

	return true
}
