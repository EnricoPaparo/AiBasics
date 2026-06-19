---
id: "02-04"
titolo: "NLP e il problema del linguaggio: perché il testo è difficile per le macchine"
sottotitolo: "Come si trasforma una parola in un numero senza perdere il significato"
capitolo: 2
capitolo_titolo: "L'Intelligenza Artificiale: Cosa È Davvero"
lezione: 4
durata_stimata: "55 minuti"
difficolta: "base"
prerequisiti: ["02-03"]
concetti_chiave:
  - NLP
  - bag of words
  - embedding
  - spazio vettoriale
  - similarità semantica
  - contesto
obiettivi:
  - "Spiegare perché il linguaggio è un problema difficile per un sistema che lavora solo con numeri"
  - "Descrivere bag of words e i suoi limiti"
  - "Spiegare cos'è un embedding e perché cattura il significato meglio di un conteggio"
  - "Comprendere intuitivamente la similarità semantica negli spazi vettoriali"
stato: "pubblicata"
versione: "1.0"
---

# NLP e il problema del linguaggio: perché il testo è difficile per le macchine

## Introduzione

Nella lezione precedente abbiamo capito come funziona una rete neurale: riceve numeri in input, li trasforma attraverso strati di pesi, produce numeri in output. Ma il linguaggio — le parole che stai leggendo in questo momento — non è fatto di numeri. È fatto di simboli, significati, ambiguità, contesto.

Questa lezione affronta un problema apparentemente semplice ma in realtà profondo: come si trasforma il testo in qualcosa che una rete neurale possa effettivamente elaborare? La risposta a questa domanda — gli **embedding** — è uno dei concetti più importanti di tutto il corso. Non è un dettaglio tecnico secondario: è il meccanismo che permette a un modello di "sapere" che "re" e "regina" sono concettualmente vicini, che "Roma" e "Italia" hanno una relazione simile a "Parigi" e "Francia". Senza questo meccanismo, l'intero edificio dei modelli linguistici moderni non potrebbe esistere.

---

## Obiettivi di Apprendimento

Al termine di questa lezione sarai in grado di:

- Spiegare perché il linguaggio è un problema difficile per un sistema che lavora solo con numeri
- Descrivere il metodo bag of words e identificarne i limiti
- Spiegare cos'è un embedding e perché cattura il significato meglio di un semplice conteggio
- Comprendere intuitivamente cosa significa "similarità semantica" in uno spazio vettoriale

---

## 1. Il Natural Language Processing: la sfida

**NLP** (Natural Language Processing, elaborazione del linguaggio naturale) è il ramo dell'AI che si occupa di far interagire le macchine con il linguaggio umano: comprenderlo, generarlo, tradurlo, riassumerlo, classificarlo.

La sfida centrale dell'NLP nasce da una contraddizione di fondo: le reti neurali, come abbiamo visto, lavorano esclusivamente con numeri — moltiplicazioni, somme, funzioni di attivazione. Il linguaggio, invece, è fatto di simboli discreti (parole) il cui significato dipende fortemente da:

- **Contesto**: la parola "banca" significa cose diverse in "mi siedo sulla banca del fiume" e "vado in banca a ritirare contanti"
- **Ordine**: "il cane morde l'uomo" e "l'uomo morde il cane" usano le stesse parole ma significano cose opposte
- **Ambiguità**: una stessa frase può avere interpretazioni diverse a seconda di chi la pronuncia, quando, perché
- **Relazioni implicite**: "Parigi è la capitale della Francia" implica una rete di conoscenza (cosa è una capitale, cosa è una nazione) che non è scritta esplicitamente nella frase

Il primo problema da risolvere, prima di qualsiasi altra cosa, è il più basilare: **come si rappresenta una parola con dei numeri?**

---

## 2. Bag of Words: il primo tentativo, e i suoi limiti

Uno dei primi approcci storici, ancora utile per capire il problema, si chiama **bag of words** ("sacco di parole"). L'idea è semplice: si costruisce un vocabolario di tutte le parole possibili, e si rappresenta una frase contando quante volte ciascuna parola del vocabolario appare in essa, ignorando completamente l'ordine.

```
Vocabolario: [gatto, cane, dorme, corre, felice]

Frase: "il gatto dorme felice"

Rappresentazione numerica:
gatto=1, cane=0, dorme=1, corre=0, felice=1
→ vettore: [1, 0, 1, 0, 1]
```

