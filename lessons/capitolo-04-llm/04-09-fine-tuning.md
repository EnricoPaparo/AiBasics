---
titolo: "Fine-Tuning: Quando e Come"
durata_stimata: "20 min"
difficolta: "Intermedio"
---

# Fine-Tuning: Quando e Come

Una delle domande più comuni quando si lavora con gli LLM è: "Dovrei fare fine-tuning del modello per il mio caso d'uso?" La risposta è quasi sempre: **prima prova il prompting, poi il RAG, e solo se entrambi non bastano considera il fine-tuning**. Questa lezione spiega perché, e come fare fine-tuning quando ha davvero senso.

## Cos'è il Fine-Tuning (in Breve)

Il **fine-tuning** (già introdotto nella lezione 04-02) è il processo di continuare l'addestramento di un modello pre-addestrato su un dataset specifico, aggiornando i pesi della rete neurale per specializzarla su un dominio o compito preciso.

Detto in modo più concreto: prendi un modello come Claude o GPT-4, gli mostri migliaia di esempi del formato "input → output ideale" che vuoi, e i pesi del modello vengono aggiornati per replicare quel comportamento.

## Il Triangolo delle Decisioni

Prima di valutare il fine-tuning, chiediti se hai già provato le alternative:

```
                    HAI UN PROBLEMA SPECIFICO?
                            │
                ┌───────────┴───────────┐
                │                       │
        È risolvibile              Richiede conoscenza
        con un buon prompt?        specifica di dominio?
                │                       │
               SÌ → usa il prompting   SÌ → prova RAG prima
                │                       │
        Ancora non basta?        RAG non basta?
                │                       │
                └───────────┬───────────┘
                            │
                    VALUTA FINE-TUNING
```

### Quando il Prompting è Sufficiente

Il prompting (e il few-shot prompting in particolare) risolve il 80% dei casi:

```python
# Few-shot prompting: dai esempi nel prompt stesso
system = """Sei un assistente che classifica le email del supporto clienti.
Rispondi SOLO con una di queste categorie: URGENTE, NORMALE, BASSA_PRIORITA

Esempi:
Email: "Il sistema è completamente bloccato, non possiamo lavorare"
Categoria: URGENTE

Email: "Avrei una domanda sulla fatturazione del mese scorso"
Categoria: NORMALE

Email: "Sarebbe carino avere la dark mode nell'app"
Categoria: BASSA_PRIORITA"""
```

Se questo funziona, non hai bisogno di fine-tuning.

### Quando il RAG è Sufficiente

Se il problema è che il modello "non sa" cose specifiche del tuo dominio (documentazione interna, prodotti, procedure), il RAG (lezione 05-03) è quasi sempre la soluzione giusta. Il RAG è:
- **Aggiornabile** senza riaddestrare il modello
- **Economico** da implementare
- **Trasparente** (puoi vedere quali documenti ha usato)

### Quando il Fine-Tuning Ha Senso

Il fine-tuning è utile quando:

1. **Il formato dell'output è molto specifico** e difficile da ottenere con il prompting (es. JSON con schema complesso, codice in un dialetto proprietario, stile di scrittura molto particolare)

2. **Hai bisogno di ridurre la latenza** — un modello più piccolo fine-tunato può essere più veloce e economico di un modello grande con prompt lungo

3. **Il comportamento deve essere assolutamente consistente** su migliaia di richieste simili

4. **Hai dati di training di alta qualità** — migliaia di coppie input/output verificate da esperti umani

5. **Il RAG non funziona** perché la conoscenza è troppo implicita o procedurale (non è "un documento da recuperare", è "un modo di ragionare")

**Quando NON fare fine-tuning:**
- Hai meno di 100-200 esempi di training (non basta)
- Non hai un processo per valutare i risultati (come sai che è migliorato?)
- Il prompt con few-shot examples già funziona bene
- Hai bisogno che il modello "sappia" fatti che cambiano nel tempo (usa RAG)

## Come si Fa il Fine-Tuning Praticamente

### Preparare i Dati

Il formato standard è JSONL (JSON Lines): ogni riga è un esempio di training.

