// ni******, cg*******, kx****

package sudoku

func Solution(myBoard *Board) bool {
	for i := 0; i < 9; i++ {
		for j := 0; j < 9; j++ {
			if myBoard[i][j] == 0 {
				candidates := Canditates(*myBoard, i, j)

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
}
