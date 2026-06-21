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
  - La risposta finale è corretta ma il tono è sbagliato
  - Il costo è 10x quello atteso perché il contesto è esploso
```

Hai bisogno di **visibilità completa** su tutto il percorso.

## Logging Strutturato delle Chiamate LLM

Il primo strumento è il logging delle chiamate al modello. Non basta loggare "ho chiamato Claude" — devi loggare tutto ciò che conta per riproducibilità e diagnosi:

```python
import anthropic
import logging
import json
import time
from dataclasses import dataclass, asdict

logger = logging.getLogger(__name__)

@dataclass
class ChiamataLLM:
    timestamp: str
    modello: str
    input_tokens: int
    output_tokens: int
    durata_ms: float
    costo_stimato_usd: float
    stop_reason: str
    
    # Prezzi approssimativi claude-haiku (per milione di token)
    PREZZO_INPUT = 0.80
    PREZZO_OUTPUT = 4.00

def chiama_con_log(client: anthropic.Anthropic, **kwargs) -> anthropic.types.Message:
    inizio = time.perf_counter()
    
    risposta = client.messages.create(**kwargs)
    
    durata_ms = (time.perf_counter() - inizio) * 1000
    
    log_entry = ChiamataLLM(
        timestamp=time.strftime("%Y-%m-%dT%H:%M:%S"),
        modello=kwargs.get("model", "unknown"),
        input_tokens=risposta.usage.input_tokens,
        output_tokens=risposta.usage.output_tokens,
        durata_ms=round(durata_ms, 1),
        costo_stimato_usd=round(
            (risposta.usage.input_tokens * ChiamataLLM.PREZZO_INPUT +
             risposta.usage.output_tokens * ChiamataLLM.PREZZO_OUTPUT) / 1_000_000,
            6
        ),
        stop_reason=risposta.stop_reason,
    )
    
    logger.info(f"LLM call: {json.dumps(asdict(log_entry))}")
    
    return risposta
```

## LangSmith: Tracing Professionale

**LangSmith** (di LangChain) è lo strumento più usato per tracciare le esecuzioni di agenti. Offre una UI visuale che mostra ogni chiamata LLM, ogni tool use, la latenza, i costi, e permette di confrontare esecuzioni diverse.

```python
# pip install langsmith anthropic
from langsmith import traceable
from langsmith.wrappers import wrap_anthropic
import anthropic

# Wrappa il client Anthropic — LangSmith intercetta automaticamente tutte le chiamate
client = wrap_anthropic(anthropic.Anthropic())

@traceable(name="classifica-email")
def classifica_email(testo: str) -> str:
    risposta = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=50,
        system="Classifica l'email: URGENTE, NORMALE, o BASSA_PRIORITA. Rispondi solo con la categoria.",
        messages=[{"role": "user", "content": testo}]
    )
    return risposta.content[0].text

@traceable(name="pipeline-email")
def processa_email(testo: str) -> dict:
    categoria = classifica_email(testo)
    return {"testo": testo[:50], "categoria": categoria}

# Ogni chiamata viene tracciata su app.smith.langchain.com
result = processa_email("Il sistema è completamente bloccato!")
```

In LangSmith puoi vedere:
- Il grafo di esecuzione dell'agente (quali funzioni hanno chiamato quali)
- I prompt esatti inviati al modello (con tutte le variabili risolte)
- I token usati e i costi per ogni passo
- Gli errori con traceback completo
- Confronto side-by-side di esecuzioni diverse

## Variabili d'Ambiente per LangSmith

```bash
# .env
LANGCHAIN_API_KEY=ls__xxxx
LANGCHAIN_TRACING_V2=true
LANGCHAIN_PROJECT=mio-agente  # nome del progetto in LangSmith
```

LangSmith è gratuito per uso personale fino a 5000 tracce/mese.

## Debugging Senza Strumenti Esterni

Se non puoi usare LangSmith (privacy, costi, ambiente offline), puoi costruire un sistema di tracing minimale:

```python
import json
import os
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

