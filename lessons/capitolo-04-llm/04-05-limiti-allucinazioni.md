---
id: "04-05"
titolo: "Limiti, allucinazioni e confini degli LLM"
sottotitolo: "Chiudere il capitolo con onestà: cosa un LLM non può fare, e perché è importante saperlo"
capitolo: 4
capitolo_titolo: "I Modelli Linguistici (LLM)"
lezione: 5
durata_stimata: "50 minuti"
difficolta: "base"
prerequisiti: ["04-04"]
concetti_chiave:
  - allucinazione
  - knowledge cutoff
  - statelessness
  - bias
  - plausibilità statistica
obiettivi:
  - "Spiegare perché le allucinazioni sono una conseguenza strutturale, non un bug occasionale"
  - "Descrivere l'implicazione pratica del knowledge cutoff"
  - "Spiegare perché il modello non ha stato né capacità di azione autonoma"
  - "Riconoscere l'origine del bias nei dati di addestramento e le sue implicazioni operative"
stato: "pubblicata"
versione: "1.0"
---
# Limiti, allucinazioni e confini degli LLM

## Introduzione

Chiudiamo il Capitolo 4 — e con esso la prima grande sezione concettuale del corso, dedicata a capire cosa sono davvero i modelli linguistici — con una lezione che ha un valore speciale. Conoscere i limiti di uno strumento è precisamente altrettanto professionale quanto conoscerne le capacità, forse anche di più: chi non conosce i limiti di uno strumento lo userà male, gli affiderà compiti sbagliati, e si stupirà nel modo peggiore quando lo strumento fallisce esattamente dove avrebbe dovuto aspettarselo.

Questa lezione non è un elenco di difetti da accettare con rassegnazione. È, al contrario, la base concettuale più importante per tutto ciò che costruiremo a partire dal Capitolo 5: ogni strumento, ogni tecnica, ogni pattern architetturale che vedremo da qui in avanti — RAG, memoria, supervisione umana, review layer — esiste precisamente per **compensare uno dei limiti che descriviamo in questa lezione**. Capirli a fondo, ora, renderà ogni soluzione successiva immediatamente comprensibile nel suo "perché", non solo nel suo "come".

---

## Obiettivi di Apprendimento

Al termine di questa lezione sarai in grado di:

- Spiegare perché le allucinazioni sono una conseguenza strutturale del funzionamento di un LLM, non un bug occasionale e risolvibile
- Descrivere l'implicazione pratica del knowledge cutoff
- Spiegare perché il modello, di per sé, non ha stato persistente né capacità di azione autonoma nel mondo
- Riconoscere l'origine del bias nei dati di addestramento e le sue implicazioni operative

---

## 1. Le allucinazioni: perché avvengono strutturalmente

Un'**allucinazione**, nel contesto degli LLM, è quando il modello genera informazioni false, inventate, o non verificabili, presentandole con la stessa fluidità e sicurezza apparente con cui presenterebbe informazioni corrette.

Per capire **perché** questo avviene — non solo che avviene — dobbiamo tornare a un'idea centrale della Lezione 4.1: il modello prevede il **token statisticamente più plausibile**, non il token **vero**. Questi due obiettivi, plausibilità e verità, normalmente coincidono — perché i dati di addestramento contengono prevalentemente informazioni corrette — ma non sono **la stessa cosa**, e in alcune circostanze divergono in modo prevedibile.

```
DOMANDA: "Chi ha scritto il romanzo 'Le Ombre di Settembre'
           pubblicato nel 1987?"

(Supponiamo che questo libro non esista realmente)

Cosa succede internamente, in modo semplificato:
Il modello ha visto, durante l'addestramento, migliaia
di frasi nella forma "Il romanzo [TITOLO] è stato scritto
da [AUTORE] nel [ANNO]" — uno schema linguistico molto
comune e plausibile

Anche se non esiste un libro con questo titolo specifico,
il modello può generare una continuazione che SEGUE
PERFETTAMENTE quello schema linguistico plausibile:
"Le Ombre di Settembre è stato scritto da Marco Belluzzi
nel 1987" — un nome, una data, tutto grammaticalmente
e stilisticamente perfetto, e completamente INVENTATO
```

