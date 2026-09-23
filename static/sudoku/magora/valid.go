package sudoku

func IsCorrect(board *[9][9]int, row, col, num int) bool {

	//checking the rows
	for i := 0; i < 9; i++ {
		if board[row][i] == num {
			return false
		}
	}
	// checking the columns
	for j := 0; j < 9; j++ {
		if board[j][col] == num {
			return false
		}
	}
	//checking the 3x3 tables
	boxrow := (row / 3) * 3
	boxcolumn := (col / 3) * 3

	for i := 0; i < 3; i++ {
		for j := 0; j < 3; j++ {
			if board[boxrow+i][boxcolumn+j] == num {
				return false
			}
		}
	}
	return true
}
