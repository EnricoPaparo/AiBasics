---
id: "02-05"
titolo: "L'architettura Transformer: la rivoluzione che ha reso possibile gli LLM"
sottotitolo: "Come un modello decide, parola per parola, cosa è rilevante nel contesto"
capitolo: 2
capitolo_titolo: "L'Intelligenza Artificiale: Cosa È Davvero"
lezione: 5
durata_stimata: "65 minuti"
difficolta: "base"
prerequisiti: ["02-04"]
concetti_chiave:
  - Transformer
  - attention
  - attenzione
  - encoder
  - decoder
  - parallelizzazione
  - RNN
obiettivi:
  - "Spiegare il limite delle reti ricorrenti (RNN) che il Transformer risolve"
  - "Descrivere intuitivamente il meccanismo di attention"
  - "Distinguere i ruoli di encoder e decoder"
  - "Spiegare perché i Transformer si addestrano su scala enormemente più grande dei predecessori"
stato: "pubblicata"
versione: "1.0"
---

# L'architettura Transformer: la rivoluzione che ha reso possibile gli LLM

## Introduzione

Questa è l'ultima lezione del Capitolo 2, e in un certo senso la più importante: tutto ciò che abbiamo costruito finora — reti neurali, strati, embedding, similarità semantica — converge in un'unica architettura che ha cambiato il corso dell'intelligenza artificiale a partire dal 2017. Il Transformer non è semplicemente "un'altra rete neurale": è l'architettura specifica che rende possibile, tecnicamente ed economicamente, addestrare modelli linguistici della scala di Claude o GPT.

Avevamo lasciato un problema aperto alla fine della lezione precedente: i primi sistemi di embedding assegnavano un vettore fisso a ogni parola, incapace di adattarsi al contesto specifico in cui quella parola appariva. Questa lezione risolve esattamente quel problema, introducendo il meccanismo che permette a un modello di "guardare" dinamicamente tutte le altre parole della frase per decidere cosa è rilevante, in quel momento, per interpretare correttamente ciascuna parola.

---

## Obiettivi di Apprendimento

Al termine di questa lezione sarai in grado di:

- Spiegare il limite delle reti neurali ricorrenti (RNN) che il Transformer è stato progettato per risolvere
- Descrivere intuitivamente il meccanismo di attention (attenzione)
- Distinguere i ruoli di encoder e decoder in un'architettura Transformer
- Spiegare perché i Transformer si possono addestrare su una scala enormemente più grande dei loro predecessori

---

## 1. Il problema della memoria nelle reti ricorrenti

Prima del Transformer, l'approccio dominante per elaborare sequenze di testo erano le **RNN** (Recurrent Neural Network, reti neurali ricorrenti). L'idea di base era intuitiva: elaborare il testo **una parola alla volta**, mantenendo una sorta di "memoria" (uno stato interno) che si aggiorna a ogni passo, portando con sé un riassunto di tutto ciò che è stato letto finora.

```
parola 1 → [RETE] → stato1
                       │
parola 2 + stato1 → [RETE] → stato2
                                │
parola 3 + stato2 → [RETE] → stato3
                                  │
                                  ▼
                          (e così via, fino
                           alla fine della frase)
```

Questo approccio sequenziale ha due problemi gravi, che lo rendevano inadatto a scalare ai modelli linguistici moderni.

### Problema 1: la memoria si degrada con la distanza

Pensa a leggere una frase molto lunga: "Il libro che mio nonno, che ha vissuto per anni in Sud America prima di tornare in Europa subito dopo la guerra, mi aveva regalato per il mio decimo compleanno, **era** rovinato." Per interpretare correttamente il verbo "era" (singolare, riferito a "libro"), il sistema deve "ricordare" un'informazione fornita molto prima nella frase, attraverso una catena lunghissima di stati intermedi. Nelle RNN, questa informazione tende a **diluirsi** progressivamente, esattamente come un sussurro che si distorce passando attraverso troppe persone in una catena — la stessa immagine usata per la backpropagation nella Lezione 2.3, qui applicata a un problema diverso ma concettualmente affine.

### Problema 2: l'elaborazione sequenziale non si parallelizza

Per calcolare lo stato alla parola numero 50, l'RNN deve necessariamente aver già calcolato gli stati per le parole 1 a 49, una dopo l'altra. Questo significa che, non importa quanta potenza di calcolo (quante GPU) si abbia a disposizione, l'elaborazione di una singola frase **non può essere accelerata eseguendo i calcoli in parallelo** — è intrinsecamente sequenziale. Su testi enormi come quelli usati per addestrare i modelli linguistici moderni, questa limitazione rendeva l'addestramento impraticabilmente lento.

