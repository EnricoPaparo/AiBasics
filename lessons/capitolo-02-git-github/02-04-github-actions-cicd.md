---
titolo: "GitHub Actions e CI/CD"
durata_stimata: "25 min"
difficolta: "Intermedio"
---

# GitHub Actions e CI/CD

Ogni volta che fai push su GitHub, potresti star rompendo qualcosa senza saperlo. I test potrebbero fallire. Il codice potrebbe non compilare. La qualità potrebbe degradarsi. **CI/CD** è il sistema che lo scopre per te — automaticamente, ogni volta, prima che arrivi agli utenti.

## Cosa Significa CI/CD

**CI — Continuous Integration (Integrazione Continua)**

L'idea: ogni volta che qualcuno fa push di codice, viene eseguita automaticamente una suite di controlli — test, linting, type check, analisi di sicurezza. Se qualcosa fallisce, la squadra lo sa immediatamente.

**CD — Continuous Delivery / Continuous Deployment**

- **Continuous Delivery**: ogni commit che passa tutti i controlli è *pronto* per essere deployato. Il deploy finale è manuale.
- **Continuous Deployment**: ogni commit che passa viene deployato *automaticamente* in produzione, senza intervento umano.

**Il principio unificante**: automatizza ogni cosa che fai manualmente e ripetutamente.

## GitHub Actions

**GitHub Actions** è il sistema CI/CD integrato in GitHub. È configurato tramite file YAML nella cartella `.github/workflows/` del tuo repository.

```
Push su GitHub
    ↓
GitHub legge .github/workflows/ci.yml
    ↓
Avvia runner (macchina virtuale Ubuntu/Mac/Windows)
    ↓
Esegue i passi in ordine
    ↓
✅ Tutto verde — o ❌ Step X fallito
```

## Anatomia di un Workflow

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout codice
        uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Installa dipendenze
        run: pip install -r requirements.txt

      - name: Esegui test
        run: pytest tests/ -v

      - name: Controlla stile codice
        run: ruff check .
```

## Gestire i Segreti

Le credenziali (API key, token di deploy) non vanno nel workflow YAML. GitHub Actions ha un sistema di **Secrets**:

1. Aggiungi il segreto su GitHub: Settings → Secrets and Variables → Actions
2. Usalo nel workflow: `${{ secrets.ANTHROPIC_API_KEY }}`

I segreti vengono mascherati automaticamente nei log — anche se provi a fare `echo $RAILWAY_TOKEN`, vedrai `***`.

## Branch Protection Rules

GitHub permette di proteggere `main` richiedendo che i check CI passino prima che una PR possa essere mergiata:

Settings → Branches → Branch protection rules:
- Require status checks to pass before merging
- Require pull request reviews before merging (almeno 1 approvazione)
- Require branches to be up to date before merging

Con queste regole, nessuno può pushare direttamente su `main` né mergare senza PR approvata e CI verde.

---

## Esercizi Pratici

> Tre esercizi a difficoltà crescente. Prova a risolverli da solo prima di aprire il suggerimento.

### Esercizio 1 — Il Tuo Primo Workflow 🟢 Base

In un repository Python, crea un file `.github/workflows/ci.yml` che: installa Python 3.11, installa le dipendenze da `requirements.txt`, esegue `pytest`. Aggiungi un test semplice che passa e uno che fallisce intenzionalmente. Pusha e osserva il risultato su GitHub.

<details>
<summary>💡 Mostra suggerimento</summary>

**Struttura minima del workflow:**
```yaml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.11' }
      - run: pip install pytest
      - run: pytest tests/ -v
```

**File di test minimale:**
```python
# tests/test_math.py
def test_somma_corretta():
    assert 2 + 2 == 4  # deve passare

def test_che_fallisce():
    assert 2 + 2 == 5  # deve fallire intenzionalmente
