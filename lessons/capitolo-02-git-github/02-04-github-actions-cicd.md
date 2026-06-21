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

Prima della CI, un team poteva lavorare su branch separati per settimane. Quando si integrava tutto, emergevano decine di conflitti e bug. La CI porta l'integrazione e il feedback a ogni singolo commit.

**CD — Continuous Delivery / Continuous Deployment (Consegna/Deploy Continuo)**

- **Continuous Delivery**: ogni commit che passa tutti i controlli è *pronto* per essere deployato in produzione. Il deploy finale è manuale ma è sempre possibile.
- **Continuous Deployment**: ogni commit che passa i controlli viene deployato *automaticamente* in produzione, senza intervento umano.

La differenza è sottile ma importante: CD richiede una cultura di testing molto matura e fiducia nel sistema automatizzato.

**Il principio unificante**: automatizza ogni cosa che fai manualmente e ripetutamente. Se esegui `pytest` ogni volta che fai push, automatizzalo. Se buildi e pubblichi un pacchetto ogni settimana, automatizzalo.

## GitHub Actions

**GitHub Actions** è il sistema CI/CD integrato in GitHub. È configurato tramite file YAML nella cartella `.github/workflows/` del tuo repository.

Quando fai push, GitHub legge i file di workflow, esegue i passi definiti su un server temporaneo (chiamato **runner**), e riporta i risultati direttamente nella PR o nel commit.

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
    ↓
Risultato visibile su PR e notifica via email
```

## Anatomia di un Workflow

```yaml
# .github/workflows/ci.yml

name: CI                           # nome visualizzato su GitHub

on:                                # quando si attiva questo workflow
  push:                            # ad ogni push
    branches: [ main ]             # solo sul branch main
  pull_request:                    # su ogni PR
    branches: [ main ]             # verso main

jobs:                              # lavori da eseguire
  test:                            # nome del job
    runs-on: ubuntu-latest         # sistema operativo del runner

    steps:                         # passi in ordine
      - name: Checkout codice
        uses: actions/checkout@v4  # action ufficiale: clona il repo

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

Ogni `step` ha:
- `name`: etichetta descrittiva (opzionale ma consigliata)
- `uses`: un'action prebuilt da usare (GitHub Marketplace ne ha migliaia)
- `run`: un comando shell da eseguire

## Trigger: Quando Parte il Workflow

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

Puoi combinare più trigger. Il più comune per CI è `push` + `pull_request` su `main`.

## Job in Parallelo

Un workflow può avere più job che girano in parallelo:

```yaml
jobs:
  test-python:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pytest tests/

  test-js:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm test

  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: ruff check . && mypy src/

  deploy:
    needs: [test-python, test-js, lint]  # aspetta che tutti passino
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'  # solo su main
    steps:
      - run: echo "Deploy!"
```

`needs` definisce le dipendenze: il job `deploy` parte solo se `test-python`, `test-js` e `lint` sono tutti passati.

## Gestire i Segreti

Le credenziali (API key, token di deploy) non vanno nel workflow YAML — sono visibili a tutti. GitHub Actions ha un sistema di **Secrets**:

1. **Aggiungi il segreto** su GitHub: Settings → Secrets and Variables → Actions → New repository secret
2. **Usalo nel workflow**:

```yaml
- name: Deploy su Railway
  env:
    RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
  run: railway deploy
```

I segreti vengono mascherati automaticamente nei log — anche se provi a fare `echo $RAILWAY_TOKEN`, vedrai `***`.

## Un Workflow Completo per un Agente AI

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

## Branch Protection Rules

GitHub permette di proteggere `main` richiedendo che i check CI passino prima che una PR possa essere mergiata:

Settings → Branches → Branch protection rules → Add rule:
- ✅ Require status checks to pass before merging
- ✅ Require pull request reviews before merging (almeno 1 approvazione)
- ✅ Require branches to be up to date before merging

Con queste regole, nessuno può pushare direttamente su `main` né mergare senza PR approvata e CI verde. È come avere un controllore automatico sempre attivo.

---

## Esercizi Pratici

> Tre esercizi a difficoltà crescente. Prova a risolverli da solo prima di aprire la soluzione.

### Esercizio 1 — Il Tuo Primo Workflow 🟢 Base

