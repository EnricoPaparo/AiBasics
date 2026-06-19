---
id: "03-02"
titolo: "Training, Fine-tuning e RLHF: come si costruisce un assistente AI"
sottotitolo: "Dal modello che completa testo all'assistente che risponde utilmente: il percorso in tre fasi"
capitolo: 3
capitolo_titolo: "I Modelli Linguistici di Grandi Dimensioni (LLM)"
lezione: 2
durata_stimata: "60 minuti"
difficolta: "base"
prerequisiti: ["03-01"]
concetti_chiave:
  - pre-training
  - fine-tuning
  - RLHF
  - modello base
  - modello istruito
  - reward model
  - costi computazionali
obiettivi:
  - "Distinguere le fasi di pre-training, fine-tuning e RLHF"
  - "Spiegare perché un modello base non è ancora un assistente utile"
  - "Descrivere come RLHF usa il feedback umano per modellare il comportamento"
  - "Comprendere perché pochissimi soggetti al mondo possono addestrare un LLM da zero"
stato: "pubblicata"
versione: "1.0"
---

# Training, Fine-tuning e RLHF: come si costruisce un assistente AI

## Introduzione

Nella lezione precedente abbiamo capito cosa fa un LLM al livello più elementare: prevede il token successivo. Ma se ti fossi mai chiesto perché Claude risponde in modo utile, educato, e si attiene a delle istruzioni — invece di limitarsi a "completare" il tuo messaggio in modo grammaticalmente plausibile ma potenzialmente inutile o bizzarro — la risposta sta in questa lezione.

Un modello che ha solo imparato a prevedere il token successivo da enormi quantità di testo grezzo di Internet non è, di per sé, un buon assistente. Potrebbe completare "Come faccio a..." con qualsiasi continuazione statisticamente plausibile trovata nei suoi dati di addestramento — non necessariamente la più utile, la più sicura, o la più pertinente al tuo reale bisogno. Questa lezione descrive il percorso, in più fasi distinte, attraverso cui un modello grezzo diventa un assistente affidabile.

---

## Obiettivi di Apprendimento

Al termine di questa lezione sarai in grado di:

- Distinguere le fasi di pre-training, fine-tuning e RLHF
- Spiegare perché un modello base non è ancora, di per sé, un assistente utile
- Descrivere come RLHF usa il feedback umano per modellare il comportamento del modello
- Comprendere perché pochissimi soggetti al mondo hanno le risorse per addestrare un LLM da zero

---

## 1. Pre-training: imparare la lingua e il mondo da Internet

La prima fase, e di gran lunga la più costosa in termini computazionali, si chiama **pre-training** (pre-addestramento). In questa fase, il modello viene esposto a quantità di testo straordinariamente grandi — tipicamente una porzione enorme e filtrata di Internet, libri, articoli, codice sorgente — e addestrato, esattamente come descritto nella lezione precedente, sul compito di prevedere il token successivo.

```
PRE-TRAINING

Input: trilioni di parole di testo grezzo
       (siti web, libri, articoli, codice, ...)

Compito: prevedi il token successivo

Risultato: un MODELLO BASE — capace di completare
           testo in modo fluente e statisticamente
           plausibile, ma SENZA alcuna nozione
           specifica di "essere un assistente utile"
```

Il modello base che emerge da questa fase ha già assorbito, come visto nella Lezione 3.1, una quantità impressionante di conoscenza implicita su grammatica, fatti, logica, stili di scrittura. Ma se gli chiedi "Come si prepara una buona pasta al pomodoro?", un modello base potrebbe rispondere in modi imprevedibili: potrebbe continuare con un'altra domanda simile (perché nei suoi dati di addestramento, sequenze di domande simili erano comuni, ad esempio in forum o FAQ), invece di fornire direttamente la ricetta che ti aspetteresti da un assistente.

> **Perché questa fase è così costosa:** il pre-training di un modello allo stato dell'arte richiede migliaia di GPU specializzate, in funzione per settimane o mesi, con costi che si misurano in decine o centinaia di milioni di dollari. Questo è il motivo concreto per cui, ad oggi, solo un numero molto ridotto di organizzazioni al mondo (Anthropic, OpenAI, Google, Meta, e poche altre) ha le risorse per addestrare un modello da zero in questa fase.

---

## 2. Fine-tuning: specializzare il modello per un compito o un comportamento

La seconda fase, chiamata **fine-tuning** (messa a punto), parte dal modello base già addestrato e lo **adatta ulteriormente**, esponendolo a una quantità molto più piccola e curata di esempi specifici, tipicamente nel formato di conversazioni: domanda dell'utente, risposta ideale dell'assistente.

