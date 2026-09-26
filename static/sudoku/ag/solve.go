// ag*******

package main

var count int
var grid [9][9]byte     // 0 = empty, 1-9 = value
var solution [9][9]byte // first solution found

func solve(pos int) {
	if count >= 2 {
		return
	}
	if pos == 81 {
		count++
		if count == 1 {
			solution = grid
		}
		return
	}

	r, c := pos/9, pos%9

	if grid[r][c] != 0 {
		solve(pos + 1)
		return
	}

	for v := byte(1); v <= 9; v++ {
		if canPlace(r, c, v) {
			grid[r][c] = v
			solve(pos + 1)
			grid[r][c] = 0 // backtrack
			if count >= 2 {
				return
			}
		}
	}
}
