---
titolo: "Gestire il Contesto"
durata_stimata: "25 min"
difficolta: "Avanzato"
---

# Gestire il Contesto

Conoscere il context window è il primo passo. Saperlo gestire in un sistema reale è ciò che separa un prototipo da un prodotto.

## Il Problema Concreto

Un agente AI che lavora su task complessi consuma contesto molto velocemente. La conversazione si allunga, i tool result si accumulano, i documenti si moltiplicano. Prima o poi il context window si riempie — e il sistema deve sapere cosa fare.

Ci sono tre conseguenze dello sforamento:

1. **Troncamento silenzioso** — il provider taglia i token più vecchi senza avvertirti. Il modello risponde senza ricordare parti cruciali della conversazione. Spesso l'output sembra corretto ma è basato su informazioni incomplete.
2. **Errore esplicito** — la chiamata API fallisce con `context_length_exceeded`. Il sistema si blocca.
3. **Costi elevati** — anche senza sforare, un context gonfio aumenta il costo di ogni chiamata. Modelli come Claude addebitano per ogni token in input, ad ogni turno.

## Le Strategie di Gestione

### 1. Context Budget (Preventivo)

La strategia più semplice: **pianifica in anticipo** quanto spazio ogni componente può usare.

```
System prompt:        max 1.000 token
Storico conversazione: max 4.000 token
Documenti/dati:       max 8.000 token  
Tool calls e risultati: max 3.000 token
Buffer risposta:       2.000 token
─────────────────────────────────────
Totale pianificato:   18.000 token
```

Ogni componente ha un "budget". Se uno sfora il suo budget, viene compresso o troncato prima di essere inserito nel context. Questo rende il comportamento prevedibile e controllabile.

### 2. Sliding Window

Quando il contesto è troppo lungo, scarta i messaggi più vecchi e tieni solo gli ultimi N token.

**Vantaggi**: semplicissimo da implementare, zero latenza aggiuntiva.

**Svantaggi**: perde informazioni potenzialmente importanti dal passato. L'agente può "dimenticare" decisioni prese all'inizio della conversazione.

Adatto per: chatbot semplici, task che non richiedono memoria a lungo termine.

### 3. Summarization Rolling

Invece di scartare i messaggi vecchi, **comprimili**. Periodicamente, chiedi al modello di riassumere la parte di conversazione che sta per uscire dalla finestra. Il riassunto entra nel context al posto dei messaggi originali.

```
[Turni 1-20: riassunto in 200 token]
[Turni 21-35: messaggi completi]
[Turno corrente: input utente]
```

**Vantaggi**: mantiene le informazioni chiave, context più denso.

**Svantaggi**: richiede una chiamata LLM aggiuntiva per fare il riassunto (latenza + costo). Il riassunto può perdere dettagli importanti.

Adatto per: conversazioni lunghe dove conta la continuità, agenti con memoria episodica.

### 4. RAG (Retrieval-Augmented Generation)

Invece di mettere tutti i documenti nel context, **indicizzali fuori** e recupera solo quello che serve, al momento giusto.

```
Query utente → Embedding → Ricerca nel vector store → Top-K chunk rilevanti → Inserimento nel context
```

Questo trasforma un problema di context (dove mettere 500 pagine di documentazione?) in un problema di retrieval (quali 5 paragrafi sono rilevanti per questa domanda?).

**Vantaggi**: scala a quantità arbitrarie di documenti, context sempre snello.

**Svantaggi**: richiede infrastruttura (embedding model + vector DB), la qualità del retrieval impatta direttamente la qualità delle risposte.

Adatto per: knowledge base, documentazione, dataset grandi.

### 5. Context Compression

Tecniche per **ridurre il numero di token** senza perdere informazione semantica:

- **Rimozione dei ridondanti**: cancella le parti della conversazione dove il modello ha solo confermato o riformulato
- **Tool result truncation**: i risultati di tool call spesso contengono metadata inutili — filtra e tieni solo i campi rilevanti
- **Prompt compression**: tecniche come LLMLingua usano un modello più piccolo per comprimere il prompt prima di passarlo al modello principale
- **Key-value cache**: alcuni provider (es. Anthropic) offrono prompt caching — il system prompt viene "memorizzato" sul server e non deve essere ritrasmesso ad ogni chiamata