```
FINE-TUNING (supervisionato — riusa il concetto
             dell'apprendimento supervisionato, Lezione 2.2)

Input: un set curato e relativamente piccolo
       di esempi: {domanda utente → risposta ideale}

Esempio:
  Domanda: "Come si prepara una buona pasta al pomodoro?"
  Risposta ideale: "Ecco una ricetta semplice: 1. Soffriggi
                     aglio in olio d'oliva... [risposta
                     diretta e utile]"

Risultato: un MODELLO ISTRUITO (instruct model) —
           ha imparato il COMPORTAMENTO di rispondere
           utilmente a domande, non solo di completare
           testo plausibile
```

Questa fase costa una piccola frazione del pre-training — non servono trilioni di esempi, ma decine o centinaia di migliaia di esempi di alta qualità sono sufficienti per "orientare" il comportamento del modello verso quello di un assistente che risponde, segue istruzioni, mantiene un tono appropriato.

Il fine-tuning può anche essere usato, oltre che per insegnare il comportamento generale di assistente, per **specializzare** un modello su un compito specifico (es. rispondere solo su argomenti legali, o solo in un certo stile), anche se nei modelli generalisti più moderni questa specializzazione avviene spesso tramite altre tecniche (come il prompting che vedremo nella Lezione 3.4) piuttosto che tramite fine-tuning dedicato.

---

## 3. RLHF: insegnare al modello cosa significa "una buona risposta"

La terza fase, e probabilmente la più sottile dal punto di vista concettuale, si chiama **RLHF** — Reinforcement Learning from Human Feedback, apprendimento per rinforzo dal feedback umano. Riprende direttamente il paradigma dell'apprendimento per rinforzo descritto nella Lezione 2.2 (agente, ambiente, ricompensa), applicandolo in un modo specifico e ingegnoso.

Il problema che RLHF risolve è questo: anche dopo il fine-tuning supervisionato, può essere difficile definire in anticipo, per ogni possibile domanda, qual è "la" risposta ideale da fornire come esempio. Spesso, è più facile per un valutatore umano **confrontare due risposte diverse** e dire quale preferisce, piuttosto che scrivere da zero la risposta perfetta per ogni possibile domanda.

```
PROCESSO RLHF (semplificato)

1. Il modello (già fine-tuned) genera DUE risposte
   diverse alla stessa domanda

2. Un valutatore umano confronta le due risposte
   e indica quale preferisce (es. più utile, più sicura,
   meglio strutturata)

3. Questi confronti vengono usati per addestrare un
   secondo modello, chiamato REWARD MODEL, che imparA
   a PREVEDERE quale tipo di risposta un umano
   preferirebbe, senza dover chiedere a un umano ogni volta

4. Il modello principale viene poi ulteriormente
   addestrato usando il reward model come "giudice
   automatico": genera risposte, il reward model le
   valuta, e i pesi del modello principale vengono
   aggiustati per produrre risposte che il reward model
   valuta positivamente

   (questo è, letteralmente, l'apprendimento per
    rinforzo descritto nella Lezione 2.2: agente = il
    modello principale, ambiente = il compito di
    rispondere, ricompensa = il punteggio del reward model)
```

> **Perché questo passo è cruciale:** RLHF è il meccanismo principale attraverso cui un modello viene orientato verso comportamenti difficili da specificare con semplici esempi scritti a mano — essere utile ma non dannoso, essere onesto sui propri limiti, evitare contenuti pericolosi, mantenere un tono appropriato in situazioni delicate. Questi sono giudizi sottili, spesso dipendenti dal contesto, che si prestano meglio a essere insegnati tramite preferenze comparative (questa risposta è migliore di quella) piuttosto che tramite regole esplicite scritte a priori.

---

## 4. Modello base vs modello istruito: una differenza pratica enorme

Riassumendo le fasi precedenti in una distinzione pratica:

```
MODELLO BASE                          MODELLO ISTRUITO
(solo pre-training)                   (pre-training + fine-tuning + RLHF)

- Completa testo in modo              - Risponde utilmente a domande
  statisticamente plausibile           e istruzioni
- Non "sa" di dover comportarsi        - Segue un comportamento
  come un assistente                    da assistente: utile,
                                         onesto, sicuro
- Utile principalmente per             - È quello che incontri
  ricerca o casi d'uso molto            quando usi Claude.ai,
  specifici                             ChatGPT, o le rispettive API
                                         in modalità conversazionale
```

Quando interagisci con Claude tramite Claude.ai o tramite l'API in modalità messaggi (come visto nell'esempio della Lezione 1.5), stai sempre interagendo con un modello istruito, che ha attraversato tutte e tre le fasi descritte in questa lezione.

