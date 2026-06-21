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

Nella lezione 07-04 hai visto i prompt come artefatti con frontmatter YAML. Il versioning costruisce su quella base:

```
prompts/
├── classificatore-email/
│   ├── v1.0.0.yaml          # versione iniziale
│   ├── v1.1.0.yaml          # miglioramento del sistema prompt
│   ├── v2.0.0.yaml          # cambio modello e struttura output
│   └── current -> v2.0.0.yaml  # symlink alla versione attiva
│
├── estrattore-entita/
│   ├── v1.0.0.yaml
│   └── current -> v1.0.0.yaml
│
└── CHANGELOG.md             # storia delle modifiche significative
```

Un file di prompt versionato:

```yaml
# prompts/classificatore-email/v2.0.0.yaml
---
id: classificatore-email
version: "2.0.0"
created: "2026-01-15"
author: "team-backend"
modello: "claude-haiku-4-5-20251001"
max_tokens: 50
temperatura: 0

changelog:
  - version: "2.0.0"
    data: "2026-01-15"
    autore: "marco"
    note: "Aggiunta categoria SPAM, migliora accuracy del 12%"
  - version: "1.1.0"
    data: "2025-12-01"
    autore: "sara"
    note: "Aggiunto few-shot per ridurre falsi negativi su URGENTE"

system: |
  Classifica l'email ricevuta in una di queste categorie:
  URGENTE, NORMALE, BASSA_PRIORITA, SPAM
  
  Regole:
  - URGENTE: sistema down, perdita dati, blocco produzione
  - NORMALE: richieste standard, domande, feedback
  - BASSA_PRIORITA: suggerimenti, feature request
  - SPAM: promozioni, phishing, contenuto irrilevante
  
  Rispondi SOLO con la categoria, nessun altro testo.

examples:
  - input: "Il server è completamente irraggiungibile da stamattina"
    output: "URGENTE"
  - input: "Come posso cambiare la mia password?"
    output: "NORMALE"
  - input: "Sarebbe bello avere la dark mode"
    output: "BASSA_PRIORITA"
  - input: "Congratulazioni! Hai vinto un iPhone!"
    output: "SPAM"
```

## Caricamento e Utilizzo dei Prompt Versionati

```python
# prompt_loader.py
import yaml
import anthropic
from pathlib import Path

PROMPTS_DIR = Path("prompts")

def carica_prompt(nome: str, versione: str = "current") -> dict:
    """Carica un prompt dalla libreria."""
    if versione == "current":
        # Leggi la versione corrente dal file di configurazione
        config_file = PROMPTS_DIR / nome / "current.txt"
        versione = config_file.read_text().strip()
    
    filepath = PROMPTS_DIR / nome / f"{versione}.yaml"
    if not filepath.exists():
        raise FileNotFoundError(f"Prompt {nome}@{versione} non trovato")
    
    with open(filepath) as f:
        return yaml.safe_load(f)

def esegui_prompt(nome: str, user_input: str, versione: str = "current") -> str:
    """Esegue un prompt dalla libreria."""
    client = anthropic.Anthropic()
    prompt_config = carica_prompt(nome, versione)
    
    kwargs = {
        "model": prompt_config["modello"],
        "max_tokens": prompt_config["max_tokens"],
        "messages": [{"role": "user", "content": user_input}],
    }
    
    if "system" in prompt_config:
        kwargs["system"] = prompt_config["system"]
    
    risposta = client.messages.create(**kwargs)
    return risposta.content[0].text.strip()

# Uso
categoria = esegui_prompt("classificatore-email", "Il server è down!")
print(categoria)  # URGENTE

# Test A/B: confronta due versioni
v1 = esegui_prompt("classificatore-email", "Il server è down!", versione="v1.1.0")
v2 = esegui_prompt("classificatore-email", "Il server è down!", versione="v2.0.0")
print(f"v1.1.0: {v1}, v2.0.0: {v2}")
```

## Test di Regressione per i Prompt

Ogni volta che modifichi un prompt, devi verificare che non abbia peggiorato i casi che già funzionavano. Serve una **suite di test** collegata al prompt:

