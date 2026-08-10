# Αναλυτικός Οδηγός Περιεχομένων Μαθημάτων Go (Μέρος 1)

## 1. Εισαγωγή & Περιβάλλον Ανάπτυξης
* **1.1. Φιλοσοφία και Αρχές της Go**
  * Γιατί δημιουργήθηκε η Go (απλότητα, ταχύτητα, συντηρησιμότητα)
* **1.2. Εγκατάσταση & Setup**
  * Εγκατάσταση του Go Toolchain (Go SDK)
  * Παραμετροποίηση περιβάλλοντος ανάπτυξης (VS Code, GoLand)
  * Επεξήγηση μεταβλητών περιβάλλοντος (`GOROOT`, `GOPATH`)
* **1.3. Το Πρώτο Πρόγραμμα**
  * Ανατομία του `main.go`
  * Επεξήγηση της `package main` και της `func main()`
  * Εισαγωγή στη `fmt.Println`
* **1.4. Το Go CLI (Command Line Interface)**
  * Εκτέλεση κώδικα με `go run`
  * Μεταγλώττιση σε εκτελέσιμο αρχείο με `go build`
  * Αυτόματη μορφοποίηση κώδικα με `go fmt`

---

## 2. Μεταβλητές, Σταθερές & Βασικοί Τύποι Δεδομένων
* **2.1. Δήλωση Μεταβλητών**
  * Πλήρης σύνταξη δήλωσης με τη λέξη-κλειδί `var`
  * Αρχικοποίηση μεταβλητών και Default τιμές (Zero Values: `0`, `""`, `false`)
  * Σύντομη δήλωση μεταβλητών με τον τελεστή `:=` (Short Variable Declaration)
  * Δήλωση πολλαπλών μεταβλητών σε μία γραμμή ή σε block `var (...)`
* **2.2. Βασικοί Τύποι Δεδομένων**
  * Ακέραιοι αριθμοί (`int`, `int8`, `int16`, `int32`, `int64`, `uint`)
  * Αριθμοί κινητής υποδιαστολής (`float32`, `float64`)
  * Λογικοί τύποι (`bool`)
  * Συμβολοσειρές (`string`) και η αμεταβλητότητά τους (immutability)
  * Χαρακτήρες και Runes (`rune`, UTF-8 encoding)
* **2.3 VSCode Challenge:** 
  * Γράψε ένα πρόγραμμα που υπολογίζει την περίμετρο τετραγώνου
* **2.4. Μετατροπές Τύπων (Type Casting / Conversion)**
  * Ρητή μετατροπή τύπων (π.χ. `float64(x)`)
  * Απαγόρευση αόρατων/ανεπίσημων μετατροπών (strict type safety)
* **2.5. Σταθερές (Constants)**
  * Δήλωση σταθερών με τη λέξη-κλειδί `const`
  * Typed vs Untyped constants
* **2.6. VSCode Challenge:** 
  * Δημιούργησε ένα αρχείο `main.go` που δηλώνει έναν ακέραιο `x = 42` και ένα float `y = 3.14`. Προσπάθησε να τα προσθέσεις απευθείας (`x + y`) για να δεις το error του compiler, και στη συνέχεια διόρθωσέ το χρησιμοποιώντας ρητή μετατροπή τύπου (`Type Casting`).

---

## 3. Τελεστές, Εκφράσεις (Expressions) & Σειρά Εκτέλεσης
* **3.1. Expressions vs Statements (Διαχωρισμός Εννοιών)**
  * Τι είναι **Expression** (Έκφραση): Οτιδήποτε επιστρέφει/παράγει μια τιμή (π.χ. `5 + 3`, `x > 10`)
  * Τι είναι **Statement** (Εντολή): Μια μονάδα εκτέλεσης που εκτελεί μια ενέργεια (π.χ. `var x int`, `if ... {}`)
  * Γιατί στην Go οι αναθέσεις (`x = 5`) και οι αυξήσεις (`x++`) είναι Statements και **όχι** Expressions
* **3.2. Κατηγορίες Τελεστών (Operators)**
  * Αριθμητικοί τελεστές (`+`, `-`, `*`, `/`, `%`)
  * Τελεστές σύγκρισης / Σχεσιακοί (`==`, `!=`, `<`, `>`, `<=`, `>=`)
  * Λογικοί τελεστές (`&&`, `||`, `!`)
  * Τελεστές Bitwise (`&`, `|`, `^`, `&^`, `<<`, `>>`)
  * Τελεστές εκχώρησης (`=`, `+=`, `-=`, `*=`, κλπ.)
* **3.3. Σειρά Εκτέλεσης & Προτεραιότητα (Order of Evaluation & Precedence)**
  * Προτεραιότητα τελεστών (Operator Precedence) και χρήση παρενθέσεων `()`
  * Πότε υπολογίζεται (evaluate) μια τιμή και πότε εκχωρείται (assign)
  * Όταν έχω expressions με `&&`, `||` για να κερδίσω performance Logical AND/OR Sequencing: In && and || , **the left part is evaluated before the right**.
  * Bραχυκύκλωμα λογικών εκφράσεων (Short-circuit evaluation: π.χ. στο `A() || B()`, αν το `A()` είναι `true`, το `B()` δεν εκτελείται ποτέ)
  * Παγίδες και ακαθόριστη σειρά υπολογισμού σε ορίσματα συναρτήσεων (π.χ. `f(g(), h())`)
