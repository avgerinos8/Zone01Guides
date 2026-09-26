// av*****, ef*****, gp******
package main

func solve() bool {
	for row := 0; row < 9; row++ {
		for col := 0; col < 9; col++ {
			if sudoku[row][col] == 0 {
				for num := 1; num <= 9; num++ {
					if isValidMove(row, col, num) {
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
}