Questo approccio trasforma effettivamente il testo in numeri, ed è stato usato con un certo successo per compiti semplici come la classificazione di email come spam. Ma ha limiti evidenti, che è importante riconoscere con precisione:

- **Perde completamente l'ordine**: "il cane morde l'uomo" e "l'uomo morde il cane" produrrebbero esattamente lo stesso vettore, nonostante il significato opposto
- **Non cattura nessuna relazione di significato tra parole**: nel vocabolario sopra, "gatto" e "cane" sono trattati come due categorie completamente indipendenti, tanto distanti quanto "gatto" e "felice". Non c'è alcuna nozione che "gatto" e "cane" sono entrambi animali domestici, concettualmente più simili tra loro di quanto "gatto" lo sia a "corre"
- **Il vocabolario esplode**: con milioni di parole possibili (incluse varianti, errori di battitura, nomi propri), il vettore diventa enorme e quasi completamente fatto di zeri

Questo terzo limite ha un nome tecnico — *sparsità* — ma la sostanza pratica è questa: bag of words è un approccio rozzo, che funziona per problemi semplici ma non può sostenere compiti che richiedono una vera comprensione del significato.

---

## 3. L'embedding: rappresentare il significato, non solo il conteggio

La svolta concettuale che risolve questi limiti si chiama **embedding** (letteralmente, "incorporamento", "immersione"). L'idea centrale è radicalmente diversa da bag of words:

> Invece di rappresentare ogni parola con un conteggio in un vocabolario enorme e privo di struttura, rappresentiamo ogni parola con un **vettore di numeri** (tipicamente qualche centinaio di numeri) in uno **spazio geometrico**, posizionato in modo tale che parole con significato simile siano posizionate **vicine** tra loro in questo spazio.

```
SPAZIO DEGLI EMBEDDING (semplificato a 2 dimensioni per visualizzarlo
— nella realtà sono centinaia di dimensioni)

                    │
            gatto • │ • cane
                    │
        felino •    │    • cucciolo
                    │
    ────────────────┼──────────────────
                    │
              re •  │  • regina
                    │
           re_____  │  ___regina
                    │
```

In questo spazio (immaginario, semplificato), "gatto" e "cane" sono vicini perché concettualmente simili (entrambi animali domestici comuni); "re" e "regina" sono vicini per un motivo analogo ma diverso (entrambi termini di regalità). La distanza geometrica tra punti nello spazio diventa una misura del **significato condiviso**.

### Come si ottengono questi numeri

Gli embedding non sono assegnati a mano da un linguista: sono **appresi** da una rete neurale, esposta a quantità enormi di testo, attraverso lo stesso principio generale visto nella Lezione 2.2 e 2.3 — il modello viene addestrato a prevedere parole nel contesto di altre parole (ad esempio, "indovina questa parola mancante, dato il resto della frase"), e nel processo di diventare bravo in questo compito, sviluppa internamente una rappresentazione numerica che cattura relazioni di significato.

Questo è importante da capire: **nessuno ha programmato esplicitamente "gatto è simile a cane"**. Questa relazione emerge automaticamente perché, statisticamente, "gatto" e "cane" tendono ad apparire in contesti linguistici simili (frasi su animali domestici, veterinari, cibo per animali) — e il modello, ottimizzato per prevedere bene il contesto, finisce per posizionarli vicini nello spazio degli embedding.

---

## 4. La similarità semantica: l'algebra del significato

Uno dei risultati più sorprendenti e celebri degli embedding è la possibilità di fare, letteralmente, operazioni matematiche su concetti. L'esempio più famoso:

```
vettore("re") - vettore("uomo") + vettore("donna") ≈ vettore("regina")
```

Cosa significa questa equazione, in termini intuitivi? Il vettore che rappresenta "re" contiene, implicitamente, sia il concetto di "regalità" sia il concetto di "genere maschile". Sottraendo "uomo" (che rappresenta, grossolanamente, il concetto di "genere maschile" in isolamento) e aggiungendo "donna", si "naviga" nello spazio degli embedding fino ad arrivare a un punto molto vicino a dove si trova effettivamente "regina".

