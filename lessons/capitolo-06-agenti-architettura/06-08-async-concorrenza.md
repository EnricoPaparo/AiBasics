---
titolo: "Async e Concorrenza negli Agenti"
durata_stimata: "25 min"
difficolta: "Avanzato"
---

# Async e Concorrenza negli Agenti

Un agente che chiama un LLM aspetta. Un agente che chiama 5 tool aspetta 5 volte. Se ogni chiamata richiede 2 secondi, un agente sequenziale impiega 10 secondi per completare quello che un agente concorrente fa in 2. In questa lezione impari a costruire agenti veloci usando `async/await` e la concorrenza in Python.

## Il Problema della Latenza Sequenziale

Considera un agente che deve rispondere a una domanda raccogliendo informazioni da fonti diverse:

```python
# Approccio sequenziale — LENTO
def ricerca_completa(query: str) -> dict:
    meteo = cerca_meteo(query)      # 1.2s
    notizie = cerca_notizie(query)  # 0.8s
    wiki = cerca_wikipedia(query)   # 1.5s
    # Totale: ~3.5 secondi
    return {"meteo": meteo, "notizie": notizie, "wiki": wiki}
```

Queste tre chiamate sono **indipendenti** — non hanno bisogno del risultato delle altre per partire. Possono essere eseguite in parallelo:

```python
# Approccio concorrente — VELOCE
async def ricerca_completa_async(query: str) -> dict:
    meteo, notizie, wiki = await asyncio.gather(
        cerca_meteo_async(query),
        cerca_notizie_async(query),
        cerca_wikipedia_async(query),
    )
    # Totale: ~1.5 secondi (il più lento dei tre)
    return {"meteo": meteo, "notizie": notizie, "wiki": wiki}
```

## Basi di async/await in Python

`async/await` è il meccanismo Python per la programmazione asincrona. L'idea chiave: invece di **bloccare** il thread mentre aspetti una risposta di rete, il programma **cede il controllo** e può fare altro nel frattempo.

```python
import asyncio

# Una funzione "normale" blocca il thread mentre aspetta
def funzione_bloccante():
    time.sleep(2)  # il thread è bloccato per 2 secondi
    return "fatto"

# Una funzione "async" restituisce immediatamente il controllo
async def funzione_asincrona():
    await asyncio.sleep(2)  # il thread può fare altro durante l'attesa
    return "fatto"

# Eseguire una funzione async
risultato = asyncio.run(funzione_asincrona())
```

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

async def analizza_testo(testo: str, tipo_analisi: str) -> str:
    """Esegue un tipo specifico di analisi su un testo."""
    prompt_map = {
        "sentiment": f"Analizza il sentiment di questo testo (positivo/negativo/neutro): {testo}",
        "lingua": f"Identifica la lingua di questo testo: {testo}",
        "keywords": f"Estrai le 3 parole chiave principali da: {testo}",
    }
    
    risposta = await client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=100,
        messages=[{"role": "user", "content": prompt_map[tipo_analisi]}]
    )
    return risposta.content[0].text.strip()

async def analisi_completa(testo: str) -> dict:
    """Esegue tutte le analisi in parallelo."""
    sentiment, lingua, keywords = await asyncio.gather(
        analizza_testo(testo, "sentiment"),
        analizza_testo(testo, "lingua"),
        analizza_testo(testo, "keywords"),
    )
    
    return {
        "sentiment": sentiment,
        "lingua": lingua,
        "keywords": keywords,
    }

# Esecuzione
testo = "This product is absolutely amazing! Best purchase I've made this year."
risultato = asyncio.run(analisi_completa(testo))
print(risultato)
```

## Elaborare Molti Item in Parallelo con Semafori

Se devi elaborare 100 documenti in parallelo, non vuoi lanciare 100 richieste API contemporaneamente — supereresti i rate limit. Usa un **semaforo** per limitare la concorrenza:

```python
import asyncio
import anthropic

client = anthropic.AsyncAnthropic()

async def classifica_documento(doc: str, semaforo: asyncio.Semaphore) -> dict:
    async with semaforo:  # max N chiamate simultanee
        risposta = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=50,
            messages=[{"role": "user", "content": f"Classifica in una parola: {doc[:200]}"}]
        )
        return {"doc": doc[:30], "categoria": risposta.content[0].text.strip()}

async def elabora_batch(documenti: list[str], max_concorrenti: int = 5) -> list[dict]:
    semaforo = asyncio.Semaphore(max_concorrenti)
    
    tasks = [classifica_documento(doc, semaforo) for doc in documenti]
    risultati = await asyncio.gather(*tasks)
    
    return list(risultati)