---

## 2. "Attention Is All You Need": la svolta del 2017

Nel 2017, un gruppo di ricercatori (allora principalmente in Google) pubblicò un paper con un titolo audace — *"Attention Is All You Need"* ("l'attenzione è tutto ciò che serve") — che introduceva un'architettura completamente nuova, capace di eliminare entrambi i problemi delle RNN descritti sopra.

L'idea centrale: invece di elaborare le parole una alla volta in sequenza, mantenendo uno stato che si aggiorna progressivamente, il Transformer guarda **simultaneamente tutte le parole della frase**, e calcola direttamente, per ciascuna parola, **quanto ogni altra parola della frase è rilevante** per interpretarla correttamente. Questo meccanismo si chiama **attention** (attenzione).

---

## 3. Il meccanismo di Attention, spiegato intuitivamente

Riprendiamo l'esempio della parola ambigua "banca". Nella frase "mi siedo sulla banca vicino al fiume", per capire che "banca" significa "panchina" e non "istituto finanziario", un lettore umano presta automaticamente attenzione alle parole circostanti: "siedo", "vicino", "fiume". Queste parole sono fortemente rilevanti per disambiguare "banca"; altre parole della stessa frase, se ce ne fossero, sarebbero meno rilevanti.

Il meccanismo di attention fa qualcosa di matematicamente analogo: per ogni parola della frase, calcola un **punteggio di rilevanza** rispetto a ogni altra parola della stessa frase, e usa questi punteggi per costruire una rappresentazione di quella parola che **incorpora il contesto pesato** in base a quanto ciascuna altra parola è risultata rilevante.

```
Frase: "mi siedo sulla banca vicino al fiume"

Calcolando l'attention per la parola "banca":

  mi       → punteggio di rilevanza: basso
  siedo    → punteggio di rilevanza: ALTO
  sulla    → punteggio di rilevanza: medio
  banca    → (la parola stessa)
  vicino   → punteggio di rilevanza: ALTO
  al       → punteggio di rilevanza: basso
  fiume    → punteggio di rilevanza: ALTO

→ La rappresentazione finale di "banca" in questo contesto
  viene costruita "pesando" fortemente le informazioni
  provenienti da "siedo", "vicino" e "fiume"
```

Questo risolve esattamente il limite di fine Lezione 2.4: "banca" non ha più un singolo embedding fisso, ma una rappresentazione che **cambia dinamicamente** in base a quali altre parole sono presenti nel contesto specifico. Nella frase "vado in banca a ritirare contanti", lo stesso meccanismo darebbe punteggi alti a "vado", "ritirare", "contanti", producendo una rappresentazione completamente diversa per la stessa parola "banca".

### Perché questo risolve anche il problema della distanza

A differenza delle RNN, che dovevano "trasportare" l'informazione attraverso una lunga catena di stati intermedi, l'attention permette a qualsiasi parola di "guardare direttamente" qualsiasi altra parola della frase, indipendentemente dalla distanza. Tornando all'esempio della frase lunghissima sul libro del nonno: il verbo "era" può calcolare direttamente un punteggio di rilevanza alto verso "libro", anche se sono separate da decine di parole, senza dover passare attraverso alcuna catena intermedia.

### Perché questo risolve anche il problema della parallelizzazione

Calcolare questi punteggi di rilevanza per tutte le coppie di parole di una frase è un'operazione che può essere eseguita **simultaneamente** per tutte le parole, usando moltiplicazioni di matrici — esattamente il tipo di calcolo in cui le GPU eccellono. Questo elimina la natura sequenziale, intrinsecamente lenta, delle RNN, e apre la strada all'addestramento su quantità di testo enormemente più grandi, in tempi praticabili.

---

## 4. Encoder e Decoder: due ruoli distinti

L'architettura Transformer originale era composta da due blocchi distinti, ciascuno con un ruolo specifico — una distinzione che vale la pena conoscere, anche se i moderni modelli linguistici di tipo "chat" come Claude usano principalmente una variante basata sul solo decoder.

- **Encoder**: riceve il testo in input e costruisce una rappresentazione ricca, contestuale, di ogni parola, usando l'attention per "guardare" tutta la frase contemporaneamente (sia le parole precedenti sia quelle successive). È adatto a compiti come comprendere un testo, classificarlo, tradurlo
- **Decoder**: genera testo **una parola alla volta**, ma può guardare (tramite attention) solo le parole già generate finora, non quelle future — per la semplice ragione che, al momento della generazione, le parole future non esistono ancora. È esattamente il meccanismo alla base della generazione di testo nei modelli linguistici, che vedremo nella Lezione 3.1