In un repository Python, crea un file `.github/workflows/ci.yml` che: installa Python 3.11, installa le dipendenze da `requirements.txt`, esegue `pytest`. Aggiungi un test semplice che passa e uno che fallisce intenzionalmente. Pusha e osserva il risultato su GitHub.

<details>
<summary>💡 Mostra soluzione</summary>

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install pytest
      - run: pytest tests/ -v
```

```python
# tests/test_math.py
def test_somma_corretta():
    assert 2 + 2 == 4  # passa

def test_che_fallisce():
    assert 2 + 2 == 5  # fallisce
```

Dopo il push, vai su GitHub → tab "Actions". Vedrai il workflow avviarsi. Clicca per vedere i log in tempo reale. Il job fallirà su `test_che_fallisce` con output dettagliato. Correggi il test e ripusha — il workflow diventa verde.

</details>

---

### Esercizio 2 — Matrix Testing 🟡 Intermedio

Configura un workflow che testa il codice su 3 versioni di Python (3.10, 3.11, 3.12) in parallelo usando la **matrix strategy** di GitHub Actions. Aggiungi anche un job separato che esegue solo su successo di tutti e 3 i test e stampa "Tutti i test passati!".

<details>
<summary>💡 Mostra soluzione</summary>

```yaml
name: Matrix CI
on: [push, pull_request]

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
    needs: test
    steps:
      - run: echo "✅ Tutti i test passati su Python 3.10, 3.11, 3.12!"
```

La `matrix` crea automaticamente 3 job paralleli, uno per ogni versione. I nomi appaiono su GitHub come `test (3.10)`, `test (3.11)`, `test (3.12)`. Con `fail-fast: false`, se Python 3.10 fallisce, 3.11 e 3.12 vengono comunque eseguiti — utile per vedere se il problema è specifico di una versione.

</details>

---

### Esercizio 3 — Pipeline CI/CD Completa 🔴 Avanzato

Progetta e implementa una pipeline CI/CD per questo scenario: repository Python con un agente AI. La pipeline deve: (a) eseguire test su ogni PR, (b) richiedere che i test passino prima del merge (branch protection), (c) deployare automaticamente su ogni push a `main`, (d) notificare via Slack se il deploy fallisce. Scrivi tutti i workflow YAML necessari.

<details>
<summary>💡 Mostra soluzione</summary>

```yaml
# .github/workflows/ci.yml — eseguito su ogni PR
name: CI
on:
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.11' }
      - run: pip install -r requirements.txt
      - run: pytest tests/ -v
      - run: ruff check .
```

```yaml
# .github/workflows/deploy.yml — eseguito solo su push a main
name: Deploy
on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.11' }
      - run: pip install -r requirements.txt

      - name: Deploy
        id: deploy
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
        run: railway deploy

      - name: Notifica Slack se fallisce
        if: failure()  # si esegue SOLO se lo step precedente ha fallito
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "❌ Deploy fallito su main!\nCommit: ${{ github.sha }}\nAutore: ${{ github.actor }}\nVedi: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

**Branch protection** (da configurare su GitHub UI):
- Settings → Branches → Add rule per `main`
- ✅ Require status checks: seleziona il job `test` del workflow CI
- ✅ Require pull request reviews: 1 approvazione minima
- ✅ Restrict who can push: solo admin

Con questa configurazione: nessun commit diretto su `main`, ogni PR deve passare CI e review, ogni merge triggera il deploy automatico, e il team viene notificato su Slack se qualcosa va storto.

</details>

---

## Connessioni

- **Lezione precedente**: [GitHub e Lavoro Collaborativo](02-03-github-collaborazione)
- **Capitolo 8**: [Testing e Valutazione degli LLM](../capitolo-08-workflow-multi-agente/08-06-testing-evals) — gli evals vengono eseguiti nella pipeline CI/CD
- **Capitolo 8**: [Deployment e Ambienti](../capitolo-08-workflow-multi-agente/08-07-deployment) — GitHub Actions orchestra il deployment automatico
- **Capitolo 9**: [Governance e Versioning](../capitolo-09-sistemi-auto-evolutivi/09-04-governance-versioning) — CI/CD è parte della governance di un sistema AI in produzione