Il punto cruciale: il modello non sta "mentendo" nel senso di avere un'intenzione di ingannare (non ha intenzioni, come visto fin dalla Lezione 3.1). Sta facendo esattamente ciò per cui è stato addestrato — produrre continuazioni statisticamente plausibili — applicato a una domanda che presuppone l'esistenza di qualcosa che non esiste. Non avendo un meccanismo nativo per "controllare se questo fatto è vero" (un meccanismo che, come vedremo nel Capitolo 5, deve essere costruito esternamente, ad esempio tramite RAG), il modello procede con la previsione più plausibile, che in questo caso è falsa.

### Quando le allucinazioni sono più probabili

Le allucinazioni tendono a presentarsi con maggiore frequenza in alcune circostanze specifiche e riconoscibili:

- **Domande su fatti molto specifici e poco rappresentati** nei dati di addestramento (dettagli minori, eventi recenti, informazioni di nicchia)
- **Richieste di citazioni precise** (numeri di pagina, date esatte, virgolette letterali) — il modello può generare una citazione "nello stile" di una citazione reale senza che corrisponda a un testo effettivamente esistente
- **Domande che presuppongono fatti falsi** (come nell'esempio del libro inesistente), dove il modello tende a "completare lo schema" invece di riconoscere la falsa premessa
- **Calcoli matematici complessi** eseguiti senza chain-of-thought (Lezione 4.4), dove il modello può generare un risultato plausibile ma numericamente errato

---

## 2. Il Knowledge Cutoff: il modello non sa cosa è successo dopo il suo addestramento

Ricorda dalla Lezione 4.2 che il pre-training avviene su una quantità enorme di testo raccolto **fino a un certo momento nel tempo**. Tutto ciò che è accaduto dopo quel momento — il **knowledge cutoff** — semplicemente non fa parte dei dati che il modello ha visto, e quindi non può "sapere" nulla a riguardo, in alcun modo diretto.

```
ADDESTRAMENTO                    DOPO IL CUTOFF

[Tutto il testo raccolto         [Eventi, notizie, scoperte
 fino alla data X]                successive alla data X]
        │                                  │
        ▼                                  ▼
  Il modello "conosce"            Il modello NON può sapere
  (in senso statistico)           nulla di questo, a meno
  tutto questo                    che non gli venga fornito
                                   esplicitamente come contesto
                                   nel prompt (anticipando
                                   il principio del RAG,
                                   Lezione 5.3)
```

Questo limite ha un'implicazione pratica spesso sottovalutata: se chiedi a un modello informazioni su eventi molto recenti rispetto al suo addestramento, due cose possono accadere, ed è importante distinguerle: il modello può onestamente dichiarare di non avere informazioni recenti (un comportamento spesso rinforzato proprio da RLHF, Lezione 4.2, che premia l'onestà sui propri limiti), oppure — nei casi peggiori — può generare un'allucinazione, "indovinando" plausibilmente cosa potrebbe essere successo, basandosi su pattern e tendenze osservate nei dati precedenti al cutoff.

> **Perché questo conta enormemente per i sistemi che costruiremo:** ogni volta che un prodotto AI (incluso Claude.ai) usa uno strumento di ricerca web per rispondere a domande su eventi recenti, sta esattamente compensando questo limite strutturale, fornendo al modello, tramite il contesto del prompt, informazioni che il modello da solo non potrebbe possedere. Vedremo questo meccanismo in dettaglio quando parleremo di Tool Use nella Lezione 5.4.

---

## 3. Mancanza di stato: ogni chiamata è indipendente

Abbiamo già toccato questo punto più volte nel corso (Lezione 1.3 sullo stato in HTTP, Lezione 4.3 sui turni conversazionali), ma vale la pena affermarlo qui in modo esplicito e definitivo, come limite strutturale del modello stesso: **il modello, di per sé, non ha alcuna memoria persistente tra una chiamata API e l'altra**.

Tutto ciò che sembra "memoria" — ricordare il nome che hai detto cinque messaggi fa, mantenere coerenza su un argomento discusso a lungo — è il risultato di un meccanismo **esterno** al modello: il prodotto (o il nostro sistema, quando inizieremo a costruirne uno) che rinvia, a ogni chiamata, l'intera cronologia rilevante. Il modello stesso, isolatamente considerato, è completamente **stateless** (senza stato) — esattamente come il protocollo HTTP di base descritto nella Lezione 1.3.

