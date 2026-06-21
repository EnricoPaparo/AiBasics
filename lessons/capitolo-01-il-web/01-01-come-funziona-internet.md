---
id: "01-01"
titolo: "Come funziona Internet: client, server e il viaggio di una richiesta"
sottotitolo: "Prima di costruire sistemi AI, bisogna capire l'infrastruttura su cui vivono"
capitolo: 1
capitolo_titolo: "Il Web come lo Conosciamo"
lezione: 1
durata_stimata: "45 minuti"
difficolta: "base"
prerequisiti: []
concetti_chiave:
  - internet
  - rete
  - client
  - server
  - HTTP
  - DNS
  - IP
  - browser
  - protocollo
  - richiesta
  - risposta
obiettivi:
  - "Spiegare la differenza tra Internet e il Web"
  - "Descrivere il modello client-server con parole proprie"
  - "Tracciare il percorso completo di una richiesta HTTP dalla barra del browser alla risposta"
  - "Comprendere cosa sono IP, DNS, porta e protocollo senza memorizzare definizioni"
stato: "pubblicata"
versione: "1.0"
---
# Come funziona Internet: client, server e il viaggio di una richiesta

> 📌 **In breve** · ⏱ ~45 min · 🎯 Saprai spiegare cosa succede quando “chiedi qualcosa” alla rete.
> Il viaggio di una richiesta — client, server, DNS, HTTP — perché è lo stesso meccanismo con cui, più avanti, il tuo programma “chiamerà” un’AI.

In questo capitolo costruiremo le fondamenta su cui poggia tutto il resto del corso: come funziona la rete, come comunicano i programmi tra loro, e cosa succede davvero quando un'applicazione chiama un servizio esterno. Capire questi meccanismi non è un prerequisito burocratico — è il vocabolario tecnico che ti permetterà di ragionare con precisione su ogni sistema AI che costruiremo.

## Introduzione

Tutto ciò che studieremo in questo corso — API, modelli di intelligenza artificiale, agenti autonomi, workflow complessi — vive e comunica attraverso Internet. Prima ancora di scrivere una riga di codice o di capire cosa sia un Large Language Model, dobbiamo avere una mappa chiara di come funziona la rete su cui questi sistemi operano.

Questa lezione non è un prerequisito burocratico: è il fondamento. Chi non capisce come viaggia una richiesta in rete fatica a capire perché un agente AI "chiama" un servizio esterno, perché ci sono limiti di velocità nelle API, o perché il contesto di una conversazione deve essere inviato ogni volta. I concetti che vediamo oggi ritorneranno, in forma più sofisticata, in ogni capitolo successivo.

---

## Obiettivi di Apprendimento

Al termine di questa lezione sarai in grado di:

- Spiegare la differenza tra Internet e il Web con un esempio concreto
- Descrivere il modello client-server e riconoscerlo in situazioni quotidiane
- Tracciare il percorso completo di una richiesta HTTP, dalla digitazione di un URL alla visualizzazione della pagina
- Capire cosa sono IP, DNS, porta e protocollo senza doverli memorizzare come definizioni astratte

---

## 1. Cos'è Internet — e cosa non è

Il termine "Internet" viene spesso usato come sinonimo di "Web", di "browser", o genericamente di "quella cosa che si usa per fare le cose online". Questa confusione ha conseguenze concrete: chi non distingue i livelli non riesce a capire dove si colloca un'API, dove vive un modello AI, o perché certi sistemi funzionano anche senza browser.

**Internet** è una rete fisica e logica globale che collega miliardi di dispositivi tra loro. È fatta di cavi sottomarini, antenne, router, switch, e protocolli di comunicazione. Esiste dagli anni '60 (nasce come ARPANET, un progetto militare americano) e il suo scopo originario era far comunicare computer fisicamente lontani in modo resiliente, cioè in modo che la comunicazione potesse continuare anche se una parte della rete venisse distrutta.

**Il Web** (World Wide Web) è uno dei servizi che viaggia su Internet. È stato inventato da Tim Berners-Lee nel 1989 al CERN di Ginevra. Il Web è il sistema di pagine collegate da link che navighiamo col browser. Ma Internet trasporta anche email, videochiamate, giochi online, messaggi istantanei, e — quello che ci interessa — le chiamate alle API dei modelli di intelligenza artificiale.