---

## 5. Perché questi costi limitano chi può fare cosa

Vale la pena essere espliciti su un punto con implicazioni pratiche dirette per chi costruisce sistemi AI (cioè, per il percorso che faremo da qui in avanti in questo corso):

- **Pre-addestrare un modello da zero**: richiede risorse alla portata di pochissime organizzazioni al mondo. Non è qualcosa che faremo, né che la maggior parte delle aziende che costruiscono prodotti AI fa
- **Fare fine-tuning su un modello esistente**: è molto più accessibile, e alcuni provider offrono questa possibilità anche a aziende di dimensioni medie, per specializzare un modello su un dominio specifico
- **Usare un modello già istruito tramite API, con prompting e strumenti**: è l'approccio accessibile a chiunque, incluso il nostro percorso di costruzione di agenti

Questo terzo livello — usare un modello già pronto, eccellente, addestrato da altri, e costruire attorno a esso logica, strumenti, memoria, orchestrazione — è esattamente l'approccio che adotteremo a partire dal Capitolo 4. Non dovremo mai preoccuparci di addestrare nulla da zero: il nostro lavoro sarà costruire sistemi intelligenti **attorno** a modelli già eccellenti, sfruttandone le capacità tramite le tecniche che vedremo nei capitoli successivi.

---

## Esempio Pratico: Riconoscere il Comportamento di un Modello Istruito

La prossima volta che usi un'interfaccia come Claude.ai, osserva consapevolmente questi comportamenti, e collegali a quanto visto in questa lezione:

1. **Segue istruzioni dirette** ("scrivi in stile formale", "rispondi in tre punti") — comportamento appreso primariamente nel fine-tuning supervisionato
2. **Evita contenuti dannosi anche se richiesti in modo ambiguo o indiretto** — comportamento rifinito primariamente tramite RLHF, dove valutatori umani hanno costantemente preferito risposte sicure a risposte pericolose, anche in casi limite
3. **Ammette di non sapere qualcosa, invece di inventare una risposta plausibile ma falsa** — quando questo accade (non sempre, come vedremo nella Lezione 3.5), è spesso il risultato di RLHF che ha premiato l'onestà sui propri limiti rispetto a risposte sicure di sé ma infondate

---

## Riepilogo

- Il **pre-training** espone il modello a quantità enormi di testo grezzo, producendo un **modello base** capace di completare testo plausibile ma non orientato a comportarsi come un assistente.
- Il **fine-tuning** supervisionato usa un set più piccolo e curato di esempi {domanda → risposta ideale} per insegnare al modello il comportamento di un assistente, producendo un **modello istruito**.
- **RLHF** usa confronti tra risposte, valutati da umani, per addestrare un **reward model** che impara le preferenze umane, e poi usa questo reward model per affinare ulteriormente il comportamento del modello principale tramite apprendimento per rinforzo.
- Pre-addestrare un modello da zero richiede risorse alla portata di pochissime organizzazioni; usare un modello già istruito tramite API, costruendoci sopra logica e strumenti, è l'approccio accessibile che useremo in questo corso.

---

## Domande di Verifica

1. Perché pensi che sia più facile, per un valutatore umano, scegliere quale tra due risposte preferisce, piuttosto che scrivere da zero "la" risposta perfetta per ogni domanda possibile? Cosa rende il confronto più gestibile della generazione?

2. Un modello base, esposto solo al pre-training, potrebbe in teoria "sapere" la stessa quantità di fatti di un modello istruito. Cosa cambia, allora, concretamente, nel modo in cui risponderebbero alla stessa domanda?

3. Rileggi la definizione di apprendimento per rinforzo data nella Lezione 2.2 (agente, ambiente, ricompensa). Identifica esplicitamente questi tre elementi nel processo RLHF descritto in questa lezione.

---

## Connessioni

**Viene da:** Lezione 3.1 — qui vediamo come il "semplice" compito di prevedere il token successivo, dopo il pre-training, viene ulteriormente plasmato in un comportamento utile e sicuro.

**Porta a:** Lezione 3.3 (Anatomia di un prodotto AI) — vedremo come un modello istruito come quello descritto qui viene integrato in un prodotto completo come Claude.ai.

**Ritroverai questi concetti in:** Lezione 2.2 (Machine Learning) — RLHF è un'applicazione diretta e concreta dell'apprendimento per rinforzo descritto lì in astratto. Lezione 8.1 (Self-Reflection) — il principio di usare un modello "giudice" per valutare risposte, centrale nel reward model di RLHF, ritornerà in una forma adattata quando un agente valuterà i propri stessi output.