```jsonl
{"messages": [{"role": "user", "content": "Classifica: 'Il server è down'"}, {"role": "assistant", "content": "URGENTE"}]}
{"messages": [{"role": "user", "content": "Classifica: 'Come cambio la password?'"}, {"role": "assistant", "content": "NORMALE"}]}
{"messages": [{"role": "user", "content": "Classifica: 'Aggiungete il supporto per il tema scuro'"}, {"role": "assistant", "content": "BASSA_PRIORITA"}]}
```

**Qualità vs Quantità**: 500 esempi perfetti valgono più di 5000 esempi mediocri. Il fine-tuning amplifica i pattern dei dati — inclusi gli errori.

### Quantità Minima di Esempi

Come regola pratica:

| Compito | Esempi minimi | Esempi ideali |
|---------|--------------|---------------|
| Classificazione semplice (3-5 classi) | 100-200 | 500-1000 |
| Estrazione strutturata | 200-500 | 1000-2000 |
| Generazione in stile specifico | 500-1000 | 2000-5000 |
| Compiti complessi multi-step | 1000+ | 5000+ |

### Fine-Tuning con OpenAI (Esempio Pratico)

Anthropic non offre ancora fine-tuning diretto via API — per modelli fine-tunabili si usano tipicamente OpenAI o provider open source (Mistral, Llama via Replicate/Modal).

```python
from openai import OpenAI

client = OpenAI()

# Step 1: carica il file di training
with open("training_data.jsonl", "rb") as f:
    risposta = client.files.create(file=f, purpose="fine-tune")
    file_id = risposta.id

# Step 2: avvia il fine-tuning
job = client.fine_tuning.jobs.create(
    training_file=file_id,
    model="gpt-4o-mini",  # modello base economico da fine-tunare
    hyperparameters={
        "n_epochs": 3,  # quante volte scorrere il dataset
    }
)
print(f"Job avviato: {job.id}")

# Step 3: monitora il progresso
import time
while True:
    stato = client.fine_tuning.jobs.retrieve(job.id)
    print(f"Stato: {stato.status}")
    if stato.status in ["succeeded", "failed"]:
        break
    time.sleep(30)

# Step 4: usa il modello fine-tunato
if stato.status == "succeeded":
    modello_ft = stato.fine_tuned_model
    risposta = client.chat.completions.create(
        model=modello_ft,
        messages=[{"role": "user", "content": "Classifica: 'App crashata'"}]
    )
    print(risposta.choices[0].message.content)
```

### Fine-Tuning con Modelli Open Source

Con modelli open source (Llama, Mistral, Phi) puoi fare fine-tuning in locale con tecniche efficienti come **LoRA** (Low-Rank Adaptation) che aggiornano solo una piccola parte dei pesi:

```python
# Con la libreria Hugging Face + PEFT (Parameter-Efficient Fine-Tuning)
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import LoraConfig, get_peft_model

modello = AutoModelForCausalLM.from_pretrained("mistralai/Mistral-7B-v0.1")
tokenizer = AutoTokenizer.from_pretrained("mistralai/Mistral-7B-v0.1")

# LoRA: aggiorna solo il 0.1-1% dei parametri
config_lora = LoraConfig(
    r=16,           # rank della decomposizione
    lora_alpha=32,
    target_modules=["q_proj", "v_proj"],
    lora_dropout=0.05,
)
modello_lora = get_peft_model(modello, config_lora)
modello_lora.print_trainable_parameters()
# "trainable params: 6,815,744 || all params: 3,753,516,032 || trainable%: 0.18"
```

## Valutare il Fine-Tuning

Come sai se il fine-tuning ha funzionato? Hai bisogno di una **eval set** — un insieme di esempi separati dal training, con le risposte corrette attese:

```python
def valuta_modello(modello_id: str, eval_set: list) -> dict:
    client = OpenAI()
    corretti = 0
    
    for esempio in eval_set:
        risposta = client.chat.completions.create(
            model=modello_id,
            messages=[{"role": "user", "content": esempio["input"]}]
        )
        output = risposta.choices[0].message.content.strip()
        if output == esempio["expected"]:
            corretti += 1
    
    return {
        "accuracy": corretti / len(eval_set),
        "n_esempi": len(eval_set),
    }

# Confronta modello base vs fine-tunato
base = valuta_modello("gpt-4o-mini", eval_set)
ft = valuta_modello("ft:gpt-4o-mini:...", eval_set)

print(f"Base: {base['accuracy']:.1%}")
print(f"Fine-tunato: {ft['accuracy']:.1%}")
print(f"Miglioramento: {(ft['accuracy'] - base['accuracy']):.1%}")
```

---

## Esercizi Pratici

> Tre esercizi a difficoltà crescente. Prova a risolverli da solo prima di aprire la soluzione.

### Esercizio 1 — Diagnosi: Fine-Tuning o No? 🟢 Base

Per ciascuno dei seguenti scenari, decidi se il fine-tuning è la soluzione giusta o se c'è un'alternativa migliore. Motiva la risposta:

1. Un'azienda vuole che il chatbot risponda sempre in italiano formale, anche se l'utente scrive in inglese
2. Un servizio legale vuole che il modello risponda basandosi solo sui contratti dell'azienda (500 contratti, aggiornati ogni mese)
3. Un'app di e-commerce vuole che il modello classifichi le recensioni in 4 categorie (molto positiva, positiva, negativa, molto negativa) con un'accuracy del 95%
4. Una banca vuole che il modello generi email nel preciso stile formale del loro ufficio compliance

<details>
<summary>💡 Mostra soluzione</summary>

**1. Rispondre in italiano formale** → **Prompting** è sufficiente.
```python
system = "Rispondi sempre in italiano formale, indipendentemente dalla lingua dell'utente."
```
Non serve fine-tuning per cambiare lingua/stile — il prompting gestisce perfettamente questo caso.

**2. Rispondere basandosi sui contratti** → **RAG**, non fine-tuning.
I contratti cambiano ogni mese: il fine-tuning sarebbe da rifare continuamente. Il RAG permette di aggiungere nuovi contratti senza riaddestrare. Il modello non deve "memorizzare" i contratti — deve recuperarli.

**3. Classificazione recensioni al 95%** → **Prova prima il few-shot prompting**, poi valuta fine-tuning.
Con 5-10 esempi nel prompt, un buon modello raggiunge spesso l'85-90%. Se non basta, il fine-tuning con 200-500 esempi annotati manualmente porta al 95%+. Ma misura prima!

**4. Stile email compliance** → **Fine-tuning è ragionevole**.
Lo stile è molto specifico e difficile da descrivere completamente in un prompt. Con 500+ esempi di email reali, il fine-tuning può catturare sfumature di tono, struttura, formulazioni tipiche che il prompting non riesce a replicare con consistenza.

</details>

---

### Esercizio 2 — Preparare un Dataset 🟡 Intermedio

Crea un dataset JSONL per fine-tunare un modello a classificare le segnalazioni di bug in tre categorie: `CRITICO` (sistema non funzionante), `MEDIO` (funzionalità degradata), `BASSO` (problema cosmético). Scrivi 15 esempi (5 per categoria) realistici, poi scrivi una funzione Python che valida il formato del file JSONL prima di caricarlo.

<details>
<summary>💡 Mostra soluzione</summary>

