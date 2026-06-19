---
id: "01-05"
titolo: "Le API: il linguaggio universale tra sistemi"
sottotitolo: "Il ponte tra tutto ciò che abbiamo visto e tutto ciò che vedremo: come due programmi si parlano"
capitolo: 1
capitolo_titolo: "Il Web come lo Conosciamo"
lezione: 5
durata_stimata: "60 minuti"
difficolta: "base"
prerequisiti: ["01-04"]
concetti_chiave:
  - API
  - REST
  - endpoint
  - JSON
  - YAML
  - API key
  - autenticazione
  - metodo HTTP
obiettivi:
  - "Definire cosa è un'API con parole proprie, senza ricorrere a gergo"
  - "Leggere e interpretare una richiesta e una risposta REST"
  - "Distinguere JSON e YAML e sapere quando si usa l'uno o l'altro"
  - "Spiegare perché esiste l'autenticazione tramite API key e come funziona"
stato: "pubblicata"
versione: "1.0"
---

# Le API: il linguaggio universale tra sistemi

## Introduzione

Questa è la lezione di chiusura del primo capitolo, e non per caso è anche una delle più importanti di tutto il corso. Tutto quello che abbiamo costruito finora — client e server, HTML statico, logica dinamica, frontend e backend separati — converge in un singolo concetto: l'**API**.

Da qui in avanti, ogni volta che il nostro futuro agente AI "chiamerà un modello", "interrogherà un database vettoriale", "userà uno strumento esterno", starà facendo esattamente quello che descriviamo in questa lezione: una richiesta HTTP strutturata secondo regole precise, verso un endpoint specifico, con un formato di risposta prevedibile. Se questa lezione è chiara, tutto il Capitolo 4 risulterà una naturale estensione di concetti già posseduti, non materiale nuovo da imparare da zero.

---

## Obiettivi di Apprendimento

Al termine di questa lezione sarai in grado di:

- Definire cosa è un'API con parole proprie, senza ricorrere a gergo tecnico vuoto
- Leggere e interpretare una richiesta e una risposta REST
- Distinguere JSON e YAML e sapere quando si usa l'uno o l'altro
- Spiegare perché esiste l'autenticazione tramite API key e come funziona

---

## 1. Cos'è un'API

**API** sta per *Application Programming Interface* — interfaccia di programmazione applicativa. Il nome è tecnico, ma il concetto è semplice: un'API è un insieme di regole che permette a un programma di chiedere qualcosa a un altro programma, senza dover sapere nulla di come quel secondo programma è costruito internamente.

> **Analogia concreta:** pensa al menù di un ristorante. Tu non sai come è organizzata la cucina, chi cucina cosa, in che ordine vengono preparati i piatti. Il menù ti dice solo: "Se ordini la voce numero 12, riceverai questo piatto specifico". Il menù è l'interfaccia tra te (il client) e la cucina (il server). L'API è il menù del programma.

Questa idea — nascondere la complessità interna dietro un'interfaccia semplice e stabile — è uno dei principi più potenti dell'informatica, ed è esattamente il motivo per cui possiamo usare un modello AI scritto da Anthropic, gestito su infrastrutture che non vedremo mai, senza dover capire una sola riga del suo funzionamento interno. Mandiamo una richiesta secondo le regole dell'API; riceviamo una risposta. Tutto il resto è incapsulato.

### Non tutte le API sono "via Internet"

