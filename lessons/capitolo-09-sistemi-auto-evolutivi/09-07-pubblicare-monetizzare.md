---
titolo: "Pubblicare e Monetizzare un Progetto AI"
durata_stimata: "20 min"
difficolta: "Intermedio"
---

# Pubblicare e Monetizzare un Progetto AI

Sai costruire agenti AI. Sai deployarli. Ma come trasformi un progetto tecnico in qualcosa che le persone usano — e magari pagano? Questa lezione copre le opzioni concrete per portare un progetto AI dal tuo computer al mondo, dalle piattaforme di distribuzione ai modelli di monetizzazione più comuni nel 2026.

## Dalla Demo al Prodotto: Le Domande Giuste

Prima di pensare alla monetizzazione, chiarisci tre cose:

**Chi è l'utente?** Un tool per sviluppatori (B2D), per aziende (B2B), o per consumatori finali (B2C) ha canali, pricing e prodotto completamente diversi.

**Qual è il valore unico?** "Un chatbot AI" non è abbastanza. "Un assistente che legge i tuoi contratti PDF e risponde a domande legali semplici in italiano" è un valore specifico misurabile.

**Qual è il costo marginale?** Ogni query all'LLM costa. Se vendi per €5/mese ma il costo API per utente è €8/mese, stai perdendo denaro. Calcola il costo prima di scegliere il pricing.

## Opzioni di Distribuzione

### 1. CLI/Script su PyPI

La via più veloce per raggiungere sviluppatori:

```bash
# Struttura per pubblicare su PyPI
mio-agente/
├── pyproject.toml
├── src/
│   └── mio_agente/
│       ├── __init__.py
│       └── cli.py
└── README.md
```

```toml
# pyproject.toml
[project]
name = "mio-agente-ai"
version = "0.1.0"
description = "Agente AI per analisi contratti"

[project.scripts]
mio-agente = "mio_agente.cli:main"  # comando CLI dopo installazione
```

```bash
# Pubblica su PyPI (richiede account su pypi.org)
pip install build twine
python -m build
twine upload dist/*

# Gli utenti installano con:
pip install mio-agente-ai
mio-agente analizza contratto.pdf
```

**Ideale per**: tool per sviluppatori, script di automazione, integrazioni.
**Monetizzazione**: difficile direttamente — considera una versione Pro a pagamento con feature avanzate.

### 2. Web App con Streamlit o Gradio

Per demo rapide e proof of concept con interfaccia grafica:

```python
# app.py con Streamlit
import streamlit as st
import anthropic

st.title("Analizzatore di Contratti AI")

uploaded_file = st.file_uploader("Carica il tuo contratto PDF", type="pdf")
domanda = st.text_input("Cosa vuoi sapere?")

if uploaded_file and domanda and st.button("Analizza"):
    with st.spinner("Analisi in corso..."):
        client = anthropic.Anthropic()
        testo_pdf = estrai_testo(uploaded_file)
        
        risposta = client.messages.create(
            model="claude-opus-4-8",
            max_tokens=1000,
            system=f"Sei un assistente legale. Analizza questo contratto:\n\n{testo_pdf}",
            messages=[{"role": "user", "content": domanda}]
        )
        st.write(risposta.content[0].text)
```

```bash
# Deploy gratuito su Streamlit Cloud
streamlit run app.py
# Poi: streamlit.io/cloud → deploy da GitHub
```

**Gradio** è alternativa popolare, preferita dalla community AI/ML:

```python
import gradio as gr

def analizza(file, domanda):
    # logica
    return risposta

demo = gr.Interface(fn=analizza, inputs=["file", "text"], outputs="text")
demo.launch()
# Deploy gratuito su Hugging Face Spaces
```

### 3. API as a Service

Esponi il tuo agente come API REST che altri sviluppatori possono integrare:

```python
# FastAPI con autenticazione via API key
from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import APIKeyHeader
import anthropic

app = FastAPI(title="Agente Analisi Contratti API")
api_key_header = APIKeyHeader(name="X-API-Key")

CHIAVI_VALIDE = {"key-utente-1": "piano-base", "key-utente-2": "piano-pro"}

async def verifica_api_key(key: str = Depends(api_key_header)):
    if key not in CHIAVI_VALIDE:
        raise HTTPException(status_code=403, detail="API key non valida")
    return CHIAVI_VALIDE[key]

@app.post("/analizza")
async def analizza(body: dict, piano: str = Depends(verifica_api_key)):
    max_tokens = 500 if piano == "piano-base" else 2000
    
    client = anthropic.Anthropic()
    risposta = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=max_tokens,
        messages=[{"role": "user", "content": body["testo"]}]
    )
    return {"risultato": risposta.content[0].text}
```

