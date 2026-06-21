---
titolo: "Prompt Versioning Pratico"
durata_stimata: "20 min"
difficolta: "Intermedio"
---

# Prompt Versioning Pratico

Un prompt è codice. Come il codice, cambia nel tempo, può rompersi, e ha bisogno di essere tracciato. Eppure la maggior parte dei team gestisce i prompt come testi incollati ovunque — nel codice, in Notion, in email. Questa lezione mostra come trattare i prompt come artefatti di prima classe con version control, test di regressione e deployment controllato.

## Il Problema del Prompt "Ovunque"

```
Senza versioning dei prompt:
  sviluppatore A modifica il prompt in produzione → "sembra meglio"
  sviluppatore B non sa che è cambiato
  la qualità degrada su casi d'uso di B
  nessuno sa cosa è cambiato quando

Con versioning:
  ogni modifica ha un commit, un autore, un messaggio
  puoi fare rollback in 30 secondi
  i test di regressione catturano le regressioni prima del deploy
```

## Struttura di un Prompt Come Artefatto

```
prompts/
├── classificatore-email/
│   ├── v1.0.0.yaml
│   ├── v1.1.0.yaml
│   ├── v2.0.0.yaml
│   └── current.txt          # contiene "v2.0.0"
│
└── CHANGELOG.md
```

Un file di prompt versionato:

```yaml
# prompts/classificatore-email/v2.0.0.yaml
---
id: classificatore-email
version: "2.0.0"
created: "2026-01-15"
modello: "claude-haiku-4-5-20251001"
max_tokens: 50

system: |
  Classifica l'email ricevuta in una di queste categorie:
  URGENTE, NORMALE, BASSA_PRIORITA, SPAM
  Rispondi SOLO con la categoria, nessun altro testo.

examples:
  - input: "Il server è completamente irraggiungibile da stamattina"
    output: "URGENTE"
  - input: "Come posso cambiare la mia password?"
    output: "NORMALE"
```

## Caricamento e Utilizzo dei Prompt Versionati

```python
import yaml
import anthropic
from pathlib import Path

PROMPTS_DIR = Path("prompts")

def carica_prompt(nome: str, versione: str = "current") -> dict:
    if versione == "current":
        versione = (PROMPTS_DIR / nome / "current.txt").read_text().strip()
    filepath = PROMPTS_DIR / nome / f"{versione}.yaml"
    with open(filepath) as f:
        return yaml.safe_load(f)

def esegui_prompt(nome: str, user_input: str, versione: str = "current") -> str:
    client = anthropic.Anthropic()
    cfg = carica_prompt(nome, versione)
    risposta = client.messages.create(
        model=cfg["modello"], max_tokens=cfg["max_tokens"],
        system=cfg.get("system", ""),
        messages=[{"role": "user", "content": user_input}]
    )
    return risposta.content[0].text.strip()
```

## Test di Regressione per i Prompt

Ogni volta che modifichi un prompt, devi verificare che non abbia peggiorato i casi che già funzionavano:

```python
# tests/test_classificatore_email.py
import pytest
from prompt_loader import esegui_prompt

CASI_TEST = [
    ("Il sistema di login non funziona per nessuno", "URGENTE"),
    ("Come cambio la mia password?", "NORMALE"),
    ("Sarebbe bello avere il tema scuro", "BASSA_PRIORITA"),
    ("Congratulazioni! Hai vinto!", "SPAM"),
]

@pytest.mark.parametrize("input_email,expected", CASI_TEST)
def test_classificatore_v2(input_email, expected):
    risultato = esegui_prompt("classificatore-email", input_email, versione="v2.0.0")
    assert risultato == expected
```

## Workflow di Modifica di un Prompt

```
1. Crea un branch Git: git checkout -b prompt/classificatore-v2.1
2. Copia la versione corrente e modifica
3. Esegui i test di regressione: pytest tests/test_classificatore_email.py -v
4. Se passano, aggiorna current.txt: echo "v2.1.0" > prompts/classificatore-email/current.txt
5. Commit e PR — i prompt vanno in review come il codice
6. Merge → deploy automatico
```