* **3.4. Interactive Quiz & Παγίδες Συντακτικού**
  * **Quiz 1:** Η διαφορά των `=` (Simple Assignment) vs `==` (Equality Comparison) vs `:=` (Short Declaration)
  * **Quiz 2:** Γιατί το `if (x = 5)` ακυρώνεται αμέσως από τον compiler της Go (σύνδεση με Statement vs Expression)
  * **Quiz 3:** Εντοπισμός λαθών σε εκφράσεις με `++` / `--` (γιατί απαγορεύεται το `y = x++` στην Go)
* **3.5. VSCode Challenge:**
  * Γράψε ένα πρόγραμμα που αποδεικνύει στην πράξη το Short-circuit evaluation: Φτιάξε δύο συναρτήσεις `checkA() bool` (που τυπώνει "Executed A" και επιστρέφει `true`) και `checkB() bool` (που τυπώνει "Executed B" και επιστρέφει `true`). Κάλεσε `checkA() || checkB()` σε μια `if` και επιβεβαίωσε στο terminal ότι η `checkB` δεν εκτελέστηκε ποτέ.

---

## 4. Έλεγχος Ροής Προγράμματος (Control Flow)
* **4.1. Συνθήκες `if` / `else if` / `else`**
  * Βασική σύνταξη και λογικοί τελεστές (`&&`, `||`, `!`)
  * Χρήση της `if` με αρχική πρόταση (If with a short statement: `if err := ...; err != nil`)
  * Εμβέλεια μεταβλητών (scope) μέσα στα blocks της `if` (όπως θα δούμε και στο 6.4 αναλυτικά)
  * Συνήθεις παγίδες και καλές πρακτικές (Early returns / Guard clauses)
  * Παράδειγμα πρόγραμμα που δέχεται δύο αριθμούς και εμφανίζει το μεγαλύτερο (spoiler tag)
* **4.2. Πολλαπλή Επιλογή με `switch`**
  * Βασική δομή της `switch` (αυτόματο `break`, χωρίς ανάγκη για χειροκίνητη διακοπή)
  * Χρήση πολλαπλών τιμών σε μία case (`case 1, 2, 3:`)
  * `switch` χωρίς έκφραση (Tagless switch - εναλλακτική για πολλά `if-else`)
  * Η λέξη-κλειδί `default` και πότε χρησιμοποιείται
* **4.3. Παγίδες και χρήσιμα πράγματα για τα if**
  *. Η παγίδα του Shadowing με το Short Statement (:= αντι για = σε μεταβλητή που ήδη υπάρχει) (όπως θα δούμε και στο 6.4)
  * Ξεχασμένη αρχικοποίηση μεταβλητών

  ## 5. 5. Επαναλήψεις & Loops
* **5.1. Επαναλήψεις με τη `for` (Η μοναδική λούπα της Go)**
  * Standard `for` loop (με αρχικοποίηση, συνθήκη, βήμα)
  * σκέτη `for` λούπα μόνο με συνθήκη)
  * Ατέρμων λούπα (Infinite loop: `for {}`)
  * Έλεγχος εκτέλεσης με `break` και `continue`
  * Χρήση labels για διακοπή εξωτερικών loops (Labeled break/continue)
* **5.2. VSCode Challenge:**
  * Γράψε το παιχνίδι "FizzBuzz" για τους αριθμούς 1 έως 20 χρησιμοποιώντας μία `for` loop και μία `switch` χωρίς έκφραση (tagless switch). (Τύπωσε "Fizz" για πολλαπλάσια του 3, "Buzz" για του 5, "FizzBuzz" για και τα δύο, ή τον ίδιο τον αριθμό).
* **5.3. Παγίδες και χρήσιμα πράγματα για τα loops**
  * ατέρμονες λούπες
(σημειωση. δεν εχουμε δει ακομα τι ειναι array/slice κλπ. αυτά τα loops δεν πρεπει να εχουν arrays!)

---

## 6. Συναρτήσεις (Functions) & Εμβέλεια Μεταβλητών (Scope)
* **6.1. Ανατομία μιας Συνάρτησης**
  * Ορισμός και κλήση συναρτήσεων
  * Παράμετροι και τύποι παραμέτρων
  * Συμπτυγμένοι τύποι παραμέτρων (π.χ. `x, y int`)
* **6.2. Τιμές Επιστροφής (Return Values)**
  * Συνάρτηση με μία τιμή επιστροφής
  * Πολλαπλές τιμές επιστροφής (Multiple return values)
  * Ονοματισμένες τιμές επιστροφής (Named return values) και Naked returns
* **6.3. Μεταβλητός Αριθμός Παραμέτρων**
  * Variadic functions (`...int`)
* **6.4. Εμβέλεια (Scope) & Διάρκεια Ζωής (Lifetime) Μεταβλητών**
  * Τοπικές (Local) vs Καθολικές (Global / Package-level) μεταβλητές
  * Διάρκεια ζωής (lifetime) μιας μεταβλητής στη μνήμη
  * Block scope (εμβέλεια εντός παρενθέσεων `{}`)
  * Η σημασία του αρχικού κεφαλαίου γράμματος (Exported vs Unexported identifiers)
* **6.5. Γλωσσάρι Χρωμάτων Συντακτικού (Syntax Highlighting Glossary)**
  * Σημασία και ρόλος του κάθε χρώματος στον κώδικα Go (Keywords, Types, Functions, Strings, Variables, Packages, Comments)
