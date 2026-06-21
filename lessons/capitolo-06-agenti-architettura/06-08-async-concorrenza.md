---
titolo: "Async e Concorrenza negli Agenti"
durata_stimata: "25 min"
difficolta: "Avanzato"
---

# Async e Concorrenza negli Agenti

Un agente che chiama un LLM aspetta. Un agente che chiama 5 tool aspetta 5 volte. Se ogni chiamata richiede 2 secondi, un agente sequenziale impiega 10 secondi per completare quello che un agente concorrente fa in 2. In questa lezione impari a costruire agenti veloci usando `async/await` e la concorrenza in Python.

## Il Problema della Latenza Sequenziale

Considera un agente che deve raccogliere informazioni da fonti diverse. Se le chiamate sono indipendenti (non hanno bisogno del risultato delle altre per partire), possono essere eseguite in parallelo:

```python
# Approccio sequenziale — LENTO (~3.5s)
def ricerca_completa(query: str) -> dict:
    meteo = cerca_meteo(query)      # 1.2s
    notizie = cerca_notizie(query)  # 0.8s
    wiki = cerca_wikipedia(query)   # 1.5s
    return {"meteo": meteo, "notizie": notizie, "wiki": wiki}

# Approccio concorrente — VELOCE (~1.5s, solo il più lento dei tre)
async def ricerca_completa_async(query: str) -> dict:
    meteo, notizie, wiki = await asyncio.gather(
        cerca_meteo_async(query),
        cerca_notizie_async(query),
        cerca_wikipedia_async(query),
    )
    return {"meteo": meteo, "notizie": notizie, "wiki": wiki}
```

## Basi di async/await in Python

`async/await` è il meccanismo Python per la programmazione asincrona. L'idea chiave: invece di **bloccare** il thread mentre aspetti una risposta di rete, il programma **cede il controllo** e può fare altro nel frattempo.

