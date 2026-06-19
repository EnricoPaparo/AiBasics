---
id: "03-03"
titolo: "Il Portale ChatGPT e i suoi equivalenti: anatomia di un prodotto AI"
sottotitolo: "Tutto quello che abbiamo imparato finora, visto in azione in un'interfaccia che usi ogni giorno"
capitolo: 3
capitolo_titolo: "I Modelli Linguistici di Grandi Dimensioni (LLM)"
lezione: 3
durata_stimata: "45 minuti"
difficolta: "base"
prerequisiti: ["03-02"]
concetti_chiave:
  - chat
  - turno conversazionale
  - context window
  - system prompt
  - user message
  - assistant message
  - ruoli
obiettivi:
  - "Descrivere ChatGPT/Claude.ai come Web Application costruite su un LLM"
  - "Spiegare cosa è un turno conversazionale e come si accumula il contesto"
  - "Definire il context window e le sue implicazioni pratiche"
  - "Distinguere i tre ruoli di un messaggio: system, user, assistant"
stato: "pubblicata"
versione: "1.0"
---

# Il Portale ChatGPT e i suoi equivalenti: anatomia di un prodotto AI

## Introduzione

Questa lezione è un momento di consolidamento, non di novità pura. Useremo tutto ciò che abbiamo imparato — Web Application (1.4), API (1.5), modello vs prodotto (3.1), modello istruito tramite RLHF (3.2) — per smontare, pezzo per pezzo, l'interfaccia che probabilmente hai già usato decine di volte: una chat con un assistente AI come Claude.ai o ChatGPT.

L'obiettivo non è semplicemente "capire come si usa una chat" — sai già farlo. L'obiettivo è guardare sotto la superficie e vedere la struttura tecnica precisa che la rende possibile, perché questa stessa struttura è esattamente quella che useremo, dal Capitolo 4 in avanti, per costruire i nostri sistemi attorno ai modelli AI.

---

## Obiettivi di Apprendimento

Al termine di questa lezione sarai in grado di:

- Descrivere ChatGPT/Claude.ai come Web Application costruite sopra un LLM
- Spiegare cosa è un turno conversazionale e come si accumula il contesto in una chat
- Definire il context window e le sue implicazioni pratiche
- Distinguere i tre ruoli di un messaggio: system, user, assistant

---

## 1. ChatGPT come Web Application sopra un LLM

Ricordi la distinzione vista nella Lezione 1.4 tra "consultare un documento" e "usare un'applicazione"? Un'interfaccia di chat AI è l'esempio per eccellenza di Web Application: ogni interazione (inviare un messaggio, vedere la risposta apparire) avviene senza ricaricare la pagina, gestita interamente da JavaScript che comunica con un backend tramite chiamate API — esattamente lo schema descritto in quella lezione.

```
       TU (nel browser)                    BACKEND DI ANTHROPIC/OPENAI

  ┌─────────────────────┐                 ┌──────────────────────┐
  │  Interfaccia di chat  │   chiamata API  │  Logica di gestione    │
  │  (frontend, JavaScript)│ ─────────────► │  della conversazione   │
  │                        │                 │                        │
  │  - Mostra i messaggi   │ ◄───────────── │  - Salva la cronologia │
  │  - Gestisce l'invio    │   risposta       │  - Modera i contenuti  │
  │  - Stato locale        │                 │  - Chiama il MODELLO   │
  │    (testo non inviato) │                 │    (Claude, GPT, ...)  │
  └─────────────────────┘                 └──────────────────────┘
```

Il **modello** (Claude Sonnet 4.6, GPT, ecc. — la distinzione vista nella Lezione 3.1) è solo **un componente** di questo sistema più ampio. Il backend del prodotto si occupa anche di compiti che il modello, da solo, non farebbe: salvare le conversazioni passate, applicare filtri di sicurezza aggiuntivi, gestire l'autenticazione dell'utente, eventualmente orchestrare strumenti esterni (ricerca web, esecuzione di codice) — funzionalità che vedremo emergere con maggiore dettaglio tecnico nel Capitolo 4.

---

## 2. Il turno conversazionale e l'accumulo del contesto

Quando scrivi un messaggio e ricevi una risposta, hai completato un **turno** (in inglese, *turn*) della conversazione. Ma cosa succede esattamente, tecnicamente, quando scrivi il secondo messaggio, facendo riferimento a qualcosa detto nel primo?

Qui arriva una delle informazioni più importanti, e più sottovalutate, di questa lezione: **il modello non ha memoria nativa tra una chiamata API e l'altra** (lo avevamo anticipato nella Lezione 3.1, parlando di modello vs prodotto, e ancora prima nella Lezione 1.3 a proposito dello stato in HTTP). Ogni volta che invii un nuovo messaggio, il backend del prodotto **invia di nuovo, integralmente, tutta la cronologia della conversazione fino a quel punto**, insieme al nuovo messaggio.

