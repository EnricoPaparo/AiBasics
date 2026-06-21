---
titolo: "L'Harness"
durata_stimata: "25 min"
difficolta: "Avanzato"
---

# L'Harness

Hai scritto un ottimo system prompt. Hai definito i tool. Hai testato il ragionamento del modello. Ma chi esegue tutto questo? Chi chiama l'API, gestisce gli errori, tiene traccia dei tool call, monitora il contesto? Entra in scena l'harness.

## Cos'è un Harness

Un **harness** (letteralmente "imbracatura") è l'infrastruttura che avvolge un agente AI e ne gestisce l'esecuzione. È lo strato software che si interpone tra il tuo codice, il modello LLM, e il mondo esterno.

L'harness non ragiona, non decide, non genera testo. **Esegue**: chiama l'API, elabora la risposta, dispatcha i tool, raccoglie i risultati, costruisce il messaggio successivo, e ricomincia — finché il task non è completato.

```
┌─────────────────────────────────────────┐
│               HARNESS                   │
│                                         │
│  ┌──────────┐    ┌──────────────────┐   │
│  │  Agente  │◄──►│  Loop di        │   │
│  │  (LLM)   │    │  Esecuzione     │   │
│  └──────────┘    └────────┬─────────┘   │
│                           │             │
│  ┌────────────────────────▼──────────┐  │
│  │  Tool Dispatcher                  │  │
│  │  Context Manager                  │  │
│  │  Error Handler                    │  │
│  │  Logger / Monitor                 │  │
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

## Cosa fa Concretamente

### Il Loop di Esecuzione

Il cuore dell'harness è un loop: chiedi al modello cosa fare → fallo → riporta il risultato → ricomincia.

```python
def run_agent(harness, user_input):
    harness.add_message("user", user_input)

    while True:
        response = harness.call_llm()

        if response.stop_reason == "end_turn":
            return response.content  # il task è finito

        if response.stop_reason == "tool_use":
            for tool_call in response.tool_calls:
                result = harness.dispatch_tool(tool_call)
                harness.add_tool_result(tool_call.id, result)
            # il loop continua: l'agente elabora i risultati
```

Questo loop può andare avanti per decine di iterazioni su task complessi. L'harness lo gestisce senza che tu debba scriverlo ogni volta da zero.

### Tool Dispatch

Quando il modello decide di usare un tool, l'harness intercetta la richiesta, trova la funzione corrispondente, la esegue, e riporta il risultato.

```python
# Il modello dice: "voglio usare il tool search_web con query='prezzi componenti'"
# L'harness fa:
tool_registry = {
    "search_web": search_web_function,
    "read_file": read_file_function,
    "write_file": write_file_function,
}

result = tool_registry[tool_call.name](**tool_call.arguments)
```

L'harness gestisce anche i casi d'errore: tool non trovato, eccezione durante l'esecuzione, timeout, risultato troppo lungo per il context.

### Context Management

L'harness mantiene la conversazione in memoria e gestisce il context window. Decide quali messaggi includere, quando comprimere, quando usare il caching.

```python
class ContextManager:
    def add_message(self, role, content):
        self.messages.append({"role": role, "content": content})
        if self.count_tokens() > self.max_tokens * 0.9:
            self.compress()  # summarization o sliding window

    def compress(self):
        # Mantieni system prompt + ultimi N messaggi
        self.messages = [self.messages[0]] + self.messages[-10:]
```

### Error Handling e Retry

Le API falliscono. I tool lanciano eccezioni. Il modello genera output malformati. L'harness gestisce tutto questo con retry automatici, backoff esponenziale, e strategie di fallback.

```python
def call_llm_with_retry(self, max_retries=3):
    for attempt in range(max_retries):
        try:
            return self.client.messages.create(...)
        except RateLimitError:
            time.sleep(2 ** attempt)  # backoff esponenziale
        except ContextLengthError:
            self.context.compress()   # riprova con context ridotto
    raise MaxRetriesExceeded()
