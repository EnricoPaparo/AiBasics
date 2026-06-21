---
titolo: "L'Harness"
durata_stimata: "25 min"
difficolta: "Avanzato"
---

# L'Harness

Hai scritto un ottimo system prompt. Hai definito i tool. Hai testato il ragionamento del modello. Ma chi esegue tutto questo? Chi chiama l'API, gestisce gli errori, tiene traccia dei tool call, monitora il contesto? Entra in scena l'harness.

## Cos'è un Harness

Un **harness** (letteralmente "imbracatura") è l'infrastruttura che avvolge un agente AI e ne gestisce l'esecuzione. È lo strato software che si interpone tra il tuo codice, il modello LLM, e il mondo esterno.

L'harness non ragiona, non decide, non genera testo. **Esegue**: chiama l'API, elabora la risposta, dispatcha i tool, raccoglie i risultati, costruisce il messaggio successivo, e ricomincia.

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

Questo loop può andare avanti per decine di iterazioni su task complessi.

### Componenti Principali

- **Tool Dispatch**: intercetta le richieste di tool, trova la funzione corrispondente in un registro, la esegue, e riporta il risultato (inclusa la gestione degli errori)
- **Context Management**: mantiene la conversazione in memoria, decide quali messaggi includere, quando comprimere, quando usare il caching
- **Error Handling e Retry**: gestisce rate limit con backoff esponenziale, contesto troppo lungo, output malformati
- **Logging e Osservabilità**: registra ogni chiamata LLM, ogni tool call, ogni errore — essenziale per il debugging

## Esempi Reali di Harness

- **Claude Code**: gestisce loop di esecuzione, dispatch verso tool (Read, Edit, Bash...), context della sessione, interfaccia con l'utente
- **LangGraph**: modella l'harness come un grafo orientato — ogni nodo è uno step, ogni arco è una transizione condizionale
- **AutoGen**: gestisce la comunicazione tra più agenti in una "conversation", coordina messaggi e decisioni su chi parla quando

## Harness vs Framework vs SDK

| | Cos'è | Esempi |
|--|-------|--------|
| **SDK** | Libreria per chiamare le API del modello | Anthropic SDK, OpenAI SDK |
| **Framework** | Abstraction layer con componenti prebuilt | LangChain, LlamaIndex |
| **Harness** | Il runtime che esegue l'agente | Claude Code, AutoGen, LangGraph, harness custom |

## Un Harness Minimale

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
                model="claude-opus-4-8", max_tokens=4096,
                system=system_prompt, tools=self.tool_schemas,
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

> Tre esercizi a difficoltà crescente. Prova a risolverli da solo prima di aprire il suggerimento.

### Esercizio 1 — Anatomia di un Harness 🟢 Base

Guarda il codice del `MinimalHarness` sopra. Identifica: (a) dove avviene il loop di esecuzione, (b) dove viene gestito il tool dispatch, (c) qual è la condizione di terminazione, (d) cosa manca rispetto a un harness di produzione.

<details>
<summary>💡 Mostra suggerimento</summary>

Leggi il codice riga per riga e cerca:

**(a) Loop:** cerca il `for _ in range(...)` — ogni iterazione è un turno del loop agente.

**(b) Tool dispatch:** cerca dove viene gestito il `block.type == "tool_use"` — è lì che si chiama la funzione corrispondente.

**(c) Terminazione:** cerca la condizione che fa uscire dal loop prematuramente (non per esaurimento delle iterazioni).

**(d) Cosa manca:** pensa a cosa succede se: la chiamata API lancia un'eccezione? Un tool lancia un'eccezione? Il contesto supera il limite di token? Nessun evento viene loggato?

</details>

---

### Esercizio 2 — Aggiungi Error Handling 🟡 Intermedio

Modifica il `MinimalHarness.run()` per gestire due casi: (1) se un tool lancia un'eccezione, restituisci l'errore come tool_result invece di crashare, così il modello può reagire; (2) se la chiamata API fallisce con un errore di rate limit, aspetta 5 secondi e riprova (max 3 volte).

<details>
<summary>💡 Mostra suggerimento</summary>

**Retry per rate limit:**
```python
for attempt in range(3):
    try:
        response = self.client.messages.create(...)
        break  # successo: esci dal loop
    except anthropic.RateLimitError:
        if attempt == 2: raise  # ultimo tentativo: propaga l'errore
        time.sleep(5)
```