### 6. Architettura Multi-Step

Per task molto complessi, non cercare di fare tutto in una singola chiamata. **Dividi in step**, ciascuno con il proprio contesto limitato:

```
Step 1: Analisi del problema (context pulito)
Step 2: Ricerca informazioni (context con solo i risultati rilevanti)
Step 3: Sintesi e risposta (context con solo i risultati degli step precedenti)
```

Ogni step inizia con un context fresco, e trasferisce al prossimo solo l'essenziale.

## L'Impatto sullo Sviluppatore

Gestire il contesto non è una preoccupazione astratta — cambia concretamente come scrivi il codice.

**Devi monitorare i token:**
```python
response = client.messages.create(
    model="claude-opus-4-8",
    messages=messages
)
# Controlla sempre l'usage
print(f"Input: {response.usage.input_tokens}")
print(f"Output: {response.usage.output_tokens}")
```

**Devi implementare strategie di overflow:**
```python
def add_message(messages, new_message, max_tokens=80_000):
    messages.append(new_message)
    while count_tokens(messages) > max_tokens:
        # Strategia: rimuovi il messaggio più vecchio (non il system prompt)
        messages.pop(1)  # indice 1 = primo messaggio dopo il system prompt
    return messages
```

**Devi testare con context pieno** — molti bug appaiono solo quando il context è vicino al limite, non nelle prime chiamate.

## Context Caching: un'Opportunità Economica

Alcuni provider offrono il **prompt caching**: se invii la stessa parte di prompt ripetutamente (es. un system prompt lungo o un documento di riferimento), il provider lo memorizza e lo riutilizza senza riprocessarlo.

Con Anthropic, il caching riduce i costi dei token in cache fino al **90%** e la latenza del 30-40%. Per un agente che fa molte chiamate con lo stesso system prompt, il risparmio può essere molto significativo.

```python
# Esempio con Anthropic prompt caching
messages.create(
    system=[{
        "type": "text",
        "text": lungo_system_prompt,
        "cache_control": {"type": "ephemeral"}  # ← abilita il caching
    }],
    ...
)
```

## Scegliere la Strategia Giusta

Non esiste una strategia universale. La scelta dipende dal tipo di sistema:

| Scenario | Strategia consigliata |
|----------|-----------------------|
| Chatbot semplice | Sliding window |
| Assistente con memoria | Summarization rolling |
| Q&A su documentazione | RAG |
| Agente multi-step | Context budget + multi-step |
| Sistema ad alto volume | Context caching |
| Produzione | Combinazione di più strategie |

In produzione, la maggior parte dei sistemi usa **più strategie in combinazione**: RAG per i documenti, summarization per la storia, budget per le componenti fisse, caching per il system prompt.

---

## Esercizi Pratici

> Tre esercizi a difficoltà crescente. Prova a risolverli da solo prima di aprire la soluzione.

### Esercizio 1 — Identifica la Strategia 🟢 Base

Per ognuno di questi scenari, quale strategia di gestione del contesto useresti? (Sliding window / Summarization / RAG / Multi-step)

1. Un chatbot di supporto tecnico che deve consultare un manuale da 1.000 pagine
2. Un assistente personale che ricorda le preferenze dell'utente nel tempo
3. Un agente che deve analizzare, poi riscrivere, poi revisionare un documento
4. Un chatbot generico con conversazioni brevi e indipendenti

<details>
<summary>💡 Mostra soluzione</summary>

1. **RAG** — il manuale non entra nel context, si recuperano solo le sezioni rilevanti per ogni domanda.

2. **Summarization rolling** — le interazioni passate vengono compresse in un profilo utente che cresce nel tempo, mantenendo le informazioni chiave senza saturare il context.

3. **Multi-step con context budget** — ogni fase (analisi, riscrittura, revisione) usa il suo context, passando solo l'output essenziale alla fase successiva.