* **6.6. VSCode Challenge:**
  * Δημιούργησε μια συνάρτηση `divide(a, b float64) (float64, bool)` που επιστρέφει το αποτέλεσμα της διαίρεσης και `true`, ή `0` και `false` αν το `b` είναι `0` (Zero Division Prevention). Κάλεσέ την στη `main` χρησιμοποιώντας το `if with short statement` μοτίβο: `if res, ok := divide(10, 2); ok { ... }`.

---

## 7. Δείκτες (Pointers) & Διαχείριση Μνήμης
* **7.1. Εισαγωγή στους Δείκτες**
  * Τι είναι η διεύθυνση μνήμης και τι ο δείκτης
  * Ο τελεστής διεύθυνσης `&` (Address-of operator)
  * Ο τελεστής αποαναφοράς `*` (Dereference operator)
  * Η μηδενική τιμή ενός δείκτη (`nil`)
* **7.2. Πέρασμα Παραμέτρων: By Value vs By Reference**
  * Πώς η Go περνάει τα πάντα με τιμή (Pass by value)
  * Τροποποίηση μεταβλητών εκτός συνάρτησης με χρήση δεικτών
  * Πότε πρέπει να χρησιμοποιούμε δείκτες και πότε όχι
* **7.3. VSCode Challenge:**
  * Γράψε μια συνάρτηση `zeroValue(val int)` που προσπαθεί να μηδενίσει μια μεταβλητή (by value) και μια συνάρτηση `zeroPointer(val *int)` που τη μηδενίζει πραγματικά μέσω δείκτη. Τύπωσε τη διεύθυνση μνήμης (`&x`) και την τιμή της μεταβλητής στη `main` πριν και μετά από κάθε κλήση.

---

## 8. Συλλογές Δεδομένων (Arrays, Slices & Maps)
* **8.1. Πίνακες (Arrays)**
  * Δήλωση και αρχικοποίηση αμετάβλητου μεγέθους πινάκων
  * Προσπέλαση και τροποποίηση στοιχείων
  * Περιορισμοί των Arrays στη Go
* **8.2. Slices (Δυναμικοί Πίνακες)**
  * Τι είναι το Slice και πώς διαφέρει από το Array
  * Ανατομία ενός Slice: Pointer, Length (`len`), Capacity (`cap`)
  * Δημιουργία Slices με `make`, literals, ή slicing υπάρχοντος πίνακα (`a[start:end]`)
  * Προσθήκη στοιχείων με την `append` και επανεκχώρηση μνήμης
  * Αντιγραφή Slices με την `copy`
* **8.3. Προσπέλαση Συλλογών**
  * Ταξιδεύουμε τα Slices με απλή for
  * Ταξιδεύουμε τα Slices και Arrays με `range` (λήψη index και value)
  * Συγκρίνουμε τα 2 από πάνω διαφορές-ομοιότητες και πλεονεκτηματα-μειονεκτήματα
  * panic σε for μεγάλη προσοχή, με παραδείγματα! Και λοιπές παγίδες
  * Παράλειψη μεταβλητών με τον τελεστή `_` (Blank identifier)
* **8.4. Χάρτες (Maps - Key/Value Pairs)**
  * Δήλωση και αρχικοποίηση Maps με `make` και literals
  * Προσθήκη, ενημέρωση και διαγραφή στοιχείων (`delete`)
  * Έλεγχος ύπαρξης κλειδιού (το μοτίβο `val, ok := m[key]`)
  * Διάσχιση Map με `for range` (μη εγγυημένη σειρά εκτέλεσης)
* **8.5. VSCode Challenge:**
  * Δημιούργησε έναν map που μετράει τη συχνότητα εμφανίσεων λέξεων σε ένα slice από strings `words := []string{"apple", "orange", "pear", "orange", "apple", "apple", "pear", "pear", "apple"}`. Διάσχισε το slice με loop και στη συνέχεια τύπωσε τα αποτελέσματα του map δηλαδή τον αριθμό εμφάνισης κάθε λέξης.



  
---
---
---
---
---
//    ┏━┓┏━┓┏━┓╺┳╸   ┏━┓
//    ┣━┛┣━┫┣┳┛ ┃    ┏━┛
//    ╹  ╹ ╹╹┗╸ ╹    ┗━╸
---
---
---
---
---

# Αναλυτικός Οδηγός Περιεχομένων Μαθημάτων Go (Μέρος 2)

## 1. Packages & Οργάνωση Project (Architecture)
* **1.1. Go Modules**
  * Δημιουργία νέου module με `go mod init`
  * Κατανόηση των αρχείων `go.mod` και `go.sum`
  * Διαχείριση εξωτερικών εξαρτήσεων (dependencies)
* **1.2. Packages (Πακέτα)**
  * Ορισμός package στην αρχή του αρχείου
  * Εισαγωγή packages (`import`) και alias
  * Ορατότητα και Προσβασιμότητα (Exported vs Unexported identifiers)
  * Η ειδική συνάρτηση αρχικοποίησης `init()`
* **1.3. Δομή και Οργάνωση Go Projects**
  * Οργάνωση κώδικα σε υποπακέτα (sub-packages)
  * Σωστή εισαγωγή υποπακέτων (`import "mymodule/subpackage"`)
  * Αποφυγή κυκλικών εξαρτήσεων (Circular dependencies)
  * Standard Project Layout (φάκελοι `/cmd`, `/pkg`, `/internal`)