# Test con 20 documenti, max 5 simultanei
documenti = [f"Documento {i}: contenuto di esempio..." for i in range(20)]
risultati = asyncio.run(elabora_batch(documenti, max_concorrenti=5))
print(f"Elaborati {len(risultati)} documenti")
```

## Pattern: Fan-Out / Fan-In

Un pattern comune negli agenti è il **fan-out/fan-in**: un orchestratore distribuisce il lavoro a più agenti specializzati (fan-out), raccoglie i risultati (fan-in), e li combina in una risposta finale:

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

async def agente_sintetizzatore(query: str, contributi: dict) -> str:
    contesto = "\n\n".join([f"**{ruolo}**: {testo}" for ruolo, testo in contributi.items()])
    risposta = await client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=500,
        system="Sintetizza i contributi degli esperti in una risposta coerente e concisa.",
        messages=[{"role": "user", "content": f"Domanda originale: {query}\n\nContributi:\n{contesto}"}]
    )
    return risposta.content[0].text

async def multi_agente(query: str) -> str:
    agenti = {
        "tecnico": "Sei un esperto tecnico. Analizza gli aspetti tecnici della domanda.",
        "business": "Sei un consulente business. Analizza le implicazioni commerciali.",
        "rischi": "Sei un risk manager. Identifica i rischi principali.",
    }
    
    # Fan-out: lancia tutti gli agenti in parallelo
    tasks = {
        ruolo: agente_specializzato(ruolo, system, query)
        for ruolo, system in agenti.items()
    }
    
    risultati = await asyncio.gather(*tasks.values())
    contributi = dict(zip(tasks.keys(), risultati))
    
    # Fan-in: sintetizza
    sintesi = await agente_sintetizzatore(query, contributi)
    return sintesi

risposta = asyncio.run(multi_agente("Dovremmo adottare un LLM per il nostro customer service?"))
print(risposta)
```

## Gestire gli Errori nella Concorrenza

Quando una delle coroutine in `asyncio.gather()` fallisce, di default vengono annullate anche le altre. Usa `return_exceptions=True` per gestire gli errori individualmente:

```python
async def chiama_con_fallback(query: str, modello: str) -> str | Exception:
    try:
        risposta = await client.messages.create(
            model=modello,
            max_tokens=100,
            messages=[{"role": "user", "content": query}]
        )
        return risposta.content[0].text
    except anthropic.APIError as e:
        return e  # restituisce l'eccezione invece di propagarla

async def chiama_robusto(query: str) -> list:
    # Prova più modelli in parallelo, usa il primo che risponde
    risultati = await asyncio.gather(
        chiama_con_fallback(query, "claude-haiku-4-5-20251001"),
        chiama_con_fallback(query, "claude-sonnet-4-6"),
        return_exceptions=True  # non annullare gli altri se uno fallisce
    )
    
    successi = [r for r in risultati if not isinstance(r, Exception)]
    errori = [r for r in risultati if isinstance(r, Exception)]
    
    if not successi:
        raise RuntimeError(f"Tutti i modelli hanno fallito: {errori}")
    
    return successi
```

## Async in FastAPI

FastAPI è costruito su async — le route async vengono gestite in modo non bloccante:

```python
from fastapi import FastAPI
import anthropic
import asyncio

app = FastAPI()
client = anthropic.AsyncAnthropic()

@app.post("/analizza")
async def analizza(body: dict) -> dict:
    testo = body["testo"]
    
    # Queste 3 analisi vengono eseguite in parallelo
    sentiment, lingua, riassunto = await asyncio.gather(
        client.messages.create(
            model="claude-haiku-4-5-20251001", max_tokens=20,
            messages=[{"role": "user", "content": f"Sentiment (una parola): {testo}"}]
        ),
        client.messages.create(
            model="claude-haiku-4-5-20251001", max_tokens=20,
            messages=[{"role": "user", "content": f"Lingua (una parola): {testo}"}]
        ),
        client.messages.create(
            model="claude-haiku-4-5-20251001", max_tokens=100,
            messages=[{"role": "user", "content": f"Riassumi in una frase: {testo}"}]
        ),
    )
    
    return {
        "sentiment": sentiment.content[0].text,
        "lingua": lingua.content[0].text,
        "riassunto": riassunto.content[0].text,
    }
```

## Quando NON Usare l'Async

L'async non è sempre la risposta giusta:

- **Script semplici**: se chiami l'LLM una volta sola, l'async aggiunge complessità inutile
- **CPU-bound tasks**: l'async di Python gestisce l'I/O concorrente, non il calcolo parallelo. Per operazioni CPU-intensive usa `multiprocessing`
- **Codice sincrono esistente**: integrare async in una codebase completamente sincrona è spesso più costoso dei benefici

Usa l'async quando hai **I/O-bound operations** (chiamate di rete, lettura di file) che possono essere sovrapposte.

---

## Esercizi Pratici

> Tre esercizi a difficoltà crescente. Prova a risolverli da solo prima di aprire la soluzione.

### Esercizio 1 — Paragone Sync vs Async 🟢 Base

Scrivi due versioni della stessa funzione che fa 5 chiamate a Claude con domande diverse: una sincrona, una asincrona. Misura il tempo di esecuzione di entrambe e calcola il speedup ottenuto.

<details>
<summary>💡 Mostra soluzione</summary>

```python
import anthropic
import asyncio
import time

client_sync = anthropic.Anthropic()
client_async = anthropic.AsyncAnthropic()

DOMANDE = [
    "Cos'è Python in una frase?",
    "Cos'è JavaScript in una frase?",
    "Cos'è Rust in una frase?",
    "Cos'è Go in una frase?",
    "Cos'è TypeScript in una frase?",
]

def versione_sincrona():
    risultati = []
    for domanda in DOMANDE:
        r = client_sync.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=50,
            messages=[{"role": "user", "content": domanda}]
        )
        risultati.append(r.content[0].text.strip())
    return risultati

async def versione_asincrona():
    async def chiedi(domanda):
        r = await client_async.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=50,
            messages=[{"role": "user", "content": domanda}]
        )
        return r.content[0].text.strip()
    
    return await asyncio.gather(*[chiedi(d) for d in DOMANDE])

# Misura
inizio = time.perf_counter()
r_sync = versione_sincrona()
t_sync = time.perf_counter() - inizio

inizio = time.perf_counter()
r_async = asyncio.run(versione_asincrona())
t_async = time.perf_counter() - inizio

print(f"Sincrono:  {t_sync:.2f}s")
print(f"Asincrono: {t_async:.2f}s")
print(f"Speedup:   {t_sync/t_async:.1f}x")
```

</details>

---

### Esercizio 2 — Batch Processor con Rate Limiting 🟡 Intermedio

Scrivi un batch processor asincrono che elabora una lista di 50 testi (simulati) con un max di 10 richieste simultanee e un delay di 100ms tra i batch per rispettare il rate limit. Mostra una progress bar testuale durante l'esecuzione.

<details>
<summary>💡 Mostra soluzione</summary>

```python
import asyncio
import anthropic
import time

client = anthropic.AsyncAnthropic()

async def elabora_testo(testo: str, semaforo: asyncio.Semaphore) -> dict:
    async with semaforo:
        await asyncio.sleep(0.1)  # simula delay rate limit
        risposta = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=20,
            messages=[{"role": "user", "content": f"Sentiment (1 parola): {testo}"}]
        )
        return {"testo": testo[:30], "sentiment": risposta.content[0].text.strip()}

async def batch_processor(testi: list[str], max_concorrenti: int = 10) -> list[dict]:
    semaforo = asyncio.Semaphore(max_concorrenti)
    totale = len(testi)
    completati = 0
    
    async def con_progresso(testo):
        nonlocal completati
        risultato = await elabora_testo(testo, semaforo)
        completati += 1
        barra = "█" * (completati * 20 // totale) + "░" * (20 - completati * 20 // totale)
        print(f"\r[{barra}] {completati}/{totale}", end="", flush=True)
        return risultato
    
    risultati = await asyncio.gather(*[con_progresso(t) for t in testi])
    print()  # newline dopo la progress bar
    return list(risultati)

# Test con 50 testi simulati
testi = [
    f"Testo di esempio numero {i}. " + ("Ottimo prodotto!" if i % 3 == 0 else "Pessima esperienza." if i % 3 == 1 else "Nella media.")
    for i in range(1, 51)
]

inizio = time.perf_counter()
risultati = asyncio.run(batch_processor(testi))
durata = time.perf_counter() - inizio

print(f"\nElaborati {len(risultati)} testi in {durata:.1f}s")
positivi = sum(1 for r in risultati if "positiv" in r["sentiment"].lower() or "ottim" in r["sentiment"].lower())
print(f"Positivi: {positivi}, Negativi: {len(risultati)-positivi}")
```

