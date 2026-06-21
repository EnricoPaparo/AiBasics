---
titolo: "Deployment e Ambienti"
durata_stimata: "25 min"
difficolta: "Avanzato"
---
# Deployment e Ambienti

Costruire un agente AI che funziona in locale è la parte facile. Portarlo in produzione in modo sicuro, scalabile e monitorabile è dove la maggior parte dei progetti si inceppa.

## Gli Ambienti di Sviluppo

Un sistema software professionale vive in almeno tre ambienti distinti:

```
LOCAL → STAGING → PRODUCTION
  ↓         ↓          ↓
sviluppo   test    utenti reali
 rapido   integraz.  alta affid.
```

**Local (sviluppo)**: il tuo laptop. Velocità di iterazione massima, nessuna conseguenza se qualcosa si rompe. Qui usi dati fittizi, modelli economici, nessuna restrizione.

**Staging**: un ambiente identico a produzione, ma isolato. Qui testi con dati reali (o anonimizzati), con le stesse configurazioni di produzione. Nessun utente reale lo vede. I bug trovati qui non causano danni.

**Production**: gli utenti reali. Qui ogni bug ha conseguenze. La stabilità è priorità assoluta.

## Gestione dei Segreti

**Non mettere mai API key, password o credenziali nel codice sorgente.** È la regola più importante del deployment.

```python
# SBAGLIATO — mai fare questo
client = anthropic.Anthropic(api_key="sk-ant-api03-...")

# GIUSTO — leggi dall'ambiente
import os
client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
```

Come gestire i segreti in pratica:

**File `.env` in locale** (mai committato):
```bash
# .env
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=postgresql://...
SECRET_KEY=...

# .gitignore deve contenere
.env
*.env
```

**Servizi di gestione segreti in produzione**:
- **Vercel / Railway / Render**: pannello web per le env vars, mai nel codice
- **AWS Secrets Manager / GCP Secret Manager**: gestione centralizzata, audit log
- **GitHub Actions Secrets**: per le pipeline CI/CD

```python
# Controlla sempre all'avvio che i segreti siano presenti
required_secrets = ["ANTHROPIC_API_KEY", "DATABASE_URL", "SECRET_KEY"]
for secret in required_secrets:
    if not os.environ.get(secret):
        raise EnvironmentError(f"Variabile d'ambiente mancante: {secret}")
```

## Opzioni di Hosting

La scelta dipende da complessità, scala e budget.

### Serverless (per API e agenti stateless)

**Vercel, Netlify Functions, AWS Lambda**

```python
# Esempio: agente come Vercel Serverless Function
# api/agent.py
from http.server import BaseHTTPRequestHandler
import anthropic

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        body = json.loads(self.rfile.read())
        response = run_agent(body["message"])
        self.send_response(200)
        self.end_headers()
        self.wfile.write(json.dumps({"response": response}).encode())
```

Pro: zero gestione server, scala automaticamente, pay-per-use.
Contro: cold start latency, timeout limite (~30s–10min), stateless (no memoria tra richieste).

### Container (per agenti con stato o lunga esecuzione)

**Railway, Render, Fly.io, AWS ECS, Google Cloud Run**

```dockerfile
# Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "main.py"]
```

Pro: controllo totale, supporta sessioni lunghe, qualsiasi stack.
Contro: più configurazione, costi fissi anche senza traffico.

### VPS (per massimo controllo)

**DigitalOcean, Hetzner, Linode**

Una macchina virtuale dove installi e gestisci tutto tu. Massimo controllo, massima responsabilità.

## Rate Limiting e Protezione dai Costi

Senza rate limiting, un utente malintenzionato (o un bug) può generare migliaia di chiamate API in minuti.

```python
from collections import defaultdict
import time

class RateLimiter:
    def __init__(self, max_calls_per_minute=10):
        self.calls = defaultdict(list)
        self.limit = max_calls_per_minute

    def is_allowed(self, user_id):
        now = time.time()
        minute_ago = now - 60
        # Rimuovi chiamate più vecchie di 1 minuto
        self.calls[user_id] = [t for t in self.calls[user_id] if t > minute_ago]
        if len(self.calls[user_id]) >= self.limit:
            return False
        self.calls[user_id].append(now)
        return True

# In produzione usa Redis per persistence tra istanze
```

Imposta anche **spending limits** nel pannello del provider:
- Anthropic: Settings → Usage → Spending Limits
- OpenAI: Billing → Usage Limits