# Uso
tracer = TracerLocale()

def agente_con_tracing(domanda: str) -> str:
    tracer.registra("input_utente", {}, {"domanda": domanda})
    
    # Chiama il modello
    risposta = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=500,
        messages=[{"role": "user", "content": domanda}]
    )
    testo = risposta.content[0].text
    
    tracer.registra(
        "chiamata_llm",
        {"domanda": domanda},
        {"risposta": testo},
        {"input_tokens": risposta.usage.input_tokens, "output_tokens": risposta.usage.output_tokens}
    )
    
    tracer.salva()
    return testo
```

## Debuggare i Prompt: Il Prompt Inspector Pattern

Un bug comune è che il prompt "sembra giusto" ma il modello lo interpreta diversamente. Il modo più rapido per diagnosticarlo è stampare il prompt esatto prima di inviarlo:

```python
import anthropic

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
# In sviluppo: abilita il debug
DEBUG_PROMPTS=true python main.py

# In produzione: disabilitato automaticamente
python main.py
```

## Errori Comuni e Come Diagnosticarli

### Il modello ignora le istruzioni di sistema

**Sintomo**: il system prompt dice "rispondi sempre in JSON" ma il modello a volte risponde in testo libero.

**Diagnosi**: stampa il prompt esatto. Verifica che il system prompt non sia troppo lungo (>500 token) — le istruzioni a fine prompt vengono dimenticate. Verifica che non ci siano istruzioni contraddittorie.

**Fix**: metti le istruzioni critiche sia all'inizio che alla fine del system prompt. Usa la tecnica del "prefill" per forzare l'inizio della risposta:

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

**Fix**: vedi lezione 04-07 (Gestire il Contesto). Implementa una strategia di troncamento o summarization.

### Il tool call usa parametri sbagliati

**Sintomo**: il modello chiama il tool `cerca_prodotto` con `{"nome_prodotto": "scarpe"}` invece di `{"query": "scarpe"}`.

**Diagnosi**: stampa il blocco `tool_use` esatto restituito dal modello.

**Fix**: migliora la `description` dello schema del tool. Il modello capisce i parametri dalla descrizione, non solo dai nomi:

```python
# Prima (ambiguo)
{"name": "query", "type": "string"}

# Dopo (chiaro)
{"name": "query", "type": "string", "description": "Stringa di ricerca per il catalogo prodotti. Usa termini generici, non ID."}
```

---

## Esercizi Pratici

> Tre esercizi a difficoltà crescente. Prova a risolverli da solo prima di aprire la soluzione.

### Esercizio 1 — Logger di Costi 🟢 Base

Scrivi un wrapper che logga ogni chiamata all'API Anthropic con: timestamp, modello, numero di token input/output, costo stimato in USD, e tempo di risposta in millisecondi. Alla fine di una sessione, stampa il totale cumulativo di token e costi.

<details>
<summary>💡 Mostra soluzione</summary>

```python
import anthropic
import time
import logging
from dataclasses import dataclass, field

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")
logger = logging.getLogger("costi_llm")

# Prezzi Anthropic in USD per milione di token (approssimativi)
PREZZI = {
    "claude-haiku-4-5-20251001": {"input": 0.80, "output": 4.00},
    "claude-sonnet-4-6":   {"input": 3.00, "output": 15.00},
    "claude-opus-4-8":     {"input": 15.00, "output": 75.00},
}

@dataclass
class SessioneStats:
    token_input_totale: int = 0
    token_output_totale: int = 0
    costo_totale_usd: float = 0.0
    n_chiamate: int = 0

sessione = SessioneStats()
client_raw = anthropic.Anthropic()

