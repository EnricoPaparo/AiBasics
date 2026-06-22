---
titolo: "Debugging e Osservabilità degli Agenti"
durata_stimata: "20 min"
difficolta: "Intermedio"
---
# Debugging e Osservabilità degli Agenti

Un agente AI non è un programma tradizionale: il suo comportamento è parzialmente non deterministico, il percorso di esecuzione dipende dall'output del modello, e i bug possono manifestarsi come "risposte strane" invece di eccezioni esplicite. Senza gli strumenti giusti, debuggare un agente è come cercare un ago in un pagliaio al buio.

## Il Problema Specifico del Debugging AI

In un programma tradizionale, un bug ha una causa esatta: riga X chiama funzione Y con valore sbagliato Z. In un sistema AI, le cose si complicano:

```
Input dell'utente → [prompt → LLM → output] → [parsing] → [tool call] → [LLM] → risposta finale

Dove può andare storto?
  - Il prompt non cattura l'intenzione dell'utente
  - Il modello malinterpreta le istruzioni
  - Il parsing dell'output fallisce su edge case
  - Il tool call usa parametri errati
  - Il costo è 10x quello atteso perché il contesto è esploso
```

Hai bisogno di **visibilità completa** su tutto il percorso.

## Logging Strutturato delle Chiamate LLM

Il primo strumento è il logging delle chiamate al modello. Non basta loggare "ho chiamato Claude" — devi loggare tutto ciò che conta per riproducibilità e diagnosi:

```python
import anthropic, logging, time

logger = logging.getLogger(__name__)

def chiama_con_log(client: anthropic.Anthropic, **kwargs) -> anthropic.types.Message:
    inizio = time.perf_counter()
    risposta = client.messages.create(**kwargs)
    durata_ms = (time.perf_counter() - inizio) * 1000
    
    logger.info(
        "LLM call: modello=%s input_token=%d output_token=%d durata_ms=%.1f stop=%s",
        kwargs.get("model"), risposta.usage.input_tokens,
        risposta.usage.output_tokens, durata_ms, risposta.stop_reason
    )
    return risposta
```

## LangSmith: Tracing Professionale

**LangSmith** (di LangChain) è lo strumento più usato per tracciare le esecuzioni di agenti. Offre una UI visuale che mostra ogni chiamata LLM, ogni tool use, la latenza, i costi, e permette di confrontare esecuzioni diverse.

```python
# pip install langsmith anthropic
from langsmith import traceable
from langsmith.wrappers import wrap_anthropic
import anthropic

# Wrappa il client — LangSmith intercetta automaticamente tutte le chiamate
client = wrap_anthropic(anthropic.Anthropic())

@traceable(name="pipeline-email")
def processa_email(testo: str) -> dict:
    risposta = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=50,
        system="Classifica l'email: URGENTE, NORMALE, o BASSA_PRIORITA.",
        messages=[{"role": "user", "content": testo}]
    )
    return {"testo": testo[:50], "categoria": risposta.content[0].text}
```

Variabili d'ambiente necessarie:
```bash
LANGCHAIN_API_KEY=ls__xxxx
LANGCHAIN_TRACING_V2=true
LANGCHAIN_PROJECT=mio-agente
```

LangSmith è gratuito per uso personale fino a 5000 tracce/mese.

## Errori Comuni e Come Diagnosticarli

### Il modello ignora le istruzioni di sistema

**Sintomo**: il system prompt dice "rispondi sempre in JSON" ma il modello a volte risponde in testo libero.

**Fix**: usa la tecnica del "prefill" per forzare l'inizio della risposta:

```python
risposta = client.messages.create(
    model="claude-haiku-4-5-20251001",
    max_tokens=500,
    system="Rispondi SEMPRE in JSON valido.",
    messages=[
        {"role": "user", "content": "Classifica questo testo: 'Ottimo prodotto!'"},
        {"role": "assistant", "content": "{"}  # prefill: forza JSON dall'inizio
    ]
)
# Il modello completerà il JSON iniziato
```