## Semantic Versioning per i Prompt

| Tipo di cambio | Versione | Esempi |
|---|---|---|
| Breaking change | MAJOR (2.0.0) | Cambia formato output, cambia modello base |
| Nuova funzionalità | MINOR (1.1.0) | Aggiunge categoria, migliora few-shot |
| Fix | PATCH (1.0.1) | Corregge typo, chiarisce una regola |

---

## Esercizi Pratici

> Tre esercizi a difficoltà crescente. Prova a risolverli da solo prima di aprire il suggerimento.

### Esercizio 1 — Struttura una Libreria di Prompt 🟢 Base

Crea una struttura di cartelle per una libreria con 3 prompt (classificatore, estrattore, risposta-automatica). Per ciascuno scrivi un file YAML v1.0.0 con frontmatter completo (id, versione, modello, system, 3 examples). Crea il file `current.txt` per ciascuno.

<details>
<summary>💡 Mostra suggerimento</summary>

**Struttura delle cartelle:**
```bash
mkdir -p prompts/{classificatore,estrattore,risposta-automatica}
echo "v1.0.0" > prompts/classificatore/current.txt
# ripeti per gli altri due
```

**Struttura YAML minima per ogni prompt:**
```yaml
---
id: classificatore
version: "1.0.0"
created: "2026-06-01"
author: "team"
modello: "claude-haiku-4-5-20251001"
max_tokens: 20

system: |
  Classifica il testo in: POSITIVO, NEGATIVO, NEUTRO.
  Rispondi solo con la categoria.

examples:
  - input: "Prodotto fantastico!"
    output: "POSITIVO"
  - input: "Pessima qualità"
    output: "NEGATIVO"
  - input: "Nella media"
    output: "NEUTRO"
```

Adatta `system` e `examples` per `estrattore` (estrae entità in JSON) e `risposta-automatica` (genera una risposta breve).

</details>

---

### Esercizio 2 — Suite di Test di Regressione 🟡 Intermedio

Scrivi una suite pytest per il tuo classificatore con: (a) 10 casi di test parametrizzati, (b) un test che confronta la versione corrente con la precedente e fallisce se l'accuracy è peggiorata di più del 5%, (c) un test che verifica il tempo di risposta medio sia sotto i 3 secondi.

<details>
<summary>💡 Mostra suggerimento</summary>

**Struttura dei 10 casi:**
```python
CASI = [
    ("Prodotto fantastico!", "POSITIVO"),
    ("Ottima qualità", "POSITIVO"),
    # ...5 total POSITIVO
    ("Pessima qualità", "NEGATIVO"),
    # ...5 total NEGATIVO/NEUTRO
]

@pytest.mark.parametrize("testo,expected", CASI)
def test_classificatore(testo, expected):
    assert esegui("v1.0.0", testo) == expected
```

**Test di no-regressione:**
```python
def test_no_regressione():
    corretti = sum(1 for t, e in CASI if esegui("v1.0.0", t) == e)
    assert corretti / len(CASI) >= 0.95
```

**Test di latenza:**
```python
def test_latenza_media():
    tempi = [misura_tempo(lambda: esegui("v1.0.0", t)) for t, _ in CASI[:5]]
    assert sum(tempi) / len(tempi) < 3.0
```

</details>

---

### Esercizio 3 — Confronto A/B Automatizzato 🔴 Avanzato

Scrivi uno script che: (a) prende due versioni di un prompt come argomenti CLI, (b) le esegue su un eval set di 20 esempi, (c) calcola precision/recall/F1 per categoria, (d) genera un report Markdown con la tabella comparativa e una raccomandazione su quale versione promuovere.

<details>
<summary>💡 Mostra suggerimento</summary>