> **Analogia concreta:** Internet è come la rete autostradale. Il Web è come i camion di un certo operatore che usano quelle autostrade. Ci sono altri operatori (email, streaming, VoIP) che usano le stesse autostrade con regole diverse.

Questa distinzione non è accademica. Quando il tuo agente AI chiama l'API di OpenAI per ottenere una risposta, quella chiamata viaggia su Internet ma **non** usa il Web nel senso tradizionale: non c'è una pagina HTML, non c'è un browser. C'è un programma che parla direttamente con un altro programma attraverso la rete.

---

## 2. Il modello Client-Server: chi chiede, chi risponde

Il principio organizzativo fondamentale di quasi tutto ciò che succede in rete è semplice e potente: c'è chi fa una **richiesta** e chi la **soddisfa**.

- Il **client** è il dispositivo o programma che fa la richiesta. Il tuo browser è un client. La tua applicazione Python che chiama un'API è un client. Il tuo telefono che scarica la posta è un client.
- Il **server** è il dispositivo o programma che riceve la richiesta, la elabora, e restituisce una risposta. Il computer di Google che ti manda la pagina di ricerca è un server. Il sistema di Anthropic che elabora la tua domanda e genera una risposta è un server.

```
CLIENT                          SERVER
  │                                │
  │──── richiesta ────────────────►│
  │                                │  (elaborazione)
  │◄─── risposta ──────────────────│
  │                                │
```

Questa struttura — richiesta e risposta — è il pattern che vedrai ovunque nel corso. Quando un agente AI usa uno strumento esterno, sta facendo una richiesta a un server. Quando riceve il risultato, sta ricevendo una risposta. Quando il tuo workflow chiama un LLM, il tuo programma è il client e il datacenter di Anthropic o OpenAI è il server.

### Il server non è necessariamente un'unica macchina

È importante chiarirlo subito: nella realtà moderna, quando parli con un "server", stai probabilmente parlando con decine o centinaia di computer che lavorano insieme, distribuiti geograficamente, gestiti da sistemi di bilanciamento del carico. Ma dal punto di vista del client — e del modello mentale che costruiamo qui — questo è irrilevante. Il client manda una richiesta, il server (come entità logica) risponde.

---

## 3. IP, DNS, porta: l'indirizzo e il citofono

Per capire come funziona una richiesta in rete, dobbiamo introdurre tre concetti: l'indirizzo IP, il DNS, e la porta. Non come definizioni da memorizzare, ma come risposte a tre domande pratiche.

### 3.1 Come si trova un computer in rete? — L'indirizzo IP

Ogni dispositivo connesso a Internet ha un indirizzo IP (Internet Protocol). È una serie di numeri che identifica in modo univoco quel dispositivo nella rete. Nella versione più diffusa (IPv4) ha la forma `192.168.1.1` o `172.217.16.46`. Nella versione più recente (IPv6) è più lunga.

Pensa all'indirizzo IP come all'indirizzo fisico di un edificio: senza di esso, nessuna comunicazione può essere consegnata alla destinazione giusta.

### 3.2 Come si ricorda un indirizzo IP? — Il DNS

`172.217.16.46` è l'indirizzo IP di Google. Nessuno lo memorizza. Tutti digitano `google.com`.

Il **DNS** (Domain Name System) è il sistema che traduce i nomi leggibili dagli esseri umani (`google.com`, `anthropic.com`, `github.com`) negli indirizzi IP corrispondenti. Funziona come un elenco telefonico distribuito su scala globale: quando digiti un nome, il tuo dispositivo chiede a un server DNS "che indirizzo IP corrisponde a questo nome?" e il server risponde con il numero.

Questo sistema è fondamentale per la manutenibilità: se Google cambia i propri server (e quindi i propri indirizzi IP), aggiorna il DNS e tutti continuano a raggiungerlo digitando `google.com`. Gli utenti non devono fare nulla.

### 3.3 A quale programma è destinata la richiesta? — La porta

Su un singolo computer possono girare decine di programmi contemporaneamente, tutti connessi a Internet. Come fa la rete a sapere che una certa richiesta deve andare al browser e non al client email?

La risposta è la **porta**: un numero da 0 a 65535 che identifica il programma specifico a cui è destinata la comunicazione. È come il numero dell'appartamento in un edificio: l'indirizzo IP è il numero civico, la porta è l'interno.