```

### Logging e Osservabilità

Un harness professionale registra ogni evento: ogni chiamata LLM con i token usati, ogni tool call con input e output, ogni errore, ogni decisione di compressione del context. Questo è essenziale per il debugging e per capire cosa l'agente sta effettivamente facendo.

## Esempi Reali di Harness

### Claude Code (Questo Strumento)

Claude Code è un agente AI, e l'harness che lo fa girare gestisce: il loop di esecuzione sui task, il dispatch verso i tool (Read, Edit, Bash, Glob...), il context della sessione corrente, il salvataggio dei file modificati, e l'interfaccia con l'utente.

Quando chiedi a Claude Code di "analizzare il repository e trovare tutti i bug", l'harness traduce questa richiesta in decine di chiamate API, centinaia di tool call, e alla fine ti presenta il risultato.

### LangGraph

LangGraph modella l'harness come un grafo orientato: ogni nodo è uno step, ogni arco è una transizione condizionale. L'harness esegue il grafo, mantiene lo stato tra i nodi, e gestisce i cicli (quando l'agente deve tornare indietro).

```python
# Con LangGraph, l'harness è il grafo stesso
workflow = StateGraph(AgentState)
workflow.add_node("agent", call_model)
workflow.add_node("tools", execute_tools)
workflow.add_conditional_edges("agent", should_continue, {
    "continue": "tools",
    "end": END
})
```

### AutoGen

In AutoGen, l'harness gestisce la comunicazione tra più agenti in una "conversation". Ogni agente ha il suo loop, e l'harness coordina i messaggi tra di loro, decide chi parla quando, e quando la conversazione è terminata.

### Harness Custom

Per molti casi d'uso professionali, si scrive un harness custom. È più lavoro ma offre controllo totale: puoi implementare esattamente le strategie di context management che vuoi, il logging che ti serve, le policy di retry specifiche per il tuo sistema.

## Harness vs Framework vs SDK

La distinzione può confondere:

| | Cos'è | Esempi |
|--|-------|--------|
| **SDK** | Libreria per chiamare le API del modello | Anthropic SDK, OpenAI SDK |
| **Framework** | Abstraction layer con componenti prebuilt | LangChain, LlamaIndex |
| **Harness** | Il runtime che esegue l'agente | Claude Code, AutoGen, LangGraph, harness custom |

Un harness spesso usa un SDK, e può appoggiarsi a un framework — ma è il livello che effettivamente esegue il loop agente.

## Perché lo Sviluppatore Deve Capirlo

Capire l'harness ti permette di:

**Debuggare efficacemente** — quando un agente si comporta in modo strano, il problema è spesso nell'harness (context mal gestito, tool risultato non passato correttamente, retry che ha cambiato lo stato) più che nel modello.

**Scegliere lo strumento giusto** — LangGraph, AutoGen, o harness custom? La risposta dipende dalla complessità del tuo loop, dal tipo di tool dispatch, e da quanto controllo ti serve.

**Ottimizzare le prestazioni** — caching, batching dei tool call, parallelizzazione — tutte ottimizzazioni che vivono nell'harness, non nel modello.

**Stimare i costi** — l'harness determina quante chiamate API vengono fatte e con quali dimensioni di context. Senza capirlo, non puoi stimare i costi di produzione.

## Un Harness Minimale

Per capire il concetto alla radice, ecco un harness funzionante scritto da zero in ~50 righe:

```python
import anthropic

class MinimalHarness:
    def __init__(self, tools):
        self.client = anthropic.Anthropic()
        self.tools = {t["name"]: t["fn"] for t in tools}
        self.tool_schemas = [{"name": t["name"], "description": t["desc"],
                              "input_schema": t["schema"]} for t in tools]
        self.messages = []

    def run(self, system_prompt, user_input, max_iterations=10):
        self.messages = [{"role": "user", "content": user_input}]

        for _ in range(max_iterations):
            response = self.client.messages.create(
                model="claude-opus-4-8",
                max_tokens=4096,
                system=system_prompt,
                tools=self.tool_schemas,
                messages=self.messages
            )

            self.messages.append({"role": "assistant", "content": response.content})

            if response.stop_reason == "end_turn":
                return next(b.text for b in response.content if hasattr(b, 'text'))

            tool_results = []
            for block in response.content:
                if block.type == "tool_use":
                    result = self.tools[block.name](**block.input)
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": str(result)
                    })

            self.messages.append({"role": "user", "content": tool_results})

        return "Max iterations reached"
```

Questo è il nucleo di ogni harness. Tutto il resto — context management, retry, logging, caching — sono strati aggiunti sopra questo loop fondamentale.

---

## Esercizi Pratici

> Tre esercizi a difficoltà crescente. Prova a risolverli da solo prima di aprire la soluzione.

### Esercizio 1 — Anatomia di un Harness 🟢 Base

Guarda il codice del `MinimalHarness` sopra. Identifica: (a) dove avviene il loop di esecuzione, (b) dove viene gestito il tool dispatch, (c) qual è la condizione di terminazione, (d) cosa manca rispetto a un harness di produzione.

<details>
<summary>💡 Mostra soluzione</summary>

**(a) Loop di esecuzione**: il `for _ in range(max_iterations)` — ogni iterazione è un turno del loop agente.

**(b) Tool dispatch**: il blocco `for block in response.content` — quando trova un `tool_use`, chiama `self.tools[block.name](**block.input)`.

**(c) Condizione di terminazione**: `if response.stop_reason == "end_turn"` — il modello dichiara di aver finito, o si raggiunge `max_iterations`.

**(d) Cosa manca in produzione**:
- Error handling (e retry) sulle chiamate API
- Context management (nessuna gestione del limite di token)
- Logging (nessuna traccia degli eventi)
- Gestione degli errori nei tool (se un tool lancia un'eccezione, il sistema crasha)
- Timeout per i tool lenti
- Parallelizzazione dei tool call quando possibile

</details>

---

### Esercizio 2 — Aggiungi Error Handling 🟡 Intermedio

Modifica il `MinimalHarness.run()` per gestire due casi: (1) se un tool lancia un'eccezione, restituisci l'errore come tool_result invece di crashare, così il modello può reagire; (2) se la chiamata API fallisce con un errore di rate limit, aspetta 5 secondi e riprova (max 3 volte).

<details>
<summary>💡 Mostra soluzione</summary>

```python
import time
import anthropic