Questo non è un trucco o una coincidenza isolata: è una conseguenza naturale del fatto che gli embedding catturano relazioni semantiche multiple e sovrapposte (regalità, genere, e molte altre dimensioni che non hanno un nome umano intuitivo) in un unico spazio numerico continuo, dove le relazioni si comportano in modo sorprendentemente coerente con operazioni aritmetiche.

> **Perché questo conta enormemente per il resto del corso:** quando parleremo di RAG (Retrieval-Augmented Generation) nella Lezione 4.3, il meccanismo per "trovare il documento più rilevante per una domanda" funzionerà esattamente così: trasformare sia la domanda sia tutti i documenti disponibili in embedding, e cercare quali documenti sono geometricamente più vicini alla domanda nello spazio degli embedding. È la stessa identica idea spiegata qui, applicata alla ricerca di informazioni invece che a singole parole.

---

## 5. Perché il contesto è fondamentale

Un'ultima complicazione, cruciale, riguarda il fatto che il significato di una parola spesso **dipende dal contesto specifico** in cui appare — il problema della parola "banca" menzionato in apertura.

I primi sistemi di embedding (come Word2Vec, una tecnica storicamente importante) assegnavano **un singolo vettore fisso** a ciascuna parola, indipendentemente dal contesto. "Banca" aveva sempre lo stesso embedding, sia che si parlasse di un istituto finanziario sia di una panchina vicino a un fiume — un limite evidente.

Questo limite specifico — la necessità di embedding che si **adattano dinamicamente al contesto** della frase in cui la parola appare — è esattamente il problema che l'architettura Transformer, che vedremo nella prossima lezione, è stata progettata per risolvere. I modelli linguistici moderni non hanno un embedding fisso per ogni parola: calcolano una rappresentazione che cambia in base a tutto il resto della frase, grazie a un meccanismo chiamato **attenzione**, che anticipiamo qui solo per nome.

---

## Esempio Pratico: Intuire la Distanza Semantica

Anche senza strumenti tecnici, puoi allenare l'intuizione su come funziona uno spazio di embedding rispondendo a queste domande, pensando in termini di "vicinanza concettuale":

1. Tra le coppie (gatto, cane) e (gatto, automobile), quale coppia pensi sarebbe più vicina in uno spazio di embedding addestrato su testo generico? Perché?