```python
# tests/test_classificatore_email.py
import pytest
from prompt_loader import esegui_prompt

# Casi di test con expected output
CASI_TEST = [
    ("Il sistema di login non funziona per nessuno", "URGENTE"),
    ("Il database è irraggiungibile", "URGENTE"),
    ("Come cambio la mia password?", "NORMALE"),
    ("Ho una domanda sulla fattura di marzo", "NORMALE"),
    ("Sarebbe bello avere il tema scuro", "BASSA_PRIORITA"),
    ("Aggiungi il supporto per il CSV", "BASSA_PRIORITA"),
    ("Congratulazioni! Hai vinto!", "SPAM"),
    ("Clicca qui per il tuo premio", "SPAM"),
]

@pytest.mark.parametrize("input_email,expected", CASI_TEST)
def test_classificatore_v2(input_email, expected):
    risultato = esegui_prompt("classificatore-email", input_email, versione="v2.0.0")
    assert risultato == expected, f"Input: '{input_email}' → Got '{risultato}', expected '{expected}'"

def test_regressione_vs_v1():
    """Verifica che v2 non sia peggiorata rispetto a v1 sui casi storici."""
    casi_v1 = [
        ("Server down", "URGENTE"),
        ("Cambio password", "NORMALE"),
    ]
    for input_email, expected in casi_v1:
        v1 = esegui_prompt("classificatore-email", input_email, versione="v1.1.0")
        v2 = esegui_prompt("classificatore-email", input_email, versione="v2.0.0")
        assert v2 == expected, f"Regressione! v1={v1}, v2={v2} per '{input_email}'"
```

```bash
# Esegui i test prima di fare merge di una nuova versione del prompt
pytest tests/test_classificatore_email.py -v
```

## Workflow di Modifica di un Prompt

```
1. Crea un branch Git: git checkout -b prompt/classificatore-v2.1

2. Copia la versione corrente e modifica:
   cp prompts/classificatore-email/v2.0.0.yaml prompts/classificatore-email/v2.1.0.yaml
   # modifica v2.1.0.yaml

3. Esegui i test di regressione:
   pytest tests/test_classificatore_email.py -v

4. Se i test passano, aggiorna il puntatore "current":
   echo "v2.1.0" > prompts/classificatore-email/current.txt

5. Commit e PR:
   git add prompts/ tests/
   git commit -m "prompt(classificatore-email): aggiunge categoria INTERNO v2.1.0"
   gh pr create

6. Code review del prompt (sì, i prompt vanno in review come il codice)

7. Merge → deploy automatico
```

## Integrazione con GitHub Actions

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
        with:
          python-version: '3.11'
      - run: pip install anthropic pytest pyyaml
      - run: pytest tests/ -v --tb=short
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

Ogni PR che tocca i prompt deve passare i test di regressione prima di essere mergiabile.

## Semantic Versioning per i Prompt

Adotta lo stesso schema `MAJOR.MINOR.PATCH` del software:

| Tipo di cambio | Versione | Esempi |
|---|---|---|
| Breaking change | MAJOR (2.0.0) | Cambia formato output, cambia modello base, rimuove categorie |
| Nuova funzionalità | MINOR (1.1.0) | Aggiunge categoria, migliora few-shot, aggiunge regole |
| Fix | PATCH (1.0.1) | Corregge typo, chiarisce una regola ambigua |

---

## Esercizi Pratici

> Tre esercizi a difficoltà crescente. Prova a risolverli da solo prima di aprire la soluzione.

### Esercizio 1 — Struttura una Libreria di Prompt 🟢 Base

Crea una struttura di cartelle per una libreria con 3 prompt (classificatore, estrattore, risposta-automatica). Per ciascuno scrivi un file YAML v1.0.0 con frontmatter completo (id, versione, modello, system, 3 examples). Crea il file `current.txt` per ciascuno.

<details>
<summary>💡 Mostra soluzione</summary>

```bash
mkdir -p prompts/{classificatore,estrattore,risposta-automatica}

# current.txt per ogni prompt
echo "v1.0.0" > prompts/classificatore/current.txt
echo "v1.0.0" > prompts/estrattore/current.txt
echo "v1.0.0" > prompts/risposta-automatica/current.txt
```

```yaml
# prompts/classificatore/v1.0.0.yaml
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

```yaml
# prompts/estrattore/v1.0.0.yaml
---
id: estrattore
version: "1.0.0"
created: "2026-06-01"
author: "team"
modello: "claude-haiku-4-5-20251001"
max_tokens: 100

system: |
  Estrai dal testo: nome, email, problema.
  Rispondi in JSON: {"nome": "...", "email": "...", "problema": "..."}
  Se un campo non è presente usa null.

