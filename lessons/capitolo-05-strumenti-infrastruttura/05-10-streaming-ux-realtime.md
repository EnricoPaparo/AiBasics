---
titolo: "Streaming e UX Real-Time"
durata_stimata: "20 min"
difficolta: "Intermedio"
---

# Streaming e UX Real-Time

Ogni chatbot AI che hai usato — ChatGPT, Claude, Gemini — mostra le parole mentre vengono generate. Non aspetta che la risposta sia completa per mostrarla tutta insieme. Questo si chiama **streaming** ed è oggi lo standard per qualsiasi interfaccia AI. In questa lezione impari come implementarlo.

## Perché lo Streaming È Importante

Senza streaming, l'utente aspetta in silenzio mentre il modello genera la risposta. Con una risposta da 500 token (circa 2-3 secondi), il silenzio è accettabile. Con una risposta da 2000 token (15-20 secondi), è insopportabile.

```
Senza streaming:
utente  ──── invia domanda ────►
                                 [15 secondi di silenzio]
utente  ◄────── risposta completa ────

Con streaming:
utente  ──── invia domanda ────►
utente  ◄── "La" ──
utente  ◄── "risposta" ──
utente  ◄── "arriva" ──
utente  ◄── "mentre" ──
utente  ◄── "viene" ──
utente  ◄── "generata..." ──
```

Lo streaming migliora la **perceived performance**: l'utente inizia a leggere dopo 200-500ms invece di aspettare 15 secondi. La risposta totale è la stessa, ma la percezione è completamente diversa.

## Streaming con l'SDK Anthropic

L'SDK Anthropic offre streaming nativo. La differenza rispetto alla chiamata standard è nel metodo usato:

```python
import anthropic

client = anthropic.Anthropic()

# SENZA streaming — aspetta la risposta completa
risposta = client.messages.create(
    model="claude-opus-4-8",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Spiega il machine learning"}]
)
print(risposta.content[0].text)  # tutto insieme alla fine

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

```python
# Livello 1: solo testo (più semplice)
with client.messages.stream(...) as stream:
    for testo in stream.text_stream:
        print(testo, end="", flush=True)

# Livello 2: eventi raw (più controllo)
with client.messages.stream(...) as stream:
    for evento in stream:
        if evento.type == "content_block_delta":
            if evento.delta.type == "text_delta":
                print(evento.delta.text, end="", flush=True)
        elif evento.type == "message_stop":
            print()  # fine risposta

# Livello 3: messaggio completo alla fine
with client.messages.stream(...) as stream:
    for testo in stream.text_stream:
        print(testo, end="", flush=True)
    
    messaggio_finale = stream.get_final_message()
    print(f"\n\nToken usati: {messaggio_finale.usage.output_tokens}")
```

## Streaming in un'Applicazione Web

Nella maggior parte dei casi reali, il tuo backend serve una web app. Lo streaming usa **Server-Sent Events (SSE)** — un protocollo HTTP che permette al server di inviare dati al browser in modo continuo.

### Backend con FastAPI

```python
# backend/main.py
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import anthropic
import json

app = FastAPI()
client = anthropic.Anthropic()

@app.post("/chat")
async def chat(body: dict):
    domanda = body["domanda"]
    
    def genera_stream():
        with client.messages.stream(
            model="claude-opus-4-8",
            max_tokens=1024,
            messages=[{"role": "user", "content": domanda}]
        ) as stream:
            for testo in stream.text_stream:
                # Formato SSE: "data: {...}\n\n"
                chunk = json.dumps({"tipo": "testo", "contenuto": testo})
                yield f"data: {chunk}\n\n"
            
            # Segnala la fine
            yield f"data: {json.dumps({'tipo': 'fine'})}\n\n"
    
    return StreamingResponse(
        genera_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # disabilita buffering nginx
        }
    )
```

### Frontend JavaScript

```javascript
// frontend/chat.js
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
        
        // Processa le righe SSE complete
        const righe = buffer.split("\n\n");
        buffer = righe.pop();  // l'ultima riga potrebbe essere incompleta
        
        for (const riga of righe) {
            if (!riga.startsWith("data: ")) continue;
            const dati = JSON.parse(riga.slice(6));
            
            if (dati.tipo === "testo") {
                // Aggiorna il DOM con il nuovo testo
                document.getElementById("risposta").textContent += dati.contenuto;
            } else if (dati.tipo === "fine") {
                console.log("Stream completato");
            }
        }
    }
}
```

## Streaming con Tool Use

Quando l'agente usa tool (vedi lezione 05-04), lo streaming diventa più complesso: i tool vengono eseguiti in mezzo alla risposta.

```python
import anthropic
import json