</details>

---

### Esercizio 3 — Pipeline Multi-Stage 🔴 Avanzato

Costruisci una pipeline asincrona a 3 stage per analizzare un corpus di articoli: **Stage 1** (parallelo): estrai le keyword da ogni articolo; **Stage 2** (parallelo per gruppo): classifica ogni articolo in una categoria basandoti sulle keyword; **Stage 3** (sequenziale): genera un report finale che riassume le statistiche del corpus. Usa `asyncio.Queue` per passare dati tra gli stage.

<details>
<summary>💡 Mostra soluzione</summary>

```python
import asyncio
import anthropic
from dataclasses import dataclass

client = anthropic.AsyncAnthropic()

@dataclass
class Articolo:
    id: int
    testo: str
    keywords: list[str] = None
    categoria: str = None

ARTICOLI = [
    Articolo(1, "Il governo approva nuove misure fiscali per le piccole imprese"),
    Articolo(2, "La squadra vince il campionato dopo 15 anni"),
    Articolo(3, "Nuova scoperta scientifica sui buchi neri"),
    Articolo(4, "Mercato azionario in rialzo dopo dati economici positivi"),
    Articolo(5, "La nazionale di calcio si qualifica per i mondiali"),
    Articolo(6, "Ricercatori sviluppano nuovo farmaco contro il diabete"),
]

async def stage1_estrai_keywords(articolo: Articolo, queue: asyncio.Queue):
    r = await client.messages.create(
        model="claude-haiku-4-5-20251001", max_tokens=50,
        messages=[{"role": "user", "content": f"3 keyword (virgola-separato): {articolo.testo}"}]
    )
    articolo.keywords = [k.strip() for k in r.content[0].text.split(",")]
    await queue.put(articolo)
    print(f"  Stage1 [art.{articolo.id}]: {articolo.keywords}")

async def stage2_classifica(queue_in: asyncio.Queue, queue_out: asyncio.Queue, n_articoli: int):
    processati = 0
    while processati < n_articoli:
        articolo = await queue_in.get()
        r = await client.messages.create(
            model="claude-haiku-4-5-20251001", max_tokens=20,
            messages=[{"role": "user", "content": f"Categoria (Politica/Sport/Scienza/Economia): keywords={articolo.keywords}"}]
        )
        articolo.categoria = r.content[0].text.strip()
        print(f"  Stage2 [art.{articolo.id}]: {articolo.categoria}")
        await queue_out.put(articolo)
        processati += 1

async def stage3_report(queue: asyncio.Queue, n_articoli: int) -> str:
    articoli = []
    while len(articoli) < n_articoli:
        articolo = await queue.get()
        articoli.append(articolo)
    
    statistiche = {}
    for a in articoli:
        statistiche[a.categoria] = statistiche.get(a.categoria, 0) + 1
    
    r = await client.messages.create(
        model="claude-haiku-4-5-20251001", max_tokens=200,
        messages=[{"role": "user", "content": f"Genera un report in 3 righe sulle statistiche del corpus: {statistiche}"}]
    )
    return r.content[0].text

async def pipeline():
    q1 = asyncio.Queue()
    q2 = asyncio.Queue()
    n = len(ARTICOLI)
    
    print("Stage 1: estrazione keyword (parallelo)")
    await asyncio.gather(*[stage1_estrai_keywords(a, q1) for a in ARTICOLI])
    
    print("\nStage 2: classificazione (parallelo)")
    await stage2_classifica(q1, q2, n)
    
    print("\nStage 3: report finale")
    report = await stage3_report(q2, n)
    print(f"\n{report}")

asyncio.run(pipeline())
```

</details>

---

## Connessioni

- **Lezione precedente**: [Sicurezza e Prompt Injection](06-07-sicurezza-prompt-injection) — gli agenti concorrenti amplificano la superficie di attacco: ogni agente parallelo può essere vettore di injection
- **Capitolo 5**: [Streaming e UX Real-Time](../capitolo-05-strumenti-infrastruttura/05-10-streaming-ux-realtime) — lo streaming in FastAPI usa già async internamente
- **Capitolo 8**: [Progettare un Workflow](../capitolo-08-workflow-multi-agente/08-01-progettare-workflow) — i pattern fan-out/fan-in di questa lezione sono la base dei workflow multi-agente
- **Capitolo 8**: [Deployment e Ambienti](../capitolo-08-workflow-multi-agente/08-07-deployment) — i worker asincroni sono la forma più efficiente di deployment per agenti ad alto throughput
