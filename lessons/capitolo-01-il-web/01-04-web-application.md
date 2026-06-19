---
id: "01-04"
titolo: "Web Application: quando il browser diventa un'interfaccia"
sottotitolo: "Il frontend si emancipa: dal documento da leggere all'applicazione con cui interagire"
capitolo: 1
capitolo_titolo: "Il Web come lo Conosciamo"
lezione: 4
durata_stimata: "50 minuti"
difficolta: "base"
prerequisiti: ["01-03"]
concetti_chiave:
  - web application
  - SPA
  - frontend
  - backend
  - stato applicazione
  - JavaScript
  - rendering lato client
obiettivi:
  - "Distinguere 'consultare' un sito da 'usare' un'applicazione"
  - "Spiegare cosa è una Single Page Application e perché è diversa da un sito dinamico classico"
  - "Descrivere frontend e backend come due sistemi distinti che comunicano via API"
  - "Comprendere il concetto di stato dell'applicazione lato client"
stato: "pubblicata"
versione: "1.0"
---

# Web Application: quando il browser diventa un'interfaccia

## Introduzione

Nelle ultime due lezioni abbiamo visto il server evolversi: da semplice fotocopiatrice di file fissi (sito statico) a sarto che costruisce ogni risposta su misura (sito dinamico). Ma in entrambi i casi, il browser aveva un ruolo passivo: riceveva HTML completo, lo mostrava, e basta. Ogni interazione significativa (un clic su un link, l'invio di un modulo) generava una richiesta completamente nuova, con una pagina interamente ricaricata.

Questa lezione descrive il passo successivo: cosa succede quando anche il browser inizia a "fare cose" — non solo a mostrare, ma a elaborare, decidere, ricordare. È il momento in cui un sito web diventa una **Web Application**, e in cui ChatGPT, Claude.ai, Gmail, Notion smettono di essere "pagine" e diventano strumenti con cui si lavora per minuti o ore senza mai vedere un ricaricamento completo della pagina.

---

## Obiettivi di Apprendimento

Al termine di questa lezione sarai in grado di:

- Distinguere concettualmente "consultare" un sito da "usare" un'applicazione
- Spiegare cosa è una Single Page Application e perché è diversa da un sito dinamico classico
- Descrivere frontend e backend come due sistemi distinti che comunicano attraverso API
- Comprendere il concetto di stato dell'applicazione mantenuto lato client

---

## 1. Consultare un sito vs usare un'applicazione

Pensa alla differenza tra leggere un articolo di un blog e usare un foglio di calcolo online come Google Sheets.

Quando leggi l'articolo, l'interazione è minima: scorri, eventualmente clicchi un link che ti porta a un'altra pagina (e l'intera pagina si ricarica). Il sito ti *mostra* qualcosa.

Quando usi un foglio di calcolo online, l'interazione è continua e densa: clicchi celle, digiti formule, vedi risultati aggiornarsi istantaneamente, sposti colonne — e in nessun momento la pagina "si ricarica" nel senso classico. Il browser, in questo caso, non sta semplicemente mostrando un documento: sta facendo girare un **programma**.

Questa è la distinzione fondamentale: un sito è un insieme di **documenti** da consultare; una web application è un **programma** con cui interagire, che vive (in buona parte) dentro il browser stesso.

---

## 2. La Single Page Application (SPA)

Il modello architetturale più comune per le web application moderne si chiama **SPA — Single Page Application**, "applicazione a pagina singola".

Il nome descrive bene il principio: il browser carica **una sola volta** una pagina HTML scheletro, quasi vuota, insieme a un grande blocco di codice JavaScript. Da quel momento in poi, tutte le interazioni — cambiare sezione, aprire un menu, visualizzare nuovi dati — vengono gestite *dal JavaScript stesso*, senza più richiedere al server una pagina HTML completamente nuova.

```
SITO DINAMICO CLASSICO              SINGLE PAGE APPLICATION

Clic su un link                     Clic su un link
       │                                   │
       ▼                                   ▼
Richiesta HTTP per                  JavaScript intercetta il clic
una NUOVA pagina HTML                       │
       │                                   ▼
       ▼                            Richiesta solo per i DATI
Browser scarta tutto e              necessari (spesso JSON)
ricarica da zero                            │
       │                                   ▼
       ▼                            JavaScript aggiorna SOLO
Nuova pagina mostrata                la parte di pagina che
                                     deve cambiare
```