```

Dopo il push, vai su GitHub → tab "Actions" per vedere i log in tempo reale. Correggi il test e ripusha — il workflow diventa verde.

</details>

---

### Esercizio 2 — Matrix Testing 🟡 Intermedio

Configura un workflow che testa il codice su 3 versioni di Python (3.10, 3.11, 3.12) in parallelo usando la **matrix strategy** di GitHub Actions. Aggiungi anche un job separato che si esegue solo dopo il successo di tutti e 3 i test.

<details>
<summary>💡 Mostra suggerimento</summary>

**Struttura con matrix:**
```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: ['3.10', '3.11', '3.12']
      fail-fast: false  # continua anche se una versione fallisce

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: ${{ matrix.python-version }}
      - run: pip install pytest
      - run: pytest tests/ -v

  summary:
    runs-on: ubuntu-latest
    needs: test  # aspetta che TUTTI i job "test" passino
    steps:
      - run: echo "Tutti i test passati su tutte le versioni!"
```

`fail-fast: false` fa sì che se Python 3.10 fallisce, 3.11 e 3.12 vengono comunque eseguiti.

</details>

---

### Esercizio 3 — Pipeline CI/CD Completa 🔴 Avanzato

Progetta e implementa una pipeline CI/CD per un repository Python con un agente AI. La pipeline deve: (a) eseguire test su ogni PR, (b) richiedere che i test passino prima del merge, (c) deployare automaticamente su ogni push a `main`, (d) notificare via Slack se il deploy fallisce.

<details>
<summary>💡 Mostra suggerimento</summary>

**Due workflow separati:**

`ci.yml` — attivato su pull_request:
```yaml
# Esegue: pytest, ruff check
# Questo workflow è il "status check" richiesto per il merge
```

`deploy.yml` — attivato su push a main:
```yaml
jobs:
  deploy:
    steps:
      - name: Deploy
        id: deploy
        env: { RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }} }
        run: railway deploy

      - name: Notifica Slack se fallisce
        if: failure()  # si esegue SOLO se lo step precedente ha fallito
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {"text": "Deploy fallito! Commit: ${{ github.sha }}"}
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

**Branch protection** (da configurare su GitHub UI):
- Require status checks: seleziona il job del workflow CI
- Require pull request reviews: 1 approvazione minima

Con questa configurazione: nessun commit diretto su `main`, ogni PR deve passare CI e review, ogni merge triggera il deploy automatico.

</details>

---

<details>
<summary>⚙️ Approfondimento Avanzato</summary>

### Un Workflow Completo per un Agente AI

```yaml
name: AI Agent CI/CD

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.11' }
      - run: pip install -r requirements.txt
      - name: Test unitari
        run: pytest tests/unit/ -v
      - name: Linting
        run: ruff check .
      - name: Type check
        run: mypy src/

  evals:
    runs-on: ubuntu-latest
    needs: quality
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.11' }
      - run: pip install -r requirements.txt
      - name: Esegui eval set core
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: python scripts/run_evals.py --set core --threshold 0.90

  deploy:
    runs-on: ubuntu-latest
    needs: [quality, evals]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    steps:
      - uses: actions/checkout@v4
      - name: Deploy su produzione
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
        run: railway deploy
```

Questo workflow garantisce che: i test passino, il codice sia tipizzato e stilisticamente corretto, gli evals AI raggiungano la soglia di qualità, e solo allora il deploy avviene — tutto automaticamente ad ogni push su `main`.

### Trigger Multipli

```yaml
on:
  push:                        # push su qualsiasi branch
  pull_request:                # apertura/aggiornamento di PR
  schedule:
    - cron: '0 8 * * 1-5'     # ogni giorno feriale alle 8:00
  workflow_dispatch:           # avvio manuale dalla UI GitHub
  release:
    types: [published]         # quando pubblichi una release
```

</details>

---

## Connessioni

- **Lezione precedente**: [GitHub e Lavoro Collaborativo](02-03-github-collaborazione)
- **Capitolo 8**: [Testing e Valutazione degli LLM](../capitolo-08-workflow-multi-agente/08-06-testing-evals) — gli evals vengono eseguiti nella pipeline CI/CD
- **Capitolo 8**: [Deployment e Ambienti](../capitolo-08-workflow-multi-agente/08-07-deployment) — GitHub Actions orchestra il deployment automatico
- **Capitolo 9**: [Governance e Versioning](../capitolo-09-sistemi-auto-evolutivi/09-04-governance-versioning) — CI/CD è parte della governance di un sistema AI in produzione