4. **Sliding window** — conversazioni brevi non richiedono memoria a lungo termine, basta tenere gli ultimi N messaggi.

</details>

---

### Esercizio 2 — Implementa il Budget 🟡 Intermedio

Scrivi una funzione Python `build_context(system_prompt, history, documents, max_tokens=16000)` che assegna budget fissi a ogni componente e tronca intelligentemente se necessario. Il system prompt non deve mai essere troncato. I documenti vengono troncati per primi, poi la history dai messaggi più vecchi.

<details>
<summary>💡 Mostra soluzione</summary>

```python
def count_tokens(text):
    # Approssimazione: 4 caratteri ≈ 1 token
    return len(text) // 4

def build_context(system_prompt, history, documents, max_tokens=16000):
    budget = {
        "system": min(count_tokens(system_prompt), max_tokens // 4),
        "documents": max_tokens // 2,
        "history": max_tokens // 4,
    }

    # System prompt: mai troncato (garantito dal budget)
    result_system = system_prompt

    # Documenti: tronca se necessario
    docs_text = "\n\n".join(documents)
    if count_tokens(docs_text) > budget["documents"]:
        max_chars = budget["documents"] * 4
        docs_text = docs_text[:max_chars] + "\n[... troncato per limiti di contesto]"

    # History: rimuovi messaggi vecchi se necessario
    trimmed_history = list(history)
    while count_tokens(str(trimmed_history)) > budget["history"] and len(trimmed_history) > 1:
        trimmed_history.pop(0)  # rimuovi il più vecchio

    return result_system, docs_text, trimmed_history
```

Nota: in produzione useresti una libreria come `tiktoken` per contare i token in modo preciso invece di approssimare con i caratteri.

</details>

---

### Esercizio 3 — Diagnostica un Sistema Reale 🔴 Avanzato

Un agente di code review funziona perfettamente sui PR piccoli, ma sui PR grandi (>50 file modificati) le sue review diventano vaghe e superficiali, senza però mai dare errori. Descrivi: (a) cosa sta probabilmente succedendo a livello di context, (b) come lo diagnosticheresti, (c) come lo risolveresti senza degradare la qualità su PR piccoli.

<details>
<summary>💡 Mostra soluzione</summary>

**(a) Cosa succede**: il provider sta troncando silenziosamente il context. I 50+ file di diff superano il limit, e il modello riceve solo una parte del codice — tipicamente la prima o l'ultima parte, non tutto. Il modello genera review sensate ma basate su dati incompleti.

**(b) Come diagnosticarla**:
- Aggiungi logging dell'usage (`response.usage.input_tokens`) e confronta PR piccoli vs grandi
- Su PR grandi, il valore di input_tokens sarà uguale o vicino al limite del modello
- Aggiungi nel prompt "Prima di rispondere, elenca i file che hai analizzato" — su PR grandi il modello ne elencherà solo una parte

**(c) Come risolvere**:
- **Chunking per file**: raggruppa i file in batch da 10-15 file, fai una review parziale per batch
- **Priorità**: usa `git diff --stat` per identificare i file più modificati, analizzali per primo con più budget
- **Review aggregata**: i risultati dei batch vengono sintetizzati in un'ultima chiamata che produce la review finale
- Questo approccio scala a PR di qualsiasi dimensione e non cambia il comportamento su PR piccoli (batch unico)

</details>

---

## Connessioni

- **Lezione precedente**: [Il Context Window](04-06-context-window) — le basi teoriche di questa lezione
- **Capitolo 5**: [RAG: Memoria Esterna](../capitolo-05-strumenti-infrastruttura/05-03-rag) — RAG approfondito come tecnica autonoma
- **Capitolo 5**: [Memory nei Sistemi AI](../capitolo-05-strumenti-infrastruttura/05-06-memory) — come i sistemi AI implementano memoria persistente
- **Capitolo 6**: [L'Harness](../capitolo-06-agenti-architettura/06-06-harness) — l'harness gestisce il context window automaticamente negli agenti