Alcune porte sono standard e universalmente riconosciute:
- **80** → traffico HTTP (web non cifrato)
- **443** → traffico HTTPS (web cifrato, quello che usiamo quasi sempre)
- **25** → email (SMTP)
- **22** → connessioni SSH (amministrazione remota di server)

Quando il tuo browser si collega a `https://anthropic.com`, si sta connettendo all'indirizzo IP di Anthropic sulla porta 443, che è quella dove il server web di Anthropic è in ascolto.

---

## 4. Il protocollo HTTP: la lingua della comunicazione

Sappiamo dove mandare una richiesta (IP + porta). Manca ancora un elemento: come si formula quella richiesta? In che formato? Con quale struttura?

Un **protocollo** è un insieme di regole che due parti accettano di rispettare per comunicare. Nella vita reale, quando chiami qualcuno al telefono, esiste un protocollo implicito: "Pronto?", "Ciao, sono X", "Posso parlare con Y?". Entrambe le parti conoscono le regole e sanno come interpretarsi.

**HTTP** (HyperText Transfer Protocol) è il protocollo usato per il Web. Definisce esattamente come deve essere strutturata una richiesta e come deve essere strutturata la risposta.

**HTTPS** è la versione cifrata: stessa struttura, ma tutto il contenuto viene crittografato prima di essere inviato, in modo che nessuno possa intercettarlo e leggerlo lungo il percorso.

### Una richiesta HTTP nella sua forma grezza

Quando digiti `https://example.com/pagina` nel browser, questo è (schematicamente) quello che viene inviato al server:

```
GET /pagina HTTP/1.1
Host: example.com
User-Agent: Mozilla/5.0 ...
Accept: text/html
```

Riga per riga:
- `GET` è il **metodo**: indica che stiamo *chiedendo* di ricevere qualcosa (altri metodi: `POST` per inviare dati, `PUT` per aggiornare, `DELETE` per cancellare)
- `/pagina` è il **percorso**: la risorsa specifica che vogliamo
- `HTTP/1.1` è la versione del protocollo
- Le righe successive sono **header**: metadati che descrivono chi fa la richiesta, che tipo di risposta accetta, e altro

### Una risposta HTTP nella sua forma grezza

Il server risponde con qualcosa del tipo:

```
HTTP/1.1 200 OK
Content-Type: text/html
Content-Length: 1234

<!DOCTYPE html>
<html>
  <body>Contenuto della pagina...</body>
</html>
```

- `200 OK` è il **codice di stato**: indica che la richiesta ha avuto successo
- Gli header descrivono il tipo e la dimensione del contenuto
- Dopo una riga vuota, arriva il **corpo** della risposta: il contenuto vero e proprio

I codici di stato hanno una logica: `2xx` significa successo, `3xx` significa reindirizzamento, `4xx` significa errore del client (il famoso `404 Not Found` significa che la risorsa non esiste), `5xx` significa errore del server.

> **Perché questo conta per gli agenti AI:** Quando il tuo agente chiama un'API esterna e riceve `429 Too Many Requests`, sta ricevendo un codice HTTP che significa "hai fatto troppe richieste troppo in fretta". Quando riceve `401 Unauthorized`, significa che le credenziali sono sbagliate. Saper leggere questi codici è indispensabile per costruire sistemi che gestiscono gli errori in modo intelligente.

---

## 5. Il viaggio completo di una richiesta

Mettiamo insieme tutto. Digiti `https://anthropic.com` nel browser. Cosa succede, passo per passo?

```
1. RISOLUZIONE DNS
   Browser: "Chi è anthropic.com?"
   Server DNS: "È all'indirizzo 188.114.96.3"

2. CONNESSIONE TCP
   Browser si connette a 188.114.96.3 sulla porta 443
   (stretta di mano a tre vie per stabilire la connessione)

3. HANDSHAKE TLS
   Browser e server negoziano la cifratura
   (questo è ciò che rende HTTPS sicuro)

4. RICHIESTA HTTP
   Browser invia:
   GET / HTTP/1.1
   Host: anthropic.com
   ...

5. ELABORAZIONE
   Il server riceve la richiesta, trova la risorsa,
   prepara la risposta (può coinvolgere database,
   altri servizi, logica di business)

6. RISPOSTA HTTP
   Server invia:
   HTTP/1.1 200 OK
   Content-Type: text/html
   ...
   [HTML della pagina]

7. RENDERING
   Il browser riceve l'HTML, lo interpreta,
   fa ulteriori richieste per CSS, immagini,
   JavaScript, e costruisce la pagina visibile
```