client = anthropic.Anthropic()

strumenti = [{
    "name": "cerca_meteo",
    "description": "Recupera le previsioni meteo per una città",
    "input_schema": {
        "type": "object",
        "properties": {
            "citta": {"type": "string", "description": "Nome della città"}
        },
        "required": ["citta"]
    }
}]

def cerca_meteo(citta: str) -> str:
    return f"A {citta}: 22°C, soleggiato"  # simulato

messaggi = [{"role": "user", "content": "Che tempo fa a Milano?"}]

while True:
    testo_accumulato = ""
    tool_calls = []
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
        # Esegui i tool e continua
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
        # Continua il loop per la risposta dopo il tool
```

## Pattern UX per lo Streaming

Alcune pratiche che migliorano l'esperienza utente:

**Indicatore di pensiero** — mostra che il modello sta elaborando prima che inizi lo streaming:
```javascript
// Mostra un cursore lampeggiante mentre si attende il primo token
document.getElementById("risposta").innerHTML = '<span class="cursor">▌</span>';
```

**Markdown rendering progressivo** — il testo in streaming spesso contiene markdown. Renderizzarlo token per token crea glitch visivi (apertura di `**` senza chiusura). Soluzioni:
- Rendi plain text durante lo stream, poi renderizza markdown alla fine
- Usa una libreria come `marked` con rendering incrementale
- Aggiorna il DOM ogni N token (non ad ogni singolo carattere)

**Gestione degli errori** — lo stream può interrompersi:
```python
try:
    with client.messages.stream(...) as stream:
        for testo in stream.text_stream:
            yield testo
except anthropic.APIStatusError as e:
    yield f"\n[Errore: {e.message}]"
```

**Abort dello stream** — permetti all'utente di interrompere:
```javascript
const controller = new AbortController();

// Pulsante stop
document.getElementById("stop").onclick = () => controller.abort();

const risposta = await fetch("/chat", {
    signal: controller.signal,
    ...
});
```

---

## Esercizi Pratici

> Tre esercizi a difficoltà crescente. Prova a risolverli da solo prima di aprire la soluzione.

### Esercizio 1 — Streaming Base in CLI 🟢 Base

Implementa una chat CLI che: (a) legge l'input dell'utente in un loop, (b) invia la domanda a Claude con streaming, (c) mostra i token man mano che arrivano, (d) mantiene la storia della conversazione tra un messaggio e l'altro.

<details>
<summary>💡 Mostra soluzione</summary>

```python
import anthropic
from dotenv import load_dotenv

load_dotenv()
client = anthropic.Anthropic()

def chat_cli():
    print("Chat con Claude (streaming). Scrivi 'exit' per uscire.\n")
    storia = []
    
    while True:
        utente = input("Tu: ").strip()
        if utente.lower() == "exit":
            break
        if not utente:
            continue
        
        storia.append({"role": "user", "content": utente})
        
        print("Claude: ", end="", flush=True)
        risposta_completa = ""
        
        with client.messages.stream(
            model="claude-haiku-4-5-20251001",
            max_tokens=1024,
            messages=storia
        ) as stream:
            for testo in stream.text_stream:
                print(testo, end="", flush=True)
                risposta_completa += testo
        
        print("\n")
        storia.append({"role": "assistant", "content": risposta_completa})

if __name__ == "__main__":
    chat_cli()
```

</details>

---

### Esercizio 2 — Misurare il Time-to-First-Token 🟡 Intermedio

Aggiungi misurazione delle performance al tuo script di streaming: misura il **time-to-first-token** (TTFT, quanto tempo passa tra l'invio della richiesta e il primo token ricevuto) e il **throughput** (token al secondo durante la generazione). Stampa queste metriche alla fine di ogni risposta.

<details>
<summary>💡 Mostra soluzione</summary>

```python
import anthropic
import time
from dotenv import load_dotenv

load_dotenv()
client = anthropic.Anthropic()

def chat_con_metriche(domanda: str):
    print(f"Domanda: {domanda}\n")
    print("Risposta: ", end="", flush=True)
    
    inizio = time.perf_counter()
    primo_token_time = None
    contatore_token = 0
    
    with client.messages.stream(
        model="claude-haiku-4-5-20251001",
        max_tokens=1024,
        messages=[{"role": "user", "content": domanda}]
    ) as stream:
        for testo in stream.text_stream:
            if primo_token_time is None:
                primo_token_time = time.perf_counter()
            print(testo, end="", flush=True)
            contatore_token += len(testo.split())  # approssimazione
        
        messaggio_finale = stream.get_final_message()
    
    fine = time.perf_counter()
    
    ttft = primo_token_time - inizio
    durata_totale = fine - inizio
    output_tokens = messaggio_finale.usage.output_tokens
    throughput = output_tokens / (fine - primo_token_time) if primo_token_time else 0
    
    print(f"\n\n{'─'*40}")
    print(f"⏱  Time-to-first-token: {ttft:.2f}s")
    print(f"📊 Throughput: {throughput:.1f} token/s")
    print(f"🔢 Token generati: {output_tokens}")
    print(f"⏰ Durata totale: {durata_totale:.2f}s")

