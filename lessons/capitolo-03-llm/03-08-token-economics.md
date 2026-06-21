---
titolo: "Token Economics e Costi"
durata_stimata: "20 min"
difficolta: "Intermedio"
---

# Token Economics e Costi

Un agente AI che funziona bene ma costa 500€ al giorno non è un prodotto — è un problema. Capire come vengono calcolati i costi è parte integrante del mestiere.

## Come Funziona il Pricing

I provider LLM addebitano per **token consumati**, separando input e output:

```
Costo totale = (token_input × prezzo_input) + (token_output × prezzo_output)
```

L'output costa sempre di più dell'input — generare testo richiede più compute che elaborarlo.

## Prezzi Attuali (riferimento 2025–2026)

| Modello | Input (per 1M token) | Output (per 1M token) |
|---------|---------------------|-----------------------|
| Claude Haiku 4.5 | ~$0,80 | ~$4,00 |
| Claude Sonnet 4.6 | ~$3,00 | ~$15,00 |
| Claude Opus 4.8 | ~$15,00 | ~$75,00 |
| GPT-4o | ~$2,50 | ~$10,00 |
| GPT-4o mini | ~$0,15 | ~$0,60 |
| Gemini 1.5 Flash | ~$0,075 | ~$0,30 |

> I prezzi cambiano frequentemente — verifica sempre sul sito del provider prima di fare stime.

La differenza tra il modello più economico e il più costoso è di 100–200x. La scelta del modello è una decisione economica prima ancora che tecnica.

## Il Problema dell'Input Accumulato

In una conversazione multi-turno, **ogni chiamata reinvia tutta la cronologia**. Non solo il nuovo messaggio.

```
Turno 1: 500 token input → costo base
Turno 2: 500 + 400 (risposta 1) = 900 token input
Turno 3: 900 + 600 (risposta 2) = 1.500 token input
...
Turno 10: potenzialmente 8.000+ token input
```

Questo significa che il costo per turno cresce nel tempo. Un chatbot con conversazioni lunghe può costare 10x di più del previsto se non si gestisce il context.

## Prompt Caching: il Moltiplicatore di Risparmio

Anthropic e altri provider offrono il **prompt caching**: se una parte del prompt (es. il system prompt o un documento di riferimento) rimane identica tra chiamate, il provider la memorizza e addebita una tariffa ridotta per le chiamate successive.

Con Anthropic:
- Token in cache costano **~10% del prezzo normale** in input
- Il cache dura tipicamente 5 minuti (refresh con ogni utilizzo)
- Riduzione di latenza del 30–40%

```python
system=[{
    "type": "text",
    "text": very_long_system_prompt,  # 2.000 token
    "cache_control": {"type": "ephemeral"}
}]
# Prima chiamata: 2.000 token a prezzo pieno
# Chiamate successive entro 5 min: 2.000 × 10% = 200 token equivalenti
```

Per un sistema con 1.000 chiamate al giorno con system prompt da 2.000 token, il risparmio può essere dell'80–90% sulla voce system prompt.

## Stimare il Costo di un Sistema

Esempio pratico: chatbot di supporto.

```
Assunzioni:
- 1.000 conversazioni/giorno
- 5 turni medi per conversazione
- System prompt: 500 token (in cache)
- Media per turno: 800 token input + 400 token output

Calcolo input per turno (senza caching storico):
  Turno 1: 500 (sys) + 200 (user) = 700 → in cache: ~70 + 200 = 270
  Turno 2: 500 + 200 + 400 + 200 = 1.300 → ~130 + 800 = 930
  ...
  Media semplificata: ~600 token input effettivi + 400 output

Costo per conversazione (Claude Sonnet):
  Input: 600 × 5 turni × $3/1M = $0,009
  Output: 400 × 5 turni × $15/1M = $0,030
  Totale per conversazione: ~$0,039

Costo/giorno: 1.000 × $0,039 = $39/giorno → ~$1.200/mese
```

Con Claude Haiku 4.5 lo stesso sistema costerebbe ~$200/mese. Con GPT-4o mini, ~$80/mese.

## La Matrice Qualità–Costo

Non esiste il modello "migliore in assoluto" — esiste il modello giusto per ogni task.

