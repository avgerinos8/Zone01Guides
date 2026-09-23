const BOCAL_REVIEWS = {
    /*
        'agalanaki': `// Bocal Review for Sudoku Solution: agalanaki
    /*
    This implementation demonstrates a highly structured and effective backtracking approach. 
    The recursive function is designed with two distinct base cases placed elegantly at the top, ensuring termination is handled correctly and efficiently without unnecessary deep calls. 
    Furthermore, the code meticulously tracks the total solution count instead of returning immediately upon the first success. This is crucial to enforce the uniqueness constraint—a core requirement of the project to ensure the Sudoku grid provided has exactly one valid solution. 
    The memory management and grid traversal logic are also clean and idiomatic Go.
    Conclusion: Passes perfectly. Excellent work!
    *\/`,
        'magora': `// Bocal Review for Sudoku Solution: magora, mpapakonst, mntampan
    /*
    This codebase stands out for its beautiful structure and adherence to solid algorithmic principles. 
    The implementation correctly handles the uniqueness requirement by thoroughly exploring the search space and counting all possible solutions before returning. This guarantees that ambiguous puzzles are rejected, fulfilling the core constraint of the project. 
    Additionally, the strategic use of pointers (*[9][9]int) to manipulate the board state in-place is handled very effectively, demonstrating a great understanding of Go's memory model and minimizing unnecessary allocations during the heavy recursion steps. 
    The code is easy to read, modular, and performs flawlessly. 
    Conclusion: Solid approach and clean execution. Passes!
    *\/`,
        'nisankou': `// Bocal Review for Sudoku Solution: nisankou, cgiannoul, kxykis
    /*
    FAILS: The backtracking algorithm halts immediately upon finding the first valid solution path. It completely fails to verify the uniqueness requirement, meaning it will incorrectly accept Sudoku grids that have multiple valid solutions.
    
    However, it is highly commendable that this is the only team to attempt a heuristics-based approach! Ακόμα κι αν δεν χρησιμοποιούν το "απόλυτο" heuristic (όπως το MRV που θα δείτε παρακάτω, το οποίο σαρώνει όλο το ταμπλό για να βρει το κελί με τις λιγότερες επιλογές και να μειώσει στο ελάχιστο το backtracking σε περίπτωση fail), η δική τους προσέγγιση παραμένει αξιέπαινη. 
    Αντί να δοκιμάζουν "στα τυφλά" τους αριθμούς 1-9 (raw check) όπως οι υπόλοιποι, γράφουν μια συνάρτηση που υπολογίζει από πριν (pre-calculate) τα υποψήφια νούμερα (candidates) για το άδειο κελί. Αυτή η λογική δείχνει προχωρημένη αλγοριθμική σκέψη και μια βαθύτερη κατανόηση του πώς μπορεί να βελτιστοποιηθεί ο χώρος αναζήτησης (search space optimization). Η χρήση heuristics πριν το "ωμό" validation έχει τεράστια αξία σαν υλοποίηση, κι ας κοστίζει το fail λόγω της απουσίας του uniqueness check.
    *\/`,
        'gangelat': `// Bocal Review for Sudoku Solution: gangelat, spapachris, dkatsiko
    /*
    FAILS: The recursive function returns true as soon as it discovers a single valid solution, halting any further exploration. Because it lacks the logic to continue searching the rest of the search tree, it cannot verify if the provided Sudoku puzzle has a unique solution, violating a primary project instruction.
    
    On the positive side, the code maintains a very clean and readable layout. The functional approach of returning an updated 2D array along with a boolean status flag is a highly interesting design choice. It keeps state management localized and avoids some of the pitfalls of mutable global states or messy pointer arithmetic. The validation logic within the canPlace function is also concise. 
    A solid attempt with nice data flow, but misses the core audit requirement.
    *\/`,
        'pgouliam': `// Bocal Review for Sudoku Solution: pgouliam, evarthal, amoraitit
    /*
    FAILS: The implementation successfully finds a solution but terminates immediately upon doing so. It fails to explore alternative branches to verify whether the initial grid configuration yields a unique solution, which is a mandatory requirement for this project.
    
    On a positive note, the decision to utilize 'rune' directly for board manipulation and string parsing is a very interesting, Go-idiomatic approach that avoids constant type casting between integers and characters. The matrix initialization and the grid validation logic are highly readable, straightforward, and clearly segmented. It shows a good grasp of the language's syntax and type system, even if the algorithmic constraints were not fully met.
    *\/`,
        'avrabac': `// Bocal Review for Sudoku Solution: avrabac, efourou, gpanouso
    /*
    FAILS: The algorithm successfully completes a standard Sudoku solver but stops execution the moment the board is filled once. It lacks the necessary tracking logic (such as a counter) to continue searching and verify that the solution is truly unique, meaning invalid puzzles with multiple solutions will pass incorrectly.
    
    On the positive side, the grid validation mechanics and the double-loop approach used for scanning row, column, and 3x3 block constraints are classic, textbook implementations. The code is very easy to follow, well-indented, and the logical flow of the recursion is fundamentally sound. With just a slight modification to count solutions instead of returning booleans, this would have been a perfect submission.
    *\/`,
    */
    'mrv': `/*
This implementation is an educational showcase of the Minimum Remaining Values (MRV) heuristic!

Instead of scanning the board blindly from the top-left (0,0) and picking the first empty cell it finds, this algorithm adds a smart check before diving into the loops. It scans the entire board to find the specific cell that has the *fewest* possible valid options left.

While this initial scan adds a small performance cost upfront, it massively pays off! By prioritizing the most constrained cells, MRV drastically reduces the number of dead-end paths the algorithm has to explore, making the overall solving process much faster and more efficient than standard backtracking.
*\/`,
    'dlx': `/*
Dancing Links (Algorithm X) is a highly efficient technique by Donald Knuth used to find all solutions to the Exact Cover problem via Depth-First Search. 

It turns out that Sudoku can be perfectly modeled as an Exact Cover problem! The process is quite different from standard backtracking: the Sudoku grid is transformed into a large sparse matrix where rows represent "actions" (placing a specific number in a specific cell) and columns represent "obligations" or constraints (e.g., a row must contain a '5'). 

By utilizing a 4-way linked list, Dancing Links enables incredibly fast searching, removing, and restoring of these rows and columns. It also integrates a greedy "best-first" heuristic naturally, making the execution dramatically faster.

For more information, check out the paper: 
http://www.ocf.berkeley.edu/~jchu/publicportal/sudoku/0011047.pdf
*\/`
};