**Struttura dello script:**
```python
# scripts/compare_prompts.py
import sys, yaml, anthropic

def esegui_versione(versione, testi):
    # carica la config, esegui ogni testo, restituisci lista di predizioni
    ...

def calcola_metriche(predette, attese):
    # per ogni classe: TP, FP, FN → precision, recall, F1
    # accuracy globale
    metriche = {}
    for classe in set(attese):
        tp = sum(1 for p, a in zip(predette, attese) if p == classe == a)
        fp = sum(1 for p, a in zip(predette, attese) if p == classe and a != classe)
        fn = sum(1 for p, a in zip(predette, attese) if p != classe and a == classe)
        prec = tp / (tp + fp) if (tp + fp) > 0 else 0
        rec  = tp / (tp + fn) if (tp + fn) > 0 else 0
        f1   = 2 * prec * rec / (prec + rec) if (prec + rec) > 0 else 0
        metriche[classe] = {"precision": prec, "recall": rec, "f1": f1}
    return metriche

def genera_report(v1, v2, m1, m2):
    # tabella markdown con le metriche a confronto
    # raccomandazione: promuovi la versione con F1 migliore
    ...

v1, v2 = sys.argv[1], sys.argv[2]
# esegui, calcola, stampa report
```

</details>

---

<details>
<summary>⚙️ Approfondimento Avanzato</summary>

### Integrazione con GitHub Actions

```yaml
# .github/workflows/test-prompts.yml
name: Test Prompt Regressions

on:
  pull_request:
    paths:
      - 'prompts/**'
      - 'tests/test_*prompt*.py'

jobs:
  test-prompts:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.11' }
      - run: pip install anthropic pytest pyyaml
      - run: pytest tests/ -v --tb=short
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

Ogni PR che tocca i prompt deve passare i test di regressione prima di essere mergiabile.

### Test A/B completo (script completo)

```python
#!/usr/bin/env python3
EVAL_SET = [
    ("Prodotto ottimo!", "POSITIVO"), ("Pessimo", "NEGATIVO"),
    ("Nella media", "NEUTRO"), # ... 20 esempi totali
]

def genera_report(v1, v2, m1, m2):
    acc1 = m1.pop("__accuracy__")
    acc2 = m2.pop("__accuracy__")
    lines = [f"# Confronto: {v1} vs {v2}",
             f"**Accuracy**: {v1}={acc1:.1%}, {v2}={acc2:.1%}",
             "| Categoria | P v1 | P v2 | R v1 | R v2 | F1 v1 | F1 v2 |",
             "|-----------|-----|-----|-----|-----|------|------|"]
    for cat in sorted(m1):
        lines.append(f"| {cat} | {m1[cat]['precision']:.1%} | {m2[cat]['precision']:.1%} | "
                     f"{m1[cat]['recall']:.1%} | {m2[cat]['recall']:.1%} | "
                     f"{m1[cat]['f1']:.1%} | {m2[cat]['f1']:.1%} |")
    vincitore = v2 if acc2 > acc1 else v1
    lines.append(f"\n**Raccomandazione**: promuovi `{vincitore}`")
    return "\n".join(lines)
```

</details>

---

## Connessioni

- **Lezione precedente**: [Prompt come Artefatti](07-04-prompt-come-artefatti) — questa lezione costruisce un sistema di versioning su quella base
- **Capitolo 2**: [GitHub Actions e CI/CD](../capitolo-02-git-github/02-04-github-actions-cicd) — i test di regressione dei prompt girano in CI come qualsiasi test del codice
- **Capitolo 8**: [Testing e Valutazione degli LLM](../capitolo-08-workflow-multi-agente/08-06-testing-evals) — le eval di questa lezione sono un sottoinsieme degli strumenti di valutazione LLM
- **Capitolo 9**: [Governance e Versioning](../capitolo-09-sistemi-auto-evolutivi/09-04-governance-versioning) — il versioning dei prompt è parte della governance di un sistema AI in produzione