```
ENCODER                              DECODER

Guarda TUTTA la frase                Guarda SOLO le parole
contemporaneamente                   già generate finora
(utile per comprendere)              (necessario per generare,
                                       una parola alla volta)
```

I modelli della famiglia GPT e Claude sono, semplificando, architetture "solo decoder": progettati specificamente per generare testo in modo fluente, una parola (più precisamente, un token, come vedremo nella prossima lezione) alla volta, sempre guardando all'indietro verso ciò che è stato già scritto.

---

## 5. Perché i Transformer scalano così bene

Riassumendo i vantaggi rispetto alle RNN, e collegandoli a ciò che abbiamo visto nella Lezione 2.3 sui fattori della rivoluzione del Deep Learning (dati, calcolo, algoritmi):

- **Parallelizzazione massiccia**: l'attention può essere calcolata simultaneamente per intere sequenze, sfruttando pienamente le GPU (e i chip specializzati come le TPU)
- **Gestione efficace di dipendenze a lunga distanza**: nessun degrado dell'informazione lungo sequenze lunghe, a differenza delle RNN
- **Scalabilità empiricamente verificata**: si è osservato che, aumentando la dimensione del modello (più parametri, più strati) e la quantità di dati di addestramento, le prestazioni dei Transformer continuano a migliorare in modo prevedibile — una proprietà che ha incentivato gli investimenti enormi in modelli sempre più grandi, fino ad arrivare ai Large Language Model che studieremo nel prossimo capitolo

Questa combinazione di fattori tecnici ha trasformato il Transformer, nel giro di pochi anni dalla sua pubblicazione, nell'architettura standard non solo per il linguaggio, ma anche, in forme adattate, per immagini, audio, e molti altri tipi di dati.

---

## Esempio Pratico: Identificare l'Attention in una Frase Ambigua

Prendi questa frase: "Il consiglio ha approvato il progetto perché era ben finanziato."

A cosa si riferisce "era" — al "consiglio" o al "progetto"? Un lettore umano risolve questa ambiguità quasi istantaneamente, basandosi sul significato: è più sensato che sia il "progetto" a essere "ben finanziato".

Prova a immaginare, come abbiamo fatto per "banca", quali parole della frase riceverebbero un punteggio di attention alto per disambiguare correttamente "era": probabilmente "progetto", "finanziato", e forse "approvato". Questo tipo di disambiguazione, che richiede di pesare il contributo di parole anche non immediatamente adiacenti, è esattamente il tipo di compito in cui l'attention eccelle rispetto agli approcci precedenti.

---

## Riepilogo

- Le **RNN**, predecessori del Transformer, elaboravano il testo sequenzialmente: questo causava degrado della memoria su lunghe distanze e impossibilità di parallelizzare i calcoli.
- Il paper **"Attention Is All You Need"** (2017) ha introdotto un meccanismo che guarda simultaneamente tutte le parole di una frase, calcolando punteggi di rilevanza reciproca.
- L'**attention** permette a ogni parola di costruire una rappresentazione contestuale dinamica, risolvendo il limite del "vettore fisso per parola" visto nella lezione precedente.
- **Encoder** (guarda tutta la frase, utile per comprendere) e **decoder** (guarda solo ciò che è stato già generato, necessario per produrre testo) sono i due ruoli distinti dell'architettura originale; i moderni LLM generativi usano principalmente architetture "solo decoder".
- La parallelizzazione massiccia rende i Transformer addestrabili su scale di dati e calcolo enormemente superiori a qualsiasi architettura precedente — la base tecnica che rende possibili gli LLM.

---

## Domande di Verifica

1. Spiega, con parole tue, perché un modello basato su RNN avrebbe più difficoltà di un Transformer a interpretare correttamente un pronome che si riferisce a un nome citato molte frasi prima nel testo.

2. Perché un decoder, durante la generazione di testo, può guardare solo le parole già generate e non quelle future? Cosa succederebbe, logicamente, se potesse "guardare avanti"?

3. Riprendi l'esempio della frase con "consiglio... progetto... era ben finanziato". Costruisci una frase tua, altrettanto ambigua, in cui un pronome o un verbo richiede attenzione verso parole lontane per essere interpretato correttamente.

---

## Esercizi Pratici

> Tre esercizi a difficoltà crescente. Prova a risolverli da solo prima di aprire la soluzione.

### Esercizio 1 — I due problemi delle RNN 🟢 Base