È utile chiarire: il termine API è generale e si applica anche dentro un singolo programma (una libreria software offre un'API alle sue funzioni). Ma nel contesto di questo corso, parliamo quasi sempre di **API web**, cioè API esposte da un server e raggiungibili tramite HTTP — esattamente il protocollo descritto nella Lezione 1.1.

---

## 2. REST: lo stile architetturale più diffuso

Esistono diversi modi di progettare un'API web. Lo stile di gran lunga più diffuso — usato da Anthropic, OpenAI, Google, e dalla stragrande maggioranza dei servizi che incontrerai — si chiama **REST** (Representational State Transfer).

Senza entrare nei dettagli teorici, REST si traduce in pratica in alcune convenzioni semplici:

- Le risorse sono identificate da **URL** (es. `/utenti/42`, `/messaggi`)
- Le azioni sono espresse tramite **metodi HTTP** (li abbiamo già visti nella Lezione 1.1):
  - `GET` → leggere/ottenere qualcosa
  - `POST` → creare qualcosa di nuovo
  - `PUT` / `PATCH` → modificare qualcosa esistente
  - `DELETE` → eliminare qualcosa
- Le risposte hanno **codici di stato HTTP** standard (`200`, `404`, `500`...)

Un singolo URL combinato con un metodo si chiama **endpoint**. Ad esempio:

```
POST https://api.anthropic.com/v1/messages
```

è l'endpoint che usi per inviare un messaggio a Claude e ottenere una risposta. È, letteralmente, una voce del "menù" di Anthropic.

---

## 3. Anatomia di una richiesta API reale

Vediamo una richiesta API completa, di tipo realistico, e analizziamola riga per riga.

```http
POST /v1/messages HTTP/1.1
Host: api.anthropic.com
Content-Type: application/json
x-api-key: sk-ant-xxxxxxxxxxxxxxxx

{
  "model": "claude-sonnet-4-6",
  "max_tokens": 1000,
  "messages": [
    { "role": "user", "content": "Spiegami cos'è la fotosintesi" }
  ]
}
```

- **`POST /v1/messages`** → metodo e percorso, esattamente come visto nella Lezione 1.1
- **`Host`** → identifica il server di destinazione (qui entra in gioco il DNS, Lezione 1.1)
- **`Content-Type: application/json`** → un header che dichiara: "il corpo di questa richiesta è scritto in formato JSON"
- **`x-api-key`** → un header personalizzato che contiene la chiave di autenticazione (ne parliamo nella sezione 5)
- Il blocco tra parentesi graffe è il **corpo** (body) della richiesta, in formato **JSON**

E una risposta tipica:

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": "msg_01XYZ",
  "role": "assistant",
  "content": [
    { "type": "text", "text": "La fotosintesi è il processo..." }
  ],
  "model": "claude-sonnet-4-6",
  "stop_reason": "end_turn"
}
```

Nota come la struttura sia identica a quella vista nella Lezione 1.1 per le pagine web: codice di stato, header, corpo. Cambia solo il formato del corpo: invece di HTML destinato a un browser, qui c'è JSON destinato a essere letto da un altro programma.

---

## 4. JSON e YAML: i formati dati standard

### JSON

**JSON** (JavaScript Object Notation) è il formato dati più usato per scambiare informazioni tra programmi via API. La sua struttura si basa su pochi elementi:

```json
{
  "nome": "Claude",
  "versione": 4.6,
  "attivo": true,
  "strumenti": ["ricerca web", "esecuzione codice"],
  "creatore": {
    "azienda": "Anthropic",
    "anno_fondazione": 2021
  }
}
```

- **Oggetti** tra `{ }`, con coppie `chiave: valore`
- **Array** (liste) tra `[ ]`
- Valori che possono essere stringhe, numeri, booleani (`true`/`false`), altri oggetti, o `null`

JSON è preferito nelle API perché è compatto, facilmente generabile e interpretabile da qualsiasi linguaggio di programmazione, e non ammette ambiguità di formattazione.

### YAML

**YAML** (YAML Ain't Markup Language) rappresenta concettualmente le stesse informazioni, ma con una sintassi pensata per essere scritta e letta comodamente da un essere umano, basata sull'indentazione invece che su parentesi:

```yaml
nome: Claude
versione: 4.6
attivo: true
strumenti:
  - ricerca web
  - esecuzione codice
creatore:
  azienda: Anthropic
  anno_fondazione: 2021
```

Stesso identico contenuto del JSON sopra, ma più leggibile a colpo d'occhio, senza il "rumore visivo" di parentesi e virgolette ripetute.

### Quando si usa l'uno e quando l'altro

- **JSON** domina nelle **comunicazioni API**: è il formato che viaggia nelle richieste e risposte HTTP, perché deve essere generato e letto velocemente da codice.
- **YAML** domina nei **file di configurazione** che un essere umano scrive e modifica a mano: file di setup, definizioni di comportamento, e — anticipiamo qui un concetto che ritroveremo in profondità nel Capitolo 6 — il **frontmatter** dei file Markdown che useremo per descrivere lezioni, agenti, e contratti nei workflow agentivi.

> Non è un caso che il file che stai leggendo ora abbia, in cima, un blocco YAML tra `---`. È esattamente l'applicazione pratica di questa distinzione: i metadati (capitolo, prerequisiti, difficoltà) sono scritti in YAML perché un umano li deve poter leggere e modificare comodamente; se questa lezione venisse scambiata tra due programmi via API, probabilmente viaggerebbe invece in JSON.

---

## 5. Autenticazione con API Key

Quasi nessuna API seria è completamente aperta al pubblico: chi gestisce il server deve sapere chi sta facendo la richiesta, per almeno tre motivi:

1. **Fatturazione** — molti servizi (incluse le API dei modelli AI) sono a pagamento in base all'uso
2. **Limiti di utilizzo (rate limiting)** — evitare che un singolo utente sovraccarichi il sistema
3. **Sicurezza** — impedire accessi non autorizzati a dati o funzionalità sensibili

Il meccanismo più comune per le API è la **API key**: una stringa lunga e segreta, generata dal fornitore del servizio, che il client deve includere in ogni richiesta (tipicamente in un header, come abbiamo visto con `x-api-key` nell'esempio precedente).

```
x-api-key: sk-ant-xxxxxxxxxxxxxxxx
```

Il server, ricevendo la richiesta, controlla questa chiave prima di fare qualsiasi altra cosa: se è valida e ha credito/permessi sufficienti, procede; altrimenti risponde con un codice di errore (tipicamente `401 Unauthorized` se la chiave è invalida, o `429 Too Many Requests` se hai superato i limiti consentiti — codici che avevamo già incontrato nella Lezione 1.1).

### Perché la API key va trattata come una password

Una API key è, a tutti gli effetti, equivalente a una password che dà accesso a un servizio spesso a pagamento. Non va mai:
- Scritta direttamente nel codice che condividi pubblicamente (es. un repository GitHub pubblico)
- Inviata in chat, email, o messaggi non sicuri
- Condivisa con persone che non devono avere accesso al tuo account

La pratica corretta — che useremo costantemente da qui in avanti — è conservarla in variabili d'ambiente o file di configurazione esclusi dal controllo di versione (per questo, ricorderai, il nostro repository AISchool ha un file `.gitignore`).

---

## Esempio Pratico: Una Chiamata API Reale, Passo per Passo

Immaginiamo di voler ottenere informazioni meteo per Roma tramite un'API pubblica (uno scenario classico per iniziare a familiarizzare con le API prima di affrontare quelle dei modelli AI).

```
1. Consultiamo la documentazione dell'API e troviamo l'endpoint:
   GET https://api.esempio-meteo.com/v1/meteo?citta=Roma

