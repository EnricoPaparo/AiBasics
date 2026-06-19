---
id: "04-02"
titolo: "Output Strutturati e Output Parser: forzare il modello a rispondere in formato preciso"
sottotitolo: "Il ponte indispensabile tra linguaggio naturale e dati che un programma può usare"
capitolo: 4
capitolo_titolo: "Strumenti e Infrastruttura per Sistemi AI"
lezione: 2
durata_stimata: "60 minuti"
difficolta: "intermedio"
prerequisiti: ["04-01"]
concetti_chiave:
  - output strutturato
  - JSON mode
  - Pydantic
  - schema
  - output parser
  - validazione
obiettivi:
  - "Spiegare perché un programma ha bisogno di output strutturato, non solo testo"
  - "Descrivere come si forza un modello a produrre JSON valido secondo uno schema"
  - "Capire il ruolo di un output parser nella pipeline di un sistema AI"
  - "Progettare una strategia di gestione degli errori di parsing"
stato: "pubblicata"
versione: "1.0"
---

# Output Strutturati e Output Parser: forzare il modello a rispondere in formato preciso

## Introduzione

Nella lezione precedente abbiamo imparato a chiamare un modello e ricevere una risposta testuale, libera, in linguaggio naturale. Va benissimo se l'obiettivo finale è mostrare quel testo a un essere umano — esattamente come fa un'interfaccia di chat. Ma cosa succede quando l'obiettivo non è mostrare testo a un umano, ma far **decidere qualcosa a un programma** sulla base di quella risposta?

Immagina di voler costruire un sistema che, data una recensione di un prodotto, decida automaticamente se instradarla al team di assistenza clienti, al team marketing, o se ignorarla. Il tuo programma ha bisogno di una risposta del tipo `{"categoria": "assistenza", "urgenza": "alta"}` — non di un paragrafo discorsivo come "Questa recensione sembra indicare un problema di assistenza piuttosto urgente". Questa lezione risolve esattamente questo problema, ed è uno dei pilastri tecnici più importanti per tutto ciò che costruiremo da qui in avanti: senza output strutturati e prevedibili, nessun agente potrebbe funzionare in modo affidabile.

---

## Obiettivi di Apprendimento

Al termine di questa lezione sarai in grado di:

- Spiegare perché un programma ha bisogno di output strutturato, non di semplice testo libero
- Descrivere come si forza un modello a produrre JSON valido secondo uno schema definito
- Capire il ruolo di un output parser nella pipeline di un sistema AI
- Progettare una strategia di base per gestire gli errori di parsing

---

## 1. Il problema: linguaggio naturale vs dati strutturati

Ricorda dalla Lezione 3.1 che un LLM, alla sua base, genera testo prevedendo il token successivo più plausibile. Per impostazione predefinita, questo significa che le risposte sono in **linguaggio naturale**: prosa discorsiva, con tutta la variabilità, ambiguità e flessibilità che il linguaggio umano comporta.

```
DOMANDA: "Estrai nome, età e città da questo testo:
'Mi chiamo Marco, ho 34 anni e vivo a Bologna.'"

RISPOSTA TIPICA SENZA VINCOLI DI FORMATO:
"Il nome della persona è Marco. Ha 34 anni. Vive a Bologna."

oppure, in un'altra esecuzione:
"Ecco le informazioni estratte: nome = Marco, età = 34,
città = Bologna."

oppure ancora:
"Nome: Marco
Età: 34 anni
Città: Bologna"
```

Nota che tutte queste risposte sono corrette dal punto di vista del contenuto, ma hanno **formati completamente diversi**. Se il tuo programma deve estrarre automaticamente il valore dell'età per inserirlo in un database, dovrebbe scrivere codice capace di interpretare correttamente qualsiasi di queste varianti — e probabilmente molte altre ancora, perché il modello, generando token per token in modo probabilistico (Lezione 3.1), non garantisce automaticamente lo stesso formato a ogni esecuzione.

Questo è precisamente il problema che gli **output strutturati** risolvono: ottenere dal modello una risposta in un formato fisso, prevedibile, parsabile da un programma in modo affidabile.

---

## 2. JSON Mode: chiedere esplicitamente una struttura

Il modo più diretto per ottenere output strutturato è istruire il modello, in modo molto esplicito, a rispondere **esclusivamente** in formato JSON (il formato visto nella Lezione 1.5), specificando esattamente quali campi ci si aspetta.

