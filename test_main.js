
        addContent(`
<div class="title-slide">
  <div class="title-badge"><img src="./icons/week3.png" alt="Course icon" onerror="this.parentElement.innerHTML='<span class=\"fallback\">?</span>'"></div>
  <div class="kicker-line">Zone01 Athens · Piscine 9 · Author: AVGERINOS PAVLOS</div>
  <h1>Piscine Go<br>Week 3 Review</h1>
  <p class="lede">Structs, Maps & Programming Patterns</p>
</div>
`);
        // ══════════════════════════════════════════════════════════════════════
        // ΚΕΦΑΛΑΙΟ 1 — MAPS
        // ══════════════════════════════════════════════════════════════════════

        addContent(`
<div class="eyebrow" id="@maps">Κεφάλαιο 1 / 3 — Maps</div>
<h1>Τι είναι το map</h1>
<p>Το <code>map</code> είναι ένας τύπος μεταβλητής που αποθηκεύει δεδομένα σε μορφή <code>key → value</code>. Κουτάκια με "values" ακριβώς όπως ο πίνακας, αλλά οι "θέσεις" του δεν είναι index 0,1,2 κλπ αλλά έχουν ειδικό "κλειδί/key" που τον τύπο του το διαλέγουμε εμείς.</p>

<h2>Βασική Σύνταξη</h2>
<pre><code class="lang-go">// map[KeyType]ValueType

map[string]int   // συμπεριφέρεται σαν []int
map[rune]string  // συμπεριφέρεται σαν []string</code></pre>

<h2>Το παραπάνω είναι μόνο ο τύπος</h2>
<p>Μην σου φαίνεται παράξενος ο τύπος του map, είναι τύπος μεταβλητής όπως όλα τα παρακάτω:</p>
<p><code>int</code>, <code>bool</code>, <code>string</code>, <code>[]int</code>, <code>[]rune</code>, <code>map[rune]int</code>, <code>map[int]int</code>, <code>map[string]string</code>, <code>map[string][]byte</code> κ.α.</p>
<p>Υπάρχουν εκατοντάδες ζευγάρια <code>key → value</code>, οπότε υπάρχουν και εκατοντάδες συνδυασμοί για τον τύπο του map.</p>
`);

        addContent(`
<div class="eyebrow" id="@maps">Κεφάλαιο 1 / 3 — Maps</div>
<h1>Τι είναι στην πραγματικότητα το map λοιπόν;</h1>

<p>Σκέψου το map σαν ένα σύστημα από lockers με <strong>κουτάκια</strong>. Σε έναν κανονικό πίνακα, τα κουτάκια έχουν αριθμούς απ' έξω (0, 1, 2...). Στο map, εσύ αποφασίζεις τι θα γράφει το "ταμπελάκι" (κλειδί/key) έξω από το κάθε κουτάκι, και τι θα βάλεις μέσα (τιμή/value).</p>
<p>Το μόνο που χρειάζεται είναι να διαλέξεις τον <em>τύπο</em> για τα ταμπελάκια (π.χ. strings) και τον <em>τύπο</em> για το περιεχόμενο (π.χ. ints).</p>
<p>Για παράδειγμα, μπορούμε να φτιάξουμε έναν τηλεφωνικό κατάλογο όπου το όνομα είναι το κλειδί/key (<code>string</code>) και το τηλέφωνο η τιμή/value (<code>int</code>):</p>
<pre><code class="lang-go">var phonebook map[string]int</code></pre>

<svg viewBox="0 0 600 220" style="width: 100%; max-width: 600px; height: auto; color: inherit; display: block; margin: 24px auto; font-family: var(--font-mono); font-size: 14px;"><!-- Key Column --><text x="100" y="20" fill="currentColor" opacity="0.5" font-weight="bold" text-anchor="middle">Key (string)</text><rect x="20" y="40" width="160" height="40" rx="6" fill="rgba(var(--accent-rgb), 0.1)" stroke="var(--accent)" stroke-width="2"/><text x="100" y="65" fill="var(--accent)" text-anchor="middle">"Pavlos"</text><rect x="20" y="100" width="160" height="40" rx="6" fill="rgba(var(--accent-rgb), 0.1)" stroke="var(--accent)" stroke-width="2"/><text x="100" y="125" fill="var(--accent)" text-anchor="middle">"Stella"</text><rect x="20" y="160" width="160" height="40" rx="6" fill="rgba(var(--accent-rgb), 0.1)" stroke="var(--accent)" stroke-width="2"/><text x="100" y="185" fill="var(--accent)" text-anchor="middle">"Sotiris"</text><!-- Arrows --><path d="M 190 60 L 330 60" fill="none" stroke="currentColor" opacity="0.4" stroke-width="2" marker-end="url(#arrow)"/><path d="M 190 120 L 330 120" fill="none" stroke="currentColor" opacity="0.4" stroke-width="2" marker-end="url(#arrow)"/><path d="M 190 180 L 330 180" fill="none" stroke="currentColor" opacity="0.4" stroke-width="2" marker-end="url(#arrow)"/><!-- Value Column --><text x="420" y="20" fill="currentColor" opacity="0.5" font-weight="bold" text-anchor="middle">Value (int)</text><rect x="340" y="40" width="160" height="40" rx="6" fill="rgba(var(--correct-rgb), 0.1)" stroke="var(--correct)" stroke-width="2"/><text x="420" y="65" fill="var(--correct)" text-anchor="middle">6978788081</text><rect x="340" y="100" width="160" height="40" rx="6" fill="rgba(var(--correct-rgb), 0.1)" stroke="var(--correct)" stroke-width="2"/><text x="420" y="125" fill="var(--correct)" text-anchor="middle">6979876543</text><rect x="340" y="160" width="160" height="40" rx="6" fill="rgba(var(--correct-rgb), 0.1)" stroke="var(--correct)" stroke-width="2"/><text x="420" y="185" fill="var(--correct)" text-anchor="middle">6945555555</text><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor"/></marker></defs></svg>

<p>**Αν** το phonebook ήταν συμβατικός πίνακας (slice), θα του ζητούσα την τιμή στην θέση <code>12</code> γράφοντας <code>phonebook[12]</code>, ή την τιμή στην θέση <code>i</code> με <code>phonebook[i]</code>. Τώρα που είναι map (<code>map[string]int</code>) θα του ζητήσω την τιμή «στην θέση» <code>"Pavlos"</code>, ή την τιμή «στην θέση» <code>"Sotiris"</code>:</p>
<pre><code class="lang-go">fmt.Println(phonebook["Pavlos"])</code></pre>
<p>Προφανώς αυτό θα τυπώσει το τηλέφωνο του Παύλου.</p>
`);
        addQuiz([
            {
                q: "Σε έναν συμβατικό πίνακα (array ή slice), τι τύπου είναι ΠΑΝΤΑ η 'θέση' (το index) ενός στοιχείου;",
                options: [
                    "Ακέραιος αριθμός (int), ξεκινώντας από το 0.",
                    "Αλφαριθμητικό (string), δηλαδή \"0\", \"1\", \"2\" κλπ.",
                    "Οποιοσδήποτε τύπος θέλουμε εμείς.",
                    "Μπορεί να είναι ακόμα και αρνητικός αριθμός."
                ],
                correct: 0,
                explain: "Στα Arrays/Slices οι θέσεις είναι αυστηρά ακέραιοι (0, 1, 2...). Αντίθετα, στα Maps διαλέγεις εσύ τι τύπος θα είναι η 'θέση' (το κλειδί)!"
            },
            {
                q: "Σε ένα map, τι τύπου μπορεί να είναι το κλειδί/key;",
                options: [
                    "Οποιοσδήποτε επιτρεπτός τύπος δηλώσουμε εμείς (π.χ. string, int, rune).",
                    "Αυστηρά και μόνο string.",
                    "Αυστηρά και μόνο int.",
                    "Δεν δηλώνουμε τύπο, η Go τον μαντεύει αυτόματα."
                ],
                correct: 0,
                explain: "Όταν δηλώνεις το map (π.χ. map[rune]bool), εσύ αποφασίζεις ότι το κλειδί θα είναι rune. Μπορείς να βάλεις (σχεδόν) ό,τι τύπο θες!"
            },
            {
                q: "Αν έχω τον παρακάτω τηλεφωνικό κατάλογο, πώς διαβάζω το τηλέφωνο του 'Christos';",
                lang: "go",
                code: "var phonebook map[string]int",
                options: [
                    "phonebook[\"Christos\"]",
                    "phonebook[1]",
                    "phonebook(Christos)",
                    "phonebook(\"Christos\")",
                ],
                correct: 0,
                explain: "Όπως στα Arrays βάζουμε brackets [] με τον αριθμό (π.χ. arr[1]), έτσι και στα Maps βάζουμε brackets με το κλειδί/key (π.χ. phonebook[\"Christos\"])."
            },
            {
                q: "Ποια είναι η σωστή σύνταξη (τύπος) ενός map;",
                options: [
                    "map[KeyType]ValueType",
                    "map(KeyType, ValueType)",
                    "map<KeyType, ValueType>",
                    "[KeyType]map[ValueType]"
                ],
                correct: 0,
                explain: "Η λέξη map, ακολουθούμενη από τον τύπο του κλειδιού μέσα σε αγκύλες [], και μετά αμέσως ο τύπος της τιμής."
            }
        ]);

        addFillBlank([
            {
                lang: "go",
                code:
                    `// 1. Θέλουμε ένα map που θα κρατάει τον βαθμό κάθε φοιτητή (από 0 έως 100).
// Το κλειδί/key (ταμπελάκι) είναι το όνομα του φοιτητή.
// Η τιμή/value (περιεχόμενο) είναι ο βαθμός του.

var grades __keyword__[__keytype__]__valuetype__`,
                blanks: [
                    { id: "keyword", answer: "map" },
                    { id: "keytype", answer: "string" },
                    { id: "valuetype", answer: "int" }
                ],
                explain: "Στη δήλωση, το keyword είναι map. Επειδή το κλειδί είναι όνομα (κείμενο) γράφουμε string μέσα στα [], και επειδή ο βαθμός είναι νούμερο γράφουμε int απ' έξω."
            },
            {
                lang: "go",
                code:
                    `// 2. Αφού δηλώσαμε το map μας (grades), τώρα πρέπει να το "φτιάξουμε" στη μνήμη
// (με τη λέξη make) και να εκχωρήσουμε τους βαθμούς.
// Ο Άλκης πήρε 80, η Μαρία πήρε 100, και ο Λευτέρης 45.

grades = make(map[string]int)

__grades1__["Alkis"] = 80
__grades2__["Maria"] = 100
__grades3__["Lefteris"] = 45`,
                blanks: [
                    { id: "grades1", answer: "grades" },
                    { id: "grades2", answer: "grades" },
                    { id: "grades3", answer: "grades" }
                ],
                explain: "Προσπελαύνουμε και αρχικοποιούμε το map πάντα με το όνομά του (grades)! Στο επόμενο slide θα δούμε αναλυτικά τι κάνει αυτή η συνάρτηση make."
            },
            {
                lang: "go",
                code:
                    `// 3. Ήρθε η ώρα να δούμε όλους τους βαθμούς!
// Πώς κάνουμε επανάληψη (loop) σε όλα τα στοιχεία ενός map;

for name, score := range grades {
    fmt.Println("Ο μαθητής", __name__, "πήρε", __score__)
}`,
                blanks: [
                    { id: "name", answer: "name" },
                    { id: "score", answer: "score" }
                ],
                explain: "Αν και θα το δούμε αναλυτικά αργότερα, η 'for range' σε ένα map επιστρέφει πάντα 2 πράγματα σε κάθε βήμα: το κλειδί (εδώ το name) και την τιμή (το score). Εδώ απλά εκτυπώνουμε αυτές τις μεταβλητές!"
            },
            {
                lang: "go",
                code:
                    `// 4. Μόλις δεχθήκαμε ένα... ύποπτο τηλεφώνημα.
// Ο Λευτέρης "πρέπει" να περάσει το μάθημα!
// Πώς μπορούμε να του αυξήσουμε τον βαθμό κατά 10;
// Έπειτα να τυπώσουμε τον νεο βαθμό του.

grades[__key__] = grades["Lefteris"] + 10

fmt.Println(__grades__["Lefteris"])`,
                blanks: [
                    { id: "key", answer: "\"Lefteris\"" },
                    { id: "grades", answer: "grades" }
                ],
                explain: "Η αλλαγή μιας τιμής σε ένα map είναι ακριβώς όπως και στον πίνακα! Χρησιμοποιείς απλά τα brackets [] με το κλειδί/key και αναθέτεις τη νέα τιμή."
            }
        ]);


        addContent(`
        <div class="eyebrow" id="@maps">Κεφάλαιο 1 / 3 — Maps</div>
<h2>Δήλωση & Αρχικοποίηση</h2>
<p>Το map πρέπει να αρχικοποιηθεί με <code>make</code>, αλλιώς είναι <strong>nil</strong>.</p>
<pre><code class="lang-go">// Αναλυτικά:
var m map[string]int 
m = make(map[string]int)
</code></pre>
<pre><code class="lang-go">// Σύντομα:
m := make(map[string]int)</code></pre>
<pre><code class="lang-go">// Με literal:
m := map[string]int{  
    "Jonas":  16,  
    "Martha": 17,  
}</code></pre>

<div class="callout warning"><span class="tag">Συχνό Λάθος</span>
Αν δηλώσεις ένα map χωρίς make, δεν μπορείς να γράψεις σε αυτό! Θα κρασάρει (panic).
<br><code>var m map[string]int</code><br><code>m["a"] = 1 // ❌ panic: assignment to entry in nil map</code>
</div>

<svg viewBox="0 0 600 200" style="width: 100%; max-width: 600px; height: auto; color: inherit; display: block; margin: 24px auto; font-family: var(--font-mono); font-size: 14px;"><!-- Nil Map --><text x="150" y="30" fill="currentColor" opacity="0.6" text-anchor="middle">var m map[string]int</text><rect x="50" y="50" width="200" height="100" rx="8" fill="rgba(var(--wrong-rgb), 0.05)" stroke="var(--wrong)" stroke-dasharray="6 6" stroke-width="2"/><text x="150" y="105" fill="var(--wrong)" font-weight="bold" text-anchor="middle" font-size="18px">nil</text><path d="M 150 120 L 150 170" fill="none" stroke="var(--wrong)" stroke-width="2" marker-end="url(#wrong-cross)"/><text x="150" y="190" fill="var(--wrong)" text-anchor="middle" opacity="0.8">Crash (Panic!)</text><!-- Initialized Map --><text x="450" y="30" fill="currentColor" opacity="0.6" text-anchor="middle">m := make(map[string]int)</text><rect x="350" y="50" width="200" height="100" rx="8" fill="rgba(var(--correct-rgb), 0.05)" stroke="var(--correct)" stroke-width="2"/><text x="450" y="90" fill="var(--correct)" font-weight="bold" text-anchor="middle" font-size="16px">Memory Bucket</text><text x="450" y="115" fill="currentColor" opacity="0.5" text-anchor="middle">Ready for keys</text><path d="M 450 125 L 450 170" fill="none" stroke="var(--correct)" stroke-width="2" marker-end="url(#arrow)"/><text x="450" y="190" fill="var(--correct)" text-anchor="middle" opacity="0.8">OK to write</text><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor"/></marker><marker id="wrong-cross" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6"><path d="M 2 2 L 8 8 M 8 2 L 2 8" fill="none" stroke="var(--wrong)" stroke-width="2"/></marker></defs></svg>

`);

        addContent(`
<div class="eyebrow">Κεφάλαιο 1 / 3 — Maps</div>
<h1>Παράδειγμα: Καταμέτρηση Χαρακτήρων</h1>
<p>Ένα χρήσιμο πράγμα που μπορούμε να κάνουμε με τα maps, είναι να μετράμε <strong>πόσες φορές συναντήσαμε κάτι</strong>. Ας πούμε ότι θέλουμε να μετρήσουμε πόσες φορές υπάρχει το κάθε γράμμα στη λέξη <code>"hello"</code>.</p>
<p>Το <strong>κλειδί/key</strong> θα είναι το γράμμα (δηλαδή <code>rune</code>), και η <strong>τιμή/value</strong> θα είναι το πόσες φορές το είδαμε (δηλαδή <code>int</code>).</p>

<pre><code class="lang-go">text := "hello"
counts := make(map[rune]int)

for _, char := range text {
    counts[char]++ // Ότι είχα πριν στο counts[char] συν 1
}</code></pre>

<svg viewBox="0 0 600 150" style="width: 100%; max-width: 600px; height: auto; color: inherit; display: block; margin: 24px auto; font-family: var(--font-mono); font-size: 14px;"><text x="300" y="20" fill="currentColor" opacity="0.5" font-weight="bold" text-anchor="middle">map[rune]int για τη λέξη "hello"</text><rect x="50" y="50" width="100" height="80" rx="8" fill="rgba(var(--accent-rgb), 0.05)" stroke="var(--accent)" stroke-width="2"/><text x="100" y="85" fill="var(--accent)" text-anchor="middle" font-size="20px">'h'</text><line x1="50" y1="100" x2="150" y2="100" stroke="var(--accent)" stroke-opacity="0.3" stroke-width="2"/><text x="100" y="120" fill="currentColor" text-anchor="middle" font-weight="bold">1</text><rect x="180" y="50" width="100" height="80" rx="8" fill="rgba(var(--accent-rgb), 0.05)" stroke="var(--accent)" stroke-width="2"/><text x="230" y="85" fill="var(--accent)" text-anchor="middle" font-size="20px">'e'</text><line x1="180" y1="100" x2="280" y2="100" stroke="var(--accent)" stroke-opacity="0.3" stroke-width="2"/><text x="230" y="120" fill="currentColor" text-anchor="middle" font-weight="bold">1</text><rect x="310" y="50" width="100" height="80" rx="8" fill="rgba(var(--correct-rgb), 0.1)" stroke="var(--correct)" stroke-width="2"/><text x="360" y="85" fill="var(--correct)" text-anchor="middle" font-size="20px">'l'</text><line x1="310" y1="100" x2="410" y2="100" stroke="var(--correct)" stroke-opacity="0.3" stroke-width="2"/><text x="360" y="120" fill="currentColor" text-anchor="middle" font-weight="bold">2</text><rect x="440" y="50" width="100" height="80" rx="8" fill="rgba(var(--accent-rgb), 0.05)" stroke="var(--accent)" stroke-width="2"/><text x="490" y="85" fill="var(--accent)" text-anchor="middle" font-size="20px">'o'</text><line x1="440" y1="100" x2="540" y2="100" stroke="var(--accent)" stroke-opacity="0.3" stroke-width="2"/><text x="490" y="120" fill="currentColor" text-anchor="middle" font-weight="bold">1</text></svg>

<div class="callout"><span class="tag">Στάσου μια στιγμή...</span>Την πρώτη φορά που συναντάμε το <code>'h'</code>, το <code>counts['h']</code> δεν υπάρχει καν στο map. Πώς μπορούμε να κάνουμε <code>++</code> σε κάτι που δεν υπάρχει, χωρίς να κρασάρει το πρόγραμμα; Η απάντηση στο επόμενο slide!</div>
`);
        addQuiz([
            {
                q: "Στο παρακάτω σύστημα καταγραφής ψήφων, ποια είναι η τελική τιμή για την 'Kamala' και για τον 'Donald';",
                lang: "go",
                code: `votes := make(map[string]int)
votes["Kamala"]++
votes["Donald"]++
votes["Kamala"]++`,
                options: [
                    "Kamala = 2, Donald = 0",
                    "Kamala = 2, Donald = Error (δεν υπάρχει)",
                    "Kamala = 1, Donald = 0",
                    "Kamala = 2, Donald = nil"
                ],
                correct: 0,
                explain: "Η Kamala παίρνει 2 ψήφους (έκανε ++ δύο φορές). Ο Donald δεν ψηφίστηκε ποτέ, οπότε αν ζητήσουμε το votes\[\"Donald\"\] η Go θα μας επιστρέψει το zero value, δηλαδή 0."
            },
            {
                q: "Αν εκτυπώσουμε το μέγεθος (len) του map `counts` στο τέλος της λούπας, τι αριθμό θα πάρουμε;",
                lang: "go",
                code: `nums := []int{5, 2, 5, 5, 2}
counts := make(map[int]int)

for _, n := range nums {
    counts[n]++
}`,
                options: [
                    "2",
                    "5",
                    "0",
                    "3"
                ],
                correct: 0,
                explain: "Το μέγεθος του map ισούται με τα μοναδικά κλειδιά/keys. Αν και το array έχει 5 στοιχεία, υπάρχουν μόνο ΔΥΟ μοναδικοί αριθμοί (το 5 και το 2). Άρα το len(counts) είναι 2."
            },
            {
                q: "Τι τιμή θα έχει το `seen['e']` μετά την εκτέλεση του παρακάτω κώδικα;",
                lang: "go",
                code: `phrase := "everyone stays for a 24-hour hackathon"
seen := make(map[rune]int)

for _, letter := range phrase {
    seen[letter] += 5
}`,
                options: [
                    "15",
                    "3",
                    "5",
                    "1"
                ],
                correct: 0,
                explain: "Το γράμμα 'e' εμφανίζεται 3 φορές (όλες στο 'everyone'). Την πρώτη φορά που η Go βλέπει το 'e', του δίνει το Zero Value (0), οπότε κάνει 0 + 5. Επειδή το βρίσκει άλλες 2 φορές, προσθέτει 5 + 5 + 5 = 15."
            }
        ]);


        addContent(`
<div class="eyebrow">Κεφάλαιο 1 / 3 — Maps</div>
<h1>Zero Value & Έλεγχος</h1>
<p>Αν το κλειδί/key <strong>δεν υπάρχει</strong>, η Go δεν κάνει panic (όπως συμβαίνει στα slices αν προσπαθήσουμε να ελέγξουμε ένα index που δεν υπάρχει).</p>
    
<p>Σου επιστρέφει το <strong>zero value</strong> του τύπου (π.χ. 0 για int, "" για string).</p>
<pre><code class="lang-go">m := make(map[string]int)  
fmt.Println(m["someone"])  // 0
</code></pre>
<p>⚠️ <em>Το 0 ΔΕΝ σημαίνει ότι υπάρχει.</em> Για να ελέγξεις αν όντως υπάρχει το κλειδί/key, χρησιμοποιείς το "ok" idiom:</p>

<h2>Έλεγχος Αν Υπάρχει Key</h2>
<pre><code class="lang-go">name := "john"
value, ok := m[name]  
if ok {  
    fmt.Println("Υπάρχει: ", value)  
}</code></pre>
<p>Ουσιαστικά ένα map στην "θέση" του κλειδιού/key <code>m["john"]</code>, δεν επιστρέφει μόνο την τιμή/value. Eπιστρέφει 2 τιμές, το value του και ένα bool (το αποθηκεύουμε σε variable με όνομα <code>ok</code>) που λέει αν υπάρχει ή δεν υπάρχει. Το παραπάνω θα το δεις γραμμένο πιο σύντομα ως εξής:</p>
<pre><code class="lang-go">name := "john"
if value, ok := m[name]; ok {
    fmt.Println(name + " exists. And its value is: " + value)
}</code></pre>


<p>Για διαγραφή χρησιμοποιείς τη συνάρτηση <code>delete(m, "john")</code> (Αν δεν υπάρχει, δεν κάνει panic).</p>
`);

        addContent(`
<div class="eyebrow">Κεφάλαιο 1 / 3 — Maps</div>
<h1>Loop σε map</h1>

<h2>Μπορούμε μόνο με for := range</h2>
<pre><code class="lang-go">for k, v := range m {  
    fmt.Println(k, v)  
}</code></pre>
<div class="callout warning">
  <span class="tag">ΧΑΟΣ ΚΑΙ ΤΥΧΑΙΟΤΗΤΑ</span>
  Επειδή τα δεδομένα στο map δεν είναι βαλμένα στη σειρά και δεν έχουν αριθμητικό index (θέση 0, 1, 2), ο <strong>μοναδικός τρόπος</strong> να τα διαβάσουμε μαζικά είναι με <code>for ... range</code>. Για τον ίδιο λόγο, δεν υπάρχει εγγυημένη σειρά: κάθε φορά που τρέχεις το πρόγραμμα, το loop θα τραβάει τα στοιχεία του map <strong>εντελώς ανακατεμένα</strong>!
</div>

<svg viewBox="0 0 800 260" style="width: 100%; max-width: 1000px; height: auto; color: inherit; display: block; margin: 24px auto; font-family: var(--font-mono); font-size: 14px;">
<defs>
  <pattern id="hatch-slice" width="5" height="5" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
    <line x1="0" y1="0" x2="0" y2="10" stroke="var(--accent)" stroke-width="2" opacity="0.2"/>
  </pattern>
  <pattern id="hatch-map" width="5" height="5" patternTransform="rotate(-45)" patternUnits="userSpaceOnUse">
    <line x1="0" y1="0" x2="0" y2="10" stroke="var(--correct)" stroke-width="2" opacity="0.2"/>
  </pattern>
</defs>
<!-- SLICE SIDE -->
<rect x="20" y="20" width="350" height="130" rx="12" fill="url(#hatch-slice)" stroke="none" opacity="0.8"/>
<!-- Slice label -->
<rect transform="rotate(-90 35 85)" x="-15" y="75" width="100" height="20" rx="4" fill="var(--code-bg)" opacity="0.9"/>
<text transform="rotate(-90 35 85)" x="35" y="85" fill="var(--accent)" font-weight="bold" letter-spacing="6px" font-size="14px" text-anchor="middle" dominant-baseline="middle">SLICE</text>
<rect x="125" y="10" width="140" height="50" rx="8" fill="var(--accent)" opacity="0.4"/>
<text x="195" y="45" text-anchor="middle" class="blacked-shadow" fill="var(--accent)" stroke="var(--accent)">[]int</text>
<text x="195" y="85" fill="currentColor" text-anchor="middle" font-size="18px">for <tspan fill="#56b6c2" font-weight="bold">i</tspan>, <tspan fill="var(--correct)" font-weight="bold">v</tspan> := range s {</text>
<!-- Slice connection drawing -->
<rect x="122" y="68" width="18" height="22" rx="9" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
<rect x="86" y="100" width="120" height="22" rx="4" fill="var(--code-bg)" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
<line x1="131" y1="90" x2="146" y2="100" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>

<rect x="154" y="68" width="18" height="22" rx="9" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
<rect x="231" y="100" width="50" height="22" rx="4" fill="var(--code-bg)" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
<line x1="163" y1="90" x2="256" y2="100" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
<text x="146" y="116" fill="#56b6c2" font-size="13px" text-anchor="middle">index (0, 1...)</text>
<text x="256" y="116" fill="var(--correct)" font-size="13px" text-anchor="middle">value</text>

<!-- MAP SIDE -->
<rect x="430" y="20" width="350" height="130" rx="12" fill="url(#hatch-map)" stroke="none" opacity="0.8"/>
<!-- Map label -->
<rect transform="rotate(90 765 85)" x="715" y="75" width="100" height="20" rx="4" fill="var(--code-bg)" opacity="0.9"/>
<text transform="rotate(90 765 85)" x="765" y="85" fill="var(--correct)" font-weight="bold" letter-spacing="6px" font-size="14px" text-anchor="middle" dominant-baseline="middle">MAP</text>
<rect x="475" y="10" width="260" height="50" rx="8" fill="var(--correct)" opacity="0.4"/>
<text x="605" y="45" text-anchor="middle" class="blacked-shadow" fill="var(--correct)" stroke="var(--correct)">map[rune]int</text>
<text x="605" y="85" fill="currentColor" text-anchor="middle" font-size="18px">for <tspan fill="#56b6c2" font-weight="bold">k</tspan>, <tspan fill="var(--correct)" font-weight="bold">v</tspan> := range m {</text>

<!-- Map connection drawing -->
<rect x="531" y="68" width="18" height="22" rx="9" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
<rect x="475" y="100" width="140" height="22" rx="4" fill="var(--code-bg)" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
<line x1="540" y1="90" x2="545" y2="100" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
<rect x="564" y="68" width="18" height="22" rx="9" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
<rect x="640" y="100" width="50" height="22" rx="4" fill="var(--code-bg)" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
<line x1="573" y1="90" x2="665" y2="100" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
<text x="545" y="116" fill="#56b6c2" font-size="13px" text-anchor="middle">key ('a', 'b'...)</text>
<text x="665" y="116" fill="var(--correct)" font-size="13px" text-anchor="middle">value</text>

<!-- VS BADGE -->
<rect x="348" y="38" width="100" height="68" rx="34" fill="rgba(var(--wrong-rgb), 0.15)" stroke="var(--wrong)" stroke-width="3"/>
<text x="399" y="84" fill="var(--wrong)" font-weight="900" font-size="36px" text-anchor="middle">VS</text>

<!-- BOTTOM BLOCK -->
<text x="400" y="180" fill="currentColor" text-anchor="middle" font-size="15px" opacity="0.9">Αν δεν μας νοιάζει η "θέση" (index ή key), την αγνοούμε με _</text>
<rect x="110" y="198" width="580" height="56" rx="8" fill="#56b6c2" opacity="0.4"/>
<text x="400" y="235" text-anchor="middle" class="blacked-shadow" fill="#56b6c2" stroke="#56b6c2">for <tspan fill="var(--wrong)" stroke="var(--wrong)">_</tspan>, v := range data {</text>
</svg>
`);

        addContent(`
<div class="eyebrow">Κεφάλαιο 1 / 3 — Maps</div>
<h1><code>[]string</code> vs <code>map[int]string</code></h1>

<p>Μπορεί να αναρωτιέσαι: <em>"Αφού το map μπορεί να έχει <code>int</code> για κλειδί/key, ποια η διαφορά από ένα απλό Slice;"</em></p>

<h2>Slice ([]string)</h2>
<p>Στο Slice, οι θέσεις (indexes) πρέπει να είναι <strong>συνεχόμενες</strong> (0, 1, 2...). Αν θέλεις να αποθηκεύσεις κάτι στη θέση <code>1.000.000</code>, η Go πρέπει να δεσμεύσει μνήμη για ένα εκατομμύριο άδεια κουτάκια!</p>
<pre><code class="lang-go">s := make([]string, 1000001)
s[1000000] = "hello" // Σπατάλησε 1 εκατομμύριο άδειες θέσεις!</code></pre>

<h2>Map (map[int]string)</h2>
<p>Στο Map, τα κλειδιά/keys είναι ανεξάρτητα. Μπορείς να έχεις το κλειδί <code>0</code> και το κλειδί <code>1.000.000</code> χωρίς να υπάρχει απολύτως τίποτα ενδιάμεσα.</p>
<pre><code class="lang-go">m := make(map[int]string)
m[1000000] = "hello" // Έφτιαξε μόνο ΕΝΑ κουτάκι!</code></pre>

<div class="callout"><span class="tag">Συμπέρασμα</span>Χρησιμοποιούμε Slices όταν τα δεδομένα μας είναι στη σειρά (1ο, 2ο, 3ο). Χρησιμοποιούμε Maps με int κλειδιά όταν τα νούμερα είναι τυχαία/σκόρπια (π.χ. IDs χρηστών στη βάση δεδομένων).</div>
`);


        addQuiz([
            {
                q: "Τι θα συμβεί αν προσπαθήσεις να διαβάσεις ένα κλειδί/key που ΔΕΝ υπάρχει σε ένα map;",
                options: [
                    "Η Go θα επιστρέψει το zero value του τύπου (π.χ. 0 για int, \"\" για string).",
                    "Το πρόγραμμα θα κρασάρει με μήνυμα 'key not found'.",
                    "Η Go θα δημιουργήσει αυτόματα το κλειδί/key και θα βάλει μέσα τη μηδενική τιμή/value.",
                    "Η συνάρτηση θα επιστρέψει nil, το οποίο πρέπει να ελέγξουμε χειροκίνητα."
                ],
                correct: 0,
                explain: "Μια συχνή παγίδα είναι να πιστεύουμε ότι η Go δημιουργεί το κλειδί αυτόματα όταν το διαβάζουμε. Όταν απλά ΔΙΑΒΑΖΕΙΣ ένα κλειδί, η Go ΔΕΝ το αποθηκεύει κρυφά μέσα στο map! Απλώς σου επιστρέφει το zero value «στον αέρα» χωρίς να βαρέσει error. Γι' αυτό ακριβώς χρειαζόμαστε το 'ok' idiom: για να ξέρουμε αν το zero value που πήραμε υπήρχε όντως αποθηκευμένο (π.χ. βαθμός 0) ή αν δεν υπήρχε ποτέ το κλειδί."
            },
            {
                q: "Πώς μπορούμε να ελέγξουμε αν ένα κλειδί/key υπάρχει *πραγματικά* σε ένα map;",
                options: [
                    "Χρησιμοποιούμε το bool που επιστρέφεται: if v, ok := m[\"key\"]; ok { ... }",
                    "Ελέγχουμε αν η τιμή που μας επιστρέφει είναι διάφορη από το Zero Value του τύπου της (π.χ. if m[\"key\"] != 0).",
                    "Ελέγχουμε το μήκος της τιμής: if len(m[\"key\"]) > 0",
                    "Χρησιμοποιούμε την ενσωματωμένη (built-in) συνάρτηση: if hasKey(m, \"key\")"
                ],
                correct: 0,
                explain: "Το περίφημο 'ok' idiom! (v, ok := m[key]). Ο έλεγχος με το Zero Value (π.χ. m[key] != 0) είναι τεράστια παγίδα: αν ένας φοιτητής είχε όντως βαθμό 0, θα νομίζαμε λανθασμένα ότι δεν υπάρχει στο map! Αντίθετα, αν η 2η μεταβλητή (ok) είναι true, ξέρουμε 100% ότι το κλειδί υπάρχει."
            },
            {
                q: "Τι συμβαίνει αν προσπαθήσεις να γράψεις δεδομένα σε ένα map που ΔΕΝ έχει αρχικοποιηθεί με make (δηλ. var m map[string]int);",
                options: [
                    "Το πρόγραμμα κρασάρει αμέσως (panic), επειδή το map είναι nil.",
                    "Η Go κάνει αυτόματα make και αποθηκεύει την τιμή/value.",
                    "Η εγγραφή αγνοείται σιωπηλά (silent failure).",
                    "Το map δημιουργείται, αλλά χάνεται αμέσως μετά την ολοκλήρωση της συνάρτησης."
                ],
                correct: 0,
                explain: "Αυτό είναι το πιο συνηθισμένο λάθος με τα maps. Ένα map χωρίς make είναι 'nil' (δεν έχει δεσμευτεί μνήμη για τα κουβαδάκια του), οπότε οποιαδήποτε εγγραφή προκαλεί panic."
            }
        ]);

        // ══════════════════════════════════════════════════════════════════════
        // ΚΕΦΑΛΑΙΟ 2 — STRUCTS
        // ══════════════════════════════════════════════════════════════════════

        addContent(`
<div class="eyebrow" id="@structs">Κεφάλαιο 2 / 3 — Structs</div>
<h1>Structs: Η Ανάγκη για Ομαδοποίηση</h1>
<p>Μέχρι τώρα, αν ήθελες να περιγράψεις ένα αυτοκίνητο στο πρόγραμμά σου, θα έπρεπε να κουβαλάς πολλές ξεχωριστές μεταβλητές: <code>brand string</code>, <code>model string</code>, <code>year int</code>. Αν είχες 10 αυτοκίνητα, θα γινόταν χάος.</p>
<p>Το <code>struct</code> (structure) σου επιτρέπει να πάρεις όλες αυτές τις σκόρπιες μεταβλητές και να τις "δέσεις" μαζί σε έναν νέο, δικό σου <strong>τύπο δεδομένων</strong>.</p>

<pre><code class="lang-go">type Car struct {
    brand string
    model string
    year  int
}</code></pre>
<p>Το παραπάνω δεν δημιουργεί κάποιο αυτοκίνητο. Δημιουργεί ένα "καλούπι" (τύπο). Λέει στη Go: <em>"Από εδώ και πέρα, υπάρχει ένας τύπος Car που περιέχει αυτά τα 3 κομμάτια πληροφορίας"</em>.</p>
`);

        addContent(`
<div class="eyebrow">Κεφάλαιο 2 / 3 — Structs</div>
<h1>Δημιουργία και Πρόσβαση</h1>
<p>Αφού φτιάξαμε το καλούπι, μπορούμε να δημιουργήσουμε μεταβλητές αυτού του τύπου. Υπάρχουν δύο τρόποι: ο "κλασικός" βήμα-βήμα, και το <strong>struct literal</strong> που τα κάνει όλα με τη μία.</p>

<pre><code class="lang-go">// Τρόπος 1: Δήλωση και μετά γέμισμα
var c1 Car
c1.brand = "Toyota"
c1.year = 2020</code></pre>

<p>Στη Go, η τελεία (<code>.</code>) είναι το "κλειδί/key" σου. Σημαίνει <em>"μπες μέσα στο struct και φέρε μου αυτό το πεδίο"</em>.</p>

<pre><code class="lang-go">// Τρόπος 2: Struct Literal (πιο συνηθισμένο)
c2 := Car{brand: "Honda", model: "Civic", year: 2022}

// Ή ακόμα πιο σύντομα (Positional fields):
c3 := Car{"Ford", "Focus", 2018}
</code></pre>
<div class="callout warning"><span class="tag">Προσοχή</span>Το positional <code>{"Ford", "Focus", 2018}</code> είναι γρήγορο, αλλά επικίνδυνο. Αν κάποιος προσθέσει ένα νέο πεδίο στο <code>Car</code> στο μέλλον, ο κώδικας θα σπάσει. Προτίμα <strong>πάντα</strong> τα named fields!</div>
`);

        addFillBlank([
            {
                lang: "go",
                code:
                    `// 1. Δήλωσε τον τύπο "Student" με 2 πεδία: name και age
__id1__ Student struct {
    name string
    age  __id2__
}

func main() {
    // 2. Δημιούργησε μια μεταβλητή τύπου Student
    s := __id3__{name: "Maria", __id4__: 22}

    // 3. Άλλαξε την ηλικία της σε 23 χρησιμοποιώντας την τελεία (.)
    __id5__ = 23
}`,
                answers: {
                    id1: ["type", "Type"],
                    id2: ["int"],
                    id3: ["Student"],
                    id4: ["age", "Age"],
                    id5: ["s.age", "s.Age"]
                }
            }
        ]);

        addQuiz([
            {
                q: "Τι θα τυπώσει ο παρακάτω κώδικας αν ξεχάσουμε να ορίσουμε την ηλικία;",
                lang: "go",
                code: `type Person struct {
    name string
    age  int
}

p := Person{name: "John"}
fmt.Println(p.age)`,
                options: [
                    "0",
                    "Θα χτυπήσει error (missing field 'age')",
                    "nil",
                    "-1"
                ],
                correct: 0,
                explain: "Όπως ακριβώς συμβαίνει στα Maps και τα Arrays, τα πεδία ενός struct που δεν αρχικοποιούνται παίρνουν αυτόματα το Zero Value του τύπου τους. Επειδή το age είναι int, παίρνει 0."
            },
            {
                q: "Στο struct literal, ποιος είναι ο ασφαλέστερος τρόπος να δώσουμε αρχικές τιμές;",
                options: [
                    "Με τα ονόματα των πεδίων (named fields): Person{name: \"John\", age: 30}",
                    "Βάζοντας τες απλά με τη σειρά (positional): Person{\"John\", 30}",
                    "Δεν υπάρχει διαφορά, είναι ακριβώς το ίδιο πράγμα.",
                    "Αφήνοντας τη Go να μαντέψει με βάση τους τύπους: Person{\"John\"}"
                ],
                correct: 0,
                explain: "Τα named fields είναι ΠΑΝΤΑ προτιμότερα! Αν στο μέλλον προστεθεί ένα νέο πεδίο στο Person, η positional μορφή (χωρίς τα ονόματα) θα σπάσει."
            }
        ]);

        addContent(`
<div class="eyebrow">Κεφάλαιο 2 / 3 — Structs</div>
<h1>Παράδειγμα: Σκύλοι</h1>
<p>Ας δούμε άλλο ένα παράδειγμα για να γίνει ξεκάθαρος ο διαχωρισμός μεταξύ <strong>Τύπου</strong> και <strong>Μεταβλητής</strong>.</p>

<pre><code class="lang-go">type Dog struct {
    name  string
    age   int
    breed string
}

func main() {
    marley := Dog{name: "Marley", age: 9, breed: "Golden Retriever"}
    tequila := Dog{name: "Tequila", age: 5, breed: "Chihuahua"}
    
    fmt.Println(marley.name)
}</code></pre>

<div class="callout"><span class="tag">ΣΗΜΑΝΤΙΚΟ</span>Το κομμάτι κώδικα <code>type Dog struct</code> είναι οι <strong>"προδιαγραφές"</strong>. Δεν φτιάχνει actually κάποια μεταβλητή τύπου <code>Dog</code> και δεν πιάνει χώρο στη μνήμη για δεδομένα. Απλά δηλώνει τα χαρακτηριστικά που <em>θα έχει</em> ένας σκύλος. Είναι οι "οδηγίες χρήσης" για τη Go, για το πώς να φτιάχνει σκύλους αργότερα!</div>
`);

        addContent(`
<div class="eyebrow">Κεφάλαιο 2 / 3 — Structs</div>
<h1>Struct μέσα σε Struct (Nested)</h1>
<p>Τα πεδία ενός struct δεν είναι ανάγκη να είναι μόνο απλοί τύποι (όπως <code>int</code> ή <code>string</code>). Μπορούν να είναι <strong>άλλα structs</strong>!</p>
<p>Για παράδειγμα, μπορούμε να ομαδοποιήσουμε τα χαρακτηριστικά του κινητήρα σε δικό τους struct: <code>Engine</code>.</p>

<pre><code class="lang-go">type Engine struct {
    horsepower int
    typeFuel   string
}

type Car struct {
    brand  string
    model  string
    engine Engine // Το πεδίο engine είναι τύπου Engine!
}</code></pre>

<p>Πώς μπαίνουμε στα άλογα του κινητήρα; Με διπλή τελεία! Μπαίνουμε στο αυτοκίνητο, μετά στον κινητήρα, και μετά στο <code>horsepower</code>:</p>
<pre><code class="lang-go">myCar := Car{
    brand:  "Toyota",
    engine: Engine{horsepower: 120, typeFuel: "Hybrid"}, // Δημιουργούμε το Engine επιτόπου
}

fmt.Println(myCar.engine.horsepower) // Τυπώνει 120
</code></pre>
`);

        addContent(`
<div class="eyebrow">Κεφάλαιο 2 / 3 — Structs</div>
<h1>Πέρασμα σε Συναρτήσεις (Pointers)</h1>
<p>Όταν περνάς ένα struct σε μια συνάρτηση (π.χ. <code>func Paint(c Car)</code>), η Go φτιάχνει ένα <strong>ακριβές αντίγραφο (clone)</strong> στη μνήμη (Pass by Value). Η συνάρτηση θα βάψει τον κλώνο, και το αρχικό αυτοκίνητο θα μείνει ανεπηρέαστο.</p>

<svg viewBox="0 0 800 160" style="width: 100%; max-width: 800px; height: auto; color: inherit; display: block; margin: 16px auto; font-family: var(--font-mono); font-size: 14px;"><!-- Pass by Value --><text x="100" y="20" fill="currentColor" opacity="0.5">By Value (Copy)</text><rect x="50" y="40" width="120" height="90" rx="8" fill="none" stroke="currentColor" stroke-dasharray="4 4" opacity="0.3"/><text x="110" y="85" fill="currentColor" text-anchor="middle">Original</text><path d="M 180 85 L 250 85" fill="none" stroke="currentColor" stroke-width="2" marker-end="url(#arrow)"/><text x="215" y="75" fill="currentColor" opacity="0.6" text-anchor="middle" font-size="12px">Copies</text><rect x="260" y="40" width="120" height="90" rx="8" fill="none" stroke="var(--wrong)" stroke-width="2"/><text x="320" y="85" fill="var(--wrong)" text-anchor="middle">Clone</text><!-- Pass by Pointer --><text x="500" y="20" fill="currentColor" opacity="0.5">By Pointer (Ref)</text><rect x="500" y="40" width="120" height="90" rx="8" fill="rgba(var(--accent-rgb), 0.1)" stroke="var(--accent)" stroke-width="2"/><text x="560" y="85" fill="var(--accent)" text-anchor="middle">Original</text><path d="M 690 85 L 630 85" fill="none" stroke="currentColor" stroke-width="2" marker-end="url(#arrow)"/><text x="660" y="75" fill="var(--accent)" text-anchor="middle" font-size="12px">Points to</text><circle cx="700" cy="85" r="10" fill="currentColor" opacity="0.2"/><text x="700" y="89" fill="currentColor" text-anchor="middle" font-size="12px">c</text><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor"/></marker></defs></svg>

<p>Για να αλλάξεις το <em>αρχικό</em> αυτοκίνητο, περνάς τη διεύθυνση μνήμης του (pointer: <code>*Car</code>).</p>
<pre><code class="lang-go">func Paint(c *Car, color string) {
    c.color = color // Το original αλλάζει! (Η Go κάνει de-reference αυτόματα)
}

// Στην κλήση της συνάρτησης, δίνουμε τη διεύθυνση με το &
myCar := Car{color: "White"}
Paint(&myCar, "Red")
</code></pre>
`);

        addFillBlank({
            lang: "go",
            code:
                `type CarColor struct {
    ColorName   string
    ColorRGB    string
    PaintFinish string
}

type Car struct {
    brand string
    model string
    color __ctype__
}

// Βάφει το αυτοκίνητο (αλλάζει το original!)
func PaintCar(c __rtype__, newFinish string) {
    c.__cfield__.__ffield__ = newFinish
}

func main() {
    myCar := Car{
        brand: "Toyota",
        color: CarColor{
            ColorName:   "Red", 
            ColorRGB:    "#FF0000", 
            PaintFinish: "Glossy",
        },
    }
    
    // Κάλεσε τη συνάρτηση δίνοντας τη διεύθυνση
    PaintCar(__ref__myCar, "Matte")
}`,
            blanks: [
                { id: "ctype", answer: "CarColor" },
                { id: "rtype", answer: "*Car" },
                { id: "cfield", answer: "color" },
                { id: "ffield", answer: "PaintFinish" },
                { id: "ref", answer: "&" }
            ],
            explain: "Το πεδίο color είναι τύπου CarColor. Η συνάρτηση δέχεται pointer (*Car) και στην κλήση της στέλνουμε τη διεύθυνση (&myCar). Μέσα στη συνάρτηση χρησιμοποιούμε διπλή τελεία (c.color.PaintFinish) για να αλλάξουμε το φινίρισμα."
        }, {
            note: "Συμπλήρωσε τα κενά ώστε η συνάρτηση PaintCar να λειτουργεί με Nested Structs και Pointers."
        });

        addQuiz([
            {
                q: "Τι ακριβώς είναι ένα struct στη Go;",
                options: [
                    "Ένας προσαρμοσμένος τύπος δεδομένων (type) που ομαδοποιεί πεδία διαφορετικών τύπων",
                    "Μια μεταβλητή που προσαρμόζεται αυτόματα ανάλογα με τα δεδομένα που της αναθέτουμε",
                    "Ένας ειδικός πίνακας (array) που επιτρέπει να αποθηκεύουμε strings και ints μαζί",
                    "Μια έτοιμη συνάρτηση της Go για να περνάμε δεδομένα by reference"
                ],
                correct: 0,
                explain: "Το struct είναι τύπος (type), όχι μεταβλητή! Δημιουργείς το 'καλούπι' μια φορά και μετά φτιάχνεις όσες μεταβλητές θες με βάση αυτό το καλούπι."
            },
            {
                q: "Αν έχουμε μια μεταβλητή c τύπου Car, πώς προσπελάζουμε το πεδίο year;",
                options: [
                    "c.year",
                    "c[year]",
                    "c->year",
                    "Car.year"
                ],
                correct: 0,
                explain: "Στη Go χρησιμοποιούμε πάντα την τελεία (.) για να 'μπούμε' μέσα στα πεδία ενός struct, ανεξάρτητα από το αν το c είναι pointer ή όχι!"
            },
            {
                q: "Τι συμβαίνει όταν περνάμε ένα struct σε μια συνάρτηση by value (δηλαδή χωρίς pointer);",
                options: [
                    "Η συνάρτηση παίρνει ένα αντίγραφο (clone). Οποιεσδήποτε αλλαγές κάνει, δεν επηρεάζουν το αρχικό struct.",
                    "Η συνάρτηση παίρνει άμεση πρόσβαση στο αρχικό struct και οποιαδήποτε αλλαγή το επηρεάζει.",
                    "Προκαλείται error κατά το compile, γιατί τα structs είναι πολύ μεγάλα και η Go απαιτεί να περνιούνται πάντα με pointer.",
                    "Η συνάρτηση παίρνει ένα αντίγραφο, αλλά οι αλλαγές συγχρονίζονται αυτόματα με το αρχικό μόλις η συνάρτηση τελειώσει."
                ],
                correct: 0,
                explain: "Το Pass by Value σημαίνει ότι φτιάχνεται ένα πιστό αντίγραφο στη μνήμη. Η συνάρτηση παίζει με τον 'κλώνο'. Αν θες να αλλάξει το αρχικό, πρέπει να το περάσεις με pointer (&)."
            }
        ]);



        // ══════════════════════════════════════════════════════════════════════
        // ΚΕΦΑΛΑΙΟ 3 — PATTERNS
        // ══════════════════════════════════════════════════════════════════════

        addContent(`
<div class="eyebrow" id="@patterns">Κεφάλαιο 3 / 3 — Programming Patterns</div>
<h1>Τα 15 Μοτίβα Προγραμματισμού</h1>
<p class="lede">Δεν χρειάζεται να ανακαλύπτεις τον τροχό σε κάθε άσκηση. Εδώ συγκεντρώσαμε τα 15 πιο σημαντικά μοτίβα κώδικα (patterns) που θα συναντήσεις, αναλυτικά και με παραδείγματα.</p>
`);

        // 1. Accumulator
        addContent(`
<div class="eyebrow">Pattern 1 / 15</div>
<h1>1. Result Variable / Accumulator</h1>
<p>Το πιο κλασικό μοτίβο. Όταν θέλεις να "μαζέψεις" πληροφορία από πολλά στοιχεία σε ένα τελικό αποτέλεσμα. Για να το πετύχεις, δηλώνεις τη μεταβλητή <em>έξω</em> από τη λούπα, και την <em>ανανεώνεις</em> (accumulate) μέσα στη λούπα.</p>
<pre><code class="lang-go">// Παράδειγμα: Άθροισμα
sum := 0
for _, n := range nums {
    sum += n  // Το sum "μαζεύει" τα νούμερα
}
fmt.Println(sum)</code></pre>
`);
        addContent(`
<div class="eyebrow">Pattern 1 / 15</div>
<h1>Accumulator: Συνένωση (Concatenation)</h1>
<p>Το ίδιο ακριβώς μοτίβο δουλεύει και για <code>string</code>. Ξεκινάς με ένα άδειο string και "κολλάς" κομμάτια.</p>
<pre><code class="lang-go">result := ""
for _, word := range words {
    result = result + word + " " // Το result μεγαλώνει
}
fmt.Println(result)</code></pre>
<p><em>Σημείωση: Στην Go, αν συνενώνεις χιλιάδες strings, καλύτερα να χρησιμοποιείς το <code>strings.Builder</code> για καλύτερη απόδοση, αλλά η λογική του Accumulator παραμένει η ίδια!</em></p>
`);

        // 2. Boolean State
        addContent(`
<div class="eyebrow">Pattern 2 / 15</div>
<h1>2. Boolean Switch / Flag</h1>
<p>Μια μεταβλητή <code>bool</code> που λειτουργεί σαν "διακόπτης" (on/off). Συχνά τη χρησιμοποιούμε για να θυμόμαστε κάτι που συνέβη στο παρελθόν καθώς προχωράει η λούπα μας.</p>
<pre><code class="lang-go">foundZero := false

for _, n := range nums {
    if n == 0 {
        foundZero = true // Ο διακόπτης άνοιξε!
        break
    }
}
if foundZero { fmt.Println("Βρήκαμε μηδενικό!") }</code></pre>
`);
        addContent(`
<div class="eyebrow">Pattern 2 / 15</div>
<h1>Boolean State: Παρακολούθηση Κατάστασης</h1>
<p>Αντί για ένα απλό flag που γυρνάει σε <code>true</code> και μένει εκεί, μπορούμε να έχουμε ένα state που <em>αναβοσβήνει</em> (toggle) ανάλογα με το πού βρισκόμαστε. Κλασικό παράδειγμα η καταμέτρηση λέξεων.</p>
<pre><code class="lang-go">inWord := false
wordCount := 0

for _, char := range text {
    if char != ' ' && !inWord {
        inWord = true   // Μπήκαμε σε νέα λέξη!
        wordCount++
    } else if char == ' ' {
        inWord = false  // Βγήκαμε από τη λέξη
    }
}</code></pre>
`);

        // 3. Early Exit
        addContent(`
<div class="eyebrow">Pattern 3 / 15</div>
<h1>3. Early Exit / Guard Clauses</h1>
<p>Το "Early Exit" (Γρήγορη Έξοδος) λέει ότι πρέπει να ξεφορτωνόμαστε τις περιπτώσεις σφάλματος <strong>όσο πιο νωρίς γίνεται</strong>, με <code>return</code> ή <code>continue</code>.</p>
<p>Κοίτα το "κακό" (χαοτικό) παράδειγμα με φωλιασμένα (nested) if:</p>
<pre><code class="lang-go">// Κακός κώδικας (Arrow Anti-pattern)
func Process(user User) {
    if user.IsActive {
        if user.Age >= 18 {
            if user.HasBalance {
                // Κάνε τη δουλειά...
            }
        }
    }
}</code></pre>
`);
        addContent(`
<div class="eyebrow">Pattern 3 / 15</div>
<h1>Early Exit: Ο σωστός τρόπος</h1>
<p>Αντιστρέφουμε τις συνθήκες! Αν κάτι δεν πάει καλά, κάνουμε <code>return</code>. Ο κώδικας παραμένει <strong>επίπεδος (flat)</strong> και καθαρός.</p>
<pre><code class="lang-go">func Process(user User) {
    if !user.IsActive { return } // Guard 1
    if user.Age < 18 { return }  // Guard 2
    if !user.HasBalance { return } // Guard 3

    // Κάνε τη δουλειά χωρίς χαοτικά if!
    fmt.Println("Ο χρήστης είναι έτοιμος.")
}</code></pre>
`);

        // 4. Sentinel Value
        addContent(`
<div class="eyebrow">Pattern 4 / 15</div>
<h1>4. Sentinel Value & Multi-Return</h1>
<p>Σε παλιές γλώσσες όπως η C, όταν μια συνάρτηση "Αναζήτησης" απέτυχε, επέστρεφε μια <strong>"μαγική" (sentinel) τιμή</strong>, όπως το <code>-1</code> ή το <code>0</code>, για να σηματοδοτήσει το σφάλμα.</p>
<pre><code class="lang-go">// Παλιός τρόπος (Μην το κάνεις έτσι στη Go)
func FindIndex(name string) int {
    // αν δεν βρεθεί...
    return -1 // Sentinel value!
}

idx := FindIndex("John")
if idx == -1 { fmt.Println("Δεν βρέθηκε") }</code></pre>
`);
        addContent(`
<div class="eyebrow">Pattern 4 / 15</div>
<h1>Multi-Return: The Go Way</h1>
<p>Στη Go, <strong>ποτέ</strong> δεν χρησιμοποιούμε sentinel values για σφάλματα. Η γλώσσα μάς δίνει το <strong>Multi-Return</strong>! Επιστρέφουμε 2 πράγματα: το αποτέλεσμα ΚΑΙ ένα <code>bool</code> (ή <code>error</code>).</p>
<pre><code class="lang-go">func FindIndex(name string) (int, bool) {
    // Αν δεν βρεθεί...
    return 0, false // Το 0 είναι αδιάφορο, το false μετράει!
}

idx, ok := FindIndex("John")
if !ok { 
    fmt.Println("Δεν βρέθηκε") 
} else {
    fmt.Println("Βρέθηκε στο", idx)
}</code></pre>
`);

        // 5. Previous Value
        addContent(`
<div class="eyebrow">Pattern 5 / 15</div>
<h1>5. Previous Value</h1>
<p>Όταν διατρέχουμε ένα array, συχνά χρειαζόμαστε να συγκρίνουμε το <em>τρέχον</em> στοιχείο με το <em>αμέσως προηγούμενο</em>. Το κόλπο είναι να κρατάμε μια μεταβλητή <code>prev</code> και να την <strong>ενημερώνουμε στο τέλος</strong> του loop.</p>
<pre><code class="lang-go">// Αφαίρεση διπλότυπων χαρακτήρων σε σειρά
text := "aabbcc"
prev := rune(0)

for _, current := range text {
    if current != prev {
        fmt.Print(string(current)) // Εκτυπώνει "abc"
    }
    prev = current // Ενημέρωση για το επόμενο βήμα!
}</code></pre>
`);
        addContent(`
<div class="eyebrow">Pattern 5 / 15</div>
<h1>Previous Value: Έλεγχος Αύξουσας Σειράς</h1>
<p>Ένα άλλο κλασικό παράδειγμα του pattern είναι να δούμε αν ένα array είναι σωστά ταξινομημένο. Συγκρίνουμε τον <code>current</code> με τον <code>prev</code>.</p>
<pre><code class="lang-go">nums := []int{1, 3, 5, 8, 2}
isSorted := true
prev := nums[0]

for _, current := range nums[1:] { // Ξεκινάμε από το 2ο
    if current < prev {
        isSorted = false
        break
    }
    prev = current
}
fmt.Println(isSorted) // false, το 2 χάλασε τη σειρά!</code></pre>
`);

        // 6. Two Index
        addContent(`
<div class="eyebrow">Pattern 6 / 15</div>
<h1>6. Two Index: Opposite Ends</h1>
<p>Χρησιμοποιούμε <strong>δύο δείκτες (indices) ταυτόχρονα</strong>. Η κλασική μορφή είναι να ξεκινάνε από τις δύο άκρες και να συγκλίνουν. Ιδανικό για Αντιστροφή (Reverse) ή Έλεγχο Παλινδρομικών (Palindrome).</p>
<pre><code class="lang-go">// Αντιστροφή Slice
left := 0
right := len(arr) - 1

for left < right {
    // Ανταλλαγή (Swap)
    arr[left], arr[right] = arr[right], arr[left]
    
    left++   // Ο αριστερός πάει δεξιά
    right--  // Ο δεξιός πάει αριστερά
}</code></pre>
`);
        addContent(`
<div class="eyebrow">Pattern 6 / 15</div>
<h1>Two Index: Fast & Slow (Runner)</h1>
<p>Η άλλη μορφή είναι και οι δύο δείκτες να ξεκινάνε από την αρχή, αλλά να τρέχουν με διαφορετική ταχύτητα! Ο ένας "σκανάρει" (fast) και ο άλλος "γράφει" (slow). Ιδανικό για φιλτράρισμα/συμπίεση χωρίς επιπλέον μνήμη (In-Place).</p>
<pre><code class="lang-go">// Αφαίρεση μηδενικών από Slice
slow := 0
for fast := 0; fast < len(arr); fast++ {
    if arr[fast] != 0 {
        arr[slow] = arr[fast] // Αντιγραφή στη 'σωστή' θέση
        slow++
    }
}
// Κόβουμε τα περισσεύματα
arr = arr[:slow]</code></pre>
`);

        // 7. Fixed Sliding Window
        addContent(`
<div class="eyebrow">Pattern 7 / 15</div>
<h1>7. Fixed Sliding Window</h1>
<p>Αν σου ζητήσουν το άθροισμα 3 συνεχόμενων αριθμών (υποπίνακας μεγέθους k=3), η αφελή λύση είναι το διπλό loop (να μετράς από την αρχή κάθε φορά). Αλλά αυτό είναι αργό (O(n*k)).</p>
<p>Το <strong>Sliding Window</strong> μετακινεί ένα "παράθυρο": προσθέτει το νέο στοιχείο (στα δεξιά) και αφαιρεί το παλιό (στα αριστερά). Αστραπιαίο!</p>
<pre><code class="lang-go">k := 3
windowSum := 0
// Υπολόγισε το πρώτο παράθυρο (τα πρώτα k στοιχεία)
for i := 0; i < k; i++ { windowSum += arr[i] }

// Τώρα "τσούλα" το παράθυρο δεξιά!
for i := k; i < len(arr); i++ {
    windowSum += arr[i]     // ➕ Μπαίνει ο νέος!
    windowSum -= arr[i-k]   // ➖ Βγαίνει ο παλιός!
}</code></pre>
`);
        addContent(`
<div class="eyebrow">Pattern 7 / 15</div>
<h1>Sliding Window vs Διπλό Loop</h1>
<p>Για να καταλάβεις τη διαφορά: Σκέψου ένα λεωφορείο (παράθυρο) χωρητικότητας 50 ατόμων που κάνει μια στάση. Η αφελή προσέγγιση είναι να κατέβουν <strong>ΚΑΙ ΟΙ 50 επιβάτες</strong>, και να ξανανέβουν οι 49 παλιοί συν 1 νέος!</p>
<p>Με το Sliding Window, απλά: κατεβαίνει 1, και ανεβαίνει 1. Η διαφορά στην ταχύτητα (Performance) είναι τεράστια σε μεγάλα δεδομένα.</p>
<div class="callout good"><span class="tag">Συμβουλή</span>Όπου βλέπεις προβλήματα που λένε "Βρες το μέγιστο/ελάχιστο σε Κ ΣΥΝΕΧΟΜΕΝΑ στοιχεία", το Fixed Sliding Window είναι η λύση.</div>
`);

        // 8. Variable Sliding Window
        addContent(`
<div class="eyebrow">Pattern 8 / 15</div>
<h1>8. Variable-Size Sliding Window</h1>
<p>Εδώ το παράθυρο <strong>δεν έχει σταθερό μέγεθος</strong>. Μεγαλώνει (right++) σαν χταπόδι για να χωρέσει όσο το δυνατόν περισσότερα στοιχεία, μέχρι να σπάσει κάποιος "κανόνας".</p>
<p>Όταν σπάσει ο κανόνας, τότε συρρικνώνεται (left++) από πίσω, μέχρι ο κανόνας να ισχύει ξανά.</p>
<pre><code class="lang-go">left := 0
for right := 0; right < len(arr); right++ {
    // 1. Μεγάλωσε παράθυρο προς τα δεξιά
    
    // 2. Όσο σπάει ο κανόνας, συρρίκνωσε από αριστερά
    for conditionIsBroken(left, right) {
        left++ 
    }
}</code></pre>
`);
        addContent(`
<div class="eyebrow">Pattern 8 / 15</div>
<h1>Variable-Size Sliding Window (Διαδραστικό)</h1>
<p>Παίξε με το παρακάτω παράδειγμα. Το παράθυρο ψάχνει <strong>άθροισμα <= 10</strong>. Όταν το άθροισμα ξεπεράσει το 10 (κόκκινο), ο αριστερός δείκτης αναγκάζεται να μειώσει το παράθυρο!</p>
<div id="sw-viz">
  <span class="vz-tag">Sliding Window — Variable Size</span>
  <div class="vz-controls">
    <button class="reset-quiz-btn" id="sw-prev" disabled>← prev</button>
    <button class="reset-quiz-btn" id="sw-next">next →</button>
    <button class="reset-quiz-btn" id="sw-reset">⟲ reset</button>
    <button class="reset-quiz-btn vz-btn-stable" id="sw-play">▶ play</button>
  </div>
  <div class="quiz-code-block" style="position:relative; border-radius:8px; padding:18px 20px;">
    <div id="sw-diff-badge" class="vz-diff-badge"></div>
    <div class="vz-pointer-row" id="sw-right-row"></div>
    <div class="vz-pointer-row" id="sw-left-row"></div>
    <div class="vz-array-row" id="sw-array-row"></div>
  </div>
  <div class="glossary-group" style="margin-top:16px;">
    <div class="glossary-strip" id="sw-state-panel"></div>
  </div>
</div>


  <div class="quiz-code-block" style="position:relative; border-radius:8px; padding:18px 20px;">
    <div id="sw-diff-badge" class="vz-diff-badge"></div>
    <div class="vz-pointer-row" id="sw-right-row"></div>
    <div class="vz-pointer-row" id="sw-left-row"></div>
    <div class="vz-array-row" id="sw-array-row"></div>
  </div>
  <div class="glossary-group" style="margin-top:16px;">
    <div class="glossary-strip" id="sw-state-panel"></div>
  </div>
</div>
`);

        // 9. Complement Lookup
        addContent(`
<div class="eyebrow">Pattern 9 / 15</div>
<h1>9. Complement Lookup (Two Sum)</h1>
<p>Πώς βρίσκεις 2 αριθμούς σε ένα array που το άθροισμά τους να κάνει 10; Η κλασική λύση είναι 2 loops (το ένα μέσα στο άλλο), αλλά αυτό είναι αργό (O(n²)).</p>
<p>Το <strong>Complement Lookup</strong> χρησιμοποιεί Map. Αντί να ψάχνεις "τι ταιριάζει" με το 6, ρωτάς απλά το Map: <em>"Μήπως στο παρελθόν είδες πουθενά το (10 - 6 = 4);"</em></p>
<pre><code class="lang-go">seen := make(map[int]bool)
target := 10

for _, x := range arr {
    complement := target - x // Τι μου λείπει;
    if seen[complement] {
        fmt.Println("Βρήκα ζευγάρι!", x, "και", complement)
        break
    }
    seen[x] = true // Θυμήσου ότι με είδες
}</code></pre>
`);
        addContent(`
<div class="eyebrow">Pattern 9 / 15</div>
<h1>Το "Μαγικό" του Complement Lookup</h1>
<p>Γιατί είναι τόσο εντυπωσιακό αυτό το Pattern;</p>
<p>Επειδή μειώνει τον χρόνο αναζήτησης δραματικά. Η αναζήτηση μέσα σε ένα Map (όπως είδαμε, το <strong>Hash Table</strong>) είναι αστραπιαία (O(1)). Αντί να συγκρίνεις κάθε αριθμό με όλους τους υπόλοιπους, κάνεις μόνο ένα (γρήγορο) loop και το Map λειτουργεί σαν τέλεια μνήμη.</p>
<div class="callout"><span class="tag">Time & Space Tradeoff</span>Προσοχή: Για να κερδίσουμε σε Ταχύτητα (Time), πρέπει να "θυσιάσουμε" Μνήμη (Space) δεσμεύοντας το Map. Στον προγραμματισμό αυτό λέγεται <em>Time-Space Tradeoff</em>!</div>
`);

        // 10. Set Pattern
        addContent(`
<div class="eyebrow">Pattern 10 / 15</div>
<h1>10. Το Set Pattern (Uniqueness)</h1>
<p>Πώς αφαιρείς διπλότυπα από μια λίστα; Στις περισσότερες γλώσσες υπάρχει το <code>Set</code>, το οποίο είναι μια δομή που επιτρέπει μόνο <strong>μοναδικά στοιχεία</strong>.</p>
<p>Η Go <strong>δεν</strong> έχει <code>Set</code>. Αλλά έχει Maps! Ένα Map με κλειδιά τύπου ` + "`string`" + ` και τιμές τύπου ` + "`bool`" + ` λειτουργεί ακριβώς σαν Set.</p>
<pre><code class="lang-go">set := make(map[string]bool)  
set["apple"] = true
set["banana"] = true
set["apple"] = true // Απλά ξαναγράφει το true (δεν διπλασιάζεται!)

fmt.Println(len(set)) // 2! Το "apple" μπήκε μόνο 1 φορά!</code></pre>
`);
        addContent(`
<div class="eyebrow">Pattern 10 / 15</div>
<h1>Set Pattern: Έλεγχος & Deduplication</h1>
<p>Το ` + "`map[T]bool`" + ` είναι το απόλυτο εργαλείο για Deduplication (αφαίρεση διπλοτύπων). Ας φιλτράρουμε μια λίστα με IPs.</p>
<pre><code class="lang-go">ips := []string{"1.1", "2.2", "1.1", "3.3"}
seen := make(map[string]bool)
unique := []string{}

for _, ip := range ips {
    if !seen[ip] {         // Αν δεν το έχω ξαναδεί...
        seen[ip] = true    // Σημείωσε το ως 'ειδωμένο'
        unique = append(unique, ip)
    }
}
// unique = ["1.1", "2.2", "3.3"]</code></pre>
`);

        // 11. Frequency Counting
        addContent(`
<div class="eyebrow">Pattern 11 / 15</div>
<h1>11. Frequency Counting / Histogram</h1>
<p>Παρόμοιο με το Set, αλλά αντί για <code>bool</code> (υπάρχει/δεν υπάρχει), χρησιμοποιούμε <code>int</code> (πόσες φορές υπάρχει). Το είχαμε δει και στο Κεφάλαιο 1, τώρα θα το δούμε στην πράξη.</p>
<p>Η μέτρηση εμφανίσεων με ένα map λέγεται Ιστόγραμμα (Histogram). Είναι απίστευτα χρήσιμο στην κρυπτογραφία (π.χ. συχνότητα γραμμάτων) και στη στατιστική ανάλυση κειμένου.</p>
<pre><code class="lang-go">freq := make(map[rune]int)
for _, char := range text {
    freq[char]++
}</code></pre>
`);
        addContent(`
<div class="eyebrow">Pattern 11 / 15</div>
<h1>Frequency Counting (Διαδραστικό)</h1>
<p>Δες πώς ακριβώς χτίζεται το Histogram γράμμα-γράμμα στο παρακάτω animation!</p>
<div id="freq-viz">
  <div class="vz-controls">
    <button class="reset-quiz-btn" id="freq-prev" disabled>← prev</button>
    <button class="reset-quiz-btn" id="freq-next">next →</button>
    <button class="reset-quiz-btn" id="freq-reset">⟲ reset</button>
  </div>
  <div class="quiz-code-block" style="border-radius:8px; padding:18px 20px;">
    <div class="vz-pointer-row" id="freq-ptr-row"></div>
    <div class="vz-array-row" id="freq-array-row"></div>
  </div>
  <div id="freq-map-container" class="vzf-layout vzf-map-container"></div>
</div>


  <div class="quiz-code-block" style="border-radius:8px; padding:18px 20px;">
    <div class="vz-pointer-row" id="freq-ptr-row"></div>
    <div class="vz-array-row" id="freq-array-row"></div>
  </div>
  <div id="freq-map-container" class="vzf-layout vzf-map-container"></div>
</div>
`);

        // 12. Stepped Iteration
        addContent(`
<div class="eyebrow">Pattern 12 / 15</div>
<h1>12. Stepped / Custom Iteration</h1>
<p>Συνήθως το <code>for range</code> κάνει τέλεια τη δουλειά του. Αλλά το <code>range</code> πάει <strong>αυστηρά βήμα-βήμα (ανά 1)</strong>. Τι γίνεται αν θες να προσπεράσεις στοιχεία, π.χ. να διαβάσεις ανά 2 (ζευγάρια);</p>
<p>Εκεί επιστρέφουμε στο κλασικό "C-style" <code>for loop</code> και αλλάζουμε το <code>i++</code> σε <code>i += 2</code>.</p>
<pre><code class="lang-go">// Διάβασμα ανά 2 (π.χ. name, age)
for i := 0; i < len(arr)-1; i += 2 {
    name := arr[i]
    age := arr[i+1]
    fmt.Println(name, age)
}</code></pre>
`);
        addContent(`
<div class="eyebrow">Pattern 12 / 15</div>
<h1>Stepped Iteration: Μεγάλη Προσοχή</h1>
<p>Το μεγαλύτερο ρίσκο με τα "Custom βήματα" είναι το **Index Out of Bounds Panic**. Αν το <code>arr</code> έχει 5 στοιχεία, και εσύ πας ανά 2, το <code>i+1</code> στο τελευταίο βήμα θα σκάσει.</p>
<div class="callout warning"><span class="tag">Panic Danger</span>Όταν κάνεις ` + "`i += k`" + `, πάντα η συνθήκη του loop σου πρέπει να είναι ` + "`i < len(arr) - (k-1)`" + ` για να μη βγεις ποτέ εκτός ορίων, όταν θα ζητήσεις το ` + "`arr[i+(k-1)]`" + `.</div>
`);

        // 13. Data Chunking
        addContent(`
<div class="eyebrow">Pattern 13 / 15</div>
<h1>13. Data Chunking / Partitioning</h1>
<p>Μερικές φορές έχεις ένα τεράστιο Slice (π.χ. 1.000 εγγραφές) και θες να το σπάσεις σε "πακέτα" (chunks) των 100 για να το στείλεις κάπου, ή για Pagination (σελίδα 1, σελίδα 2).</p>
<pre><code class="lang-go">chunkSize := 3
for i := 0; i < len(arr); i += chunkSize {
    end := i + chunkSize
    
    // Προστασία για το τελευταίο 'μισό' πακέτο!
    if end > len(arr) { end = len(arr) }
    
    chunk := arr[i:end] // Κόβουμε τη φέτα!
    fmt.Println(chunk)
}</code></pre>
`);
        addContent(`
<div class="eyebrow">Pattern 13 / 15</div>
<h1>Data Chunking: Γιατί είναι χρήσιμο;</h1>
<p>Το Chunking είναι πανταχού παρόν στη μηχανική λογισμικού (Software Engineering):</p>
<ul>
  <li><strong>Βάσεις Δεδομένων:</strong> Δεν μπορείς να ζητήσεις 1.000.000 χρήστες ταυτόχρονα. Ζητάς "chunks" (LIMIT / OFFSET).</li>
  <li><strong>API Requests:</strong> Αν θες να στείλεις ειδοποιήσεις, δεν στέλνεις σε 100.000 κινητά μαζί. Τα στέλνεις σε "batches" (πακέτα) των 50.</li>
  <li><strong>Goroutines (Παραλληλισμός):</strong> Σπας έναν πίνακα σε 4 chunks, και δίνεις κάθε chunk σε διαφορετικό πυρήνα του επεξεργαστή να το λύσει!</li>
</ul>
`);

        // 14. State Machine
        addContent(`
<div class="eyebrow">Pattern 14 / 15</div>
<h1>14. State Machine Data Modeling</h1>
<p>Όταν γράφουμε πολύπλοκα προγράμματα (όπως ένα παιχνίδι ή ένα ATM), το σύστημά μας έχει <strong>καταστάσεις (States)</strong>. π.χ. Η πόρτα είναι ΚΛΕΙΔΩΜΕΝΗ, το ATM περιμένει PIN κλπ.</p>
<p>Η καλύτερη πρακτική είναι να μοντελοποιούμε την "Κατάσταση" με ένα <strong>Struct</strong> και να φτιάχνουμε Συναρτήσεις (Methods) που αναλαμβάνουν την "Αλλαγή Κατάστασης" με ασφάλεια (μέσω pointers).</p>
<pre><code class="lang-go">type Door struct {
    State string
}
func (d *Door) Unlock(key string) {
    if key == "secret" { d.State = "UNLOCKED" }
}</code></pre>
`);
        addContent(`
<div class="eyebrow">Pattern 14 / 15</div>
<h1>State Machine: Η Δύναμη του Ελέγχου</h1>
<p>Γιατί να μπω στον κόπο; Γιατί δεν κάνω απλά <code>door.State = "UNLOCKED"</code> απ' έξω;</p>
<p>Γιατί η συνάρτηση της αλλαγής κατάστασης (State Transition) μπορεί να ελέγξει τους κανόνες! Δεν μπορείς να κλειδώσεις μια πόρτα που είναι ήδη κλειδωμένη, ή που είναι ορθάνοιχτη!</p>
<pre><code class="lang-go">func (d *Door) Lock() {
    if d.State == "OPEN" {
        fmt.Println("Πρέπει πρώτα να κλείσεις την πόρτα!")
        return
    }
    d.State = "LOCKED"
}</code></pre>
`);

        // 15. Bitwise Operations
        addContent(`
<div class="eyebrow">Pattern 15 / 15</div>
<h1>15. Bitwise Operations / Binary State</h1>
<p>Οι πράξεις στο επίπεδο των Bit είναι εξαιρετικά χαμηλού επιπέδου (low-level), αλλά απίστευτα γρήγορες, επειδή ο επεξεργαστής τις τρέχει σε 1 κύκλο ρολογιού.</p>
<p>Ένα κλασικό κόλπο είναι ο έλεγχος <strong>Άρτιου / Περιττού</strong> (Odd/Even) με τον τελεστή AND (<code>&</code>).</p>
<pre><code class="lang-go">// Κανονικά: if n % 2 != 0
if (n & 1) != 0 {
    // Είναι περιττός (odd) αριθμός! 
    // Το τελευταίο bit είναι 1 (π.χ. 0101 για το 5)
}</code></pre>
`);
        addContent(`
<div class="eyebrow">Pattern 15 / 15</div>
<h1>Bitwise: Bit Shifting (>> και <<)</h1>
<p>Το <code>>> 1</code> (Shift Right κατά 1 θέση) μετακινεί όλα τα bits δεξιά, που είναι ακριβώς το ίδιο με την **ακέραια διαίρεση με το 2** (<code>/ 2</code>). Αντίστοιχα το <code><< 1</code> είναι πολλαπλασιασμός με το 2 (<code>* 2</code>).</p>
<pre><code class="lang-go">n := 10       // 1010 στο δυαδικό
n = n >> 1    // Έγινε 0101 (δηλαδή 5)

m := 3        // 0011
m = m << 1    // Έγινε 0110 (δηλαδή 6)
</code></pre>
<p>Αυτά τα μοτίβα λάμπουν σε κώδικα γραφικών, μηχανών παιχνιδιών και συμπίεσης δεδομένων!</p>
`);

        initSlideDeck({
            version: "1.0.0",
            notifyUrl: "https://script.google.com/macros/s/AKfycbzZRFWgg0WwQXHE6H0yg-QS-cem-d4qaYYYNmZ58Fss-fZmSXqmuu-u7DPXyLzn1Lc/exec"
        });
