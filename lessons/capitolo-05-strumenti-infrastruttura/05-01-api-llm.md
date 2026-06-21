---
id: "05-01"
titolo: "L'API degli LLM: come si usa un modello da un programma"
sottotitolo: "Da qui in avanti costruiamo: la prima chiamata reale a un modello, fatta da codice"
capitolo: 5
capitolo_titolo: "Strumenti e Infrastruttura AI"
lezione: 1
durata_stimata: "60 minuti"
difficolta: "intermedio"
prerequisiti: ["04-05","01-05"]
concetti_chiave:
  - API LLM
  - endpoint messages
  - streaming
  - rate limit
  - provider
obiettivi:
  - "Costruire mentalmente una chiamata API completa a un modello linguistico"
  - "Spiegare cosa è lo streaming e perché viene usato"
  - "Gestire concettualmente errori e rate limit in una chiamata API"
  - "Confrontare i principali provider di modelli linguistici"
stato: "pubblicata"
versione: "1.0"
---
# L'API degli LLM: come si usa un modello da un programma

> **⚡ Setup richiesto**: questo capitolo contiene codice eseguibile. Prima di procedere, assicurati di aver completato la **Lezione 00-01 (Ambiente di Sviluppo)**: Python installato, `.env` con la chiave API, e `python hello.py` che risponde correttamente.
>
> Librerie necessarie per il Capitolo 5:
> ```bash
> pip install anthropic python-dotenv pydantic chromadb
> ```

In questo capitolo il corso cambia marcia: passiamo dalla comprensione alla costruzione. Imparerai a usare un modello linguistico da un programma reale, a strutturare dati per farlo ragionare in modo affidabile, e ad aggiungergli strumenti e memoria — i mattoni con cui si costruisce qualsiasi sistema AI professionale.

## Da limitazioni a soluzioni

Nel Capitolo 5 abbiamo capito cosa è un LLM e come funziona — ma anche, con precisione, cosa non sa fare. Tre limiti in particolare definiscono i confini di un modello linguistico grezzo:

1. **Conoscenza ferma alla data di training.** Un LLM sa solo ciò che era presente nei suoi dati di addestramento: non conosce eventi recenti, non può accedere a database aggiornati, non sa cosa è successo ieri. Per ogni domanda che richiede informazioni attuali o specifiche, il modello grezzo è cieco.

2. **Context window limitata.** Il modello elabora solo ciò che entra nella finestra di contesto di una singola chiamata. Non ha memoria tra sessioni diverse, non può "ricordare" conversazioni passate, non gestisce documenti molto lunghi senza strategie apposite.

3. **Non può agire sul mondo.** Un LLM produce testo. Non può aprire file, fare ricerche su Internet, chiamare API esterne, eseguire codice, o modificare database — a meno che qualcuno non gli fornisca questi strumenti in modo esplicito.

Il Capitolo 6 è la risposta sistematica a questi tre limiti. RAG (Retrieval-Augmented Generation) risolve il primo: porta al modello la conoscenza esterna di cui ha bisogno, al momento giusto. Gli strumenti e il function calling risolvono il terzo: danno al modello la capacità di agire. Le tecniche di gestione del contesto e l'orchestrazione risolvono il secondo: gestiscono cosa entra nella finestra, quando, e in quale forma.

Ogni lezione di questo capitolo aggiunge un pezzo. Alla fine avrai gli ingredienti per costruire un agente completo.

---

## Introduzione

Con questa lezione il corso cambia marcia, esattamente come annunciato in chiusura del Capitolo 4. Fino a ora abbiamo costruito comprensione: cosa è un'API (Lezione 1.5), cosa è un LLM (Lezione 4.1), come è strutturata una conversazione con ruoli system/user/assistant (Lezione 4.3). Questa lezione fonde questi tre pezzi di conoscenza in un'unica competenza pratica: scrivere il codice che chiama un modello linguistico via API, esattamente come fa qualsiasi prodotto AI professionale.

Questa non è una lezione isolata: è la fondazione tecnica letterale su cui si costruirà tutto il resto del corso. RAG, Function Calling, agenti, workflow — ogni singolo sistema che vedremo da qui in avanti, alla sua base, esegue ripetutamente l'operazione descritta in questa lezione: una chiamata API a un modello, con un contesto costruito appositamente per il compito da svolgere.