```python
# genera_dataset.py
import json

esempi = [
    # CRITICO
    {"messages": [{"role": "user", "content": "Bug: 'Il login non funziona per nessun utente, tutti ricevono errore 500'"}, {"role": "assistant", "content": "CRITICO"}]},
    {"messages": [{"role": "user", "content": "Bug: 'Il database è irraggiungibile da stamattina'"}, {"role": "assistant", "content": "CRITICO"}]},
    {"messages": [{"role": "user", "content": "Bug: 'I pagamenti vengono rifiutati tutti, il sistema di checkout è bloccato'"}, {"role": "assistant", "content": "CRITICO"}]},
    {"messages": [{"role": "user", "content": "Bug: 'L\\'app si chiude immediatamente all\\'avvio su iOS'"}, {"role": "assistant", "content": "CRITICO"}]},
    {"messages": [{"role": "user", "content": "Bug: 'Perdita di dati: i file caricati scompaiono dopo 10 minuti'"}, {"role": "assistant", "content": "CRITICO"}]},
    # MEDIO
    {"messages": [{"role": "user", "content": "Bug: 'La ricerca avanzata restituisce risultati sbagliati con filtri multipli'"}, {"role": "assistant", "content": "MEDIO"}]},
    {"messages": [{"role": "user", "content": "Bug: 'Le notifiche email arrivano con 2 ore di ritardo'"}, {"role": "assistant", "content": "MEDIO"}]},
    {"messages": [{"role": "user", "content": "Bug: 'Il grafico delle statistiche non si aggiorna in tempo reale'"}, {"role": "assistant", "content": "MEDIO"}]},
    {"messages": [{"role": "user", "content": "Bug: 'Il PDF generato dall\\'esportazione ha i margini sbagliati'"}, {"role": "assistant", "content": "MEDIO"}]},
    {"messages": [{"role": "user", "content": "Bug: 'La funzione di importazione CSV fallisce con file sopra i 10MB'"}, {"role": "assistant", "content": "MEDIO"}]},
    # BASSO
    {"messages": [{"role": "user", "content": "Bug: 'Il pulsante Salva è di colore leggermente diverso su Safari'"}, {"role": "assistant", "content": "BASSO"}]},
    {"messages": [{"role": "user", "content": "Bug: 'Il tooltip appare mezzo pixel fuori posizione'"}, {"role": "assistant", "content": "BASSO"}]},
    {"messages": [{"role": "user", "content": "Bug: 'Il footer della pagina non è centrato su schermi 4K'"}, {"role": "assistant", "content": "BASSO"}]},
    {"messages": [{"role": "user", "content": "Bug: 'L\\'animazione di caricamento ha un piccolo glitch su Chrome'"}, {"role": "assistant", "content": "BASSO"}]},
    {"messages": [{"role": "user", "content": "Bug: 'La favicon non è visibile nella tab su Firefox'"}, {"role": "assistant", "content": "BASSO"}]},
]

# Scrivi il file JSONL
with open("training_bugs.jsonl", "w") as f:
    for esempio in esempi:
        f.write(json.dumps(esempio, ensure_ascii=False) + "\n")

# Funzione di validazione
def valida_jsonl(filepath: str) -> tuple[bool, list[str]]:
    errori = []
    with open(filepath) as f:
        for i, riga in enumerate(f, 1):
            riga = riga.strip()
            if not riga:
                continue
            try:
                obj = json.loads(riga)
            except json.JSONDecodeError as e:
                errori.append(f"Riga {i}: JSON non valido — {e}")
                continue
            
            if "messages" not in obj:
                errori.append(f"Riga {i}: manca 'messages'")
                continue
            
            msgs = obj["messages"]
            if len(msgs) < 2:
                errori.append(f"Riga {i}: servono almeno 2 messaggi (user + assistant)")
                continue
            
            if msgs[0]["role"] != "user" or msgs[-1]["role"] != "assistant":
                errori.append(f"Riga {i}: deve iniziare con 'user' e finire con 'assistant'")
            
            validi = {"CRITICO", "MEDIO", "BASSO"}
            output = msgs[-1]["content"]
            if output not in validi:
                errori.append(f"Riga {i}: output '{output}' non valido, deve essere {validi}")
    
    return len(errori) == 0, errori

ok, errori = valida_jsonl("training_bugs.jsonl")
if ok:
    print("✅ Dataset valido")
else:
    for e in errori:
        print(f"❌ {e}")
```

</details>

---

### Esercizio 3 — Confronto Sistematico 🔴 Avanzato