---

## 2. Εισαγωγή-Έξοδος & Ορίσματα CLI (`os`, `os.Args`)
* **2.1. Ορίσματα Γραμμής Εντολών (`os.Args`)**
  * Ανάγνωση παραμέτρων εισόδου από το τερματικό με το `os.Args`
  * Διάσχιση και επεξεργασία των ορισμάτων (`os.Args[1:]`)
* **2.2. Ειδικές εντολές με - παύλα στην αρχή. Που χρησιμοποιούνται, πώς μπορώ να τις ανιχνεύσω πιο εύκολα (`πακέτο flag`)**

---

## 3. Θεμελιώδη Λογικά & Δομικά Μοτίβα Κώδικα

* **3.1. Μοτίβα Ελέγχου Ροής & Μεταβλητών (Control Flow & State Patterns)**
  * **Σημασία / Διακόπτης (Flag / Bool Switch):**
    * Χρήση boolean για την παρακολούθηση κατάστασης (state tracking)
    * Πρόωρη διακοπή λούπας (early break) μόλις ικανοποιηθεί μια συνθήκη (π.χ. `isFound`, `hasError`, `isSorted`)
  * **Τιμή Φρουρού (Sentinel Value):**
    * Ειδικές τιμές τερματισμού εισόδου ή επεξεργασίας (π.χ. `-1`, `EOF`, empty string `""`)
    * Διαχωρισμός πραγματικών δεδομένων από σήματα ελέγχου
  * **Συσσωρευτής (Accumulator Pattern):**
    * Τεχνικές άθροισης (sum), γινομένου (product), συνένωσης (string concatenation) και καταμέτρησης (counters)
    * Αρχικοποίηση συσσωρευτή βάσει ουδέτερου στοιχείου (`0` για πρόσθεση, `1` για πολλαπλασιασμό)
  * **Εκτήκτης / Ελάχιστο-Μέγιστο (Extremum Pattern - Min/Max Finding):**
    * Εύρεση μέγιστης/ελάχιστης τιμής σε συλλογή
    * Σωστή αρχικοποίηση (χρήση πρώτου στοιχείου vs `math.MaxInt` / `math.MinInt`)
  * **Εναλλάκτης Κατάστασης (State Toggle / Alternating Pattern):**
    * Εναλλαγή μεταξύ δύο καταστάσεων (π.χ. `flag = !flag`, παίκτης A / παίκτης B, ζυγός / μονός δείκτης)
  * **Κατώφλι / Όριο (Threshold / Limit Pattern):**
    * Έλεγχος ορίων (π.χ. max retries, rate limiting, buffer limits)
    * Χρήση μετρητή προσπαθειών σε λούπα `for`
  * **Φρουρός Guard Clause / Early Return:**
    * Αποφυγή βαθιάς εμφώλευσης (`nested ifs`) με πρόωρη επιστροφή (`return` / `continue`) μόλις αποτύχει μια συνθήκη
  * **Παρακολούθηση Προηγούμενης Τιμής (Previous Value / Lagging Pointer Pattern):**
    * Αποθήκευση της τιμής του προηγούμενου βήματος (`prev = current`) για σύγκριση διαδοχικών στοιχείων (π.χ. εύρεση διπλότυπων, εντοπισμός αλλαγής τάσης)
  * **Δεξαμενή / Κατηγοριοποίηση (Bucketing / Frequency Map Pattern):**
    * Καταμέτρηση συχνότητας εμφάνισης στοιχείων με χρήση πίνακα (Direct Indexing) ή `map[rune]int` / `map[string]int` (π.χ. αναγράμματα, συχνότητα γραμμάτων)

* **3.2. Μοτίβα Διάσχισης Πινάκων & Slices**
  * Εμφωλευμένοι βρόχοι (Nested Loops / Διπλές λούπες) για 2D πίνακες
  * Τεχνική δύο δεικτών (Two Pointers Pattern) για αναζήτηση και αντιστροφή
  * Ολισθαίνον παράθυρο (Sliding Window Pattern) για υπο-ακολουθίες

* **3.3. Πολυπλοκότητα Αλγορίθμων (Big O Notation)**
  * Εισαγωγή στην πολυπλοκότητα χρόνου και μνήμης (Time & Space Complexity)
  * Κατανόηση των $O(1)$, $O(n)$, $O(n^2)$, $O(\log n)$

---

## 4. Βασικές Δομές Δεδομένων (Data Structures)
* **4.1. Στοίβα (Stack - LIFO)**
  * Έννοια Last-In, First-Out
  * Υλοποίηση Στοίβας με Go Slices (`Push`, `Pop`, `Peek`)
  * Πρακτικές εφαρμογές (αντιστροφή συμβολοσειράς, έλεγχος παρενθέσεων)
* **4.2. Ουρά (Queue - FIFO)**
  * Έννοια First-In, First-Out
  * Υλοποίηση Ουράς με Go Slices (`Enqueue`, `Dequeue`)
  * Διπλή Ουρά (Deque - Double Ended Queue)

---

## 5. Αλγόριθμοι Ταξινόμησης & Αναζήτησης
* **5.1. Αλγόριθμοι Αναζήτησης (Searching)**
  * Γραμμική Αναζήτηση (Linear Search - $O(n)$)
  * Δυαδική Αναζήτηση (Binary Search - $O(\log n)$) σε ταξινομημένα Slices