```
                    QUALITÀ
                  Bassa │ Alta
            ─────────────────────
       Basso │  Haiku  │ Sonnet  │
  COSTO      │  Flash  │ GPT-4o  │
       ─────────────────────────
       Alto  │    ─    │ Opus    │
             │         │ GPT-4   │
```

**Strategia comune in produzione**: routing intelligente.
- Task semplici (classificazione, estrazione, FAQ) → modello economico
- Task complessi (ragionamento, codice, analisi) → modello potente
- Risparmio tipico: 60–80% rispetto all'uso del solo modello potente

```python
def route_to_model(task_complexity):
    if task_complexity == "simple":
        return "claude-haiku-4-5-20251001"
    elif task_complexity == "medium":
        return "claude-sonnet-4-6"
    else:
        return "claude-opus-4-8"
```

## Ottimizzazioni Pratiche

**1. Comprimi i system prompt** — ogni parola in più costa. Un system prompt da 500 token invece di 2.000 riduce il costo base del 75%.

**2. Usa streaming con early stopping** — se l'utente interrompe la lettura, puoi smettere di generare e non pagare per i token non inviati.

**3. Imposta max_tokens** — senza un limite, il modello può generare risposte lunghissime. Settare `max_tokens=500` per task dove non serve la lunghezza risparmia output inutile.

**4. Batch quando possibile** — molte API supportano batch processing con sconti del 50% sulla latenza non è critica.

**5. Monitora sempre** — implementa logging dell'usage in produzione. I picchi di costo imprevisti sono segnali di bug (loop infiniti, context non gestito, etc.).

---

## Esercizi Pratici

> Tre esercizi a difficoltà crescente. Prova a risolverli da solo prima di aprire la soluzione.

### Esercizio 1 — Stima un Budget 🟢 Base

Stai costruendo un tool di riassunto email per un team di 10 persone. Ogni persona elabora 50 email al giorno. Ogni email ha in media 300 parole in input (≈400 token) e il riassunto è di 50 parole (≈70 token). Il system prompt è 200 token (in cache). Stima il costo mensile con Claude Haiku 4.5 ($0,80/1M input, $4,00/1M output).

<details>
<summary>💡 Mostra soluzione</summary>

```
Chiamate/giorno: 10 persone × 50 email = 500 chiamate
Token input per chiamata: 200 (sys, in cache ≈20) + 400 (email) = 420 effettivi
Token output per chiamata: 70

Costo input/giorno: 500 × 420 / 1.000.000 × $0,80 = $0,168
Costo output/giorno: 500 × 70 / 1.000.000 × $4,00 = $0,140

Totale/giorno: $0,308
Totale/mese (22 giorni lavorativi): $0,308 × 22 ≈ $6,80/mese
```

Praticamente gratuito. Per questo tipo di task semplice e ripetitivo, i modelli economici sono perfetti.

</details>

---

### Esercizio 2 — Ottimizza il Costo 🟡 Intermedio

Un agente di analisi del codice usa Claude Opus 4.8 ($15/1M input, $75/1M output) per tutti i task. Analizza 200 PR al giorno. Ogni analisi ha: system prompt 1.000 token, codice del PR in media 3.000 token, output medio 800 token. Il costo mensile attuale è troppo alto. Proponi una strategia di ottimizzazione che mantenga la qualità su PR complessi ma riduca il costo.

<details>
<summary>💡 Mostra soluzione</summary>

**Costo attuale**:
- Input per PR: 1.000 + 3.000 = 4.000 token
- Output per PR: 800 token
- Costo per PR: (4.000 × $15 + 800 × $75) / 1.000.000 = $0,12
- Costo/mese (22 giorni): 200 × 22 × $0,12 = **$528/mese**

**Strategia ottimizzata**:

1. **Prompt caching** sul system prompt (1.000 token → ~100 equivalenti):
   risparmio immediato del ~20%

2. **Routing per dimensione PR**:
   - PR piccoli (<500 token di diff, ~60% dei PR): usa Sonnet ($3/$15)
   - PR grandi (>500 token, ~40% dei PR): mantieni Opus