2. Costruiamo la richiesta:
   GET /v1/meteo?citta=Roma HTTP/1.1
   Host: api.esempio-meteo.com
   x-api-key: la-nostra-chiave-segreta

3. Il server elabora la richiesta (probabilmente interroga
   un proprio database interno, come visto nella Lezione 1.3)

4. Riceviamo la risposta:
   HTTP/1.1 200 OK
   Content-Type: application/json

   {
     "citta": "Roma",
     "temperatura": 24,
     "condizione": "soleggiato",
     "umidita": 45
   }

5. Il nostro programma legge questo JSON ed estrae,
   ad esempio, solo il campo "temperatura" per mostrarlo
   nella nostra applicazione
```

Questo schema — endpoint, richiesta con autenticazione, risposta JSON, estrazione dei dati necessari — è identico, concettualmente, a qualsiasi chiamata che faremo più avanti verso le API di Claude, GPT, o qualsiasi strumento esterno integrato in un agente. Cambiano i dettagli, non la struttura.

---

## Riepilogo

- Un'**API** è un'interfaccia che permette a un programma di usare le funzionalità di un altro senza conoscerne i dettagli interni — come un menù di ristorante.
- **REST** è lo stile più comune per le API web: risorse identificate da URL, azioni espresse da metodi HTTP (`GET`, `POST`, ecc.), risposte con codici di stato standard. Un URL più un metodo formano un **endpoint**.
- **JSON** è il formato standard per i dati che viaggiano nelle chiamate API; **YAML** è preferito nei file di configurazione pensati per essere letti e scritti da umani — incluso il frontmatter dei file Markdown.
- L'**autenticazione tramite API key** permette al fornitore del servizio di identificare chi fa la richiesta, per motivi di fatturazione, limiti d'uso e sicurezza. Una API key va sempre trattata come una password.

---

## Domande di Verifica

1. Se un'API restituisce `401 Unauthorized` invece di `200 OK`, in quale fase del processo descritto in questa lezione si è verificato il problema? Cosa controlleresti per primo?

2. Perché pensi che la documentazione di un'API venga spesso paragonata a un "contratto" tra chi fornisce il servizio e chi lo consuma? Cosa succederebbe se il fornitore cambiasse la struttura della risposta senza preavviso?

3. Rifletti sulla differenza JSON/YAML: se dovessi progettare un file che un agente AI legge automaticamente migliaia di volte al secondo, quale formato useresti? E se dovessi progettare un file che un umano deve poter modificare a mano ogni giorno?

---

## Connessioni

**Viene da:** Lezioni 1.1–1.4 — questa lezione è la sintesi naturale di client/server, HTTP, logica dinamica e separazione frontend/backend, tutti applicati al caso specifico della comunicazione programma-programma.

**Porta a:** Capitolo 2 (L'Intelligenza Artificiale) — da qui in avanti smettiamo di parlare del Web in generale e iniziamo a costruire la comprensione di cosa sia, internamente, il sistema che risponde dall'altra parte di quelle chiamate API.

**Ritroverai questi concetti in:** Lezione 4.1 (L'API degli LLM) — useremo esattamente questo schema (endpoint, header, autenticazione, corpo JSON) per chiamare un modello linguistico. Lezione 6.1 (YAML e Frontmatter) — approfondiremo perché YAML è lo standard per gli artefatti dei workflow agentivi. Lezione 6.5 (Contratti tra Agenti) — il concetto di "contratto" accennato nella domanda di verifica diventerà centrale quando parleremo di schemi di input/output tra agenti.