---

## Obiettivi di Apprendimento

Al termine di questa lezione sarai in grado di:

- Costruire mentalmente una chiamata API completa a un modello linguistico, dall'endpoint alla risposta
- Spiegare cosa è lo streaming e perché viene usato nelle interfacce conversazionali
- Gestire concettualmente errori comuni e limiti di frequenza (rate limit) in una chiamata API
- Confrontare i principali provider di modelli linguistici e le loro differenze strutturali

---

## 1. Anatomia di una chiamata reale all'API di un LLM

Riprendiamo, ora con piena consapevolezza tecnica, l'esempio che avevamo già visto — in forma preliminare — nella Lezione 1.5. Una chiamata all'API di Claude, scritta in Python, ha questa struttura:

```python
import anthropic

client = anthropic.Anthropic(api_key="sk-ant-xxxxxxxxxxxx")

response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1000,
    system="Sei un assistente esperto di cucina italiana.",
    messages=[
        {"role": "user", "content": "Come si fa una buona carbonara?"}
    ]
)

print(response.content[0].text)
```

Analizziamo ogni componente, collegandolo esplicitamente a concetti già visti:

- **`api_key`** — l'autenticazione vista nella Lezione 1.5: identifica chi sta facendo la richiesta, per fatturazione e sicurezza
- **`model`** — specifica esattamente quale modello (Lezione 4.1) deve elaborare la richiesta: i provider offrono tipicamente più modelli, con compromessi diversi tra velocità, costo, e capacità
- **`max_tokens`** — il limite massimo di token (Lezione 4.1) che il modello può generare in **questa** risposta, un parametro di controllo del costo e della lunghezza, distinto dal context window totale visto nella Lezione 4.3
- **`system`** — le istruzioni di comportamento stabile viste nella Lezione 4.3 e 3.4
- **`messages`** — la cronologia della conversazione, con la struttura a ruoli vista nella Lezione 4.3

La risposta che si riceve (semplificando la struttura JSON completa già vista nella Lezione 1.5) contiene il testo generato dal modello, insieme a metadati come il motivo per cui la generazione si è interrotta (`stop_reason`) e il conteggio dei token usati — informazione cruciale, come vedremo, per gestire costi e context window.

---

## 2. Streaming: perché le parole arrivano una alla volta

Se hai usato Claude.ai o ChatGPT, avrai notato che la risposta non appare tutta insieme: il testo viene mostrato progressivamente, parola per parola (più precisamente, token per token, Lezione 4.1), come se il modello stesse "scrivendo in tempo reale". Questo comportamento si chiama **streaming**, ed è un'opzione esplicita delle API dei modelli linguistici.

```
SENZA STREAMING                       CON STREAMING

Richiesta inviata                    Richiesta inviata
       │                                    │
       ▼                                    ▼
[attesa... il modello genera         Il client riceve il primo
 l'intera risposta prima              token non appena è pronto
 di rispondere]                       │
       │                              ▼
       ▼                       Il client riceve il secondo
Risposta completa ricevuta            token...
tutta insieme                         │
                                       ▼
                                (e così via, fino al
                                 completamento)
```

> **Perché lo streaming è importante, non solo estetico:** ricorda dalla Lezione 4.1 che un LLM genera un token alla volta, prevedendo ciascuno in base al contesto precedente, incluso ciò che ha già generato. Tecnicamente, il primo token è già pronto molto prima che l'intera risposta sia completa. Senza streaming, l'utente aspetterebbe l'intera generazione (che per risposte lunghe può richiedere diversi secondi) prima di vedere qualcosa; con lo streaming, il primo token appare quasi immediatamente, e il resto continua ad arrivare progressivamente — un miglioramento enorme nella percezione di reattività del sistema, anche se il tempo totale di generazione non cambia.

Questo è anche, dal punto di vista architetturale, un'applicazione diretta del modello client-server visto nella Lezione 1.1: la connessione resta aperta, e il server invia progressivamente dei "pezzi" (chunk) della risposta, invece di un'unica risposta completa al termine.

---

## 3. Gestione degli errori e dei rate limit

Una chiamata API a un LLM, come qualsiasi chiamata HTTP (Lezione 1.1), può fallire per diverse ragioni, e ognuna si manifesta tipicamente con un codice di stato specifico:

```
401 Unauthorized       → la API key è invalida o mancante
429 Too Many Requests  → hai superato il limite di richieste
                          consentite in un certo intervallo
                          di tempo (rate limit)
500 / 503               → problema temporaneo lato server
                          del provider
400 Bad Request         → la richiesta è malformata (es. un
                          campo obbligatorio mancante, un
                          formato JSON non valido — Lezione 1.5)
```

Il **rate limit** (limite di frequenza) merita un approfondimento specifico, perché è una circostanza che incontrerai costantemente costruendo sistemi reali. I provider impongono limiti su quante richieste (o quanti token) puoi elaborare in un dato intervallo di tempo, sia per ragioni tecniche (proteggere l'infrastruttura da sovraccarichi) sia commerciali (differenziare piani di abbonamento).

```python
import time

def chiamata_con_retry(client, messaggio, tentativi_massimi=3):
    for tentativo in range(tentativi_massimi):
        try:
            return client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=1000,
                messages=[{"role": "user", "content": messaggio}]
            )
        except RateLimitError:
            attesa = 2 ** tentativo  # attesa crescente: 1, 2, 4 secondi
            time.sleep(attesa)
    raise Exception("Troppi tentativi falliti")
```

Questo pattern — tentare, fallire, attendere un tempo crescente, ritentare — si chiama **exponential backoff** (attesa esponenziale), ed è uno standard ingegneristico per gestire errori temporanei senza sovraccaricare ulteriormente un sistema già in difficoltà. Lo ritroveremo, formalizzato con maggiore rigore, quando parleremo di robustezza degli agenti nella Lezione 6.5.

---

## 4. Confronto tra i principali provider

Diversi provider offrono accesso API a modelli linguistici, ciascuno con caratteristiche distintive. Una panoramica sobria, utile per orientarsi:

- **Anthropic** (Claude): enfasi dichiarata su sicurezza e affidabilità del comportamento, context window ampi, forte capacità di seguire istruzioni complesse e di ragionamento
- **OpenAI** (GPT): probabilmente l'ecosistema più maturo e diffuso, ampia documentazione, ampio supporto di librerie e integrazioni di terze parti
- **Google** (Gemini): forte integrazione nativa con dati multimodali (testo, immagini, video) e con l'infrastruttura cloud di Google
- **Mistral** e altri provider europei: spesso posizionati su efficienza, costo, e — in alcuni casi — modelli con licenza open source che permettono di essere eseguiti su infrastruttura propria invece che tramite API di terzi

> **Perché questa scelta non è banale per chi costruisce sistemi:** scegliere un provider non è solo una questione di "quale modello è più bravo" (una domanda che cambia risposta continuamente, man mano che escono nuove versioni). Sono fattori altrettanto rilevanti il costo per token, i limiti di rate limit del piano scelto, la disponibilità geografica, le garanzie contrattuali su privacy e gestione dei dati, e — un aspetto che affronteremo a fondo nella Lezione 5.5 — il supporto nativo per protocolli standardizzati come MCP nella connessione a strumenti esterni.

---

## 5. Costruire un primo blocco riutilizzabile

Per chiudere questa lezione con un'applicazione concreta, vediamo come si incapsula una chiamata API in una funzione riutilizzabile — il primo, piccolissimo, passo verso quello che nel Capitolo 7 chiameremo un "agent package":

```python
import anthropic

def chiedi_a_claude(domanda, istruzioni_sistema=None, modello="claude-sonnet-4-6"):
    """
    Invia una domanda a Claude e restituisce la risposta testuale.
    """
    client = anthropic.Anthropic()  # legge la API key da variabile d'ambiente

    parametri = {
        "model": modello,
        "max_tokens": 1024,
        "messages": [{"role": "user", "content": domanda}]
    }

    if istruzioni_sistema:
        parametri["system"] = istruzioni_sistema

    risposta = client.messages.create(**parametri)
    return risposta.content[0].text


# Utilizzo:
risultato = chiedi_a_claude(
    "Quali sono i vantaggi del Machine Learning supervisionato?",
    istruzioni_sistema="Rispondi in modo conciso, massimo 3 punti."
)
print(risultato)
```

Nota una scelta deliberata: la API key non è scritta direttamente nel codice (`anthropic.Anthropic()` senza argomenti la legge automaticamente da una variabile d'ambiente) — esattamente la pratica di sicurezza raccomandata nella Lezione 1.5, e il motivo per cui il nostro repository AISchool ha un file `.gitignore` configurato per escludere file di configurazione sensibili.

---

## 🧪 Il Tuo Primo Messaggio via API

**Obiettivo**: inviare un messaggio a un LLM tramite codice (non tramite interfaccia grafica) per la prima volta.

**Passo 0 — Ottieni una chiave API gratuita**
- Anthropic offre crediti gratuiti per sviluppatori (docs.anthropic.com)
- In alternativa, Google Gemini ha un tier gratuito generoso
- OpenAI ha crediti iniziali per i nuovi account

**Passo 1 — Installa la libreria**
```bash
pip install anthropic  # oppure: pip install openai
```

**Passo 2 — 5 righe di codice**
```python
import anthropic
client = anthropic.Anthropic(api_key="LA_TUA_CHIAVE")
risposta = client.messages.create(
    model="claude-haiku-4-5-20251001",
    max_tokens=200,
    messages=[{"role": "user", "content": "Ciao! Spiegami cos'è un LLM in 2 frasi."}]
)
print(risposta.content[0].text)
```

**Cosa osservare**: il testo arriva come oggetto strutturato, non come stringa grezza. Perché? Perché l'API è progettata per sistemi, non per esseri umani.

> ✅ **Output atteso**: se il codice gira correttamente con la chiave API valida, vedrai qualcosa simile a:
> ```
> Un LLM (Large Language Model) è un sistema di intelligenza artificiale addestrato
> su enormi quantità di testo per prevedere e generare linguaggio naturale. In
> pratica, è un modello statistico che, data una sequenza di parole, impara a
> predire quale parola viene dopo — e iterando questo processo genera testo coerente.
> ```
> Il testo esatto varierà a ogni esecuzione — i modelli linguistici non sono deterministici per default. Se vedi invece un errore `AuthenticationError`, controlla che la chiave API sia corretta e che non contenga spazi o caratteri extra. Se vedi `RateLimitError`, hai esaurito i crediti o superato il limite di frequenza: aspetta qualche secondo e riprova.

*Cambia il messaggio, cambia il modello, osserva come cambia la risposta.*

---

## Esempio Pratico: Stimare Costo e Tempo di una Chiamata

Immagina di voler costruire un sistema che riassume automaticamente 100 documenti, ciascuno di circa 2.000 token, con un prompt di istruzioni di circa 200 token, e una risposta attesa di circa 300 token per documento.

```
Token totali per documento = 2.000 (documento) + 200 (istruzioni) + 300 (risposta)
                            = 2.500 token

Token totali per 100 documenti = 2.500 × 100 = 250.000 token
```

Questo tipo di stima — moltiplicare il consumo medio per il numero di esecuzioni previste — è un esercizio che farai costantemente progettando sistemi reali, specialmente quando, nei capitoli successivi, costruiremo agenti che possono effettuare **multiple chiamate API in sequenza** per un singolo compito (ad esempio, un agente che cerca informazioni, le elabora, e poi genera una risposta finale può facilmente comportare 3-5 chiamate API per un singolo task dell'utente).

---

## Riepilogo

- Una chiamata API a un LLM combina autenticazione (Lezione 1.5), scelta del modello (Lezione 4.1), parametri di generazione, istruzioni di sistema e cronologia dei messaggi (Lezione 4.3) in un'unica richiesta strutturata.
- Lo **streaming** permette di ricevere la risposta progressivamente, token per token, migliorando drasticamente la reattività percepita senza cambiare il tempo totale di generazione.
- Gli errori API (rate limit, problemi di autenticazione, errori del server) richiedono strategie di gestione come l'**exponential backoff**, un pattern che ritroveremo nella progettazione di agenti robusti.
- I principali **provider** (Anthropic, OpenAI, Google, Mistral) si distinguono per enfasi tecnica, costo, ecosistema, e supporto a protocolli standardizzati.
- Incapsulare una chiamata API in una funzione riutilizzabile, con gestione sicura delle credenziali, è il primo passo concreto verso la costruzione di sistemi più complessi.

---

## Domande di Verifica

1. Perché lo streaming non riduce il tempo totale necessario al modello per generare una risposta completa, ma migliora comunque significativamente l'esperienza percepita dall'utente?

2. Se il tuo programma riceve ripetutamente errori `429 Too Many Requests`, è corretto continuare a ritentare immediatamente, senza attesa? Perché l'exponential backoff è una strategia migliore?

3. Stai progettando un sistema che deve elaborare migliaia di documenti al giorno con un budget limitato. Quali fattori, oltre alla "qualità" generica del modello, dovresti considerare nella scelta del provider e del modello specifico?

---

## Esercizi Pratici

> Tre esercizi a difficoltà crescente. Prova a risolverli da solo prima di aprire la soluzione.

### Esercizio 1 — Anatomia della chiamata 🟢 Base

Nella chiamata `client.messages.create(...)`, spiega a cosa serve ciascun parametro: `model`, `max_tokens`, `system`, `messages`.

<details>
<summary>💡 Mostra soluzione</summary>

- **`model`**: quale modello deve elaborare la richiesta (es. `claude-sonnet-4-6`); i provider offrono modelli con compromessi diversi tra costo/velocità/capacità.
- **`max_tokens`**: il numero massimo di token che il modello può **generare in questa risposta** (controllo di lunghezza e costo). Diverso dal context window totale.
- **`system`**: le istruzioni di comportamento stabile per tutta la conversazione (Lezione 4.3/3.4).
- **`messages`**: la cronologia della conversazione con i ruoli `user`/`assistant`.

</details>

### Esercizio 2 — Streaming e backoff 🟡 Intermedio

Rispondi: (a) lo streaming riduce il *tempo totale* di generazione? Perché migliora comunque l'esperienza? (b) Ricevi ripetuti `429 Too Many Requests`: ritentare subito è una buona idea? Cosa fai invece?

<details>
<summary>💡 Mostra soluzione</summary>

**(a) Streaming:** **no**, non riduce il tempo totale di generazione — il modello impiega lo stesso tempo a produrre tutti i token. Migliora la **reattività percepita**: il primo token appare quasi subito invece di far attendere l'intera risposta. Per risposte lunghe, la differenza nell'esperienza è enorme.

**(b) 429:** ritentare **subito** è controproducente — aggraveresti il sovraccarico e verresti rifiutato di nuovo. Usa l'**exponential backoff**: aspetta tempi crescenti (1s, 2s, 4s…) tra un tentativo e l'altro. Dà al sistema il tempo di "respirare" e rispetta il rate limit.

</details>

### Esercizio 3 — Stima il costo di un batch 🔴 Avanzato

Devi riassumere 500 documenti. Ogni documento è ~3.000 token, le istruzioni ~200 token, la risposta attesa ~250 token. Calcola i token totali. Poi: cosa cambia se l'agente fa 3 chiamate API per documento invece di 1?

<details>
<summary>💡 Mostra soluzione</summary>

**Una chiamata per documento:**
- Per documento: `3.000 + 200 + 250 = 3.450 token`.
- Per 500 documenti: `3.450 × 500 = 1.725.000 token` (~1,7 milioni).

**Con 3 chiamate per documento:** il consumo cresce all'incirca **× 3** (più precisamente dipende da quanto contesto si rispedisce a ogni chiamata: se ogni chiamata reinvia il documento, può crescere anche di più). Stima grossolana: ~5,2 milioni di token.

Lezione pratica: gli agenti reali fanno **più chiamate per task** (cerca → elabora → genera). Il costo va stimato moltiplicando consumo medio × numero di chiamate × numero di task — non sul singolo prompt. È un calcolo che farai costantemente progettando sistemi.

</details>

---

## Connessioni

**Viene da:** Lezione 1.5 (Le API) e Lezione 4.5 (Limiti degli LLM) — qui rendiamo operativa, con codice reale, la struttura di chiamata API teorizzata in precedenza.

**Porta a:** Lezione 5.2 (Output Strutturati) — vedremo come ottenere, dalla stessa chiamata API appena descritta, risposte in un formato prevedibile e parsabile da un programma, non solo testo libero.

**Ritroverai questi concetti in:** Lezione 5.4 (Function Calling) — la stessa struttura di chiamata vista qui si arricchirà di un nuovo elemento, la definizione degli strumenti disponibili al modello. Lezione 6.5 (Gestione degli Errori negli Agenti) — l'exponential backoff visto qui in forma semplice diventerà parte di una strategia di robustezza molto più articolata.