2. La parola "Apple" (l'azienda) e la parola "mela" (il frutto) — pensi che, in un modello addestrato principalmente su testo in inglese e tecnologico, sarebbero vicine o lontane? Cosa potrebbe far cambiare questa vicinanza?

3. Prova a immaginare la relazione: vettore("Parigi") - vettore("Francia") + vettore("Giappone") ≈ ? Che tipo di relazione stai sfruttando per fare questa previsione?

Questi esercizi mentali sono esattamente il tipo di intuizione che userai, più avanti nel corso, per capire perché un sistema RAG riesce a "trovare" il documento giusto anche quando la domanda dell'utente non condivide nemmeno una singola parola esatta con il documento — la vicinanza è semantica, non testuale.

---

## Riepilogo

- L'**NLP** affronta la sfida di trasformare il linguaggio — ambiguo, dipendente dal contesto, dipendente dall'ordine — in qualcosa che una rete neurale, che lavora solo con numeri, possa elaborare.
- **Bag of words** rappresenta il testo come conteggio di parole, ma perde l'ordine e non cattura nessuna relazione di significato tra le parole.
- Gli **embedding** rappresentano ogni parola come un vettore numerico in uno spazio geometrico, posizionato in modo che parole con significato simile siano vicine: questa vicinanza viene **appresa** dai dati, non assegnata a mano.
- La **similarità semantica** permette persino operazioni algebriche sui concetti (come l'esempio re - uomo + donna ≈ regina), ed è il meccanismo alla base della ricerca per significato nei sistemi RAG.
- I primi sistemi di embedding assegnavano un vettore fisso per parola, ignorando il contesto: questo limite motiva direttamente l'architettura Transformer della prossima lezione.

---

## Domande di Verifica

1. Perché bag of words non riuscirebbe a distinguere "il cane morde l'uomo" da "l'uomo morde il cane", mentre un sistema che tiene conto dell'ordine e del contesto potrebbe farlo?

2. Spiega con parole tue perché nessun umano ha "programmato" la relazione re - uomo + donna ≈ regina in un sistema di embedding. Da dove emerge, esattamente, questa relazione?

3. Pensa alla parola "vetro" nelle frasi "ho rotto il vetro della finestra" e "bevo un vetro di vino" (errore comune per "bicchiere" in alcune lingue romanze). Perché un embedding fisso per parola, non sensibile al contesto, avrebbe difficoltà a gestire correttamente questa ambiguità?

---

## Esercizi Pratici

> Tre esercizi a difficoltà crescente. Prova a risolverli da solo prima di aprire la soluzione.

### Esercizio 1 — Bag of words 🟢 Base

Vocabolario: `[sole, pioggia, oggi, domani]`. Costruisci il vettore bag of words per la frase "oggi sole domani pioggia". Poi: quale vettore produrrebbe "domani pioggia oggi sole"? Cosa dimostra questo?

<details>
<summary>💡 Mostra soluzione</summary>

Frase "oggi sole domani pioggia": `sole=1, pioggia=1, oggi=1, domani=1` → **`[1, 1, 1, 1]`**.

Frase "domani pioggia oggi sole": **`[1, 1, 1, 1]`** — identico!

**Cosa dimostra:** bag of words **perde completamente l'ordine**. Due frasi con parole uguali ma disposte diversamente producono lo stesso vettore, anche se il significato cambiasse (come "il cane morde l'uomo" vs "l'uomo morde il cane"). È il limite fondamentale che gli embedding contestuali e i Transformer risolvono.

</details>

### Esercizio 2 — L'algebra del significato 🟡 Intermedio

Sfruttando lo stesso principio di `re - uomo + donna ≈ regina`, prevedi il risultato di `Parigi - Francia + Giappone ≈ ?`. Che tipo di relazione stai usando?

<details>
<summary>💡 Mostra soluzione</summary>

Risultato: **≈ Tokyo**.

La relazione sfruttata è **"capitale di un paese"**. Il vettore `Parigi - Francia` isola, grosso modo, il concetto astratto di "essere la capitale di"; aggiungendolo a `Giappone` si arriva vicino a `Tokyo`.

Il punto importante: nessuno ha codificato a mano "Tokyo è la capitale del Giappone". La relazione emerge perché gli embedding catturano dimensioni semantiche multiple e coerenti, apprese dai contesti in cui le parole compaiono nei testi. La stessa coerenza geometrica vale per genere, tempo verbale, ecc.

</details>

### Esercizio 3 — Perché serve il contesto 🔴 Avanzato

La parola "banca" significa cose diverse in "mi siedo sulla banca del fiume" e "vado in banca". Spiega perché un embedding **fisso** per parola (come Word2Vec) non gestisce bene questo caso, e collega il problema all'architettura Transformer e al RAG.

<details>
<summary>💡 Mostra soluzione</summary>

**Il problema dell'embedding fisso:** Word2Vec assegna a "banca" **un solo vettore**, uguale in ogni frase. Ma "banca" finanziaria e "banca" del fiume hanno significati opposti: comprimere entrambi in un unico punto dello spazio è una media insoddisfacente che non rappresenta bene nessuno dei due sensi.

**Collegamento al Transformer:** i modelli moderni non usano un vettore fisso per parola. Calcolano una rappresentazione **dinamica**, che cambia in base a *tutto il resto della frase*, grazie al meccanismo di **attenzione** (Lezione 2.5). Così "banca" vicino a "fiume" e "banca" vicino a "contanti" ricevono rappresentazioni diverse.

**Collegamento al RAG (Lezione 4.3):** la stessa idea di "vicinanza nello spazio degli embedding" che qui mette vicine parole simili, là serve a trovare i documenti più rilevanti per una domanda — anche quando domanda e documento non condividono nessuna parola esatta. La vicinanza è **semantica**, non testuale.

</details>

---

## Connessioni

**Viene da:** Lezione 2.3 — qui applichiamo la rete neurale, vista in astratto, al problema specifico di rappresentare il linguaggio.

**Porta a:** Lezione 2.5 (Architettura Transformer) — vedremo il meccanismo di attenzione, che risolve esattamente il limite del "vettore fisso per parola" discusso in chiusura di questa lezione.

**Ritroverai questi concetti in:** Lezione 4.3 (RAG) — la ricerca per similarità semantica tra una domanda e un insieme di documenti, usando esattamente il principio di distanza nello spazio degli embedding spiegato qui. Lezione 3.1 (Cos'è un LLM) — i token che un modello linguistico elabora sono, alla base, rappresentati internamente come embedding.