def chiama(modello: str, **kwargs) -> anthropic.types.Message:
    inizio = time.perf_counter()
    risposta = client_raw.messages.create(model=modello, **kwargs)
    durata_ms = (time.perf_counter() - inizio) * 1000
    
    prezzi = PREZZI.get(modello, {"input": 0, "output": 0})
    costo = (
        risposta.usage.input_tokens * prezzi["input"] +
        risposta.usage.output_tokens * prezzi["output"]
    ) / 1_000_000
    
    sessione.token_input_totale += risposta.usage.input_tokens
    sessione.token_output_totale += risposta.usage.output_tokens
    sessione.costo_totale_usd += costo
    sessione.n_chiamate += 1
    
    logger.info(
        f"[{modello}] in={risposta.usage.input_tokens} out={risposta.usage.output_tokens} "
        f"costo=${costo:.5f} durata={durata_ms:.0f}ms"
    )
    return risposta

def stampa_riepilogo():
    print(f"\n{'='*40}")
    print(f"Riepilogo sessione:")
    print(f"  Chiamate: {sessione.n_chiamate}")
    print(f"  Token input totale: {sessione.token_input_totale:,}")
    print(f"  Token output totale: {sessione.token_output_totale:,}")
    print(f"  Costo totale: ${sessione.costo_totale_usd:.4f}")
    print(f"{'='*40}")

# Test
for q in ["Chi è Alan Turing?", "Cos'è il machine learning?", "Definisci deep learning."]:
    r = chiama(
        "claude-haiku-4-5-20251001",
        max_tokens=100,
        messages=[{"role": "user", "content": q}]
    )

stampa_riepilogo()
```

</details>

---

### Esercizio 2 — Riprodurre un Bug 🟡 Intermedio

Un agente ha questo bug: a volte risponde "Non riesco a classificare" anche per email semplici. Progetta un sistema di logging che salva su file ogni chiamata che produce questo output inatteso, includendo: il prompt completo inviato, l'output del modello, e i parametri della chiamata. Poi scrivi una funzione `riproduci_bug(filepath)` che rilegge il log e riesegue la stessa chiamata.

<details>
<summary>💡 Mostra soluzione</summary>

```python
import anthropic
import json
import logging
from datetime import datetime
from pathlib import Path

client = anthropic.Anthropic()
Path("logs").mkdir(exist_ok=True)

def classifica_email(testo: str) -> str:
    parametri = {
        "model": "claude-haiku-4-5-20251001",
        "max_tokens": 20,
        "system": "Classifica l'email: URGENTE, NORMALE, BASSA_PRIORITA. Solo la categoria.",
        "messages": [{"role": "user", "content": testo}]
    }
    
    risposta = client.messages.create(**parametri)
    output = risposta.content[0].text.strip()
    
    # Logga i casi anomali
    anomalie = ["Non riesco", "non posso", "impossibile", "errore"]
    if any(a.lower() in output.lower() for a in anomalie):
        log = {
            "timestamp": datetime.now().isoformat(),
            "parametri_chiamata": parametri,
            "output_modello": output,
            "usage": {
                "input_tokens": risposta.usage.input_tokens,
                "output_tokens": risposta.usage.output_tokens,
            }
        }
        filepath = f"logs/anomalia_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}.json"
        with open(filepath, "w") as f:
            json.dump(log, f, indent=2, ensure_ascii=False)
        logging.warning(f"Output anomalo rilevato! Log salvato: {filepath}")
    
    return output

def riproduci_bug(filepath: str) -> str:
    with open(filepath) as f:
        log = json.load(f)
    
    print(f"Riproducendo chiamata del {log['timestamp']}")
    print(f"Output originale: {log['output_modello']}")
    
    parametri = log["parametri_chiamata"]
    risposta = client.messages.create(**parametri)
    nuovo_output = risposta.content[0].text.strip()
    
    print(f"Nuovo output: {nuovo_output}")
    return nuovo_output

