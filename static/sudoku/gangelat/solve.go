// gangelat, spapachris, dkatsiko

package sudoku

func Solve(pinakas [9][9]int) ([9][9]int, bool) {
	for i := 0; i < 9; i++ {
		for j := 0; j < 9; j++ {
			if pinakas[i][j] == 0 {
				for n := 1; n <= 9; n++ {
					if canPlace(pinakas, i, j, n) {
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
}