```python
prompt_con_struttura = """
Estrai nome, età e città dal testo seguente.
Rispondi ESCLUSIVAMENTE con un oggetto JSON valido,
nel formato esatto: {"nome": "...", "eta": numero, "citta": "..."}
Non includere alcun testo prima o dopo il JSON.

Testo: "Mi chiamo Marco, ho 34 anni e vivo a Bologna."
"""
```

Con un'istruzione di questo tipo, ben formulata (riusando le tecniche di prompting viste nella Lezione 3.4), il modello tende a produrre consistentemente:

```json
{"nome": "Marco", "eta": 34, "citta": "Bologna"}
```

Molti provider, incluso Anthropic, offrono inoltre un parametro API dedicato (talvolta chiamato "JSON mode" o gestito tramite il meccanismo di tool use che vedremo nella prossima lezione) che **forza tecnicamente** il modello a generare solo token validi per una struttura JSON, riducendo drasticamente — anche se non eliminando del tutto — il rischio che il modello produca output malformato o circondato da testo extra.

---

## 3. Definire uno schema con Pydantic

Specificare il formato desiderato direttamente nel testo del prompt, come visto sopra, funziona ma è fragile: se il formato richiesto è complesso (campi opzionali, tipi di dato precisi, valori che devono rispettare vincoli specifici), descriverlo a parole nel prompt diventa rapidamente complicato e meno affidabile.

Una pratica più robusta, ampiamente usata nello sviluppo professionale di sistemi AI, è definire lo **schema** desiderato con uno strumento di validazione strutturata — in Python, la libreria più diffusa per questo si chiama **Pydantic**.

```python
from pydantic import BaseModel

class PersonaEstratta(BaseModel):
    nome: str
    eta: int
    citta: str

# Questo schema può essere usato per:
# 1. Generare automaticamente la descrizione del formato per il prompt
# 2. Validare la risposta del modello DOPO averla ricevuta
```

L'idea centrale è che lo schema **non vive solo nella tua testa o in un commento**: è codice eseguibile, che il tuo programma può usare sia per comunicare al modello esattamente cosa si aspetta, sia per **verificare automaticamente**, dopo aver ricevuto la risposta, che il modello abbia effettivamente rispettato quella struttura — un campo mancante, un tipo di dato sbagliato (una stringa dove ci si aspettava un numero), o un valore fuori dai vincoli previsti vengono rilevati immediatamente, invece di propagarsi silenziosamente come errore nel resto del sistema.

> **Perché questo anticipa direttamente il Capitolo 6:** quando, nella Lezione 6.5, parleremo di "contratti tra agenti", vedremo che uno schema come quello appena definito è esattamente la base tecnica di un contratto: una dichiarazione precisa e verificabile di cosa un componente del sistema si aspetta di ricevere o produrre.

---

## 4. L'Output Parser: il componente che chiude il cerchio

Un **output parser** è il componente software, posizionato subito dopo la chiamata API, che ha il compito specifico di:

1. Ricevere il testo grezzo restituito dal modello
2. Tentare di interpretarlo secondo il formato atteso (es. JSON)
3. Validarlo contro lo schema definito (es. con Pydantic)
4. Restituire un oggetto strutturato e utilizzabile dal resto del programma, oppure segnalare un errore se il parsing o la validazione fallisce

```python
import json
from pydantic import BaseModel, ValidationError

class PersonaEstratta(BaseModel):
    nome: str
    eta: int
    citta: str

def estrai_persona(risposta_grezza_del_modello: str) -> PersonaEstratta:
    """
    Output parser: trasforma il testo grezzo del modello
    in un oggetto Python validato e tipizzato.
    """
    try:
        dati_json = json.loads(risposta_grezza_del_modello)
        return PersonaEstratta(**dati_json)
    except json.JSONDecodeError:
        raise ValueError("Il modello non ha restituito JSON valido")
    except ValidationError as errore:
        raise ValueError(f"Il JSON non rispetta lo schema previsto: {errore}")
```

Questo componente è quello che rende possibile costruire **pipeline affidabili**: il resto del tuo programma non deve mai gestire direttamente l'incertezza del testo libero generato dal modello — riceve sempre, o un oggetto `PersonaEstratta` perfettamente formato e validato, o un errore esplicito e gestibile. Questa separazione di responsabilità — il modello genera, il parser valida, il resto del programma usa dati puliti — è un principio di design che ritroveremo costantemente, in forma sempre più sofisticata, in tutto il resto del corso.