* **5.2. Βασικοί Αλγόριθμοι Ταξινόμησης (Elementary Sorting)**
  * Ταξινόμηση Φυσαλίδας (Bubble Sort)
  * Ταξινόμηση με Επιλογή (Selection Sort)
  * Ταξινόμηση με Εισαγωγή (Insertion Sort)
* **5.3. Προηγμένοι Αλγόριθμοι Ταξινόμησης (Advanced Sorting)**
  * Ταξινόμηση με Συγχώνευση (Merge Sort)
  * Γρήγορη Ταξινόμηση (Quick Sort)

---

## 6. Αναδρομή & Διαίρει και Βασίλευε
* **6.1. Αναδρομή (Recursion)**
  * Βασική έννοια και συνθήκη τερματισμού (Base Case vs Recursive Step)
  * Η στοίβα κλήσεων (Call Stack) και ο κίνδυνος Stack Overflow
  * Παραδείγματα: Παραγοντικό, Ακολουθία Fibonacci
* **6.2. Διαίρει και Βασίλευε (Divide and Conquer)**
  * Διάσπαση προβλήματος σε υποπροβλήματα, επίλυση και συνένωση
  * Εφαρμογή σε Merge Sort, Quick Sort και Binary Search
* **6.3. Διάσχιση Γράφων & Δέντρων**
  * Αναδρομική Διάσχιση σε Βάθος (Depth-First Search - DFS)
  * Διάσχιση σε Πλάτος (Breadth-First Search - BFS) με χρήση Queue

---

## 7. Άπληστοι Αλγόριθμοι (Greedy Algorithms) & Επιστροφή (Backtracking)
* **7.1. Άπληστοι Αλγόριθμοι (Greedy Algorithms)**
  * Η φιλοσοφία της τοπικά βέλτιστης επιλογής (Locally optimal choice)
  * Πότε λειτουργεί και πότε αποτυγχάνει η άπληστη στρατηγική
  * Παραδείγματα: Πρόβλημα των ρέστων (Coin Change), scheduling/activity selection
* **7.2. Επιστροφή (Backtracking)**
  * Συστηματική δοκιμή λύσεων βήμα-βήμα και υπαναχώρηση
  * Κατασκευή δέντρου αποφάσεων (State Space Tree)
* **7.3. Πρακτικές Εφαρμογές Backtracking**
  * Επίλυση Λαβυρίνθου (Maze Solving)
  * Πρόβλημα των Ν-Βασιλισσών (N-Queens)
  * Sudoku Solver

---

## 8. Δυναμικός Προγραμματισμός (Dynamic Programming)
* **8.1. Θεμελιώδεις Αρχές Δυναμικού Προγραμματισμού**
  * Επικάλυψη υποπροβλημάτων (Overlapping subproblems)
  * Βέλτιστη υποδομή (Optimal substructure)
* **8.2. Τεχνικές Υλοποίησης**
  * Απομνημόνευση (Memoization - Top-Down approach)
  * Τακτική πίνακα (Tabulation - Bottom-Up approach)
  * Σύγκριση αναδρομικής vs DP προσέγγισης (χρονική/χωρική πολυπλοκότητα)
* **8.3. Κλασικά Προβλήματα DP**
  * Βέλτιστο Coin Change Problem
  * Πρόβλημα του Σακιδίου (0/1 Knapsack Problem)
  * Μεγαλύτερη Κοινή Υποακολουθία (Longest Common Subsequence)

  
---
---
---
---
---
//    ┏━┓┏━┓┏━┓╺┳╸   ┏━┓
//    ┣━┛┣━┫┣┳┛ ┃    ╺━┫
//    ╹  ╹ ╹╹┗╸ ╹    ┗━┛
---
---
---
---
---

  # Αναλυτικός Οδηγός Περιεχομένων Μαθημάτων Go Μέρος 3

## 1. Error Handling & Standard Packages Overview
* **1.1. Η Φιλοσοφία του Error Handling στη Go**
  * Γιατί η Go δεν χρησιμοποιεί Exceptions (`try/catch`) και ποιες οι αρχιτεκτονικές συνέπειες
  * Τα σφάλματα ως κανονικές τιμές (Errors as Values)
  * Το ενσωματωμένο `error` interface: Ανατομία και υλοποίηση
* **1.2. Δημιουργία & Διαχείριση Σφαλμάτων**
  * Δημιουργία απλών σφαλμάτων με το `errors.New`
  * Διαμορφωμένα σφάλματα με το `fmt.Errorf`
  * Το θεμελιώδες μοτίβο `if err != nil` και η λογική του Guard Clause
* **1.3. Panic, Recover & Defer**
  * Η λέξη-κλειδί `defer`: Στοίβα εκτέλεσης (LIFO execution) και εγγυημένη αποδέσμευση πόρων
  * Πότε επιτρέπεται το `panic` (μη ανακτήσιμα σφάλματα συστήματος vs application logic)
  * Μηχανισμός `recover`: Περιορισμός της ζημιάς, αποφυγή crash και μετατροπή panics σε κανονικά errors

---

## 2. Αναλυτική Χρήση Θεμελιωδών Standard Packages
* **2.1. Πακέτο `strings`**
  * Αναζήτηση και έλεγχος υποσυμβολοσειρών (`Contains`, `HasPrefix`, `HasSuffix`, `Index`, `Count`)
  * Μετασχηματισμός και καθαρισμός (`ToLower`, `ToUpper`, `TrimSpace`, `Trim`, `ReplaceAll`)
  * Τεμαχισμός και συνένωση (`Split`, `Fields`, `Join`)
  * Αποδοτική κατασκευή string χωρίς allocations με το `strings.Builder`
  * Συγκρίσεις και αντιστοίχιση χαρακτήρων (`Compare`, `EqualFold`)