3. **Calcolo dopo ottimizzazione**:
   - 120 PR/giorno con Sonnet: (4.000×$3 + 800×$15)/1M = $0,024/PR
   - 80 PR/giorno con Opus + caching: (3.100×$15 + 800×$75)/1M = $0,107/PR
   - Costo/mese: 22 × (120×$0,024 + 80×$0,107) = 22 × ($2,88 + $8,56) = **$251/mese**

Risparmio: ~52% mantenendo Opus dove serve davvero.

</details>

---

### Esercizio 3 — Progetta il Monitoring 🔴 Avanzato

La tua startup ha un budget mensile di $500 per le API LLM. Vuoi implementare un sistema di monitoring che: (a) tracci il costo in tempo reale, (b) emetta alert quando si supera l'80% del budget, (c) throttli automaticamente le chiamate meno critiche quando ci si avvicina al limite, (d) generi un report giornaliero per analizzare i pattern di consumo. Descrivi l'architettura e scrivi la logica core.

<details>
<summary>💡 Mostra soluzione</summary>

```python
import time
from datetime import datetime, date
from collections import defaultdict

class CostMonitor:
    def __init__(self, monthly_budget_usd=500):
        self.monthly_budget = monthly_budget_usd
        self.daily_costs = defaultdict(float)  # {date: cost}
        self.call_log = []
        self.alert_threshold = 0.8
        self.throttle_threshold = 0.9

    def record_call(self, model, input_tokens, output_tokens, priority="normal"):
        cost = self._calculate_cost(model, input_tokens, output_tokens)
        today = date.today().isoformat()
        self.daily_costs[today] += cost
        self.call_log.append({
            "timestamp": datetime.now().isoformat(),
            "model": model, "cost": cost,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "priority": priority
        })
        self._check_alerts()
        return cost

    def _calculate_cost(self, model, input_tokens, output_tokens):
        prices = {
            "claude-haiku-4-5-20251001":  (0.80, 4.00),
            "claude-sonnet-4-6": (3.00, 15.00),
            "claude-opus-4-8": (15.00, 75.00),
        }
        inp, out = prices.get(model, (3.00, 15.00))
        return (input_tokens * inp + output_tokens * out) / 1_000_000

    def get_month_spend(self):
        month_prefix = date.today().strftime("%Y-%m")
        return sum(v for k, v in self.daily_costs.items() if k.startswith(month_prefix))

    def _check_alerts(self):
        ratio = self.get_month_spend() / self.monthly_budget
        if ratio >= self.throttle_threshold:
            print("⚠️ THROTTLE: disabilitando chiamate a bassa priorità")
        elif ratio >= self.alert_threshold:
            print(f"🔔 ALERT: {ratio*100:.0f}% del budget mensile consumato")

    def should_allow_call(self, priority="normal"):
        ratio = self.get_month_spend() / self.monthly_budget
        if ratio >= self.throttle_threshold and priority != "critical":
            return False  # blocca chiamate non critiche
        return True

    def daily_report(self):
        today = date.today().isoformat()
        today_cost = self.daily_costs.get(today, 0)
        month_cost = self.get_month_spend()
        print(f"📊 Report {today}: oggi ${today_cost:.3f}, mese ${month_cost:.2f}/{self.monthly_budget}")
```

Il pattern chiave è: **misura prima di agire**. Il sistema registra ogni chiamata, calcola il totale corrente, e prende decisioni di throttling basate su soglie predefinite. In produzione, `daily_costs` verrebbe salvato in un database persistente.

</details>

---

## Connessioni

- **Lezione precedente**: [Gestire il Contesto](03-07-gestire-il-contesto) — il context management impatta direttamente i costi
- **Capitolo 4**: [L'API degli LLM](../capitolo-04-strumenti-infrastruttura/04-01-api-llm) — dove vedere usage e costs nelle risposte API
- **Capitolo 7**: [Valutazione e Testing](../capitolo-07-workflow-multi-agente/07-06-testing-evals) — come scegliere il modello giusto in base a benchmark di qualità
- **Capitolo 7**: [Deployment e Ambienti](../capitolo-07-workflow-multi-agente/07-07-deployment) — cost monitoring in produzione
