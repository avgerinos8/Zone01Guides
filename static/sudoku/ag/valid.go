package main

func canPlace(r, c int, v byte) bool {
	for i := 0; i < 9; i++ {
		if grid[r][i] == v || grid[i][c] == v {
			return false
		}
	}
	br, bc := (r/3)*3, (c/3)*3
	for i := br; i < br+3; i++ {
		for j := bc; j < bc+3; j++ {
			if grid[i][j] == v {
				return false
			}
		}
	}
	return true
}