**Piattaforme per API as a Service**: Railway, Render, Fly.io per hosting; Stripe per i pagamenti; Lago o Stigg per usage-based billing.

### 4. Integrazione come Plugin/Extension

Portare il tuo agente dove gli utenti già lavorano:

- **VS Code Extension**: per tool per sviluppatori
- **Chrome Extension**: per tool che si integrano nel browser
- **Slack/Discord Bot**: per team collaboration
- **Zapier/Make Integration**: per automazione no-code

```python
# Esempio: Slack Bot con Bolt
from slack_bolt import App

app = App(token="xoxb-...", signing_secret="...")

@app.message("analizza")
def analizza_messaggio(message, say):
    testo = message["text"].replace("analizza", "").strip()
    risposta = chiedi_al_modello(testo)
    say(risposta)

if __name__ == "__main__":
    app.start(port=3000)
```

## Modelli di Monetizzazione

### Freemium

**Modello**: versione gratuita con limiti, versione a pagamento illimitata.

```
Gratis:    10 analisi/mese, max 5 pagine per documento
Pro €15/m: 100 analisi/mese, max 50 pagine, priorità
Business €49/m: illimitato, API access, support dedicato
```

**Pro**: acquisizione utenti più facile, diventi viral
**Contro**: devi mantenere due versioni, rischio di utenti gratis che costano

### Pay-per-Use

**Modello**: l'utente paga per quello che usa (come le API stesse).

```
€0.10 per analisi documento
€0.05 per domanda su documento già analizzato
€5.00 per 100 crediti (sconto volume)
```

**Implementazione con Stripe**:

```python
import stripe
stripe.api_key = "sk_..."

def addebita_uso(customer_id: str, n_analisi: int):
    stripe.billing.MeterEvent.create(
        event_name="analisi_documento",
        payload={"stripe_customer_id": customer_id, "value": str(n_analisi)}
    )
```

### Subscription SaaS

**Modello**: abbonamento mensile/annuale, il più comune per B2B.

Regola pratica per il pricing:
```
Costo API per utente/mese × 3 = prezzo minimo sostenibile
Costo API per utente/mese × 5-10 = pricing target

Se costo API = €2/utente/mese:
  Prezzo minimo = €6/mese
  Pricing target = €10-20/mese
```

### Marketplace e Affiliazione

Se non vuoi gestire l'infrastruttura, distribuisci su marketplace esistenti:
- **Anthropic Console** (per tool costruiti su Claude)
- **GPT Store** (per GPT personalizzati)
- **Hugging Face Spaces** (per demo e modelli)
- **Zapier Marketplace** (per automazioni)

## Aspetti Legali e di Compliance

Quando pubblichi un prodotto AI, considera:

**Termini d'uso dell'API**: Anthropic vieta certi usi (spam, disinformazione, contenuti illegali). Leggi le [usage policies](https://www.anthropic.com/legal/aup) prima di pubblicare.

**Privacy e GDPR**: se elabori dati di utenti EU, hai obblighi precisi. I dati inviati all'API Anthropic vengono processati da Anthropic — includilo nella tua privacy policy.

**Disclosure AI**: in molte giurisdizioni è richiesto (o buona pratica) indicare che le risposte sono generate da AI.

**Costi imprevisti**: metti sempre un limite di spesa (`max_tokens`, rate limiting per utente) per evitare sorprese in bolletta se un utente abusa del servizio.

---

## Esercizi Pratici

> Tre esercizi a difficoltà crescente. Prova a risolverli da solo prima di aprire la soluzione.

### Esercizio 1 — Analisi di Sostenibilità 🟢 Base

Per un'idea di prodotto AI a tua scelta, calcola: (a) il costo API stimato per utente al mese (ipotizza 50 query/giorno da 200 token input + 500 token output ciascuna), (b) il prezzo minimo sostenibile con margine 4x, (c) quanti utenti paganti servono per coprire €500/mese di costi fissi (hosting, dominio, servizi).

<details>
<summary>💡 Mostra soluzione</summary>

```python
# calcola_costi.py

def analisi_sostenibilita(
    query_al_giorno: int,
    token_input_per_query: int,
    token_output_per_query: int,
    modello: str = "claude-haiku",
    costi_fissi_mensili_eur: float = 500.0,
    margine_moltiplicatore: float = 4.0,
):
    # Prezzi approssimativi in USD per milione di token
    PREZZI_USD = {
        "claude-haiku": {"input": 0.80, "output": 4.00},
        "claude-sonnet": {"input": 3.00, "output": 15.00},
        "claude-opus":   {"input": 15.00, "output": 75.00},
    }
    EUR_USD = 1.08  # tasso approssimativo
    
    prezzi = PREZZI_USD[modello]
    
    # Costo per query
    costo_query_usd = (
        token_input_per_query * prezzi["input"] +
        token_output_per_query * prezzi["output"]
    ) / 1_000_000
    
    # Costo mensile per utente
    query_mensili = query_al_giorno * 30
    costo_mensile_usd = costo_query_usd * query_mensili
    costo_mensile_eur = costo_mensile_usd / EUR_USD
    
    # Pricing
    prezzo_minimo = costo_mensile_eur * margine_moltiplicatore
    
    # Break-even
    utenti_per_break_even = costi_fissi_mensili_eur / max(prezzo_minimo - costo_mensile_eur, 0.01)
    
    print(f"=== Analisi Sostenibilità: {modello} ===")
    print(f"Query/giorno per utente: {query_al_giorno}")
    print(f"Token per query: {token_input_per_query} in + {token_output_per_query} out")
    print(f"Costo per query: ${costo_query_usd:.4f}")
    print(f"Costo mensile per utente: €{costo_mensile_eur:.2f}")
    print(f"Prezzo minimo sostenibile (×{margine_moltiplicatore}): €{prezzo_minimo:.2f}/mese")
    print(f"Utenti paganti per break-even (€{costi_fissi_mensili_eur:.0f}/mese fissi): {utenti_per_break_even:.0f}")

# Esempio: chatbot per support ticket
analisi_sostenibilita(
    query_al_giorno=20,
    token_input_per_query=300,
    token_output_per_query=600,
    modello="claude-haiku",
)
```

</details>

---

### Esercizio 2 — Rate Limiting per Utente 🟡 Intermedio

Implementa un sistema di rate limiting in memoria che limita ogni utente a 10 richieste/ora per il piano gratuito e 100/ora per il piano pro. Usa un dizionario con timestamp delle richieste per implementarlo senza database. Integra il controllo in un endpoint FastAPI.

<details>
<summary>💡 Mostra soluzione</summary>

```python
from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import APIKeyHeader
from collections import defaultdict
import time

app = FastAPI()
api_key_header = APIKeyHeader(name="X-API-Key")

# Piani e limiti
PIANI = {
    "free-key-123": {"piano": "free", "limite_ora": 10},
    "pro-key-456": {"piano": "pro", "limite_ora": 100},
}

# Registro richieste in memoria {api_key: [timestamp, ...]}
registro_richieste: dict[str, list[float]] = defaultdict(list)

def verifica_rate_limit(api_key: str = Depends(api_key_header)):
    if api_key not in PIANI:
        raise HTTPException(status_code=403, detail="API key non valida")
    
    piano = PIANI[api_key]
    limite = piano["limite_ora"]
    ora_fa = time.time() - 3600
    
    # Rimuovi richieste più vecchie di 1 ora
    registro_richieste[api_key] = [
        t for t in registro_richieste[api_key] if t > ora_fa
    ]
    
    richieste_recenti = len(registro_richieste[api_key])
    
    if richieste_recenti >= limite:
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit superato: {richieste_recenti}/{limite} richieste nell'ultima ora. "
                   f"Piano: {piano['piano']}. Attendi o aggiorna il piano."
        )
    
    # Registra questa richiesta
    registro_richieste[api_key].append(time.time())
    
    return {
        "piano": piano["piano"],
        "richieste_usate": richieste_recenti + 1,
        "richieste_rimaste": limite - richieste_recenti - 1,
    }

@app.post("/analizza")
async def analizza(body: dict, info_piano: dict = Depends(verifica_rate_limit)):
    return {
        "risultato": f"Risposta simulata per: {body.get('testo', '')[:50]}",
        "piano": info_piano["piano"],
        "richieste_rimaste": info_piano["richieste_rimaste"],
    }

@app.get("/quota")
async def quota(info_piano: dict = Depends(verifica_rate_limit)):
    return info_piano
```

```bash
pip install fastapi uvicorn
uvicorn main:app --reload

# Test
curl -H "X-API-Key: free-key-123" -X POST http://localhost:8000/analizza \
     -H "Content-Type: application/json" -d '{"testo": "test"}'
```

</details>

---

### Esercizio 3 — Landing Page con Pricing 🔴 Avanzato

Progetta (in pseudocodice o HTML statico) una landing page per il tuo prodotto AI con: (a) headline che comunica il valore in una frase, (b) 3 piani di pricing con feature list, (c) una sezione FAQ che risponde alle 5 domande più comuni, (d) una sezione "Come funziona" con 3 step. Aggiungi una nota su quali elementi cambieresti basandoti su A/B testing.

<details>
<summary>💡 Mostra soluzione</summary>

```html
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <title>ContrattAI — Analizza Contratti con AI</title>
    <style>
        body { font-family: system-ui; max-width: 900px; margin: 0 auto; padding: 20px; }
        .hero { text-align: center; padding: 60px 0; }
        .pricing { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .piano { border: 1px solid #ddd; padding: 20px; border-radius: 8px; }
        .piano.featured { border-color: #0070f3; background: #f0f7ff; }
    </style>
</head>
<body>

<!-- HEADLINE -->
<section class="hero">
    <h1>Carica il contratto. Fai le domande. Ottieni risposte in secondi.</h1>
    <p>ContrattAI analizza contratti PDF in italiano e risponde alle tue domande legali in linguaggio semplice — senza aspettare l'avvocato.</p>
    <a href="#prezzi">Inizia gratis →</a>
</section>

<!-- COME FUNZIONA -->
<section>
    <h2>Come funziona</h2>
    <ol>
        <li><strong>Carica il PDF</strong> — Trascina il contratto sulla piattaforma. Supportiamo PDF, Word, e testo.</li>
        <li><strong>Fai la domanda</strong> — "Quando scade? Posso recedere? Ci sono penali?"</li>
        <li><strong>Ricevi la risposta</strong> — In italiano semplice, con riferimento alle clausole originali.</li>
    </ol>
</section>

<!-- PRICING -->
<section id="prezzi">
    <h2>Piani</h2>
    <div class="pricing">
        <div class="piano">
            <h3>Gratis</h3>
            <p class="prezzo">€0/mese</p>
            <ul>
                <li>5 analisi/mese</li>
                <li>Max 10 pagine</li>
                <li>Risposta entro 30s</li>
            </ul>
            <a href="/signup">Inizia gratis</a>
        </div>
        <div class="piano featured">
            <h3>Pro ⭐</h3>
            <p class="prezzo">€19/mese</p>
            <ul>
                <li>100 analisi/mese</li>
                <li>Max 100 pagine</li>
                <li>Cronologia illimitata</li>
                <li>Export PDF del riassunto</li>
            </ul>
            <a href="/signup?piano=pro">Inizia — 14 giorni gratis</a>
        </div>
        <div class="piano">
            <h3>Business</h3>
            <p class="prezzo">€79/mese</p>
            <ul>
                <li>Analisi illimitate</li>
                <li>API access</li>
                <li>Multi-utente (5 seat)</li>
                <li>Support prioritario</li>
            </ul>
            <a href="/contatto">Contattaci</a>
        </div>
    </div>
</section>

<!-- FAQ -->
<section>
    <h2>FAQ</h2>
    <details>
        <summary>I miei contratti sono al sicuro?</summary>
        <p>I documenti vengono processati e immediatamente eliminati. Non conserviamo copie. Connessione cifrata TLS.</p>
    </details>
    <details>
        <summary>Può sostituire un avvocato?</summary>
        <p>No. ContrattAI è uno strumento di comprensione, non consulenza legale. Per decisioni importanti, consulta sempre un professionista.</p>
    </details>
    <details>
        <summary>Funziona con contratti tecnici e settoriali?</summary>
        <p>Sì — contratti di affitto, lavoro, NDA, fornitura, licenze software. Non funziona bene con documenti giudiziari complessi.</p>
    </details>
    <details>
        <summary>Posso cancellare quando voglio?</summary>
        <p>Sì, cancellazione in un click, nessuna penale, nessuna telefonata.</p>
    </details>
    <details>
        <summary>Quali lingue supporta?</summary>
        <p>Italiano e inglese. Il supporto per francese e tedesco è in arrivo.</p>
    </details>
</section>

<!--
NOTE A/B TESTING:
- Testare headline: "Carica il contratto..." vs "Finalmente capisci cosa firmi"
- Testare CTA: "Inizia gratis" vs "Prova 14 giorni gratis"
- Testare piano in evidenza: Pro vs Piano Annuale con sconto
- Testare posizione FAQ: dopo pricing vs dopo how-it-works
- Testare social proof: aggiungi "2.000 contratti analizzati questa settimana"
-->
</body>
</html>
```

</details>

---

## Connessioni

- **Capitolo 8**: [Deployment e Ambienti](../capitolo-08-workflow-multi-agente/08-07-deployment) — il deployment del prodotto è il prerequisito tecnico alla pubblicazione
- **Capitolo 8**: [Testing e Valutazione degli LLM](../capitolo-08-workflow-multi-agente/08-06-testing-evals) — prima di pubblicare, valuta la qualità con metodi sistematici
- **Capitolo 9**: [Etica e Responsabilità nell'AI](09-06-etica-responsabilita) — disclosure AI, privacy, e usi accettabili sono obblighi prima di pubblicare
- **Capitolo 5**: [Struttura di un Progetto Python Reale](../capitolo-05-strumenti-infrastruttura/05-09-struttura-progetto-python) — la struttura del progetto che hai imparato è compatibile con PyPI publishing