chat_con_metriche("Scrivi una breve storia di 3 paragrafi su un robot che impara a cucinare.")
```

</details>

---

### Esercizio 3 — Backend SSE con FastAPI 🔴 Avanzato

Costruisci un'API REST con FastAPI che espone un endpoint `/stream` che accetta una domanda e restituisce la risposta in streaming SSE. Includi: gestione degli errori (timeout, errori API), header CORS per permettere chiamate dal browser, un endpoint `/health` per verificare che il servizio sia attivo. Scrivi anche il frontend HTML/JS minimale per consumare lo stream.

<details>
<summary>💡 Mostra soluzione</summary>

```python
# main.py
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import anthropic
import json
from dotenv import load_dotenv

load_dotenv()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In produzione: specifica i domini
    allow_methods=["*"],
    allow_headers=["*"],
)

client = anthropic.Anthropic()

class ChatRequest(BaseModel):
    domanda: str

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/stream")
async def stream_chat(body: ChatRequest):
    if not body.domanda.strip():
        raise HTTPException(status_code=400, detail="Domanda vuota")
    
    def genera():
        try:
            with client.messages.stream(
                model="claude-haiku-4-5-20251001",
                max_tokens=1024,
                messages=[{"role": "user", "content": body.domanda}]
            ) as stream:
                for testo in stream.text_stream:
                    data = json.dumps({"tipo": "testo", "contenuto": testo})
                    yield f"data: {data}\n\n"
                yield f"data: {json.dumps({'tipo': 'fine'})}\n\n"
        except anthropic.APIError as e:
            data = json.dumps({"tipo": "errore", "messaggio": str(e)})
            yield f"data: {data}\n\n"
    
    return StreamingResponse(
        genera(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    )
```

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <title>Chat SSE</title>
    <style>
        body { font-family: sans-serif; max-width: 600px; margin: 40px auto; padding: 0 20px; }
        textarea { width: 100%; padding: 8px; box-sizing: border-box; }
        #risposta { white-space: pre-wrap; border: 1px solid #ccc; padding: 12px; min-height: 100px; }
        button { margin-top: 8px; padding: 8px 16px; cursor: pointer; }
    </style>
</head>
<body>
    <h1>Chat SSE</h1>
    <textarea id="domanda" rows="3" placeholder="Scrivi la tua domanda..."></textarea>
    <button onclick="invia()">Invia</button>
    <button onclick="abort()">Stop</button>
    <div id="risposta"></div>

    <script>
        let reader = null;
        
        async function invia() {
            const domanda = document.getElementById("domanda").value.trim();
            if (!domanda) return;
            
            const el = document.getElementById("risposta");
            el.textContent = "";
            
            const risposta = await fetch("http://localhost:8000/stream", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ domanda })
            });
            
            reader = risposta.body.getReader();
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
                    if (dati.tipo === "testo") el.textContent += dati.contenuto;
                    if (dati.tipo === "errore") el.textContent += `\nErrore: ${dati.messaggio}`;
                }
            }
        }
        
        function abort() {
            if (reader) { reader.cancel(); reader = null; }
        }
    </script>
</body>
</html>
```

```bash
pip install fastapi uvicorn anthropic python-dotenv
uvicorn main:app --reload
# Apri index.html nel browser
```

</details>

---

## Connessioni

- **Lezione precedente**: [Struttura di un Progetto Python Reale](05-09-struttura-progetto-python) — organizza il codice dello streaming in moduli
- **Capitolo 4**: [Gestire il Contesto](../capitolo-04-llm/04-07-gestire-il-contesto) — con streaming puoi mostrare all'utente il processo di ragionamento del modello
- **Capitolo 6**: [L'Harness](../capitolo-06-agenti-architettura/06-06-harness) — l'harness di un agente può usare streaming per mostrare i tool call in tempo reale
- **Capitolo 8**: [Deployment e Ambienti](../capitolo-08-workflow-multi-agente/08-07-deployment) — il backend SSE va deployato tenendo conto del timeout delle connessioni long-lived