Quando usi Gmail e clicchi su un'email diversa, non stai generando una richiesta per una pagina HTML completa: il JavaScript già presente nel browser richiede solo il contenuto di quella email (tipicamente in formato JSON, come vedremo nella prossima lezione) e aggiorna esclusivamente la porzione di schermo necessaria. Il resto dell'interfaccia — la barra laterale, l'intestazione, i menu — resta esattamente com'era, senza nessun lampo di ricaricamento.

> **Perché questo è rilevante per il corso:** l'interfaccia di ChatGPT o di Claude.ai funziona esattamente così. Quando scrivi un messaggio e premi invio, il browser non ricarica la pagina: il JavaScript invia i tuoi dati a un'API, riceve la risposta (spesso pezzo per pezzo, come vedremo parlando di streaming nella Lezione 4.1), e aggiorna dinamicamente solo l'area della conversazione.

---

## 3. Frontend e Backend come sistemi distinti

Nei siti dinamici classici (Lezione 1.3), backend e generazione dell'HTML erano strettamente accoppiati: il server costruiva l'HTML finale e lo mandava già pronto.

Nelle web application moderne, questo accoppiamento si rompe. **Frontend** e **backend** diventano due sistemi distinti, spesso scritti in linguaggi diversi, sviluppati da team diversi, e che comunicano esclusivamente attraverso API (il tema della prossima lezione).

```
┌─────────────────┐         richieste API          ┌─────────────────┐
│    FRONTEND      │ ◄─────────────────────────────►│     BACKEND      │
│  (nel browser)   │      (tipicamente JSON)         │  (sul server)    │
│                  │                                  │                  │
│  - HTML/CSS      │                                  │  - Logica        │
│  - JavaScript    │                                  │  - Database      │
│  - Stato locale  │                                  │  - Autenticazione│
└─────────────────┘                                  └─────────────────┘
```

Il frontend ha la responsabilità di: mostrare l'interfaccia, gestire le interazioni dell'utente, mantenere uno stato locale (vedremo cosa significa nel prossimo paragrafo), e comunicare con il backend quando ha bisogno di dati o deve salvare qualcosa.

Il backend ha la responsabilità di: applicare le regole di business, parlare con database e altri sistemi, garantire sicurezza e autenticazione, e rispondere alle richieste del frontend con i dati richiesti.

Questa separazione netta è esattamente l'architettura che useremo per costruire sistemi AI: un frontend (interfaccia di chat, dashboard) che parla con un backend (che a sua volta orchestra chiamate a modelli AI, database vettoriali, strumenti esterni). Il pattern è identico; cambia solo cosa fa il backend internamente.

---

## 4. Il concetto di "stato dell'applicazione"

Avevamo già incontrato il concetto di **stato** nella Lezione 1.3, parlando di come un sito dinamico "ricorda" chi sei tramite i cookie. Nelle web application, lo stato si arricchisce di un livello ulteriore: lo **stato dell'applicazione mantenuto nel browser**, indipendentemente dal server.

Pensa a un'interfaccia di chat come quella di Claude.ai. Mentre scrivi un messaggio ma non l'hai ancora inviato, quel testo esiste *solo* nel tuo browser: il server non ne sa nulla. Se hai aperto un menu a tendina, se hai selezionato una scheda diversa, se hai scorso fino a un certo punto della conversazione — tutto questo è stato locale, gestito interamente da JavaScript, senza alcuna comunicazione con il server.

```
STATO LOCALE (nel browser)              STATO REMOTO (sul server)

- Testo non ancora inviato              - Conversazioni salvate
- Menu apert/chiuso                     - Account utente
- Scroll position                       - Preferenze persistenti
- Selezioni temporanee                  - Cronologia dei messaggi
       │                                        │
       └──────────── sincronizzazione ──────────┘
              (avviene tramite chiamate API,
               solo quando necessario)
```

