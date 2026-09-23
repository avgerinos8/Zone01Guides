const BOCAL_REVIEWS = {
    'agalanaki': `// Bocal Review for Sudoku Solution: agalanaki
/*
✅ Very clean code.
✅ The base case is placed elegantly at the top of the function.
✅ Properly tracks solution count to enforce uniqueness.
Conclusion: Passes perfectly. Well done!
*/`,
    'magora': `// Bocal Review for Sudoku Solution: magora, mpapakonst, mntampan
/*
✅ Beautifully structured code.
✅ Correctly checks for uniqueness by counting solutions.
✅ Uses pointers to the board effectively.
Conclusion: Solid approach and clean execution. Passes!
*/`,
    'nisankou': `// Bocal Review for Sudoku Solution: nisankou, cgiannoul, kxykis
/*
❌ FAILS: The code stops at the first solution found, so it does not verify uniqueness!
✅ However, great job being the only team to implement a Candidates heuristic! 
(Even though for a 9x9 it doesn't give a massive performance boost over a simple isValid check, the initiative is highly appreciated and shows advanced thinking).
*/`,
    'gangelat': `// Bocal Review for Sudoku Solution: gangelat, spapachris, dkatsiko
/*
❌ FAILS: The code returns as soon as it finds one solution. It does not check if the solution is unique!
✅ Good clean layout.
✅ Nice functional approach returning the updated array and a boolean.
*/`,
    'pgouliam': `// Bocal Review for Sudoku Solution: pgouliam, evarthal, amoraitit
/*
❌ FAILS: Returns \`true\` immediately upon finding the first valid path. Fails the uniqueness requirement!
✅ Uses \`rune\` which is interesting for parsing directly from strings.
✅ Code is readable and straightforward.
*/`,
    'avrabac': `// Bocal Review for Sudoku Solution: avrabac, efourou, gpanouso
/*
❌ FAILS: Stops at the first valid configuration. Does not ensure uniqueness!
✅ The double loop approach is classic and easy to read.
✅ Good logical flow, but misses the core constraint of the project.
*/`,
    'mrv': `// Bocal Review for Sudoku Solution: MRV Heuristic
/*
This implementation is an educational showcase of the Minimum Remaining Values (MRV) heuristic!

Instead of scanning the board blindly from the top-left (0,0) and picking the first empty cell it finds, this algorithm adds a smart check before diving into the loops. It scans the entire board to find the specific cell that has the *fewest* possible valid options left.

While this initial scan adds a small performance cost upfront, it massively pays off! By prioritizing the most constrained cells, MRV drastically reduces the number of dead-end paths the algorithm has to explore, making the overall solving process much faster and more efficient than standard backtracking.
*/`,
    'dlx': `// Bocal Review for Sudoku Solution: Knuth DLX
/*
Dancing Links (Algorithm X) is a highly efficient technique by Donald Knuth used to find all solutions to the Exact Cover problem via Depth-First Search. 

It turns out that Sudoku can be perfectly modeled as an Exact Cover problem! The process is quite different from standard backtracking: the Sudoku grid is transformed into a large sparse matrix where rows represent "actions" (placing a specific number in a specific cell) and columns represent "obligations" or constraints (e.g., a row must contain a '5'). 

By utilizing a 4-way linked list, Dancing Links enables incredibly fast searching, removing, and restoring of these rows and columns. It also integrates a greedy "best-first" heuristic naturally, making the execution dramatically faster.

For more information, check out the paper: 
http://www.ocf.berkeley.edu/~jchu/publicportal/sudoku/0011047.pdf
*/`
};