* **2.2. Πακέτο `strconv` & Σύνδεση με Error Handling**
  * Μετατροπή string σε ακέραιους και δεκαδικούς (`strconv.Atoi`, `strconv.ParseInt`, `strconv.ParseFloat`)
  * Μετατροπή αριθμών σε string (`strconv.Itoa`, `strconv.FormatInt`, `strconv.FormatFloat`)
  * Χειρισμός σφαλμάτων μετατροπής: Αναγνώριση `strconv.ErrSyntax` και `strconv.ErrRange`
  * Parsing λογικών τιμών (`strconv.ParseBool`) και quote/unquote συμβολοσειρών
* **2.3. Πακέτο `os` & Αλληλεπίδραση με το Σύστημα**
  * Διαχείριση αρχείων και καταλόγων (`os.Open`, `os.Create`, `os.Remove`, `os.MkdirAll`, `os.ReadDir`)
  * Πληροφορίες αρχείων και δικαιώματα (`os.Stat`, `os.FileInfo`, `os.FileMode`)
  * Περιβαλλοντικές μεταβλητές (`os.Getenv`, `os.Setenv`, `os.Unsetenv`, `os.Environ`)
  * Έξοδος από το πρόγραμμα με το `os.Exit` και η σύνδεσή της με το Error Handling
  * Γιατί το `os.Exit` τερματίζει ακαριαία τη διεργασία παρακάμπτοντας τις `defer` συναρτήσεις
* **2.4. Πακέτο `io` & Αφαιρέσεις Εισόδου/Εξόδου**
  * Τα θεμελιώδη interfaces `io.Reader`, `io.Writer`, `io.Closer` και `io.Seeker`
  * Σύνθετα interfaces: `io.ReadWriter`, `io.ReadCloser`, `io.WriteCloser`
  * Αντιγραφή και ανάγνωση ροών δεδομένων (`io.Copy`, `io.CopyBuffer`, `io.ReadAll`, `io.LimitReader`)
* **2.5. Ανάγνωση & Εγγραφή Αρχείων (`os`, `io`)**
  * Ανάγνωση ολόκληρου αρχείου με `os.ReadFile`
  * Δημιουργία και εγγραφή σε αρχεία με `os.WriteFile` και `os.Create`
  * Άνοιγμα, προσάρτηση (append) και διαχείριση file descriptors (`os.OpenFile`)
* **2.6. Buffering & Ροές Δεδομένων (`bufio`)**
  * Χρήση του `bufio.Scanner` για ανάγνωση γραμμή-γραμμή (line-by-line)
  * 1. **`ScanLines` (Default):** Για logs, ρυθμίσεις, κείμενα. 2. **`ScanRunes`:** Για επεξεργασία κειμένου γράμμα-γράμμα. 3. **`ScanWords`:** Για μέτρηση λέξεων. 4. **`ReadString(delim)`:** Όταν ξέρεις ακριβώς σε ποιο σύμβολο θέλεις να σταματάς. 5. **Χρήση custom split function με το scanner.Split(split)** 
  * Ανάγνωση εισόδου χρήστη από το τερματικό (`os.Stdin`)
  * Χρήση `bufio.Writer` για αποδοτική εγγραφή μεγάλων δεδομένων
* **2.7. Σύνοψη τρόπων ανάγνωσης**
  * Α. Η "Γρήγορη" Μέθοδος (`os.ReadFile`)
  * Β. Η Μέθοδος με Buffer (`os.Open` + `Read`)
  * Γ. Η Μέθοδος "Γραμμή-Γραμμή" (`bufio.NewScanner`)
  * Διαφορές και πλεονεκτήματα/μειονεκτήματα


---

## 3. Structs σε Βάθος
* **3.1. Εισαγωγή στα Structs**
  * Τι είναι το Struct και γιατί αντικαθιστά τις κλάσεις (Classes)
  * Ορισμός Struct με τη σύνταξη `type ... struct`
  * Πεδία (Fields), τύποι δεδομένων και ευθυγράμμιση μνήμης (Memory Alignment / Field Padding)
* **3.2. Αρχικοποίηση & Προσπέλαση**
  * Struct Literals: Positional vs Named Field initialization
  * Προσπέλαση και τροποποίηση πεδίων με τον τελεστή τελεία (`.`)
  * Zero Values σε Structs και χρήση κατασκευαστών (Constructor Functions: `NewXxx(...)`)
* **3.3. Advanced Struct Concepts**
  * Ανώνυμα Structs (Anonymous Structs) και η χρήση τους σε inline testing ή JSON payloads
  * Δείκτες σε Structs (Pointers to Structs) και αυτόματη αποαναφορά (Auto-dereferencing)
  * Struct Tags (π.χ. `` `json:"name" xml:"Name"` ``) για Serialization/Deserialization
  * Σύγκριση Structs (Comparable vs Non-comparable structs)
  * Empty Struct (struct{}) και πώς χρησιμοποιείται για εξοικονόμηση μνήμης (π.χ. υλοποίηση Sets ως map[string]struct{})