examples:
  - input: "Ciao sono Marco (marco@email.com), ho un problema con il login"
    output: '{"nome": "Marco", "email": "marco@email.com", "problema": "problema con il login"}'
  - input: "Il mio ordine non è arrivato"
    output: '{"nome": null, "email": null, "problema": "ordine non arrivato"}'
  - input: "Sara Rossi: sara@test.it - app crashata"
    output: '{"nome": "Sara Rossi", "email": "sara@test.it", "problema": "app crashata"}'
```

</details>

---

### Esercizio 2 — Suite di Test di Regressione 🟡 Intermedio

Scrivi una suite pytest per il tuo classificatore con: (a) 10 casi di test parametrizzati, (b) un test che confronta la versione corrente con la precedente e fallisce se l'accuracy è peggiorata di più del 5%, (c) un test che verifica il tempo di risposta medio sia sotto i 3 secondi.

<details>
<summary>💡 Mostra soluzione</summary>

```python
# tests/test_classificatore.py
import pytest
import time
import yaml
import anthropic
from pathlib import Path

client = anthropic.Anthropic()

def esegui(versione: str, testo: str) -> str:
    with open(f"prompts/classificatore/{versione}.yaml") as f:
        cfg = yaml.safe_load(f)
    r = client.messages.create(
        model=cfg["modello"], max_tokens=cfg["max_tokens"],
        system=cfg["system"],
        messages=[{"role": "user", "content": testo}]
    )
    return r.content[0].text.strip()

CASI = [
    ("Prodotto fantastico, lo ricomprerei!", "POSITIVO"),
    ("Ottima qualità, consegna veloce", "POSITIVO"),
    ("Soddisfatto al 100%", "POSITIVO"),
    ("Supera le aspettative", "POSITIVO"),
    ("Pessima qualità, si è rotto subito", "NEGATIVO"),
    ("Deluso, non corrisponde alla descrizione", "NEGATIVO"),
    ("Soldi sprecati", "NEGATIVO"),
    ("Non funziona come promesso", "NEGATIVO"),
    ("Nella media, niente di speciale", "NEUTRO"),
    ("Ok, né bello né brutto", "NEUTRO"),
]

@pytest.mark.parametrize("testo,expected", CASI)
def test_classificatore_corrente(testo, expected):
    risultato = esegui("v1.0.0", testo)
    assert risultato == expected

def test_no_regressione_vs_precedente():
    """v1.0.0 non deve avere accuracy inferiore di 5% rispetto a sé stessa (test struttura)."""
    corretti_attuale = sum(1 for t, e in CASI if esegui("v1.0.0", t) == e)
    accuracy = corretti_attuale / len(CASI)
    assert accuracy >= 0.95, f"Accuracy {accuracy:.0%} sotto soglia del 95%"

def test_latenza_media():
    tempi = []
    for testo, _ in CASI[:5]:  # solo 5 per velocità
        inizio = time.perf_counter()
        esegui("v1.0.0", testo)
        tempi.append(time.perf_counter() - inizio)
    media = sum(tempi) / len(tempi)
    assert media < 3.0, f"Latenza media {media:.1f}s supera soglia di 3s"
```

</details>

---

### Esercizio 3 — Confronto A/B Automatizzato 🔴 Avanzato

Scrivi uno script che: (a) prende due versioni di un prompt come argomenti CLI, (b) le esegue su un eval set di 20 esempi, (c) calcola precision/recall/F1 per categoria (non solo accuracy globale), (d) genera un report Markdown con la tabella comparativa e una raccomandazione su quale versione promuovere.

<details>
<summary>💡 Mostra soluzione</summary>

```python
#!/usr/bin/env python3
# scripts/compare_prompts.py
import sys
import yaml
import anthropic
from collections import defaultdict

client = anthropic.Anthropic()

EVAL_SET = [
    ("Prodotto ottimo!", "POSITIVO"), ("Servizio eccellente", "POSITIVO"),
    ("Qualità top", "POSITIVO"), ("Soddisfatto", "POSITIVO"),
    ("Consegna rapida e precisa", "POSITIVO"),
    ("Pessimo", "NEGATIVO"), ("Non funziona", "NEGATIVO"),
    ("Deluso profondamente", "NEGATIVO"), ("Spreco di soldi", "NEGATIVO"),
    ("Rotto al primo utilizzo", "NEGATIVO"),
    ("Nella media", "NEUTRO"), ("Niente di speciale", "NEUTRO"),
    ("Ok, accettabile", "NEUTRO"), ("Come atteso", "NEUTRO"),
    ("Né bello né brutto", "NEUTRO"),
    ("Fantastico prodotto!!!", "POSITIVO"), ("Terribile", "NEGATIVO"),
    ("Mediocre", "NEUTRO"), ("Superbo", "POSITIVO"), ("Inutile", "NEGATIVO"),
]

