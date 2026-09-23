package sudoku

import (
	// "fmt"
	"slices"
)

type Board [9][9]int

func Canditates(myBoard Board, i int, j int) []int {
	row := make([]int, 0)
	column := make([]int, 0)
	square := make([]int, 0)

	for k := 0; k < 9; k++ {
		if myBoard[i][k] != 0 {
			row = append(row, myBoard[i][k])
		}
	}

	for l := 0; l < 9; l++ {
		if myBoard[l][j] != 0 {
			column = append(column, myBoard[l][j])
		}
	}

	startRow := (i / 3) * 3
	startColumn := (j / 3) * 3

	for m := startRow; m < startRow+3; m++ {
		for n := startColumn; n < startColumn+3; n++ {
			if myBoard[m][n] != 0 {
				square = append(square, myBoard[m][n])
			}
		}
	}

	invalidCanditates := make([]int, 0)
	invalidCanditates = append(invalidCanditates, row...)
	invalidCanditates = append(invalidCanditates, column...)
	invalidCanditates = append(invalidCanditates, square...)
	// fmt.Println(invalidCanditates)

	numbers := []int{1, 2, 3, 4, 5, 6, 7, 8, 9}

	canditates := make([]int, 0)

	for _, n := range numbers {
		found := slices.Contains(invalidCanditates, n)

		if found == false {
			canditates = append(canditates, n)
		}
	}
	return canditates
}
