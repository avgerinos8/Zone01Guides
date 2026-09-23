package sudoku

func canPlace(pinakas [9][9]int, i int, j int, n int) bool {

	if pinakas[i][j] == 0 {
		for k := 0; k <= 8; k++ {
			if pinakas[i][k] == n || pinakas[k][j] == n {
				return false
			}
		}
		startX := (i / 3) * 3
		startY := (j / 3) * 3
		for r := startX; r < startX+3; r++ {
			for t := startY; t < startY+3; t++ {
				if pinakas[r][t] == n {
					return false
				}
			}
		}
	}
	return true
}