---

## 5. Gestire gli errori di parsing: cosa fare quando il modello sbaglia formato

Anche con istruzioni ben formulate e schemi precisi, un modello può occasionalmente produrre output che non rispetta esattamente il formato richiesto — ricorda che, come visto nella Lezione 3.5, il comportamento del modello resta intrinsecamente probabilistico, non garantito al 100%. Una strategia di gestione robusta prevede tipicamente:

```
1. Tentare il parsing della risposta
       │
       ▼ (se fallisce)
2. Ri-tentare la chiamata API, eventualmente con
   un'istruzione rafforzata ("Il formato precedente
   non era valido, rispondi SOLO con JSON valido")
       │
       ▼ (se fallisce ripetutamente)
3. Usare un parsing più permissivo come fallback
   (es. estrarre solo la porzione di testo che
   sembra essere JSON, ignorando testo circostante)
       │
       ▼ (se anche questo fallisce)
4. Segnalare l'errore in modo esplicito al resto
   del sistema, invece di propagare dati corrotti
   o inventati
```

Questo pattern di gestione — tentare, correggere, fare fallback, infine fallire in modo esplicito e controllato — anticipa direttamente il principio di **graceful degradation** (fallire in modo controllato) che approfondiremo con maggiore rigore nella Lezione 5.5, parlando della robustezza degli agenti.

---

## Esempio Pratico: Una Pipeline Completa di Estrazione Strutturata

Mettiamo insieme tutti i pezzi di questa lezione in un esempio end-to-end, costruendo su quanto visto nella Lezione 4.1:

```python
import anthropic
import json
from pydantic import BaseModel, ValidationError

class AnalisiRecensione(BaseModel):
    categoria: str  # "assistenza", "marketing", "altro"
    urgenza: str    # "bassa", "media", "alta"
    riassunto: str

def analizza_recensione(testo_recensione: str) -> AnalisiRecensione:
    client = anthropic.Anthropic()

    prompt = f"""
Analizza questa recensione e classifica l'urgenza.
Rispondi ESCLUSIVAMENTE con JSON in questo formato esatto:
{{"categoria": "assistenza|marketing|altro",
  "urgenza": "bassa|media|alta",
  "riassunto": "breve riassunto in una frase"}}

Recensione: "{testo_recensione}"
"""

    risposta = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=300,
        messages=[{"role": "user", "content": prompt}]
    )

    testo_grezzo = risposta.content[0].text
    dati = json.loads(testo_grezzo)
    return AnalisiRecensione(**dati)


# Utilizzo:
risultato = analizza_recensione(
    "Il prodotto è arrivato rotto e nessuno mi ha mai risposto via email."
)
print(f"Categoria: {risultato.categoria}, Urgenza: {risultato.urgenza}")
# → Categoria: assistenza, Urgenza: alta
```

Questo esempio, per quanto semplice, contiene già tutti gli ingredienti di un componente di automazione reale: una chiamata API (Lezione 4.1), un'istruzione di formato precisa (questa lezione, Sezione 2), e una validazione tramite schema (questa lezione, Sezione 3) — il risultato finale, `risultato.categoria` e `risultato.urgenza`, sono dati Python pienamente utilizzabili, ad esempio, per instradare automaticamente la recensione al team giusto.

---

## Riepilogo

- Un programma ha bisogno di **output strutturato** (non testo libero) per poter usare in modo affidabile la risposta di un modello in una logica automatizzata.
- Istruzioni esplicite nel prompt, eventualmente combinate con parametri API dedicati ("JSON mode"), aumentano la probabilità che il modello produca un formato consistente.
- Definire uno **schema** (ad esempio con Pydantic) rende la struttura attesa esplicita, verificabile e riutilizzabile, sia per istruire il modello sia per validare la sua risposta.
- Un **output parser** riceve il testo grezzo, lo interpreta secondo il formato atteso, lo valida contro lo schema, e restituisce un oggetto strutturato o un errore esplicito — mai dati ambigui o corrotti silenziosamente.
- Una strategia robusta di gestione degli errori di parsing prevede tentativi, correzioni, fallback, e infine un fallimento esplicito e controllato.

---

## Domande di Verifica

1. Perché chiedere a un modello "Estrai nome ed età" senza specificare un formato preciso è una scelta progettuale rischiosa per un sistema che deve elaborare automaticamente migliaia di risposte?