## Monitoring in Produzione

Non puoi migliorare quello che non misuri. Un sistema di monitoring minimo per un agente AI:

### Logging Strutturato

```python
import logging
import json
from datetime import datetime

def log_agent_call(user_id, input_tokens, output_tokens, latency_ms, success):
    event = {
        "timestamp": datetime.utcnow().isoformat(),
        "user_id": user_id,
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "cost_usd": calculate_cost(input_tokens, output_tokens),
        "latency_ms": latency_ms,
        "success": success,
    }
    logging.info(json.dumps(event))  # formato JSON per tool come Datadog, Grafana
```

### Health Check Endpoint

```python
# GET /health — usato dal load balancer per verificare che l'app sia viva
def health_check():
    return {
        "status": "ok",
        "version": os.environ.get("APP_VERSION", "unknown"),
        "timestamp": datetime.utcnow().isoformat(),
        "checks": {
            "database": check_db_connection(),
            "llm_api": check_llm_api(),
        }
    }
```

### Alerting

Configura alert per:
- Latenza > soglia (es. p95 > 10s)
- Error rate > 5%
- Costo giornaliero > budget threshold
- Zero traffico per > 10 minuti (potenziale downtime)

## CI/CD: Automazione del Deploy

Un pipeline CI/CD automazione i test prima di ogni deploy.

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: pip install -r requirements.txt
      - run: python -m pytest tests/
      - run: python run_evals.py --set core

  deploy:
    needs: test  # solo se i test passano
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: railway deploy  # o vercel, fly, etc.
    env:
      RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

Il principio: **nessun deploy manuale**. Ogni push a `main` che passa i test viene deployato automaticamente.

## Checklist Pre-Deploy

Prima di portare qualcosa in produzione:

```
SICUREZZA
☐ Nessun segreto nel codice o nei commit
☐ Input validation implementata
☐ Rate limiting attivo
☐ Errori non espongono stack trace agli utenti

QUALITÀ
☐ Test unitari passano
☐ Eval set core passa (>90%)
☐ Regression check ok vs versione precedente
☐ Red team base eseguito

OPERAZIONI
☐ Health check endpoint funzionante
☐ Logging strutturato attivo
☐ Spending limit impostato nel provider LLM
☐ Alert configurati (errori, latenza, costi)
☐ Procedura di rollback documentata

DOCUMENTAZIONE
☐ README aggiornato con istruzioni di setup
☐ Variabili d'ambiente documentate
☐ Endpoint API documentati
```

---

## Esercizi Pratici

> Tre esercizi a difficoltà crescente. Prova a risolverli da solo prima di aprire la soluzione.

### Esercizio 1 — Configura gli Ambienti 🟢 Base

Hai un'app Flask con un agente AI. Scrivi il codice per caricare la configurazione in modo diverso in base all'ambiente (`development`, `staging`, `production`): in development usa un modello economico e nessun rate limiting, in staging usa il modello reale ma con rate limiting lasco, in produzione usa il modello reale con rate limiting stretto e logging abilitato.

<details>
<summary>💡 Mostra soluzione</summary>

```python
import os

ENV = os.environ.get("APP_ENV", "development")

configs = {
    "development": {
        "model": "claude-haiku-4-5-20251001",
        "rate_limit_per_minute": 100,
        "logging_enabled": False,
        "debug": True,
    },
    "staging": {
        "model": "claude-sonnet-4-6",
        "rate_limit_per_minute": 30,
        "logging_enabled": True,
        "debug": False,
    },
    "production": {
        "model": "claude-sonnet-4-6",
        "rate_limit_per_minute": 10,
        "logging_enabled": True,
        "debug": False,
    }
}

config = configs.get(ENV)
if not config:
    raise ValueError(f"Ambiente non riconosciuto: {ENV}")

# Uso
print(f"Avvio in ambiente: {ENV}")
print(f"Modello: {config['model']}")

# Variabile d'ambiente per il deploy:
# APP_ENV=production railway deploy
```

</details>

---

### Esercizio 2 — Rate Limiter con Redis 🟡 Intermedio

Implementa un rate limiter usando Redis come backend (invece di memoria locale), così funziona anche con più istanze dell'app in parallelo. Usa il pattern "sliding window" con chiavi Redis che scadono automaticamente.

<details>
<summary>💡 Mostra soluzione</summary>

