package main

var sudoku [9][9]int

// Ελέγχει αν ένας αριθμός μπορεί να μπει
// στο συγκεκριμένο κελί.
func isValidMove(row, col, num int) bool {
	// Έλεγχος γραμμής.
	for i := 0; i < 9; i++ {
		if sudoku[row][i] == num {
			return false
		}
	}

	// Έλεγχος στήλης.
	for i := 0; i < 9; i++ {
		if sudoku[i][col] == num {
			return false
		}
	}

	// Βρίσκουμε την αρχή του 3x3 κουτιού.
	startRow := (row / 3) * 3
	startCol := (col / 3) * 3

	// Έλεγχος 3x3 κουτιού.
	for i := startRow; i < startRow+3; i++ {
		for j := startCol; j < startCol+3; j++ {
			if sudoku[i][j] == num {
				return false
			}
		}
	}

	return true
}