Progetta un esperimento per confrontare tre approcci su un compito di classificazione a tua scelta: (a) zero-shot prompting, (b) few-shot prompting con 10 esempi nel prompt, (c) fine-tuning (anche simulato se non hai accesso all'API). Definisci le metriche, la dimensione dell'eval set, e scrivi il codice per eseguire il confronto e presentare i risultati in una tabella.

<details>
<summary>💡 Mostra soluzione</summary>

```python
# confronto_approcci.py
import anthropic
import json
import random
from dataclasses import dataclass

client = anthropic.Anthropic()

# Dataset simulato: sentiment di recensioni prodotto
DATASET = [
    ("Prodotto eccellente, supera le aspettative!", "POSITIVO"),
    ("Ottima qualità, lo ricomprerei subito", "POSITIVO"),
    ("Perfetto, esattamente come descritto", "POSITIVO"),
    ("Funziona bene, consegna rapida", "POSITIVO"),
    ("Soddisfatto dell'acquisto, buon rapporto qualità/prezzo", "POSITIVO"),
    ("Prodotto difettoso, si è rotto dopo 2 giorni", "NEGATIVO"),
    ("Deluso, non corrisponde alla descrizione", "NEGATIVO"),
    ("Pessima qualità, soldi sprecati", "NEGATIVO"),
    ("Non funziona come pubblicizzato", "NEGATIVO"),
    ("Assistenza clienti ignora i problemi, inaccettabile", "NEGATIVO"),
    ("Nella media, niente di speciale", "NEUTRO"),
    ("Va bene, né bello né brutto", "NEUTRO"),
    ("Prodotto ordinario, come me lo aspettavo", "NEUTRO"),
    ("Né positivo né negativo, semplicemente ok", "NEUTRO"),
    ("Funziona, ma niente di eccezionale", "NEUTRO"),
]

random.shuffle(DATASET)
train = DATASET[:5]   # per few-shot
eval_set = DATASET[5:]  # per valutazione

@dataclass
class Risultato:
    nome: str
    corretti: int
    totale: int
    
    @property
    def accuracy(self):
        return self.corretti / self.totale

def classifica(testo: str, system_prompt: str) -> str:
    risposta = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=10,
        system=system_prompt,
        messages=[{"role": "user", "content": testo}]
    )
    return risposta.content[0].text.strip()

def valuta(nome: str, system_prompt: str) -> Risultato:
    corretti = 0
    for testo, atteso in eval_set:
        output = classifica(testo, system_prompt)
        if output == atteso:
            corretti += 1
    return Risultato(nome, corretti, len(eval_set))

# Approccio A: zero-shot
zero_shot = "Classifica il sentiment della recensione. Rispondi SOLO con: POSITIVO, NEGATIVO, o NEUTRO."

# Approccio B: few-shot
esempi = "\n".join([f'Recensione: "{t}"\nSentiment: {s}' for t, s in train])
few_shot = f"""Classifica il sentiment delle recensioni. Rispondi SOLO con: POSITIVO, NEGATIVO, o NEUTRO.

Esempi:
{esempi}"""

# Confronto
risultati = [
    valuta("Zero-shot", zero_shot),
    valuta("Few-shot (5 esempi)", few_shot),
]

# Presenta i risultati
print(f"\n{'Approccio':<25} {'Corretti':<10} {'Totale':<10} {'Accuracy':<10}")
print("─" * 55)
for r in risultati:
    print(f"{r.nome:<25} {r.corretti:<10} {r.totale:<10} {r.accuracy:<10.1%}")

print(f"\nMiglioramento few-shot vs zero-shot: {risultati[1].accuracy - risultati[0].accuracy:+.1%}")
print("\nNota: il fine-tuning richiederebbe ~200+ esempi e accesso all'API di fine-tuning.")
```

</details>

---

## Connessioni

- **Lezione precedente**: [Token Economics e Costi](04-08-token-economics) — il fine-tuning ha costi di training + inference da considerare
- **Capitolo 5**: [RAG: Memoria Esterna](../capitolo-05-strumenti-infrastruttura/05-03-rag) — alternativa al fine-tuning per conoscenza di dominio
- **Capitolo 5**: [Embeddings e Vector Database](../capitolo-05-strumenti-infrastruttura/05-08-embeddings-vector-db) — i modelli di embedding sono spesso fine-tunati su domini specifici
- **Capitolo 8**: [Testing e Valutazione degli LLM](../capitolo-08-workflow-multi-agente/08-06-testing-evals) — valutare il fine-tuning richiede gli stessi strumenti di valutazione degli LLM