```python
import redis
import time

class RedisRateLimiter:
    def __init__(self, redis_url, max_calls=10, window_seconds=60):
        self.r = redis.from_url(redis_url)
        self.max_calls = max_calls
        self.window = window_seconds

    def is_allowed(self, user_id):
        key = f"rate_limit:{user_id}"
        now = time.time()
        window_start = now - self.window

        pipe = self.r.pipeline()
        # Rimuovi elementi fuori dalla finestra
        pipe.zremrangebyscore(key, 0, window_start)
        # Conta elementi nella finestra
        pipe.zcard(key)
        # Aggiungi la chiamata corrente
        pipe.zadd(key, {str(now): now})
        # Fai scadere la chiave dopo la finestra (cleanup automatico)
        pipe.expire(key, self.window)
        results = pipe.execute()

        current_count = results[1]
        return current_count < self.max_calls

# Il vantaggio di Redis: funziona con 10 istanze dell'app in parallelo,
# il conteggio è condiviso e consistente.
limiter = RedisRateLimiter(
    redis_url=os.environ["REDIS_URL"],
    max_calls=10,
    window_seconds=60
)
```

</details>

---

### Esercizio 3 — Progetta un Sistema di Rollback 🔴 Avanzato

Il tuo agente AI è in produzione e riceve 1.000 richieste/giorno. Hai appena deployato una nuova versione e dopo 30 minuti noti che l'error rate è salito dal 2% al 15%. Progetta: (a) il sistema di monitoring che ha rilevato il problema, (b) la procedura di rollback automatico, (c) le misure post-incident per evitare che si ripeta.

<details>
<summary>💡 Mostra soluzione</summary>

**(a) Sistema di monitoring**:

```python
class ErrorRateMonitor:
    def __init__(self, threshold=0.10, window_minutes=5):
        self.threshold = threshold
        self.window = window_minutes * 60
        self.calls = []  # (timestamp, success)

    def record(self, success):
        now = time.time()
        self.calls.append((now, success))
        # Mantieni solo la finestra recente
        cutoff = now - self.window
        self.calls = [(t, s) for t, s in self.calls if t > cutoff]
        return self.check_alert()

    def check_alert(self):
        if len(self.calls) < 20:  # dati insufficienti
            return None
        error_rate = sum(1 for _, s in self.calls if not s) / len(self.calls)
        if error_rate > self.threshold:
            return f"ALERT: error rate {error_rate:.1%} > {self.threshold:.1%}"
        return None
```

**(b) Rollback automatico**:

```bash
#!/bin/bash
# rollback.sh

PREVIOUS_VERSION=$(cat .last_good_version)
echo "Rollback a versione: $PREVIOUS_VERSION"

# Railway / Render hanno comandi specifici:
railway rollback $PREVIOUS_VERSION

# O con Docker/Kubernetes:
kubectl set image deployment/agent agent=myimage:$PREVIOUS_VERSION

# Verifica che il rollback abbia funzionato
sleep 30
ERROR_RATE=$(python check_error_rate.py --last 5min)
if [ "$ERROR_RATE" -gt 10 ]; then
    echo "ERRORE: rollback non ha risolto il problema, escalation manuale"
    send_alert "Rollback fallito, intervento manuale richiesto"
fi
```

**(c) Post-incident**:
1. **Root cause analysis**: confronta il diff tra la versione buona e quella problematica
2. **Aggiungi il caso all'eval set**: il tipo di richiesta che causava errori diventa un test case obbligatorio
3. **Abbassa la soglia di regression check**: se il test avrebbe rilevato il problema, perché non l'ha fatto?
4. **Canary deploy**: la prossima versione viene prima testata sul 5% del traffico per 30 minuti prima del rollout completo

</details>

---

## Connessioni

- **Lezione precedente**: [Testing e Valutazione](08-06-testing-evals) — il testing precede il deployment
- **Capitolo 4**: [Token Economics](../capitolo-04-llm/04-08-token-economics) — i cost monitor visti lì vivono nell'infrastruttura di deployment
- **Capitolo 6**: [Sicurezza e Prompt Injection](../capitolo-06-agenti-architettura/06-07-sicurezza-prompt-injection) — la checklist di sicurezza pre-deploy
- **Capitolo 9**: [Governance e Versioning](../capitolo-09-sistemi-auto-evolutivi/09-04-governance-versioning) — deployment come parte del ciclo di vita di un sistema AI
