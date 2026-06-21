---
titolo: "Streaming e UX Real-Time"
durata_stimata: "20 min"
difficolta: "Intermedio"
---

# Streaming e UX Real-Time

Ogni chatbot AI che hai usato — ChatGPT, Claude, Gemini — mostra le parole mentre vengono generate. Non aspetta che la risposta sia completa per mostrarla tutta insieme. Questo si chiama **streaming** ed è oggi lo standard per qualsiasi interfaccia AI. In questa lezione impari come implementarlo.

## Perché lo Streaming È Importante

Senza streaming, l'utente aspetta in silenzio mentre il modello genera la risposta. Con una risposta da 500 token (circa 2-3 secondi), il silenzio è accettabile. Con una risposta da 2000 token (15-20 secondi), è insopportabile.

Lo streaming migliora la **perceived performance**: l'utente inizia a leggere dopo 200-500ms invece di aspettare 15 secondi. La risposta totale è la stessa, ma la percezione è completamente diversa.

## Streaming con l'SDK Anthropic

```python
import anthropic

client = anthropic.Anthropic()

# CON streaming — ricevi i token man mano
with client.messages.stream(
    model="claude-opus-4-8",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Spiega il machine learning"}]
) as stream:
    for testo in stream.text_stream:
        print(testo, end="", flush=True)  # flush=True forza l'output immediato
print()  # newline finale
```

Il `flush=True` è importante: senza di esso Python bufferizza l'output e lo stampa tutto insieme alla fine, vanificando lo streaming.

## Gestire gli Eventi dello Stream

Lo stream genera diversi tipi di eventi. Puoi accedervi a diversi livelli di dettaglio:

- **Livello 1** (solo testo): `for testo in stream.text_stream` — il più semplice
- **Livello 2** (eventi raw): itera su `stream` e controlla `evento.type == "content_block_delta"`
- **Livello 3** (messaggio finale): dopo il loop usa `stream.get_final_message()` per ottenere statistiche di utilizzo

## Streaming in un'Applicazione Web

Nella maggior parte dei casi reali, il tuo backend serve una web app. Lo streaming usa **Server-Sent Events (SSE)** — un protocollo HTTP che permette al server di inviare dati al browser in modo continuo.

### Backend con FastAPI

```python
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import anthropic, json

app = FastAPI()
client = anthropic.Anthropic()

@app.post("/chat")
async def chat(body: dict):
    def genera_stream():
        with client.messages.stream(
            model="claude-opus-4-8",
            max_tokens=1024,
            messages=[{"role": "user", "content": body["domanda"]}]
        ) as stream:
            for testo in stream.text_stream:
                chunk = json.dumps({"tipo": "testo", "contenuto": testo})
                yield f"data: {chunk}\n\n"
            yield f"data: {json.dumps({'tipo': 'fine'})}\n\n"
    
    return StreamingResponse(genera_stream(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})
```

## Pattern UX per lo Streaming

Alcune pratiche che migliorano l'esperienza utente:

- **Indicatore di pensiero**: mostra un cursore lampeggiante mentre si attende il primo token
- **Markdown rendering progressivo**: il testo in streaming contiene markdown; renderizzarlo token per token crea glitch visivi. Aggiorna il DOM ogni N token, non ad ogni singolo carattere
- **Gestione degli errori**: avvolgi il loop in try/except per catturare `anthropic.APIStatusError`
- **Abort dello stream**: usa `AbortController` in JavaScript per permettere all'utente di interrompere

---

## Esercizi Pratici

> Tre esercizi a difficoltà crescente. Prova a risolverli da solo prima di aprire il suggerimento.

### Esercizio 1 — Streaming Base in CLI 🟢 Base

Implementa una chat CLI che: (a) legge l'input dell'utente in un loop, (b) invia la domanda a Claude con streaming, (c) mostra i token man mano che arrivano, (d) mantiene la storia della conversazione tra un messaggio e l'altro.

<details>
<summary>💡 Mostra suggerimento</summary>

**Struttura del loop:**
```python
storia = []
while True:
    utente = input("Tu: ").strip()
    if utente.lower() == "exit": break
    storia.append({"role": "user", "content": utente})
    
    print("Claude: ", end="", flush=True)
    risposta_completa = ""
    
    with client.messages.stream(model="claude-haiku-4-5-20251001",
                                 max_tokens=1024, messages=storia) as stream:
        for testo in stream.text_stream:
            print(testo, end="", flush=True)
            risposta_completa += testo
    
    print("\n")
    storia.append({"role": "assistant", "content": risposta_completa})
```

Ricorda di aggiungere sempre la risposta dell'assistente alla storia prima del prossimo giro.

</details>

---

### Esercizio 2 — Misurare il Time-to-First-Token 🟡 Intermedio