Capire questa distinzione è importante perché la maggior parte dei problemi di progettazione nelle applicazioni moderne — incluse le interfacce per sistemi AI — riguarda esattamente questo: cosa deve vivere temporaneamente nel browser, e cosa deve invece essere salvato in modo persistente sul server. Un messaggio che stai ancora scrivendo non ha bisogno di essere salvato a ogni lettera digitata; una volta inviato, invece, deve diventare stato remoto, persistente, recuperabile in futuro.

---

## 5. Esempi concreti di Web Application

- **Google Maps:** ti muovi sulla mappa, zoomi, cerchi indirizzi — tutto avviene senza mai ricaricare la pagina. Solo i dati della mappa (le "tile" geografiche) vengono richiesti al volo.
- **Notion:** ogni blocco di testo, ogni pagina, ogni database è gestito interamente da JavaScript nel browser; il salvataggio sul server avviene in background, spesso impercettibile.
- **Figma:** un intero software di design professionale che gira nel browser, con uno stato applicativo complesso (livelli, selezioni, strumenti attivi) mantenuto interamente lato client.
- **Claude.ai / ChatGPT:** l'interfaccia di chat che useremo come riferimento concettuale per tutto il resto del corso. Il messaggio che scrivi è stato locale; la cronologia salvata è stato remoto; l'invio del messaggio è una chiamata API che attraversa esattamente i meccanismi HTTP descritti nella Lezione 1.1.

---

## Esempio Pratico: Vedere una SPA in Azione

1. Apri una qualsiasi applicazione web moderna (Gmail, Notion, o anche Claude.ai)
2. Apri gli strumenti sviluppatore (F12) → tab **Network**
3. Filtra per **Doc** (documenti HTML): osserva che, dopo il caricamento iniziale, non compaiono più richieste di tipo documento anche se navighi tra sezioni diverse dell'app
4. Ora filtra per **Fetch/XHR** (le chiamate API): osserva che invece queste continuano ad apparire ogni volta che l'interfaccia mostra nuovi dati

Questo conferma empiricamente quanto descritto: la pagina HTML viene caricata una volta sola; tutto il resto dell'interazione passa attraverso chiamate API che restituiscono solo dati, non pagine intere.

---

## Riepilogo

- Una **Web Application** trasforma il browser da semplice visualizzatore di documenti a ambiente di esecuzione di un programma interattivo.
- La **Single Page Application (SPA)** carica l'HTML una sola volta e gestisce tutte le interazioni successive tramite JavaScript, richiedendo solo dati (non pagine intere) al server.
- **Frontend** e **backend** diventano sistemi distinti che comunicano tramite API: il frontend gestisce interfaccia e interazione, il backend gestisce logica, dati e sicurezza.
- Lo **stato dell'applicazione** si divide tra stato locale (temporaneo, nel browser) e stato remoto (persistente, sul server), sincronizzati tramite chiamate API quando necessario.

---

## Domande di Verifica

1. Quando scrivi un messaggio in un'interfaccia di chat AI ma non l'hai ancora inviato, quel testo è stato locale o remoto? Cosa succederebbe, dal punto di vista dello stato, se chiudessi la scheda del browser in quel momento?

2. Perché pensi che separare frontend e backend in sistemi distinti (invece di tenerli accoppiati come nei siti dinamici classici) renda più facile, in seguito, costruire anche un'app mobile che usa lo stesso backend?

3. Identifica, in un'applicazione che usi regolarmente, un elemento di stato locale e un elemento di stato remoto. Come fai a distinguerli?

---

## Connessioni

**Viene da:** Lezione 1.3 — qui il backend "costruiva" l'HTML; ora il frontend si emancipa e costruisce l'interfaccia da solo, comunicando con il backend solo per i dati.

**Porta a:** Lezione 1.5 (Le API) — abbiamo accennato più volte a "chiamate API che restituiscono dati": è il momento di trattare questo meccanismo in profondità, capendo esattamente come è strutturata una richiesta e una risposta API.

**Ritroverai questi concetti in:** Lezione 3.3 (Anatomia di un prodotto AI) — vedremo che ChatGPT e Claude.ai sono Web Application costruite esattamente secondo questo modello, con un frontend che gestisce la conversazione e un backend che orchestra le chiamate al modello AI sottostante.
