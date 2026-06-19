---
id: "01-03"
titolo: "Siti Web Dinamici: server, database e la nascita della logica"
sottotitolo: "Dal file fisso alla risposta costruita su misura: il salto concettuale che apre la strada a tutto il resto"
capitolo: 1
capitolo_titolo: "Il Web come lo Conosciamo"
lezione: 3
durata_stimata: "45 minuti"
difficolta: "base"
prerequisiti: ["01-02"]
concetti_chiave:
  - server dinamico
  - backend
  - database
  - stato
  - logica server-side
  - rendering lato server
  - query
obiettivi:
  - "Spiegare cosa cambia tra un sito statico e uno dinamico a livello di server"
  - "Descrivere il ruolo di un database in un sito dinamico"
  - "Comprendere il concetto di 'stato' applicato a un'applicazione web"
  - "Tracciare il ciclo completo richiesta-elaborazione-risposta dinamica"
stato: "pubblicata"
versione: "1.0"
---

# Siti Web Dinamici: server, database e la nascita della logica

## Introduzione

Nella lezione precedente abbiamo visto il caso più semplice: il server come fotocopiatrice, che restituisce sempre lo stesso file. Ma la maggior parte di ciò che usiamo ogni giorno online non funziona così. Quando apri Gmail vedi *le tue* email, non quelle di qualcun altro. Quando apri Amazon vedi *i tuoi* ordini precedenti. Quando ricarichi la pagina di un social network, il contenuto è leggermente diverso da un minuto prima.

Questo salto — dal file fisso alla risposta costruita su misura per quella specifica richiesta, in quel preciso momento — è uno dei concetti più importanti di tutto il corso. Introduce due idee che ritroveremo costantemente quando parleremo di sistemi AI: la **logica che elabora**, e lo **stato che persiste**. Un agente AI che ricorda una conversazione precedente sta facendo, concettualmente, la stessa cosa che fa un sito dinamico che ricorda chi sei loggato.

---

## Obiettivi di Apprendimento

Al termine di questa lezione sarai in grado di:

- Spiegare cosa cambia tra un sito statico e uno dinamico a livello di funzionamento del server
- Descrivere il ruolo di un database in un sito dinamico
- Comprendere il concetto di "stato" applicato a un'applicazione web
- Tracciare il ciclo completo richiesta → elaborazione → risposta dinamica

---

## 1. Cosa cambia rispetto al sito statico

Nel sito statico, il server riceve una richiesta e fa una sola cosa: legge un file dal disco e lo restituisce. Non c'è nessuna decisione da prendere.

Nel sito **dinamico**, il server riceve la richiesta e, prima di rispondere, esegue del **codice**. Questo codice può:

- Controllare chi sta facendo la richiesta (sei loggato? chi sei?)
- Recuperare informazioni specifiche per quella richiesta (i tuoi ordini, i tuoi messaggi)
- Eseguire calcoli (il totale del carrello, la disponibilità di un prodotto)
- Costruire l'HTML al volo, inserendo i dati appena recuperati

Il file HTML che il browser riceve, alla fine, esiste comunque — ma **non esisteva prima della richiesta**. È stato generato in quel momento, apposta per te.

> **Analogia concreta:** se il sito statico è la fotocopiatrice, il sito dinamico è un sarto su misura. Non tira fuori un abito già pronto da uno scaffale: prende le tue misure (la richiesta), consulta i suoi appunti (il database), e costruisce l'abito (la risposta) apposta per te, in quel momento.

---

## 2. Il ruolo del server backend

Il pezzo di software che esegue questa logica si chiama comunemente **backend**, in contrapposizione al **frontend** (quello che vedi e con cui interagisci nel browser). Il backend è un programma che gira sul server, scritto in linguaggi come Python, JavaScript (Node.js), Java, PHP, Go, e molti altri.

Il backend, quando riceve una richiesta HTTP (esattamente quelle che abbiamo visto nella Lezione 1.1), non si limita a leggere un file. Esegue una sequenza di operazioni che potremmo schematizzare così:

```
1. Riceve la richiesta HTTP
2. Identifica cosa viene chiesto (quale pagina? quali parametri?)
3. Esegue la logica necessaria:
   - magari interroga un database
   - magari chiama altri servizi
   - magari fa calcoli
4. Costruisce la risposta (spesso HTML, ma può essere JSON, come vedremo nella Lezione 1.5)
5. Invia la risposta HTTP al client
```

Questo è esattamente lo stesso schema concettuale che useremo, più avanti nel corso, per descrivere cosa fa un server che ospita un modello di intelligenza artificiale: riceve una richiesta, esegue una computazione (in quel caso, l'inferenza del modello), e restituisce una risposta.

---

## 3. Cos'è un database e perché serve

Un **database** è un sistema organizzato per memorizzare, recuperare e gestire grandi quantità di dati in modo efficiente e strutturato.

Senza un database, un sito dinamico non avrebbe nulla da "consultare" prima di rispondere. Il database è la memoria persistente del sistema: contiene gli utenti registrati, gli ordini effettuati, i messaggi scambiati, i prodotti disponibili — tutto ciò che deve esistere anche dopo che il server viene riavviato, anche dopo che la singola richiesta è terminata.

### Una query: come si "chiede" qualcosa a un database

Il backend comunica con il database attraverso delle **query**, cioè richieste formulate in un linguaggio specifico (il più comune è SQL — Structured Query Language).

```sql
SELECT nome, email FROM utenti WHERE id = 42;
```

Questa query dice, in sostanza: "dammi il nome e l'email dell'utente con identificativo 42". Il database risponde con quei dati, e il backend li usa per costruire la pagina.

> **Perché questo conta più avanti:** quando arriveremo a parlare di RAG (Retrieval-Augmented Generation) nella Lezione 4.3, vedremo che un agente AI fa concettualmente la stessa cosa — interroga un database (in quel caso, un database vettoriale) per recuperare informazioni rilevanti prima di generare una risposta. Il pattern "recupera, poi rispondi" nasce qui, nei siti dinamici classici.

---

## 4. Il concetto di stato

Uno dei concetti più importanti introdotti dai siti dinamici è quello di **stato**.

Lo stato è l'insieme delle informazioni che il sistema "ricorda" tra una richiesta e l'altra. HTTP, di per sé, è un protocollo **stateless** (senza stato): ogni richiesta è indipendente dalle altre, il server non ha nativamente memoria del fatto che la richiesta di un secondo fa proveniva dalla stessa persona.

Allora come fa un sito a "ricordare" che sei loggato, anche se navighi tra pagine diverse facendo richieste HTTP separate? La risposta più comune sono i **cookie**: piccoli pezzi di dati che il server chiede al browser di conservare e di rispedire a ogni richiesta successiva, come una specie di "biglietto identificativo".

```
1. Ti logghi → il server crea un cookie con un identificativo di sessione
2. Il browser salva il cookie
3. Ogni richiesta successiva, il browser invia automaticamente quel cookie
4. Il server controlla il cookie, recupera dal database chi sei,
   e costruisce la risposta di conseguenza
```

Questo meccanismo — un'identità che persiste attraverso richieste altrimenti indipendenti — è concettualmente identico al problema che affronteremo con la **memoria degli agenti AI** nella Lezione 4.6. Anche un LLM, di base, non ha memoria tra una chiamata API e l'altra: ogni chiamata è stateless, esattamente come HTTP. Il "ricordo" di una conversazione viene ricostruito rispedendo, a ogni richiesta, la cronologia precedente — un meccanismo per certi versi più simile al cookie di quanto si pensi.

---

## 5. Il ciclo completo: richiesta → elaborazione → risposta dinamica

Mettiamo insieme tutti i pezzi con un esempio concreto: apri la pagina di un prodotto su un sito di e-commerce.

```
1. Il browser invia: GET /prodotto/57

2. Il backend riceve la richiesta e:
   a. Estrae l'ID del prodotto (57) dall'URL
   b. Interroga il database:
      SELECT * FROM prodotti WHERE id = 57;
   c. Riceve dal database: nome, prezzo, descrizione, disponibilità
   d. Controlla anche il cookie di sessione per sapere se l'utente
      ha già questo prodotto nel carrello
   e. Costruisce l'HTML inserendo questi dati nei punti giusti

3. Il backend invia la risposta:
   HTTP/1.1 200 OK
   Content-Type: text/html

   <html>...<h1>Nome del prodotto</h1>
   <p>Prezzo: 29,99€</p>
   <p>Disponibilità: 12 pezzi</p>...</html>

4. Il browser riceve questo HTML e lo mostra,
   esattamente come faceva con il sito statico —
   la differenza è tutta nel COME quell'HTML è stato costruito,
   non in COME viene interpretato dal browser
```

Questo ultimo punto è essenziale e spesso sottovalutato: **dal punto di vista del browser, non c'è differenza tra ricevere HTML statico o dinamico**. Il browser interpreta sempre allo stesso modo. La differenza enorme è tutta a monte, in quello che succede sul server prima che la risposta venga inviata.

---

## Esempio Pratico: Osservare la Dinamicità

Puoi verificare empiricamente se un sito è dinamico con un piccolo esperimento.

1. Vai su un sito di e-commerce qualsiasi e apri la pagina di un prodotto
2. Apri gli strumenti sviluppatore (F12) → tab **Network**
3. Ricarica la pagina
4. Osserva: oltre alla richiesta HTML principale, probabilmente vedrai richieste verso endpoint con nomi come `/api/carrello`, `/api/raccomandazioni`, `/api/utente` — spesso con risposte in formato JSON

Questo è un segnale chiaro che dietro c'è un backend che interroga dati specifici per quella sessione, quel momento, quell'utente. Confronta questo comportamento con quello osservato nella Lezione 1.2 su un sito statico: la differenza nel numero e nella natura delle richieste di rete è il modo più diretto per "vedere" la dinamicità in azione.

---

## Riepilogo

- Un sito **dinamico** esegue codice (logica **backend**) prima di rispondere, costruendo l'HTML al volo invece di leggerlo da un file fisso.
- Il **database** è la memoria persistente del sistema, interrogata tramite **query** per recuperare i dati necessari a costruire la risposta.
- HTTP è **stateless** per natura; lo **stato** (es. "sei loggato") viene ricostruito tramite meccanismi come i **cookie**, che fanno viaggiare un identificativo a ogni richiesta.
- Il ciclo richiesta → elaborazione → risposta è lo stesso schema concettuale che ritroveremo nelle chiamate ai modelli AI: ricevi input, elabori (con o senza dati esterni), rispondi.
- Dal punto di vista del browser, HTML statico e dinamico sono indistinguibili: la differenza è tutta in come quell'HTML è stato prodotto.

---

## Domande di Verifica

1. Se HTTP è stateless, perché quando navighi su Amazon il carrello "ricorda" cosa hai aggiunto, anche passando da una pagina all'altra? Spiega il meccanismo con parole tue.

2. Un sito dinamico che interroga il database per ogni singola richiesta, anche quando i dati non sono cambiati da ore, è efficiente? Quali strategie ti vengono in mente per migliorare questa situazione? (Non è richiesta una risposta tecnica precisa — è un esercizio di intuizione.)

3. Spiega con un esempio concreto, diverso da quelli usati nella lezione, perché il pattern "ricorda chi sei tra richieste diverse" sarà importante quando parleremo di conversazioni con un agente AI.

---

## Connessioni

**Viene da:** Lezione 1.2 — qui abbiamo "rotto" l'idea del file fisso, introducendo logica ed elaborazione.

**Porta a:** Lezione 1.4 (Web Application) — vedremo come questa logica si sposta sempre più anche nel browser, sfumando il confine tra backend e frontend.

**Ritroverai questi concetti in:** Lezione 4.3 (RAG) — lo stesso pattern "interroga un database, poi costruisci la risposta" applicato a un database vettoriale e a un LLM. Lezione 4.6 (Memory nei sistemi AI) — il problema dello stato e della sua persistenza, qui risolto con i cookie, lì risolto con tecniche di gestione della memoria conversazionale.