* **3.4. Struct Composition (Σύνθεση αντί για Κληρονομικότητα)**
  * Embedded Structs (Ενσωμάτωση Struct μέσα σε άλλο Struct - Anonymous Fields)
  * Promoted Fields (Προαγόμενα πεδία) και Shadowing πεδίων
  * Γιατί η Go προτιμά το Composition (Σύνθεση) από το Inheritance (Κληρονομικότητα)

---

## 4. Methods
* **4.1. Εισαγωγή στα Methods**
  * Τι είναι ένα Method στη Go και πώς διαφέρει από μια απλή Function
  * Η έννοια του Receiver (Παραλήπτης): Σύνδεση συμπεριφοράς με δεδομένα
  * Πώς τα Methods προσομοιώνουν την OOP συμπεριφορά χωρίς την ανάγκη κλάσεων
* **4.2. Value Receivers vs Pointer Receivers**
  * Value Receiver: Εργασία με αντίγραφο του Struct (Immutability, Safety)
  * Pointer Receiver: Τροποποίηση του αρχικού Struct (Mutation) και αποφυγή αντιγραφής μνήμης σε μεγάλα structs
  * Κανόνες και βέλτιστες πρακτικές επιλογής μεταξύ Value και Pointer Receiver
  * Συνεπής χρήση Receiver Types σε όλο το Method Set ενός Struct
* **4.3. Advanced Method Patterns**
  * Methods σε custom non-struct τύπους (π.χ. `type Celsius float64`, `type StringSet map[string]struct{}`)
  * Method Sets: Διαφορές στους κανόνες κλήσης μεταξύ τιμών (`T`) και δεικτών (`*T`)
  * Method Values (δέσμευση μεθόδου σε μεταβλητή) vs Method Expressions (κλήση μέσω του τύπου)
  * Προαγωγή μεθόδων (Method Promotion) μέσω Embedded Structs

---

## 5. Interfaces
* **5.1. Θεμελιώδεις Αρχές των Interfaces**
  * Τι είναι ένα Interface: Συμβόλαιο συμπεριφοράς (Behavioural Contract)
  * Ορισμός Interface με τη σύνταξη `type ... interface`
  * Η αρχή του Duck Typing: "If it walks like a duck and quacks like a duck..."
* **5.2. Implicit Implementation (Έμμεση Υλοποίηση)**
  * Πώς ένας τύπος υλοποιεί ένα Interface αυτόματα
  * Πλεονεκτήματα της έμμεσης υλοποίησης στην αποσύζευξη (Decoupling) και στο Unit Testing (Mock Implementations)
* **5.3. Θεωρία Πολυμορφισμού στη Go (Polymorphism)**
  * **Τι είναι Πολυμορφισμός:** Η ικανότητα διαφορετικών τύπων δεδομένων να αντιμετωπίζονται μέσω μιας κοινής διεπαφής (One interface, many forms).
  * **Πώς διαφέρει η Go:** Απουσία κληρονομικότητας (no `extends`/`super`) — Ο πολυμορφισμός στη Go βασίζεται αποκλειστικά στη **συμπεριφορά (behavior)** και όχι στην ιεραρχία κλάσεων.
  * **Compile-time vs Runtime dispatch:** Πώς η Go γνωρίζει ποια μέθοδο να καλέσει dynamic στο runtime.
* **5.4. Advanced Interface Usage**
  * Dynamic Type και Dynamic Value ενός Interface (Εσωτερική δομή interface tuple)
  * Το παγιδευτικό σφάλμα: Interface που περιέχει `nil` pointer ΔΕΝ είναι `nil` interface (`i == nil` vs `ptr == nil`)
  * Empty Interface (`interface{}` / `any`) και πότε πρέπει να αποφεύγεται
  * Type Assertions (`val, ok := i.(ConcreteType)`) για ασφαλή ανάκτηση του αρχικού τύπου
  * Type Switches (`switch v := i.(type)`) για χειρισμό πολλαπλών τύπων
  * Interface Composition (Σύνθεση μικρών Interfaces σε μεγαλύτερα, π.χ. `io.ReadWriter`)
  * Η χρυσή αρχή της Go: "Keep interfaces small" (Interface Segregation Principle)
* **5.5. VSCode Challenge:**
  * Δημιούργησε ένα interface `Shape` με τη μέθοδο `Area() float64`. Φτιάξε δύο structs (`Rectangle` και `Circle`) που την υλοποιούν. Γράψε μια συνάρτηση `PrintArea(s Shape)` που δέχεται οτιδήποτε είναι `Shape` και τυπώνει το εμβαδόν του (αποδεικνύοντας τον πολυμορφισμό στην πράξη).

---

## 6. Πολυμορφισμός στην Πράξη: `*os.File` vs `io.Reader` / `io.Writer`
* **6.1. Η Φιλοσοφία του I/O στη Standard Library της Go**
  * Γιατί το I/O στην Go είναι το κορυφαίο παράδειγμα σχεδιασμού με Interfaces
  * Η διαφορά μεταξύ ενός Concrete Type (`*os.File`) και ενός Abstraction (`io.Reader`, `io.Writer`)
  * Γιατί η εξάρτηση από συγκεκριμένους τύπους (Concrete Types) κάνει τον κώδικα δύσκολο στη δοκιμή (Hard to test)
* **6.2. Ανατομία των `io.Reader` & `io.Writer`**
  * Μελέτη του `io.Reader`: Η μέθοδος `Read(p []byte) (n int, err error)`
  * Μελέτη του `io.Writer`: Η μέθοδος `Write(p []byte) (n int, err error)`
  * Πώς το `*os.File` υλοποιεί ταυτόχρονα και τα δύο interfaces