Aggiungi misurazione delle performance al tuo script di streaming: misura il **time-to-first-token** (TTFT, quanto tempo passa tra l'invio della richiesta e il primo token ricevuto) e il **throughput** (token al secondo durante la generazione). Stampa queste metriche alla fine di ogni risposta.

<details>
<summary>💡 Mostra suggerimento</summary>

**Metriche da calcolare:**
```python
inizio = time.perf_counter()
primo_token_time = None

with client.messages.stream(...) as stream:
    for testo in stream.text_stream:
        if primo_token_time is None:
            primo_token_time = time.perf_counter()  # registra il primo token
        print(testo, end="", flush=True)
    messaggio_finale = stream.get_final_message()

fine = time.perf_counter()
ttft = primo_token_time - inizio
output_tokens = messaggio_finale.usage.output_tokens
throughput = output_tokens / (fine - primo_token_time)
```

Stampa TTFT, throughput (token/s) e durata totale al termine.

</details>

---

### Esercizio 3 — Backend SSE con FastAPI 🔴 Avanzato

Costruisci un'API REST con FastAPI che espone un endpoint `/stream` che accetta una domanda e restituisce la risposta in streaming SSE. Includi: gestione degli errori (timeout, errori API), header CORS per permettere chiamate dal browser, un endpoint `/health` per verificare che il servizio sia attivo.

<details>
<summary>💡 Mostra suggerimento</summary>

**Struttura del backend:**
```python
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import anthropic, json

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"],
                   allow_methods=["*"], allow_headers=["*"])
client = anthropic.Anthropic()

class ChatRequest(BaseModel):
    domanda: str

@app.get("/health")
def health(): return {"status": "ok"}

@app.post("/stream")
async def stream_chat(body: ChatRequest):
    def genera():
        try:
            with client.messages.stream(...) as stream:
                for testo in stream.text_stream:
                    yield f"data: {json.dumps({'tipo': 'testo', 'contenuto': testo})}\n\n"
                yield f"data: {json.dumps({'tipo': 'fine'})}\n\n"
        except anthropic.APIError as e:
            yield f"data: {json.dumps({'tipo': 'errore', 'messaggio': str(e)})}\n\n"
    return StreamingResponse(genera(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache"})
```

Poi scrivi un `index.html` con un form e JavaScript che usa `fetch()` per consumare lo stream SSE, aggiornando il DOM token per token.

</details>

---

<details>
<summary>⚙️ Approfondimento Avanzato</summary>

### Streaming con Tool Use

Quando l'agente usa tool, lo streaming diventa più complesso: i tool vengono eseguiti in mezzo alla risposta.

```python
import anthropic, json

client = anthropic.Anthropic()

strumenti = [{
    "name": "cerca_meteo",
    "description": "Recupera le previsioni meteo per una città",
    "input_schema": {
        "type": "object",
        "properties": {"citta": {"type": "string"}},
        "required": ["citta"]
    }
}]

def cerca_meteo(citta: str) -> str:
    return f"A {citta}: 22°C, soleggiato"  # simulato

messaggi = [{"role": "user", "content": "Che tempo fa a Milano?"}]

while True:
    testo_accumulato = ""
    messaggio_finale = None
    
    with client.messages.stream(
        model="claude-opus-4-8",
        max_tokens=1024,
        tools=strumenti,
        messages=messaggi
    ) as stream:
        for evento in stream:
            if evento.type == "content_block_delta":
                if evento.delta.type == "text_delta":
                    print(evento.delta.text, end="", flush=True)
                    testo_accumulato += evento.delta.text
        messaggio_finale = stream.get_final_message()
    
    if messaggio_finale.stop_reason == "end_turn":
        break
    
    if messaggio_finale.stop_reason == "tool_use":
        messaggi.append({"role": "assistant", "content": messaggio_finale.content})
        risultati_tool = []
        for blocco in messaggio_finale.content:
            if blocco.type == "tool_use":
                print(f"\n[usando tool: {blocco.name}]")
                risultato = cerca_meteo(**blocco.input)
                risultati_tool.append({
                    "type": "tool_result",
                    "tool_use_id": blocco.id,
                    "content": risultato
                })
        messaggi.append({"role": "user", "content": risultati_tool})
```

### Frontend JavaScript completo

```javascript
async function inviaDomanda(domanda) {
    const risposta = await fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domanda })
    });
    
    const reader = risposta.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const righe = buffer.split("\n\n");
        buffer = righe.pop();
        
        for (const riga of righe) {
            if (!riga.startsWith("data: ")) continue;
            const dati = JSON.parse(riga.slice(6));
            if (dati.tipo === "testo") {
                document.getElementById("risposta").textContent += dati.contenuto;
            }
        }
    }
}
```

</details>

---

## Connessioni

- **Lezione precedente**: [Struttura di un Progetto Python Reale](05-09-struttura-progetto-python) — organizza il codice dello streaming in moduli
- **Capitolo 4**: [Gestire il Contesto](../capitolo-04-llm/04-07-gestire-il-contesto) — con streaming puoi mostrare all'utente il processo di ragionamento del modello
- **Capitolo 6**: [L'Harness](../capitolo-06-agenti-architettura/06-06-harness) — l'harness di un agente può usare streaming per mostrare i tool call in tempo reale
- **Capitolo 8**: [Deployment e Ambienti](../capitolo-08-workflow-multi-agente/08-07-deployment) — il backend SSE va deployato tenendo conto del timeout delle connessioni long-lived