Le RNN elaborano il testo una parola alla volta. Indica i due problemi gravi che ne derivano e che il Transformer risolve.

<details>
<summary>💡 Mostra soluzione</summary>

1. **Degrado della memoria a lunga distanza:** l'informazione delle prime parole deve "viaggiare" attraverso una lunga catena di stati intermedi e si diluisce. Una parola molto lontana fatica a influenzare l'interpretazione di una successiva.
2. **Impossibilità di parallelizzare:** per calcolare lo stato alla parola 50 serve aver già calcolato le 49 precedenti, in sequenza. Quindi non si può accelerare con più GPU → addestramento impraticabilmente lento su grandi testi.

Il Transformer risolve **entrambi** con l'attention: ogni parola guarda direttamente ogni altra (niente catena → niente degrado) e i punteggi si calcolano tutti insieme con moltiplicazioni di matrici (parallelizzabili sulle GPU).

</details>

### Esercizio 2 — Assegna l'attention 🟡 Intermedio

Nella frase "ho lasciato le **chiavi** sul tavolo perché erano pesanti", quali parole dovrebbero ricevere un punteggio di attention alto per interpretare correttamente "erano"? A cosa si riferisce?

<details>
<summary>💡 Mostra soluzione</summary>

"Erano" si riferisce a **"chiavi"** (plurale, "erano pesanti").

Parole con attention alta per disambiguare "erano": **"chiavi"** (l'antecedente, plurale) e **"pesanti"** (l'aggettivo che concorda). Parole come "tavolo" (singolare) o "perché" riceverebbero punteggi bassi per questo scopo.

Il punto: l'attention permette a "erano" di **guardare direttamente** "chiavi" anche se separate da diverse parole, pesando le informazioni rilevanti — senza dover trasportare l'informazione attraverso una catena, come dovrebbe fare un'RNN.

</details>

### Esercizio 3 — Perché il decoder guarda solo indietro 🔴 Avanzato

Un decoder, durante la generazione, può guardare (via attention) solo le parole **già generate**, non quelle future. Spiega perché è necessario e cosa succederebbe logicamente se potesse "guardare avanti". Poi collega la parallelizzazione alla scala degli LLM.

<details>
<summary>💡 Mostra soluzione</summary>

**Perché solo indietro:** al momento di generare la parola N, le parole future (N+1, N+2…) **non esistono ancora** — devono ancora essere prodotte. Non c'è nulla da guardare avanti.

**Se potesse "guardare avanti":** durante l'addestramento sarebbe un imbroglio — il modello vedrebbe la risposta che deve predire. Imparerebbe a "copiare" il token successivo invece di predirlo davvero, e a generazione reale (dove il futuro non c'è) crollerebbe. Per questo il decoder è "causale": ogni token dipende solo dal passato.

**Parallelizzazione e scala:** poiché l'attention si calcola con moltiplicazioni di matrici eseguibili simultaneamente su tutta la sequenza, l'addestramento sfrutta a pieno GPU/TPU. Questo ha reso praticabile addestrare su quantità enormi di testo, e si è osservato empiricamente che **aumentando parametri e dati le prestazioni continuano a migliorare in modo prevedibile** — la "scalabilità" che ha giustificato gli investimenti negli LLM giganti del Capitolo 3.

</details>

---

## Connessioni

**Viene da:** Lezione 2.4 — qui risolviamo esplicitamente il limite del vettore fisso per parola, lasciato aperto in chiusura della lezione precedente.

**Porta a:** Capitolo 3 (I Modelli Linguistici di Grandi Dimensioni) — il Transformer, in particolare l'architettura solo-decoder, è il fondamento tecnico esatto su cui sono costruiti Claude, GPT, e tutti gli LLM moderni. La Lezione 3.1 inizierà esattamente da dove questa lezione finisce.

**Ritroverai questi concetti in:** Lezione 5.2 (ReAct e Pattern di Ragionamento) — il meccanismo di attention sul contesto pregresso è ciò che permette a un agente di "ricordare" i passi precedenti del proprio ragionamento all'interno di una stessa sessione. Lezione 4.6 (Memory) — i limiti del context window, che affronteremo lì, sono diretta conseguenza di come l'attention deve calcolare relazioni tra tutte le coppie di token nella sequenza.

---

## 🌐 Per Approfondire in Inglese

La spiegazione visiva più celebre e condivisa dell'architettura Transformer: illustrazioni dettagliate del meccanismo di attention, degli encoder e decoder, del positional encoding — tutto senza equazioni → **"The Illustrated Transformer"** di Jay Alammar (tipo: articolo)