### Il contesto esplode inaspettatamente

**Sintomo**: le chiamate costano 10x il normale dopo alcune interazioni.

**Diagnosi**: logga `input_tokens` ad ogni chiamata. Se cresce linearmente ad ogni turno, stai accumulando tutta la storia della conversazione senza limite.

**Fix**: implementa una strategia di troncamento o summarization (vedi lezione 04-07).

### Il tool call usa parametri sbagliati

**Fix**: migliora la `description` dello schema del tool. Il modello capisce i parametri dalla descrizione, non solo dai nomi:

```python
# Prima (ambiguo)
{"name": "query", "type": "string"}

# Dopo (chiaro)
{"name": "query", "type": "string",
 "description": "Stringa di ricerca per il catalogo prodotti. Usa termini generici, non ID."}
```

---

## Esercizi Pratici

> Tre esercizi a difficoltà crescente. Prova a risolverli da solo prima di aprire il suggerimento.

### Esercizio 1 — Logger di Costi 🟢 Base

Scrivi un wrapper che logga ogni chiamata all'API Anthropic con: timestamp, modello, numero di token input/output, costo stimato in USD, e tempo di risposta in millisecondi. Alla fine di una sessione, stampa il totale cumulativo di token e costi.

<details>
<summary>💡 Mostra suggerimento</summary>

**Struttura del wrapper:**
```python
from dataclasses import dataclass, field

PREZZI = {
    "claude-haiku-4-5-20251001": {"input": 0.80, "output": 4.00},
    "claude-sonnet-4-6":         {"input": 3.00, "output": 15.00},
}

@dataclass
class SessioneStats:
    token_input_totale: int = 0
    token_output_totale: int = 0
    costo_totale_usd: float = 0.0
    n_chiamate: int = 0

sessione = SessioneStats()

def chiama(modello: str, **kwargs):
    inizio = time.perf_counter()
    risposta = client_raw.messages.create(model=modello, **kwargs)
    durata_ms = (time.perf_counter() - inizio) * 1000
    
    # Calcola costo e aggiorna sessione
    # Logga: modello, token in/out, costo, durata
    return risposta
```

Alla fine, una funzione `stampa_riepilogo()` che mostra i totali.

</details>

---

### Esercizio 2 — Riprodurre un Bug 🟡 Intermedio

Un agente ha questo bug: a volte risponde "Non riesco a classificare" anche per email semplici. Progetta un sistema di logging che salva su file ogni chiamata che produce questo output inatteso, includendo: il prompt completo inviato, l'output del modello, e i parametri della chiamata. Poi scrivi una funzione `riproduci_bug(filepath)` che rilegge il log e riesegue la stessa chiamata.

<details>
<summary>💡 Mostra suggerimento</summary>

**Struttura del log:**
```python
import json
from datetime import datetime

def classifica_email(testo: str) -> str:
    parametri = {"model": "...", "max_tokens": 20, "system": "...",
                 "messages": [{"role": "user", "content": testo}]}
    risposta = client.messages.create(**parametri)
    output = risposta.content[0].text.strip()
    
    anomalie = ["Non riesco", "non posso", "impossibile"]
    if any(a.lower() in output.lower() for a in anomalie):
        log = {"timestamp": datetime.now().isoformat(),
               "parametri_chiamata": parametri,
               "output_modello": output}
        filepath = f"logs/anomalia_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(filepath, "w") as f:
            json.dump(log, f, indent=2, ensure_ascii=False)
    return output

def riproduci_bug(filepath: str) -> str:
    with open(filepath) as f: log = json.load(f)
    risposta = client.messages.create(**log["parametri_chiamata"])
    return risposta.content[0].text.strip()
```

</details>

---

### Esercizio 3 — Dashboard Costi Multi-Agente 🔴 Avanzato