Questo intero processo — dalla digitazione del tasto Invio alla pagina visualizzata — avviene tipicamente in meno di un secondo. È una delle imprese ingegneristiche più straordinarie mai realizzate dall'umanità, resa invisibile dalla sua stessa perfezione.

---

## 6. Il browser come interprete

Il browser non è solo un "visualizzatore di pagine". È un programma complesso che svolge almeno tre ruoli distinti:

1. **Client di rete:** sa come costruire richieste HTTP, gestire le risposte, gestire la cifratura TLS, seguire i reindirizzamenti
2. **Interprete di codice:** sa leggere HTML (struttura), CSS (aspetto), e JavaScript (comportamento) e trasformarli in qualcosa di visivo e interattivo
3. **Ambiente di esecuzione:** fa girare il codice JavaScript della pagina, gestisce la sicurezza, isola ogni scheda dalle altre

Questa distinzione sarà importante più avanti: quando costruiremo applicazioni AI, spesso il browser non sarà coinvolto affatto. Il nostro programma Python parlerà direttamente con i server dei modelli AI via HTTP, senza nessun browser nel mezzo. Il browser è uno strumento per gli umani; le API sono lo strumento per i programmi.

---

## Esempio Pratico: Tracciare una Richiesta Reale

Su qualsiasi computer, puoi vedere questo meccanismo in azione usando gli strumenti per sviluppatori del browser.

**In Chrome o Firefox:**
1. Apri una nuova scheda
2. Premi `F12` (o `Cmd+Option+I` su Mac) per aprire gli strumenti sviluppatore
3. Vai alla scheda **Network** (Rete)
4. Digita `https://example.com` nella barra degli indirizzi e premi Invio
5. Osserva la lista di richieste che appaiono

Per ogni riga vedrai: il metodo (`GET`), l'URL, il codice di stato (`200`), il tipo di contenuto, e il tempo impiegato.