2. Quali sono i vantaggi di definire lo schema con uno strumento come Pydantic, invece di limitarsi a descrivere il formato desiderato a parole nel prompt?

3. Immagina che il tuo output parser riceva una risposta JSON sintatticamente valida, ma con il campo "eta" contenente la stringa "trentaquattro" invece del numero 34. In quale fase del processo descritto in questa lezione verrebbe rilevato questo problema, e perché?

---

## Esercizi Pratici

> Tre esercizi a difficoltà crescente. Prova a risolverli da solo prima di aprire la soluzione.

### Esercizio 1 — Perché non basta il testo libero 🟢 Base

Un sistema deve instradare automaticamente migliaia di recensioni a team diversi. Perché chiedere al modello "dimmi la categoria" in testo libero è rischioso? Cosa serve invece?

<details>
<summary>💡 Mostra soluzione</summary>

In testo libero il modello risponde ogni volta in un **formato diverso** ("È assistenza", "Categoria: assistenza", "Direi che riguarda l'assistenza clienti…"). Il programma dovrebbe interpretare infinite varianti — fragile e inaffidabile su migliaia di casi.

Serve un **output strutturato** in formato fisso, es. `{"categoria": "assistenza", "urgenza": "alta"}`, parsabile in modo deterministico. Così il codice estrae sempre `risultato["categoria"]` senza indovinare.

</details>

### Esercizio 2 — Scrivi lo schema 🟡 Intermedio

Definisci uno schema Pydantic per estrarre da un testo: `titolo` (stringa), `anno` (intero), `disponibile` (booleano). Poi: se il modello restituisce `"anno": "millenovecento"`, in quale fase viene rilevato l'errore?

<details>
<summary>💡 Mostra soluzione</summary>

```python
from pydantic import BaseModel

class Libro(BaseModel):
    titolo: str
    anno: int
    disponibile: bool
```

Se il modello restituisce `"anno": "millenovecento"` (una stringa non convertibile a intero), l'errore viene rilevato nella **fase di validazione**, quando l'output parser fa `Libro(**dati)`: Pydantic solleva un `ValidationError` perché il valore non rispetta il tipo `int`.

Il vantaggio: l'errore emerge **subito ed esplicitamente**, invece di propagarsi silenziosamente come dato corrotto nel resto del sistema.

</details>

### Esercizio 3 — Strategia anti-errore 🔴 Avanzato

Il modello a volte restituisce JSON malformato o circondato da testo. Progetta una strategia di gestione robusta in più livelli. Quale principio della Lezione 5.5 anticipa?

<details>
<summary>💡 Mostra soluzione</summary>

Strategia a livelli (dal tentativo ottimista al fallimento controllato):
1. **Tenta il parsing** della risposta come JSON + validazione con lo schema.
2. Se fallisce → **ri-chiama l'API con istruzione rafforzata** ("Il formato non era valido, rispondi SOLO con JSON valido").
3. Se fallisce ancora → **parsing permissivo di fallback**: estrai solo la porzione che sembra JSON, ignorando il testo circostante.
4. Se anche questo fallisce → **fallisci in modo esplicito**, segnalando l'errore al resto del sistema invece di propagare dati inventati/corrotti.

Anticipa il principio di **graceful degradation** (Lezione 5.5): un sistema robusto degrada in modo controllato e, quando proprio non può, fallisce in modo visibile e gestibile — mai silenziosamente con dati sbagliati.

</details>

---

## Connessioni

**Viene da:** Lezione 4.1 — qui aggiungiamo, alla chiamata API di base, il livello di precisione necessario per ottenere dati utilizzabili da un programma, non solo testo per un umano.

**Porta a:** Lezione 4.3 (RAG) e Lezione 4.4 (Function Calling) — entrambe le tecniche richiedono che il modello produca output strutturati (rispettivamente, per integrare informazioni recuperate, e per specificare quale strumento usare e con quali parametri).

**Ritroverai questi concetti in:** Lezione 6.5 (Contratti tra Agenti) — lo schema Pydantic visto qui è precisamente l'antenato tecnico del concetto di "contratto" tra componenti di un sistema multi-agente. Lezione 6.3 (Agent Card) — gli schemi di input/output di un agente, dichiarati nella sua Agent Card, si basano esattamente su questo principio di validazione strutturata.