Questo non è un limite "minore": è una delle ragioni principali per cui, dal Capitolo 5 in avanti, dedicheremo un'intera lezione (5.6) al problema della memoria, e perché la gestione dello stato sarà uno dei temi ricorrenti per tutto il resto del corso, fino ad arrivare alla memoria episodica e al riassorbimento della conoscenza nel Capitolo 9.

---

## 4. Mancanza di azione: il modello produce solo testo

Un LLM, lasciato a sé stesso, **non può fare nulla nel mondo reale** se non generare testo. Non può cercare informazioni aggiornate su Internet, non può eseguire codice, non può inviare un'email, non può consultare un database aziendale — può solo produrre una sequenza di token, basandosi sul contesto fornito.

```
COSA UN LLM "GREZZO" PUÒ FARE         COSA NON PUÒ FARE
(da solo)                              (da solo)

- Generare testo                       - Cercare informazioni
- Rispondere a domande basandosi         aggiornate online
  su ciò che ha "appreso" durante       - Eseguire calcoli complessi
  l'addestramento                        con garanzia di precisione
- Seguire istruzioni di formato        - Interagire con sistemi
  e stile                                esterni (database, email,
                                          calendari, ...)
                                        - Verificare la veridicità
                                          delle proprie affermazioni
```

Questo limite, probabilmente più di ogni altro, è la **motivazione fondamentale** per cui esistono il Function Calling (Lezione 5.4) e, in ultima analisi, l'intera architettura degli agenti che costruiremo a partire dal Capitolo 6. Un agente, come vedremo, è precisamente un sistema che **dà al modello la capacità di agire** nel mondo, collegandolo a strumenti esterni — risolvendo esattamente questo limite strutturale.

---

## 5. Il bias nei dati di training: implicazioni etiche e operative

Un ultimo limite, di natura diversa dai precedenti ma altrettanto importante: un modello addestrato su dati prodotti da esseri umani **eredita inevitabilmente i pattern, le prospettive, e gli squilibri presenti in quei dati**.

Se certi argomenti, prospettive, lingue, o gruppi sono sovra-rappresentati o sotto-rappresentati nei dati di addestramento, il comportamento del modello tenderà a rifletterlo — non per una scelta deliberata, ma come conseguenza statistica diretta del meccanismo di apprendimento descritto nella Lezione 3.2. Questo non è un difetto "riparabile" del tutto con un intervento tecnico semplice: è una caratteristica intrinseca di qualunque sistema che apprende da dati prodotti da una popolazione umana reale, con tutte le sue asimmetrie storiche e culturali.

Le fasi di fine-tuning e RLHF (Lezione 4.2) sono, in parte significativa, tentativi deliberati di **mitigare** alcuni di questi squilibri — ad esempio, addestrando il modello a non riprodurre stereotipi dannosi anche quando questi fossero statisticamente presenti nei dati grezzi di pre-training. Ma è importante avere consapevolezza realistica: la mitigazione riduce il problema, non lo elimina in modo assoluto e definitivo.

> **Implicazione operativa per chi costruisce sistemi AI:** quando, più avanti nel corso, parleremo di supervisione umana (Lezione 8.4) e di valutazione dei sistemi (Lezione 8.5), una delle ragioni per cui questi meccanismi di controllo sono indispensabili — e non semplici "buone pratiche opzionali" — è precisamente la consapevolezza che nessun modello, per quanto ben addestrato, è interamente esente da bias.

---

## Esempio Pratico: Riconoscere il Rischio di Allucinazione

Prova a classificare ciascuna di queste richieste secondo il rischio di allucinazione, usando i criteri visti nella Sezione 1:

1. "Qual è la formula chimica dell'acqua?" — rischio basso (fatto estremamente comune e stabile, ben rappresentato nei dati)
2. "Quali sono stati i risultati delle elezioni locali nel tuo comune la settimana scorsa?" — rischio alto (evento specifico, recente, probabilmente oltre il knowledge cutoff)
3. "Cita testualmente, parola per parola, il terzo paragrafo a pagina 142 di un libro specifico" — rischio alto (richiesta di citazione letterale estremamente specifica, difficile da garantire con precisione)
4. "Spiegami il principio generale della fotosintesi" — rischio basso (concetto scientifico stabile, ampiamente documentato)