def run(self, system_prompt, user_input, max_iterations=10):
    self.messages = [{"role": "user", "content": user_input}]

    for _ in range(max_iterations):
        # Retry per rate limit
        for attempt in range(3):
            try:
                response = self.client.messages.create(
                    model="claude-opus-4-8",
                    max_tokens=4096,
                    system=system_prompt,
                    tools=self.tool_schemas,
                    messages=self.messages
                )
                break
            except anthropic.RateLimitError:
                if attempt == 2:
                    raise
                time.sleep(5)

        self.messages.append({"role": "assistant", "content": response.content})

        if response.stop_reason == "end_turn":
            return next(b.text for b in response.content if hasattr(b, 'text'))

        tool_results = []
        for block in response.content:
            if block.type == "tool_use":
                # Error handling per i tool
                try:
                    result = self.tools[block.name](**block.input)
                    content = str(result)
                except Exception as e:
                    content = f"ERRORE nel tool {block.name}: {str(e)}"

                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": content
                })

        self.messages.append({"role": "user", "content": tool_results})

    return "Max iterations reached"
```

Il punto chiave: restituire l'errore come `tool_result` invece di crashare permette al modello di recuperare autonomamente — magari ritentando con parametri diversi o scegliendo un'altra strategia.

</details>

---

### Esercizio 3 — Progetta un Harness Specializzato 🔴 Avanzato

Devi costruire un harness per un agente di code review. L'agente deve: (1) ricevere una lista di file modificati, (2) leggere ogni file, (3) produrre commenti strutturati per ogni file, (4) sintetizzare una review finale. Il context window è 100k token e i file possono essere molti. Progetta l'architettura dell'harness: quali componenti, come gestisce il contesto, come struttura il loop.

<details>
<summary>💡 Mostra soluzione</summary>

**Architettura**: harness multi-fase con context budget per fase.

```
┌─────────────────────────────────────────────┐
│         CodeReviewHarness                   │
│                                             │
│  Fase 1: Analisi per batch di file          │
│  ┌───────────────────────────────────────┐  │
│  │ Per ogni batch (10 file max):          │  │
│  │  - Loop agente con tool read_file      │  │
│  │  - Context budget: 40k token           │  │
│  │  - Output: commenti strutturati JSON   │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  Fase 2: Sintesi finale                     │
│  ┌───────────────────────────────────────┐  │
│  │ Input: tutti i commenti JSON (compressi)│  │
│  │ Loop agente senza tool                  │  │
│  │ Context budget: 20k token               │  │
│  │ Output: review finale in markdown       │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

**Componenti chiave**:

```python
class CodeReviewHarness:
    def review(self, changed_files):
        # Fase 1: batch da 10 file
        all_comments = []
        for batch in self.chunk(changed_files, 10):
            comments = self.review_batch(batch)  # loop agente isolato
            all_comments.extend(comments)

        # Fase 2: sintesi
        return self.synthesize(all_comments)

    def review_batch(self, files):
        # Harness con context budget 40k
        # Tool: solo read_file
        # Output strutturato: JSON con commenti per file
        ...

    def synthesize(self, all_comments):
        # Singola chiamata (no loop) con tutti i commenti
        # Output: review finale in markdown
        ...
```

**Perché questa struttura funziona**:
- Ogni fase ha un context pulito → nessun overflow
- Il batch separa l'analisi dei file dalla sintesi → più facile fare retry su singoli batch
- L'output JSON dei commenti è compresso rispetto al codice originale → la sintesi riceve molte meno informazioni ma quelle chiave

</details>

---

## Connessioni

- **Lezione precedente**: [Errori, Robustezza, Osservabilità](05-05-errori-robustezza-osservabilita) — molte delle strategie di robustezza vivono nell'harness
- **Capitolo 3**: [Gestire il Contesto](../capitolo-03-llm/03-07-gestire-il-contesto) — le strategie di context management che l'harness implementa
- **Capitolo 4**: [Tool Use / Function Calling](../capitolo-04-strumenti-infrastruttura/04-04-tool-use-function-calling) — i tool che l'harness dispatcha
- **Capitolo 6**: [L'Agent Package](../capitolo-06-agent-package/06-02-agent-package) — come si pacchettizza un agente per essere eseguito da un harness
- **Capitolo 7**: [LangGraph](../capitolo-07-workflow-multi-agente/07-02-langgraph) — un framework che fornisce un harness per workflow multi-agente