**Regole fondamentali**:
- Una funzione `async def` restituisce una **coroutine**
- Le coroutine si eseguono con `await` (dentro un'altra funzione async) o con `asyncio.run()` (entrypoint)
- `await` può essere usato SOLO dentro funzioni `async`
- `asyncio.gather()` esegue più coroutine in **parallelo** e aspetta che tutte finiscano

## Chiamate Parallele all'LLM

L'SDK Anthropic supporta l'uso asincrono tramite `AsyncAnthropic`:

```python
import asyncio
import anthropic

client = anthropic.AsyncAnthropic()

async def analisi_completa(testo: str) -> dict:
    """Esegue tre analisi diverse sullo stesso testo in parallelo."""
    async def analizza(tipo: str) -> str:
        prompt = {
            "sentiment": f"Analizza il sentiment (positivo/negativo/neutro): {testo}",
            "lingua":    f"Identifica la lingua: {testo}",
            "keywords":  f"Estrai le 3 parole chiave principali: {testo}",
        }[tipo]
        risposta = await client.messages.create(
            model="claude-haiku-4-5-20251001", max_tokens=100,
            messages=[{"role": "user", "content": prompt}]
        )
        return risposta.content[0].text.strip()
    
    sentiment, lingua, keywords = await asyncio.gather(
        analizza("sentiment"), analizza("lingua"), analizza("keywords")
    )
    return {"sentiment": sentiment, "lingua": lingua, "keywords": keywords}

risultato = asyncio.run(analisi_completa("This product is absolutely amazing!"))
```

## Elaborare Molti Item con Semafori

Se devi elaborare 100 documenti in parallelo, non vuoi lanciare 100 richieste API contemporaneamente — supereresti i rate limit. Usa un **semaforo** per limitare la concorrenza:

```python
async def elabora_batch(documenti: list[str], max_concorrenti: int = 5) -> list[dict]:
    semaforo = asyncio.Semaphore(max_concorrenti)
    
    async def classifica(doc: str) -> dict:
        async with semaforo:  # max N chiamate simultanee
            risposta = await client.messages.create(
                model="claude-haiku-4-5-20251001", max_tokens=50,
                messages=[{"role": "user", "content": f"Classifica in una parola: {doc[:200]}"}]
            )
            return {"doc": doc[:30], "categoria": risposta.content[0].text.strip()}
    
    return list(await asyncio.gather(*[classifica(doc) for doc in documenti]))
```

## Pattern: Fan-Out / Fan-In

Un pattern comune negli agenti è il **fan-out/fan-in**: un orchestratore distribuisce il lavoro a più agenti specializzati (fan-out), raccoglie i risultati (fan-in), e li combina in una risposta finale. Vedi l'approfondimento per un esempio completo.

## Quando NON Usare l'Async

L'async non è sempre la risposta giusta:

- **Script semplici**: se chiami l'LLM una volta sola, l'async aggiunge complessità inutile
- **CPU-bound tasks**: l'async di Python gestisce l'I/O concorrente, non il calcolo parallelo. Per operazioni CPU-intensive usa `multiprocessing`
- **Codice sincrono esistente**: integrare async in una codebase completamente sincrona è spesso più costoso dei benefici

Usa l'async quando hai **I/O-bound operations** (chiamate di rete, lettura di file) che possono essere sovrapposte.

---

## Esercizi Pratici

> Tre esercizi a difficoltà crescente. Prova a risolverli da solo prima di aprire il suggerimento.

### Esercizio 1 — Paragone Sync vs Async 🟢 Base

Scrivi due versioni della stessa funzione che fa 5 chiamate a Claude con domande diverse: una sincrona, una asincrona. Misura il tempo di esecuzione di entrambe e calcola lo speedup ottenuto.

<details>
<summary>💡 Mostra suggerimento</summary>

**Struttura delle due versioni:**

```python
# Versione sincrona
def versione_sincrona(domande: list[str]) -> list[str]:
    risultati = []
    for domanda in domande:
        r = client_sync.messages.create(
            model="claude-haiku-4-5-20251001", max_tokens=50,
            messages=[{"role": "user", "content": domanda}]
        )
        risultati.append(r.content[0].text.strip())
    return risultati

# Versione asincrona
async def versione_asincrona(domande: list[str]) -> list[str]:
    async def chiedi(domanda):
        r = await client_async.messages.create(...)
        return r.content[0].text.strip()
    return list(await asyncio.gather(*[chiedi(d) for d in domande]))
```

Misura con `time.perf_counter()` e calcola `speedup = t_sync / t_async`.

</details>

---

### Esercizio 2 — Batch Processor con Rate Limiting 🟡 Intermedio

Scrivi un batch processor asincrono che elabora una lista di 50 testi (simulati) con un max di 10 richieste simultanee. Mostra una progress bar testuale durante l'esecuzione.

<details>
<summary>💡 Mostra suggerimento</summary>

**Struttura con semaforo e progress bar:**

```python
async def batch_processor(testi: list[str], max_concorrenti: int = 10) -> list[dict]:
    semaforo = asyncio.Semaphore(max_concorrenti)
    totale = len(testi)
    completati = 0
    
    async def con_progresso(testo):
        nonlocal completati
        async with semaforo:
            risposta = await client.messages.create(...)
        completati += 1
        barra = "█" * (completati * 20 // totale) + "░" * (20 - completati * 20 // totale)
        print(f"\r[{barra}] {completati}/{totale}", end="", flush=True)
        return {"testo": testo[:30], "risultato": risposta.content[0].text.strip()}
    
    risultati = await asyncio.gather(*[con_progresso(t) for t in testi])
    print()  # newline dopo la barra
    return list(risultati)
```

</details>

---

### Esercizio 3 — Pipeline Multi-Stage 🔴 Avanzato

Costruisci una pipeline asincrona a 3 stage per analizzare un corpus di articoli: **Stage 1** (parallelo): estrai le keyword da ogni articolo; **Stage 2** (parallelo): classifica ogni articolo in una categoria basandoti sulle keyword; **Stage 3** (sequenziale): genera un report finale che riassume le statistiche del corpus. Usa `asyncio.Queue` per passare dati tra gli stage.

<details>
<summary>💡 Mostra suggerimento</summary>

**Struttura della pipeline con Queue:**

```python
from dataclasses import dataclass, field

@dataclass
class Articolo:
    id: int
    testo: str
    keywords: list[str] = field(default_factory=list)
    categoria: str = ""

async def stage1(articolo, queue_out):
    # Chiama LLM per estrarre keywords
    # articolo.keywords = [...]
    await queue_out.put(articolo)

async def stage2(queue_in, queue_out, n_articoli):
    processati = 0
    while processati < n_articoli:
        articolo = await queue_in.get()
        # Chiama LLM per classificare basandosi su keywords
        # articolo.categoria = "..."
        await queue_out.put(articolo)
        processati += 1

async def stage3(queue, n_articoli) -> str:
    articoli = []
    while len(articoli) < n_articoli:
        articoli.append(await queue.get())
    # Calcola statistiche e chiama LLM per il report
    return report

async def pipeline(articoli):
    q1, q2 = asyncio.Queue(), asyncio.Queue()
    n = len(articoli)
    
    await asyncio.gather(*[stage1(a, q1) for a in articoli])
    await stage2(q1, q2, n)
    report = await stage3(q2, n)
    return report
```

</details>

---

<details>
<summary>⚙️ Approfondimento Avanzato</summary>

### Pattern Fan-Out / Fan-In Completo

```python
import asyncio
import anthropic

client = anthropic.AsyncAnthropic()

async def agente_specializzato(ruolo: str, system: str, query: str) -> str:
    risposta = await client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=300,
        system=system,
        messages=[{"role": "user", "content": query}]
    )
    return risposta.content[0].text

async def multi_agente(query: str) -> str:
    agenti = {
        "tecnico":  "Sei un esperto tecnico. Analizza gli aspetti tecnici della domanda.",
        "business": "Sei un consulente business. Analizza le implicazioni commerciali.",
        "rischi":   "Sei un risk manager. Identifica i rischi principali.",
    }
    
    # Fan-out: lancia tutti gli agenti in parallelo
    risultati = await asyncio.gather(*[
        agente_specializzato(ruolo, system, query)
        for ruolo, system in agenti.items()
    ])
    contributi = dict(zip(agenti.keys(), risultati))
    
    # Fan-in: sintetizza con un agente finale
    contesto = "\n\n".join([f"**{r}**: {t}" for r, t in contributi.items()])
    sintesi = await client.messages.create(
        model="claude-haiku-4-5-20251001", max_tokens=500,
        system="Sintetizza i contributi degli esperti in una risposta coerente e concisa.",
        messages=[{"role": "user", "content": f"Domanda: {query}\n\nContributi:\n{contesto}"}]
    )
    return sintesi.content[0].text

risposta = asyncio.run(multi_agente("Dovremmo adottare un LLM per il customer service?"))
print(risposta)
```

### Gestire gli Errori nella Concorrenza

```python
async def chiama_con_fallback(query: str, modello: str) -> str | Exception:
    try:
        risposta = await client.messages.create(
            model=modello, max_tokens=100,
            messages=[{"role": "user", "content": query}]
        )
        return risposta.content[0].text
    except anthropic.APIError as e:
        return e  # restituisce l'eccezione invece di propagarla

async def chiama_robusto(query: str) -> list:
    risultati = await asyncio.gather(
        chiama_con_fallback(query, "claude-haiku-4-5-20251001"),
        chiama_con_fallback(query, "claude-sonnet-4-6"),
        return_exceptions=True  # non annullare gli altri se uno fallisce
    )
    successi = [r for r in risultati if not isinstance(r, Exception)]
    if not successi:
        raise RuntimeError("Tutti i modelli hanno fallito")
    return successi
```

### Async in FastAPI

```python
from fastapi import FastAPI
import anthropic, asyncio

app = FastAPI()
client = anthropic.AsyncAnthropic()

@app.post("/analizza")
async def analizza(body: dict) -> dict:
    testo = body["testo"]
    sentiment, lingua, riassunto = await asyncio.gather(
        client.messages.create(model="claude-haiku-4-5-20251001", max_tokens=20,
            messages=[{"role": "user", "content": f"Sentiment (una parola): {testo}"}]),
        client.messages.create(model="claude-haiku-4-5-20251001", max_tokens=20,
            messages=[{"role": "user", "content": f"Lingua (una parola): {testo}"}]),
        client.messages.create(model="claude-haiku-4-5-20251001", max_tokens=100,
            messages=[{"role": "user", "content": f"Riassumi in una frase: {testo}"}]),
    )
    return {
        "sentiment": sentiment.content[0].text,
        "lingua": lingua.content[0].text,
        "riassunto": riassunto.content[0].text,
    }
```

</details>

---

## Connessioni

- **Lezione precedente**: [Sicurezza e Prompt Injection](06-07-sicurezza-prompt-injection) — gli agenti concorrenti amplificano la superficie di attacco: ogni agente parallelo può essere vettore di injection
- **Capitolo 5**: [Streaming e UX Real-Time](../capitolo-05-strumenti-infrastruttura/05-10-streaming-ux-realtime) — lo streaming in FastAPI usa già async internamente
- **Capitolo 8**: [Progettare un Workflow](../capitolo-08-workflow-multi-agente/08-01-progettare-workflow) — i pattern fan-out/fan-in di questa lezione sono la base dei workflow multi-agente
- **Capitolo 8**: [Deployment e Ambienti](../capitolo-08-workflow-multi-agente/08-07-deployment) — i worker asincroni sono la forma più efficiente di deployment per agenti ad alto throughput