```
TURNO 1
Tu scrivi:    "Qual è la capitale della Francia?"
Il backend invia al modello: ["Qual è la capitale della Francia?"]
Il modello risponde: "Parigi è la capitale della Francia."

TURNO 2
Tu scrivi:    "E quanti abitanti ha?"
Il backend invia al modello (RI-INVIANDO TUTTO):
  ["Qual è la capitale della Francia?",
   "Parigi è la capitale della Francia.",
   "E quanti abitanti ha?"]
Il modello risponde: "Parigi ha circa 2,1 milioni di abitanti
                       nella città propriamente detta."
```

Il modello "capisce" che "quanti abitanti ha" si riferisce a Parigi non perché "ricorda" la conversazione precedente in senso autonomo, ma perché **l'intera cronologia gli viene rifornita ogni volta**, e il meccanismo di attention (Lezione 2.5) gli permette di collegare correttamente il nuovo messaggio al contesto appena fornito.

> **Implicazione pratica diretta:** questo significa che più lunga diventa una conversazione, più testo deve essere rinviato al modello a ogni turno — con conseguenze dirette su costo (le API si pagano tipicamente in base ai token elaborati, come visto nella Lezione 3.1) e su un limite tecnico fondamentale che vediamo nella prossima sezione.

---

## 3. Il Context Window: il limite di quanto il modello può "vedere"

Il **context window** (finestra di contesto) è il numero massimo di token che un modello può elaborare in una singola chiamata, contando insieme l'intera cronologia della conversazione, eventuali istruzioni di sistema, e lo spazio necessario per generare la risposta.

```
┌─────────────────────────────────────────────────────────┐
│                     CONTEXT WINDOW                          │
│              (es. 200.000 token per Claude)                 │
│                                                                │
│  [System prompt] [Messaggio 1] [Risposta 1] [Messaggio 2]   │
│  [Risposta 2] ... [Messaggio N] [spazio per la risposta]     │
│                                                                │
│  Se la conversazione supera questo limite, qualcosa deve     │
│  essere tagliato, riassunto, o la richiesta fallisce          │
└─────────────────────────────────────────────────────────┘
```

Perché esiste questo limite? Ricordi, dalla Lezione 2.5, che l'attention calcola punteggi di rilevanza tra **tutte le coppie possibili** di token in una sequenza? Questo significa che il costo computazionale dell'attention cresce rapidamente con la lunghezza della sequenza — più token significano un costo di calcolo significativamente maggiore, non semplicemente proporzionale. Questo vincolo tecnico, radicato direttamente nell'architettura Transformer, è il motivo per cui ogni modello ha un limite massimo di contesto, per quanto i progressi tecnici lo abbiano reso via via più ampio negli anni.

> **Perché questo conta enormemente più avanti nel corso:** quando, nella Lezione 4.6, affronteremo la gestione della memoria nei sistemi AI, il problema centrale sarà esattamente questo: come continuare una conversazione o un compito complesso quando la quantità di informazione rilevante supera il context window disponibile. Tecniche come il riassunto progressivo della cronologia, o il recupero selettivo di sole le informazioni rilevanti (anticipando il principio di RAG, Lezione 4.3), esistono precisamente per gestire questo limite.

---

## 4. I tre ruoli di un messaggio: system, user, assistant

Avevamo già visto, nell'esempio di chiamata API della Lezione 1.5, una struttura con un campo `"role": "user"`. È il momento di trattare questo concetto con la precisione che merita, perché è centrale per tutto il resto del corso, incluso il momento in cui parleremo di system prompt nella prossima lezione.

Ogni messaggio scambiato con un modello ha un **ruolo** associato, che indica chi ha "detto" quel testo:

- **`system`**: istruzioni che definiscono il comportamento generale del modello per l'intera conversazione — non è un messaggio "detto" da un utente, ma una configurazione di contesto. Esempi: "Rispondi sempre in tono formale", "Sei un assistente specializzato in diritto del lavoro italiano"
- **`user`**: i messaggi scritti dalla persona che usa il sistema — le tue domande, richieste, istruzioni specifiche per quel turno
- **`assistant`**: le risposte generate dal modello — incluse quelle dei turni precedenti, che vengono rispedite a ogni nuova chiamata, come visto nella Sezione 2

```json
{
  "system": "Sei un assistente esperto di cucina italiana. Rispondi sempre con ricette pratiche e ingredienti facilmente reperibili.",
  "messages": [
    { "role": "user", "content": "Come si fa una buona carbonara?" },
    { "role": "assistant", "content": "Ecco la ricetta classica..." },
    { "role": "user", "content": "Posso usare la panna?" }
  ]
}
```

Questa struttura a ruoli è esattamente ciò che rende possibile, in un prodotto come Claude.ai, avere un comportamento di base coerente (definito dal `system`, spesso configurato dall'azienda che fornisce il prodotto, non visibile direttamente all'utente finale) mentre l'utente conduce liberamente la propria conversazione tramite i messaggi `user`, ottenendo risposte `assistant`.