**Error handling per i tool:**
```python
try:
    result = self.tools[block.name](**block.input)
    content = str(result)
except Exception as e:
    content = f"ERRORE nel tool {block.name}: {str(e)}"
    # Non crashare: il modello riceve l'errore e può reagire
```

Il punto chiave del secondo: restituire l'errore come `tool_result` permette al modello di recuperare autonomamente.

</details>

---

### Esercizio 3 — Progetta un Harness Specializzato 🔴 Avanzato

Devi costruire un harness per un agente di code review. L'agente deve: (1) ricevere una lista di file modificati, (2) leggere ogni file, (3) produrre commenti strutturati per ogni file, (4) sintetizzare una review finale. Il context window è 100k token e i file possono essere molti. Progetta l'architettura dell'harness: quali componenti, come gestisce il contesto, come struttura il loop.

<details>
<summary>💡 Mostra suggerimento</summary>

**Problema principale:** non puoi mettere tutti i file in un unico context — supereresti il limite.

**Approccio multi-fase:**
- **Fase 1 (per batch di file):** harness con context budget 40k token, loop agente con tool `read_file`, output: commenti JSON per file
- **Fase 2 (sintesi finale):** singola chiamata (no loop) con tutti i commenti JSON compressi, output: review finale in markdown

**Struttura dell'harness:**
```python
class CodeReviewHarness:
    def review(self, changed_files):
        all_comments = []
        for batch in self.chunk(changed_files, 10):
            # Fase 1: harness isolato per ogni batch
            comments = self.review_batch(batch)
            all_comments.extend(comments)
        # Fase 2: sintesi finale
        return self.synthesize(all_comments)
```

**Perché questa struttura:** ogni fase ha un context pulito (no overflow), il batch separa analisi dalla sintesi (retry su singoli batch), i commenti JSON sono compressi rispetto al codice originale.

</details>

---

<details>
<summary>⚙️ Approfondimento Avanzato</summary>

### Componenti interni del loop

```python
# Tool dispatch
tool_registry = {
    "search_web": search_web_function,
    "read_file":  read_file_function,
    "write_file": write_file_function,
}
result = tool_registry[tool_call.name](**tool_call.arguments)

# Context management
class ContextManager:
    def add_message(self, role, content):
        self.messages.append({"role": role, "content": content})
        if self.count_tokens() > self.max_tokens * 0.9:
            self.compress()  # summarization o sliding window

    def compress(self):
        # Mantieni system prompt + ultimi N messaggi
        self.messages = [self.messages[0]] + self.messages[-10:]

# Retry con backoff esponenziale
def call_llm_with_retry(self, max_retries=3):
    for attempt in range(max_retries):
        try:
            return self.client.messages.create(...)
        except RateLimitError:
            time.sleep(2 ** attempt)
        except ContextLengthError:
            self.context.compress()
    raise MaxRetriesExceeded()
```

### LangGraph (harness come grafo)

```python
from langgraph.graph import StateGraph, END

workflow = StateGraph(AgentState)
workflow.add_node("agent", call_model)
workflow.add_node("tools", execute_tools)
workflow.add_conditional_edges("agent", should_continue, {
    "continue": "tools",
    "end": END
})
```

### Soluzione Esercizio 3 completa

```python
class CodeReviewHarness:
    def review_batch(self, files):
        # Harness con context budget 40k
        # Tool: solo read_file
        # Output strutturato: JSON con commenti per file
        ...

    def synthesize(self, all_comments):
        # Singola chiamata (no loop) con tutti i commenti
        # Output: review finale in markdown
        ...

    def chunk(self, files, size):
        for i in range(0, len(files), size):
            yield files[i:i+size]
```

</details>

---

## Connessioni

- **Lezione precedente**: [Errori, Robustezza, Osservabilità](06-05-errori-robustezza-osservabilita) — molte delle strategie di robustezza vivono nell'harness
- **Capitolo 4**: [Gestire il Contesto](../capitolo-04-llm/04-07-gestire-il-contesto) — le strategie di context management che l'harness implementa
- **Capitolo 5**: [Tool Use / Function Calling](../capitolo-05-strumenti-infrastruttura/05-04-tool-use-function-calling) — i tool che l'harness dispatcha
- **Capitolo 7**: [L'Agent Package](../capitolo-07-agent-package/07-02-agent-package) — come si pacchettizza un agente per essere eseguito da un harness
- **Capitolo 8**: [LangGraph](../capitolo-08-workflow-multi-agente/08-02-langgraph) — un framework che fornisce un harness per workflow multi-agente