* **6.3. Πραγματικός Πολυμορφισμός (Piping Data Anywhere)**
  * Πώς η ίδια συνάρτηση επεξεργασίας δεδομένων μπορεί να διαβάσει αδιάφορα από:
    * Αρχείο στο δίσκο (`*os.File`)
    * Δίκτυο / HTTP Request Body (`net.Conn`, `http.Request.Body`)
    * In-memory Buffer (`*bytes.Buffer`, `*strings.Reader`)
    * Standard Input (`os.Stdin`)
  * Χρήση της `io.Copy(dst Writer, src Reader)` ως το απόλυτο παράδειγμα πολυμορφισμού
* **6.4. Παγίδες, Anti-patterns & Testing Benefits**
  * **Tight Coupling Pitfall:** Γιατί **δεν** πρέπει να ζητάμε `*os.File` ως όρισμα σε συνάρτηση αν θέλουμε απλά να διαβάσουμε/γράψουμε δεδομένα.
  * **Unit Testing χωρίς πραγματικά αρχεία (Mocking I/O):** Πώς αντικαθιστούμε ένα πραγματικό αρχείο με ένα `bytes.Buffer` στα tests για ταχύτητα και απομόνωση.
  * **Buffer Re-use & Partial Reads Trap:** Πώς διαχειριζόμαστε σωστά το slice `p []byte` στο `Read()` χωρίς να υποθέτουμε ότι διαβάστηκαν όλα τα bytes με τη μία.
* **6.5. VSCode Challenge:**
  * Γράψε μια συνάρτηση `CountLines(r io.Reader) (int, error)` που μετράει τις γραμμές οποιασδήποτε πηγής δεδομένων. Στη `main`, κάλεσέ την δύο φορές: μία περνώντας της ένα πραγματικό αρχείο (`*os.File`) και μία περνώντας της ένα `strings.NewReader("Line1\nLine2\nLine3")` για να αποδείξεις ότι λειτουργεί πολυμορφικά χωρίς να νοιάζεται για την πηγή!

---

## 7. Αρχιτεκτονικά Μοτίβα & Δομικά Patterns
* **7.1. Pipeline Pattern (Αρχιτεκτονική Διοχέτευσης)**
  * Τι είναι το Pipeline Pattern: Στάδια επεξεργασίας δεδομένων σε αυστηρή σειρά (Stage 1 -> Stage 2 -> Stage 3)
  * Υλοποίηση Pipeline με χρήση Slices, Functions & Interfaces (Synchronous Processing)
  * Παράδειγμα: Data Validation, Transformation & Sanitization Pipeline
* **7.2. Finite State Machine - FSM (Μηχανή Πεπασμένων Καταστάσεων)**
  * Έννοιες: Καταστάσεις (States), Συμβάντα (Events), Μεταβάσεις (Transitions)
  * Απλή υλοποίηση FSM στη Go με Switch!
  * 2η Υλοποίηση με Enums
  * 3η Υλοποίηση με Map (Πίνακας Μεταβάσεων)
  * Οι Διαφορές ανάμεσα σε 2 και 3, πλεονεκτήματα και μειονεκτήματα
  * 4η Υλοποίηση FSM Βασισμένη σε Callbacks / Hooks
  * Οι Διαφορές ανάμεσα σε 3 και 4, πλεονεκτήματα και μειονεκτήματα
  * 5η Υλοποίηση FSM στη Go με Structs, Enums (`iota`), Maps και Interfaces (State Pattern)
  * Οι Διαφορές ανάμεσα σε 3 4 και 5, πλεονεκτήματα και μειονεκτήματα και γενικότερα ένα συμπέρασμα
  * Παράδειγμα: Σύστημα κατάστασης παραγγελίας e-shop (Pending -> Paid -> Shipped -> Delivered)
* **7.3. Command Pattern & Strategy Pattern**
  * **Strategy Pattern:** Εναλλαγή αλγορίθμων κατά τον χρόνο εκτέλεσης με τη χρήση Interfaces (π.χ. διαφορετικές στρατηγικές πληρωμής: CreditCard, PayPal, Crypto)
  * **Command Pattern:** Encapsulation αιτημάτων ως αντικείμενα/structs με μέθοδο `Execute()` (π.χ. Undo/Redo operations, Job queues)
* **7.4. Builder Pattern & Functional Options Pattern**
  * **Builder Pattern:** Σταδιακή κατασκευή σύνθετων Structs με αλυσιδωτές κλήσεις μεθόδων (Method Chaining)
  * **Functional Options Pattern:** Κατασκευή ευέλικτων Structs με προαιρετικές παραμέτρους (Optional Configuration) μέσω συναρτήσεων
  * Αποφυγή τεράστιων constructors και διαχείριση προκαθορισμένων τιμών (Defaults)

---
---
---
---
---
//    ┏━┓┏━┓┏━┓╺┳╸   ╻ ╻
//    ┣━┛┣━┫┣┳┛ ┃    ┗━┫
//    ╹  ╹ ╹╹┗╸ ╹      ╹
---
---
---
---
---

Τι μένει για ολόκληρα courses αναλυτικά
net.http
και
html.template
(εισαγωγή σε html και css)

άλλο

Networks - Cybersecurity και το πακέτο net