> **Perché questo conta enormemente più avanti nel corso:** quando, nel Capitolo 6, parleremo dei prompt come artefatti professionali, distingueremo esattamente system prompt (istruzioni stabili, raramente modificate) da task prompt costruiti dinamicamente — una distinzione che si fonda direttamente sui ruoli appena descritti.

---

## 5. Panoramica dei principali prodotti AI

Per completezza, è utile avere un quadro sobrio dei principali prodotti che incontrerai, tutti costruiti secondo l'architettura descritta in questa lezione, ma con enfasi diverse:

- **Claude.ai** (Anthropic): interfaccia di chat con forte enfasi su affidabilità, ragionamento accurato, e capacità di gestire documenti lunghi grazie a context window ampi
- **ChatGPT** (OpenAI): probabilmente il prodotto più diffuso al mondo per popolarità, con un ecosistema ampio di plugin e integrazioni
- **Gemini** (Google): integrato profondamente con l'ecosistema Google (Workspace, ricerca)
- **Perplexity**: un prodotto che integra strettamente la ricerca web in tempo reale con la generazione di risposte, posizionandosi più come "motore di ricerca aumentato da AI" che come assistente generalista

Tutti questi prodotti condividono la stessa anatomia di fondo descritta in questa lezione: un frontend (Web Application), un backend che gestisce la logica e la cronologia, e uno o più modelli LLM come componente centrale per la generazione del linguaggio.

---

## Esempio Pratico: Osservare il Context Window in Azione

Se hai accesso a Claude.ai o ChatGPT, prova questo esperimento:

1. Inizia una conversazione molto lunga (centinaia di messaggi, se hai pazienza, oppure carica un documento molto estenso)
2. Continua a fare domande che richiedono di ricordare informazioni dall'inizio della conversazione
3. Osserva se, superata una certa lunghezza, il prodotto ti avvisa esplicitamente (molte interfacce mostrano un indicatore dell'uso del context, o avvisano quando la conversazione diventa molto lunga) o se le risposte iniziano a perdere coerenza con i dettagli più lontani nella conversazione

Questo esperimento rende tangibile un limite che altrimenti resterebbe puramente teorico, e ti prepara concretamente al problema che affronteremo, con soluzioni tecniche precise, nella Lezione 4.6.

---

## Riepilogo

- Un prodotto come ChatGPT o Claude.ai è una **Web Application** (Lezione 1.4) che usa un **LLM** (Lezione 3.1) come componente centrale, circondato da logica di gestione della cronologia, sicurezza, e funzionalità aggiuntive.
- Il modello non ha memoria nativa tra le chiamate: ogni **turno** conversazionale richiede di **rinviare l'intera cronologia** precedente insieme al nuovo messaggio.
- Il **context window** è il limite massimo di token che un modello può elaborare in una chiamata, una conseguenza tecnica diretta del costo computazionale dell'attention (Lezione 2.5) che cresce con la lunghezza della sequenza.
- Ogni messaggio ha un **ruolo**: `system` (istruzioni di comportamento generale), `user` (i messaggi della persona), `assistant` (le risposte del modello, incluse quelle dei turni precedenti).

---

## Domande di Verifica

1. Se il modello non ha memoria nativa, e ogni turno richiede di rinviare tutta la cronologia, cosa succede al costo (in token elaborati) di una conversazione che si allunga progressivamente? È costante, lineare, o cresce più rapidamente? Pensa a cosa succede quando aggiungi il decimo messaggio rispetto a quando aggiungi il centesimo.

2. Perché pensi che il `system prompt` di un prodotto commerciale come Claude.ai non sia tipicamente visibile all'utente finale, mentre i messaggi `user` e `assistant` lo sono?

3. Rifletti su questo scenario: stai costruendo un tuo prodotto che usa l'API di un LLM, e vuoi che si comporti sempre come "un tutor di matematica per studenti di scuola superiore". In quale dei tre ruoli (system, user, assistant) inseriresti questa istruzione, e perché?

---

## Connessioni

**Viene da:** Lezioni 3.1 e 3.2 — qui vediamo, concretamente, come il modello istruito descritto in quelle lezioni viene effettivamente utilizzato all'interno di un prodotto reale.

**Porta a:** Lezione 3.4 (Il Prompting) — avendo capito i ruoli system/user/assistant, siamo pronti ad approfondire come formulare efficacemente le istruzioni in ciascuno di questi ruoli.

**Ritroverai questi concetti in:** Lezione 4.6 (Memory nei sistemi AI) — il problema del context window e dell'accumulo della cronologia, qui solo osservato, troverà soluzioni tecniche precise. Lezione 6.4 (I Prompt come Artefatti) — la distinzione system/user che abbiamo introdotto qui sarà la base per capire la differenza tra prompt stabili e prompt dinamici nei sistemi agentivi professionali.