def esegui_versione(versione: str, testi: list[str]) -> list[str]:
    with open(f"prompts/classificatore/{versione}.yaml") as f:
        cfg = yaml.safe_load(f)
    risultati = []
    for testo in testi:
        r = client.messages.create(
            model=cfg["modello"], max_tokens=cfg["max_tokens"],
            system=cfg["system"],
            messages=[{"role": "user", "content": testo}]
        )
        risultati.append(r.content[0].text.strip())
    return risultati

def calcola_metriche(predette: list, attese: list) -> dict:
    classi = set(attese)
    metriche = {}
    for classe in classi:
        tp = sum(1 for p, a in zip(predette, attese) if p == classe == a)
        fp = sum(1 for p, a in zip(predette, attese) if p == classe and a != classe)
        fn = sum(1 for p, a in zip(predette, attese) if p != classe and a == classe)
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0
        f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0
        metriche[classe] = {"precision": precision, "recall": recall, "f1": f1}
    accuracy = sum(1 for p, a in zip(predette, attese) if p == a) / len(attese)
    metriche["__accuracy__"] = accuracy
    return metriche

def genera_report(v1: str, v2: str, m1: dict, m2: dict) -> str:
    acc1, acc2 = m1.pop("__accuracy__"), m2.pop("__accuracy__")
    lines = [f"# Confronto Prompt: {v1} vs {v2}\n",
             f"**Accuracy**: {v1}={acc1:.1%}, {v2}={acc2:.1%}\n",
             "| Categoria | Precision v1 | Precision v2 | Recall v1 | Recall v2 | F1 v1 | F1 v2 |",
             "|-----------|-------------|-------------|----------|----------|-------|-------|"]
    for cat in sorted(m1.keys()):
        lines.append(
            f"| {cat} | {m1[cat]['precision']:.1%} | {m2[cat]['precision']:.1%} | "
            f"{m1[cat]['recall']:.1%} | {m2[cat]['recall']:.1%} | "
            f"{m1[cat]['f1']:.1%} | {m2[cat]['f1']:.1%} |"
        )
    vincitore = v2 if acc2 > acc1 else v1
    diff = abs(acc2 - acc1)
    lines.append(f"\n**Raccomandazione**: promuovi `{vincitore}` (differenza: {diff:.1%})")
    if diff < 0.05:
        lines.append("\n⚠️ Differenza < 5%: considera altri fattori (costo, latenza, edge case).")
    return "\n".join(lines)

if __name__ == "__main__":
    v1, v2 = sys.argv[1], sys.argv[2]
    testi = [t for t, _ in EVAL_SET]
    attese = [a for _, a in EVAL_SET]
    pred1 = esegui_versione(v1, testi)
    pred2 = esegui_versione(v2, testi)
    m1 = calcola_metriche(pred1, attese)
    m2 = calcola_metriche(pred2, attese)
    report = genera_report(v1, v2, m1, m2)
    print(report)
    with open(f"report_{v1}_vs_{v2}.md", "w") as f:
        f.write(report)
```

```bash
python scripts/compare_prompts.py v1.0.0 v2.0.0
```

</details>

---

## Connessioni

- **Lezione precedente**: [Prompt come Artefatti](07-04-prompt-come-artefatti) — questa lezione costruisce un sistema di versioning su quella base
- **Capitolo 2**: [GitHub Actions e CI/CD](../capitolo-02-git-github/02-04-github-actions-cicd) — i test di regressione dei prompt girano in CI come qualsiasi test del codice
- **Capitolo 8**: [Testing e Valutazione degli LLM](../capitolo-08-workflow-multi-agente/08-06-testing-evals) — le eval di questa lezione sono un sottoinsieme degli strumenti di valutazione LLM
- **Capitolo 9**: [Governance e Versioning](../capitolo-09-sistemi-auto-evolutivi/09-04-governance-versioning) — il versioning dei prompt è parte della governance di un sistema AI in produzione