Questo tipo di valutazione del rischio — non un giudizio binario "vero/falso" ma una stima probabilistica basata su quanto la richiesta si avvicina alle condizioni che favoriscono le allucinazioni — è un'abilità pratica che ti accompagnerà per tutto il resto del corso, specialmente quando dovrai decidere, costruendo un agente, quali richieste richiedono il supporto di strumenti esterni (RAG, ricerca web) invece di affidarsi alla sola conoscenza del modello.

---

## Riepilogo

- Le **allucinazioni** sono una conseguenza strutturale del fatto che il modello ottimizza per la plausibilità statistica, non per la verità: questi due obiettivi normalmente coincidono ma possono divergere, specialmente su fatti specifici, citazioni letterali, o premesse false.
- Il **knowledge cutoff** significa che il modello non può sapere nulla di eventi successivi alla raccolta dei propri dati di addestramento, a meno che questa informazione non gli venga fornita esplicitamente nel contesto.
- Il modello è intrinsecamente **stateless**: non ha memoria persistente tra chiamate; ciò che sembra memoria è gestito da sistemi esterni che rinviano la cronologia.
- Un LLM grezzo **non può agire nel mondo**: produce solo testo, non può cercare informazioni aggiornate, eseguire azioni, o interagire con sistemi esterni autonomamente.
- Il **bias** nei dati di addestramento si riflette inevitabilmente nel comportamento del modello; fine-tuning e RLHF mitigano ma non eliminano completamente questo fenomeno.

---

## Domande di Verifica

1. Spiega perché un modello può generare con grande sicurezza apparente un'informazione completamente falsa, collegando questa osservazione alla distinzione tra "plausibilità statistica" e "verità" introdotta in questa lezione.

2. Hai chiesto a un modello informazioni su un evento accaduto la settimana scorsa, e ha risposto con dettagli specifici e sicuri. Alla luce di questa lezione, cosa dovresti sospettare, e come potresti verificarlo?

3. Rivedi i cinque limiti descritti in questa lezione (allucinazioni, knowledge cutoff, mancanza di stato, mancanza di azione, bias). Per ciascuno, individua — anche solo per nome, anticipando i capitoli successivi — quale tecnica o pattern architetturale è stato concepito principalmente per compensarlo.

---

## Esercizi Pratici

> Tre esercizi a difficoltà crescente. Prova a risolverli da solo prima di aprire la soluzione.

### Esercizio 1 — Rischio di allucinazione 🟢 Base

Ordina queste richieste da **rischio basso** a **rischio alto** di allucinazione: (a) "Qual è la capitale dell'Italia?", (b) "Cita testualmente la riga 3 di pagina 88 di un libro specifico", (c) "Spiega cos'è la gravità", (d) "Chi ha vinto la partita di ieri sera?".

<details>
<summary>💡 Mostra soluzione</summary>

Dal rischio più basso al più alto:
1. **(a) capitale d'Italia** e **(c) gravità** → rischio **basso**: fatti/concetti stabili e ben rappresentati nei dati.
2. **(d) partita di ieri** → rischio **alto**: evento recente, quasi certamente oltre il knowledge cutoff.
3. **(b) citazione letterale riga/pagina** → rischio **alto**: il modello può generare una citazione "nello stile" senza che corrisponda al testo reale.

Criterio: più la richiesta riguarda **fatti specifici, recenti, o citazioni precise**, più è probabile l'allucinazione.

</details>

### Esercizio 2 — Ogni limite, la sua cura 🟡 Intermedio

Per ciascun limite, indica la tecnica/pattern (anche solo per nome) concepito per compensarlo: (a) knowledge cutoff, (b) mancanza di azione, (c) mancanza di stato, (d) bias.

<details>
<summary>💡 Mostra soluzione</summary>