In un sistema con 3 agenti (Classificatore, Estrattore, Risposta), ogni agente fa chiamate indipendenti. Costruisci un sistema di monitoraggio centralizzato che: raccoglie le statistiche di ogni agente separatamente, calcola il costo per "task completato", e genera un report CSV con una riga per ogni task eseguito.

<details>
<summary>💡 Mostra suggerimento</summary>

**Struttura dati:**
```python
from dataclasses import dataclass

@dataclass
class StatAgente:
    nome: str
    chiamate: int = 0
    token_in: int = 0
    token_out: int = 0
    
    @property
    def costo(self) -> float:
        return (self.token_in * 0.80 + self.token_out * 4.00) / 1_000_000

monitor = {
    "classificatore": StatAgente("Classificatore"),
    "estrattore":     StatAgente("Estrattore"),
    "risposta":       StatAgente("Risposta"),
}
log_tasks = []
```

**Per ogni task:**
1. Calcola il costo prima del task (`costo_inizio = sum(a.costo for a in monitor.values())`)
2. Chiama i 3 agenti in sequenza, aggiornando le statistiche
3. Calcola il costo del task (`costo_task = somma_attuale - costo_inizio`)
4. Aggiungi una riga a `log_tasks`

Alla fine usa `csv.DictWriter` per generare il report.

</details>

---

<details>
<summary>⚙️ Approfondimento Avanzato</summary>

### Debugging Senza Strumenti Esterni (Tracer Locale)

```python
import json
from datetime import datetime
from pathlib import Path

class TracerLocale:
    def __init__(self, cartella_log: str = "logs/traces"):
        self.cartella = Path(cartella_log)
        self.cartella.mkdir(parents=True, exist_ok=True)
        self.trace_corrente = []
        self.trace_id = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    def registra(self, nome: str, input_dati: dict, output_dati: dict, metadati: dict = None):
        evento = {
            "nome": nome,
            "timestamp": datetime.now().isoformat(),
            "input": input_dati,
            "output": output_dati,
            "metadati": metadati or {},
        }
        self.trace_corrente.append(evento)
        return evento
    
    def salva(self):
        filepath = self.cartella / f"{self.trace_id}.json"
        with open(filepath, "w") as f:
            json.dump(self.trace_corrente, f, indent=2, ensure_ascii=False)
        print(f"Trace salvato: {filepath}")
```

### Il Prompt Inspector Pattern

```python
import anthropic, os

class ClientDebug(anthropic.Anthropic):
    """Client Anthropic che stampa i prompt prima di inviarli."""
    
    DEBUG = os.getenv("DEBUG_PROMPTS", "false").lower() == "true"
    
    def messages_create_debug(self, **kwargs):
        if self.DEBUG:
            print("\n" + "="*60)
            print("PROMPT DEBUG:")
            if "system" in kwargs:
                print(f"[SYSTEM]\n{kwargs['system']}\n")
            for msg in kwargs.get("messages", []):
                print(f"[{msg['role'].upper()}]\n{msg['content']}\n")
            print("="*60 + "\n")
        return self.messages.create(**kwargs)
```

```bash
# In sviluppo
DEBUG_PROMPTS=true python main.py

# In produzione (disabilitato automaticamente)
python main.py
```

</details>

---

## Connessioni

- **Lezione precedente**: [Streaming e UX Real-Time](05-10-streaming-ux-realtime) — il tracing degli stream richiede gestione speciale degli eventi parziali
- **Capitolo 6**: [Errori, Robustezza, Osservabilità](../capitolo-06-agenti-architettura/06-05-errori-robustezza-osservabilita) — questa lezione applica i principi di osservabilità agli agenti complessi
- **Capitolo 8**: [Testing e Valutazione degli LLM](../capitolo-08-workflow-multi-agente/08-06-testing-evals) — il debugging produce i dati di training per i test di regressione
- **Capitolo 8**: [Deployment e Ambienti](../capitolo-08-workflow-multi-agente/08-07-deployment) — in produzione il monitoring LangSmith è parte dell'infrastruttura di osservabilità