# Test
risultato = classifica_email("???")  # input ambiguo che potrebbe causare anomalia
print(f"Risultato: {risultato}")
```

</details>

---

### Esercizio 3 — Dashboard Costi Multi-Agente 🔴 Avanzato

In un sistema con 3 agenti (Classificatore, Estrattore, Risposta), ogni agente fa chiamate indipendenti. Costruisci un sistema di monitoraggio centralizzato che: raccoglie le statistiche di ogni agente separatamente, calcola il costo per "task completato" (un task coinvolge tutti e 3 gli agenti), e genera un report CSV con una riga per ogni task eseguito.

<details>
<summary>💡 Mostra soluzione</summary>

```python
import anthropic
import csv
import time
from dataclasses import dataclass, field
from datetime import datetime

client = anthropic.Anthropic()

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
    "estrattore": StatAgente("Estrattore"),
    "risposta": StatAgente("Risposta"),
}
log_tasks = []

def chiama_agente(nome_agente: str, system: str, user: str) -> str:
    risposta = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=150,
        system=system,
        messages=[{"role": "user", "content": user}]
    )
    stat = monitor[nome_agente]
    stat.chiamate += 1
    stat.token_in += risposta.usage.input_tokens
    stat.token_out += risposta.usage.output_tokens
    return risposta.content[0].text.strip()

def processa_task(email: str) -> dict:
    inizio = time.perf_counter()
    costo_inizio = sum(a.costo for a in monitor.values())
    
    categoria = chiama_agente(
        "classificatore",
        "Classifica l'email: URGENTE, NORMALE, BASSA_PRIORITA. Solo la categoria.",
        email
    )
    
    info = chiama_agente(
        "estrattore",
        "Estrai dal testo: mittente (se presente), problema principale. Formato JSON: {mittente, problema}",
        email
    )
    
    risposta = chiama_agente(
        "risposta",
        "Scrivi una risposta breve e professionale all'email.",
        email
    )
    
    durata = time.perf_counter() - inizio
    costo_task = sum(a.costo for a in monitor.values()) - costo_inizio
    
    record = {
        "timestamp": datetime.now().isoformat(),
        "email_preview": email[:50],
        "categoria": categoria,
        "durata_s": round(durata, 2),
        "costo_usd": round(costo_task, 5),
    }
    log_tasks.append(record)
    return {"categoria": categoria, "info": info, "risposta": risposta}

def salva_report(filepath="report_tasks.csv"):
    if not log_tasks:
        return
    with open(filepath, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=log_tasks[0].keys())
        writer.writeheader()
        writer.writerows(log_tasks)
    print(f"Report salvato: {filepath}")
    
    print("\nStatistiche per agente:")
    for nome, stat in monitor.items():
        print(f"  {stat.nome}: {stat.chiamate} chiamate, ${stat.costo:.4f}")

# Test
email_test = [
    "Il sistema di login è completamente bloccato, nessun utente può accedere!",
    "Avrei una domanda sulla fattura di marzo",
    "Sarebbe bello aggiungere la modalità scura all'app",
]

for email in email_test:
    processa_task(email)

salva_report()
```

</details>

---

## Connessioni

- **Lezione precedente**: [Streaming e UX Real-Time](05-10-streaming-ux-realtime) — il tracing degli stream richiede gestione speciale degli eventi parziali
- **Capitolo 6**: [Errori, Robustezza, Osservabilità](../capitolo-06-agenti-architettura/06-05-errori-robustezza-osservabilita) — questa lezione applica i principi di osservabilità agli agenti complessi
- **Capitolo 8**: [Testing e Valutazione degli LLM](../capitolo-08-workflow-multi-agente/08-06-testing-evals) — il debugging produce i dati di training per i test di regressione
- **Capitolo 8**: [Deployment e Ambienti](../capitolo-08-workflow-multi-agente/08-07-deployment) — in produzione il monitoring LangSmith è parte dell'infrastruttura di osservabilità