Clicca sulla prima riga (la richiesta principale alla pagina). Troverai le sezioni **Headers** (gli header di richiesta e risposta così come li abbiamo descritti) e **Response** (il corpo della risposta, cioè l'HTML grezzo).

Questo non è un esercizio teorico: è lo stesso strumento che userai per diagnosticare problemi nelle chiamate alle API AI, per capire cosa sta inviando il tuo programma, e per verificare che le risposte abbiano la struttura attesa.

---

## Riepilogo

- **Internet** è l'infrastruttura di rete globale. **Il Web** è uno dei servizi che ci viaggia sopra, non è la stessa cosa.
- Il modello **client-server** — chi chiede e chi risponde — è il pattern fondamentale di tutta la comunicazione in rete, incluse le chiamate ai modelli AI.
- Ogni dispositivo in rete ha un **indirizzo IP**. Il **DNS** traduce nomi leggibili (come `anthropic.com`) in indirizzi IP. La **porta** identifica il programma specifico destinatario della comunicazione.
- **HTTP** è il protocollo che definisce come si strutturano richieste e risposte. **HTTPS** è la versione cifrata. I codici di stato (`200`, `404`, `500`...) comunicano l'esito di ogni richiesta.
- Il viaggio di una richiesta è: DNS → connessione → cifratura → richiesta → elaborazione → risposta → rendering. Tutto questo in frazioni di secondo.

---

## Domande di Verifica

1. Un tuo collega dice "ho problemi con Internet, non funziona il Wi-Fi". Un altro dice "ho problemi con Internet, il sito non si carica". Sono lo stesso tipo di problema? Dove si trova il guasto in ciascun caso?

2. Il tuo programma Python chiama un'API AI e riceve un errore `503 Service Unavailable`. Di chi è il problema — del tuo codice o del server remoto? Come lo sai? Cosa potresti fare?

3. Perché il DNS è un sistema *distribuito* su molti server nel mondo, invece di essere un unico database centralizzato? Cosa succederebbe se fosse centralizzato?

---

## Esercizi Pratici

> Tre esercizi a difficoltà crescente. Prova a risolverli da solo: scrivi la tua risposta prima di aprire la soluzione. Il valore è nel tentativo, non nella lettura.

### Esercizio 1 — Internet o Web? 🟢 Base

Per ciascuna di queste situazioni, indica se sta usando **il Web** (pagine HTML nel browser) o **un altro servizio su Internet**: (a) guardi un film su Netflix, (b) il tuo programma Python chiama l'API di un LLM, (c) leggi una pagina Wikipedia nel browser, (d) fai una videochiamata.

<details>
<summary>💡 Mostra soluzione</summary>

- **(a) Netflix:** Internet ma non "Web" nel senso classico — lo streaming usa protocolli dedicati per il video, anche se l'interfaccia di scelta dei film è una web app.
- **(b) API LLM:** Internet, **non** Web — nessun browser, nessun HTML, un programma parla direttamente con un server via HTTP/JSON.
- **(c) Wikipedia:** Web vero e proprio — browser, pagine HTML collegate da link.
- **(d) Videochiamata:** Internet ma non Web — usa protocolli real-time audio/video.

Il punto chiave: **Internet è l'autostrada, il Web è solo uno degli operatori che la percorre.**

</details>

### Esercizio 2 — Diagnosi da codice di stato 🟡 Intermedio

Il tuo agente chiama un'API e riceve, in tre momenti diversi: `401 Unauthorized`, `429 Too Many Requests`, `503 Service Unavailable`. Per ognuno: di chi è il problema (tuo codice o server remoto)? Cosa faresti concretamente?

<details>
<summary>💡 Mostra soluzione</summary>

- **401 Unauthorized** → problema **tuo**: la API key è mancante, sbagliata o scaduta. Azione: verifica la chiave e come la stai inviando negli header. Un retry identico non servirà a nulla.
- **429 Too Many Requests** → problema **tuo** (di ritmo): stai facendo troppe richieste. Azione: aspetta e riprova con *exponential backoff*; valuta di rallentare le chiamate.
- **503 Service Unavailable** → problema **del server remoto**: è temporaneamente sovraccarico o in manutenzione. Azione: retry con backoff; se persiste, è fuori dal tuo controllo.

Regola generale: **4xx = colpa del client (tu), 5xx = colpa del server.** Questa distinzione decide se ha senso ritentare la stessa richiesta o no.

</details>

### Esercizio 3 — Traccia il viaggio verso un LLM 🔴 Avanzato

Il tuo programma chiama `https://api.anthropic.com/v1/messages`. Descrivi i 7 passi del viaggio della richiesta (come nella Sezione 5), ma adattati a questo caso: cosa cambia rispetto a un browser che apre una pagina? Quale passo "rendering" non avviene e cosa lo sostituisce?

<details>
<summary>💡 Mostra soluzione</summary>

1. **DNS:** `api.anthropic.com` → indirizzo IP del server.
2. **Connessione TCP** sulla porta **443** (HTTPS).
3. **Handshake TLS:** negoziazione della cifratura.
4. **Richiesta HTTP:** qui cambia tutto — non è un `GET` di una pagina, ma un `POST` con header di autenticazione (`x-api-key`) e un **corpo JSON** (model, messages, max_tokens).
5. **Elaborazione:** il server non cerca un file HTML, ma esegue il modello per generare la risposta token per token.
6. **Risposta HTTP:** `200 OK` con `Content-Type: application/json` e un corpo **JSON**, non HTML.
7. **Rendering → NON avviene.** Non c'è browser. Al suo posto, il tuo programma **fa il parsing del JSON** (Lezione 5.2) ed estrae il testo per usarlo nel codice.

La differenza fondamentale: il browser è uno strumento per umani; l'API è lo strumento per programmi. Stesso protocollo HTTP, payload e destinatario diversi.

</details>

---

## Connessioni

**Porta a:** Lezione 1.2 (Siti Web Statici) — vedremo cosa contiene esattamente una risposta HTTP quando il server invia una pagina HTML completa.

**Porta a:** Lezione 1.5 (Le API) — il meccanismo richiesta/risposta HTTP è identico, cambia solo il formato del contenuto (da HTML a JSON) e chi fa la richiesta (da browser a programma).

**Ritroverai questi concetti in:** Lezione 5.1 (L'API degli LLM) — dove chiameremo server AI esattamente come descritto qui, e in Lezione 6.5 (Osservabilità degli Agenti) — dove i codici di stato HTTP saranno fondamentali per diagnosticare errori nel sistema.