- **(a) knowledge cutoff** → **RAG** (Lezione 5.3) e **ricerca web via Tool Use** (5.4): forniscono al modello informazioni recenti/esterne nel contesto.
- **(b) mancanza di azione** → **Function Calling / Tool Use** (5.4) e l'intera **architettura agentiva** (Cap. 6): danno al modello la capacità di agire.
- **(c) mancanza di stato** → **Memory** (5.6) e, più avanti, **memoria episodica** (9.3): gestiscono la persistenza tra chiamate.
- **(d) bias** → **supervisione umana** (8.4) e **valutazione/evals** (8.5): controlli che nessuna soluzione puramente tecnica elimina del tutto.

Idea chiave: l'intero Capitolo 5 in poi esiste per **compensare** i limiti strutturali visti qui.

</details>

### Esercizio 3 — Sicuro ma falso 🔴 Avanzato

Spiega perché un modello può affermare con grande sicurezza un fatto completamente falso. Poi: hai ricevuto una risposta dettagliata e sicura su un evento della settimana scorsa — cosa dovresti sospettare e come verificheresti?

<details>
<summary>💡 Mostra soluzione</summary>

**Perché sicuro ma falso:** la "sicurezza apparente" è solo fluidità linguistica. Il modello genera il testo *statisticamente più plausibile*, non quello *vero* (Lezione 4.1). Una frase falsa può seguire perfettamente uno schema linguistico comune ("Il libro X è stato scritto da Y nel Z") ed essere prodotta con la stessa scioltezza di un fatto vero. Non c'è un modulo interno che verifica la verità, né un "tono di incertezza" legato alla correttezza.

**Sull'evento della settimana scorsa, dovresti sospettare:** che sia oltre il **knowledge cutoff**. Il modello, da solo, non può conoscere fatti così recenti; dettagli specifici e sicuri sono un campanello d'allarme per un'allucinazione.

**Come verificare:**
- Controlla **fonti esterne** affidabili (la verità non è nel modello).
- Chiedi al modello stesso le fonti e verificale (spesso le citazioni inventate non reggono).
- Usa un sistema con **ricerca web / RAG** che porti dati reali nel contesto invece di affidarti alla sola memoria del modello.

</details>

---

## Connessioni

**Viene da:** Lezioni 4.1–3.4 — questa lezione applica con rigore critico tutto ciò che abbiamo imparato sul funzionamento degli LLM, trasformando la comprensione tecnica in consapevolezza pratica dei limiti.

**Porta a:** Capitolo 5 (Strumenti e Infrastruttura) — ogni singola lezione di questo capitolo (output strutturati, RAG, Function Calling, MCP, memoria) esiste per risolvere uno specifico limite descritto qui. La Lezione 5.3 (RAG) risolve direttamente il knowledge cutoff e riduce le allucinazioni su fatti specifici; la Lezione 5.4 (Function Calling) risolve la mancanza di azione; la Lezione 5.6 (Memory) risolve la mancanza di stato.

**Ritroverai questi concetti in:** Lezione 6.5 (Gestione degli Errori) — la consapevolezza dei limiti qui descritti è il fondamento per progettare sistemi agentivi robusti, che si aspettano e gestiscono questi fallimenti invece di ignorarli. Lezione 8.4 (Human-in-the-Loop) — la supervisione umana esiste precisamente perché nessuno di questi limiti, incluso il bias, può essere considerato completamente risolto da soluzioni puramente tecniche.

---

**CHIUSURA DEL CAPITOLO 4.** Con questa lezione si conclude la prima grande sezione del corso: abbiamo costruito, capitolo dopo capitolo, una comprensione solida di come funziona il Web (Capitolo 1), cosa è l'intelligenza artificiale e come funzionano le reti neurali (Capitolo 3), e cosa sono esattamente i modelli linguistici, come si addestrano, come si usano, e quali sono i loro limiti (Capitolo 4). Dal Capitolo 5 in avanti, il corso cambia natura: smettiamo di "capire" e iniziamo a "costruire" — strumenti, memoria, agenti, e infine sistemi agentivi completi, supervisionati e capaci di evolvere nel tempo.

---

## 🌐 Per Approfondire in Inglese

Un'analisi rigorosa che dimostra perché le allucinazioni non sono un bug risolvibile con più dati o modelli migliori, ma una conseguenza strutturale del modo in cui gli LLM funzionano → **"Hallucination is Inevitable: An Innate Limitation of Large Language Models"** (Xu et al., 2024) (tipo: paper)
