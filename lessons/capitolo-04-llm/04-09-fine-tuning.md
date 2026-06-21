---
titolo: "Fine-Tuning: Quando e Come"
durata_stimata: "20 min"
difficolta: "Intermedio"
---
# Fine-Tuning: Quando e Come

Una delle domande più comuni quando si lavora con gli LLM è: "Dovrei fare fine-tuning del modello per il mio caso d'uso?" La risposta è quasi sempre: **prima prova il prompting, poi il RAG, e solo se entrambi non bastano considera il fine-tuning**. Questa lezione spiega perché, e come fare fine-tuning quando ha davvero senso.

## Cos'è il Fine-Tuning (in Breve)

Il **fine-tuning** è il processo di continuare l'addestramento di un modello pre-addestrato su un dataset specifico, aggiornando i pesi della rete neurale per specializzarla su un dominio o compito preciso.

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

### Albero Decisionale: Hai Davvero Bisogno del Fine-Tuning?

Prima di avviare un processo costoso e lungo, rispondi a queste domande in sequenza:

```
1. Hai già provato il prompting con few-shot examples?
   │
   ├─ NO → Prova prima. Molti casi si risolvono qui. Torna a questa domanda solo dopo.
   │
   └─ SÌ, e non basta → vai alla domanda 2

2. Il problema riguarda conoscenza di dominio che cambia nel tempo
   (documenti aggiornati, normative, dati aziendali)?
   │
   ├─ SÌ → Usa RAG, non fine-tuning. La conoscenza va recuperata, non baked nel modello.
   │
   └─ NO → vai alla domanda 3

3. Hai almeno 500 esempi di alta qualità, verificati da esperti,
   con etichette coerenti e bilanciamento ragionevole delle classi?
   │
   ├─ NO → Non fare fine-tuning adesso. Costruisci prima il dataset.
   │         Considera il prompting avanzato come soluzione provvisoria.
   │
   └─ SÌ → vai alla domanda 4

4. Il problema riguarda formato/stile di output molto specifico,
   oppure consistenza su migliaia di richieste simili,
   oppure latenza (modello più piccolo e veloce)?
   │
   ├─ SÌ → Il fine-tuning ha senso. Procedi con attenzione.
   │
   └─ NO → Rivaluta il problema. Forse prompting + RAG coprono il caso.
```

### Quando il Fine-Tuning Ha Senso

1. **Il formato dell'output è molto specifico** e difficile da ottenere con il prompting
2. **Hai bisogno di ridurre la latenza** — un modello più piccolo fine-tunato può essere più veloce
3. **Il comportamento deve essere assolutamente consistente** su migliaia di richieste simili
4. **Hai dati di training di alta qualità** — migliaia di coppie input/output verificate da esperti
5. **Il RAG non funziona** perché la conoscenza è troppo implicita o procedurale

**Quando NON fare fine-tuning:**
- Hai meno di 100-200 esempi di training (non basta)
- Non hai un processo per valutare i risultati
- Il prompt con few-shot examples già funziona bene
- La conoscenza cambia nel tempo (usa RAG)

## Come si Fa il Fine-Tuning Praticamente

### Preparare i Dati

Il formato standard è JSONL (JSON Lines): ogni riga è un esempio di training.

```jsonl
{"messages": [{"role": "user", "content": "Classifica: 'Il server è down'"}, {"role": "assistant", "content": "URGENTE"}]}
{"messages": [{"role": "user", "content": "Classifica: 'Come cambio la password?'"}, {"role": "assistant", "content": "NORMALE"}]}
{"messages": [{"role": "user", "content": "Classifica: 'Aggiungete il supporto per il tema scuro'"}, {"role": "assistant", "content": "BASSA_PRIORITA"}]}
```

> ✅ **Output atteso**: un file JSONL valido ha esattamente una riga per esempio, senza righe vuote intermedie. Se lo apri con un editor di testo, ogni riga deve essere JSON valido su una singola riga. Per verificare da terminale:
> ```bash
> python -c "
> import json
> with open('training_data.jsonl') as f:
>     for i, riga in enumerate(f, 1):
>         obj = json.loads(riga)
>         role_out = obj['messages'][-1]['role']
>         content_out = obj['messages'][-1]['content']
>         print(f'Riga {i}: OK | output={role_out!r} → {content_out!r}')
> "
> # Output atteso (per il file di esempio):
> # Riga 1: OK | output='assistant' → 'URGENTE'
> # Riga 2: OK | output='assistant' → 'NORMALE'
> # Riga 3: OK | output='assistant' → 'BASSA_PRIORITA'
> ```
> Se vedi `json.decoder.JSONDecodeError` su una riga, quella riga contiene JSON malformato (virgolette non chiuse, caratteri speciali non escapati, newline interno). Correggi quella riga prima di caricare il file sulla piattaforma di fine-tuning.

**Qualità vs Quantità**: 500 esempi perfetti valgono più di 5000 esempi mediocri.

### Rubrica per Valutare la Qualità degli Esempi

Non tutti gli esempi di training hanno lo stesso valore. Prima di caricare un dataset, valuta ciascun esempio con questa checklist:

**✅ Un esempio di alta qualità:**

1. **Consistenza tono/stile** — il testo dell'assistente mantiene esattamente il registro linguistico che vuoi nel modello finale. Se vuoi risposte formali, ogni esempio deve essere formale. Una singola risposta colloquiale "inquina" il segnale.

2. **Copertura dei casi limite** — il dataset include non solo i casi tipici, ma anche gli input ambigui, incompleti o inusuali che il sistema incontrerà in produzione. Un dataset con soli casi facili produce un modello che fallisce sui casi difficili.

3. **Assenza di contraddizioni** — due esempi non devono insegnare comportamenti opposti per input simili. Esempio da evitare: un esempio classifica "server down" come URGENTE e un altro classifica "server non risponde" come NORMALE. Il modello non può imparare una regola coerente da segnali contraddittori.

4. **Bilanciamento delle classi** — in un compito di classificazione, le categorie devono essere rappresentate in modo proporzionale (o intenzionalmente sbilanciato, se rispecchia la realtà). Un dataset con 900 esempi "NORMALE" e 10 esempi "URGENTE" produce un modello che ignora quasi sempre la classe minoritaria.

5. **Verificabilità** — ogni etichetta è stata assegnata da una persona con competenza nel dominio, non inferita automaticamente o generata da un altro LLM senza revisione umana. Il fine-tuning amplifica i bias del dataset: spazzatura in entrata, spazzatura in uscita.

6. **Rappresentatività della distribuzione reale** — gli esempi coprono la variabilità che esiste nel mondo reale (varianti linguistiche, errori di battitura, sinonimi, formulazioni diverse dello stesso concetto). Un dataset costruito in laboratorio con phrasing perfetto non prepara il modello agli input grezzi degli utenti reali.

### Quantità Minima di Esempi

| Compito | Esempi minimi | Esempi ideali |
|---------|--------------|---------------|
| Classificazione semplice (3-5 classi) | 100-200 | 500-1000 |
| Estrazione strutturata | 200-500 | 1000-2000 |
| Generazione in stile specifico | 500-1000 | 2000-5000 |
| Compiti complessi multi-step | 1000+ | 5000+ |

> **Nota sui minimi:** i valori nella colonna "Esempi minimi" derivano dall'esperienza pratica consolidata della comunità di ricercatori e sviluppatori; con meno esempi il modello non generalizza — impara a memoria i casi visti invece di apprendere il pattern sottostante. Considera questi numeri come punto di partenza, non come garanzia: la qualità degli esempi conta quanto la quantità, e domini più complessi o ambigui richiedono più dati per raggiungere la stessa affidabilità.

## Segnali che il Fine-Tuning Sta Andando Male

Il fine-tuning non è una garanzia di miglioramento. Ci sono sintomi precisi che indicano che qualcosa è andato storto, e per ciascuno esiste un'azione correttiva.

**1. Overfitting sul training set**
Il modello ottiene accuracy perfetta sugli esempi di training ma crolla sull'eval set (differenza superiore a 15-20 punti percentuali). Significa che ha memorizzato le risposte invece di generalizzare il pattern.
*Cosa fare*: aggiungi dati di training diversificati, riduci il numero di epoche di addestramento, applica early stopping basato sulla loss dell'eval set.

**2. Catastrophic forgetting del comportamento base**
Il modello fine-tunato eccelle sul compito specifico ma ha perso capacità generali del modello originale — per esempio, risponde in modo sgrammaticato, non riesce più a seguire istruzioni semplici, o si "dimentica" di lingua e contesto. Questo accade quando il dataset di fine-tuning è troppo piccolo e omogeneo rispetto all'enorme variabilità dei dati di pre-training.
*Cosa fare*: riduci il learning rate, diminuisci il numero di epoche, valuta tecniche come LoRA che modificano solo una porzione dei pesi (invece di tutti).

**3. Degradazione su prompt semplici**
Il modello fine-tunato risponde peggio del modello base a domande semplici che non riguardano il dominio di specializzazione. Sintomo tipico: ogni risposta assomiglia agli esempi di training anche quando non dovrebbe, come se il modello avesse "bloccato" la propria modalità di output.
*Cosa fare*: controlla che il dataset non contenga un bias stilistico così forte da sopraffare il comportamento generale. Mescola nel training set alcuni esempi di risposta generica (non specializzata) per mantenere la flessibilità del modello base.

**4. Collasso delle risposte**
Il modello risponde sempre con lo stesso output (o un insieme molto ristretto di varianti), indipendentemente dall'input. Spesso causato da dataset troppo sbilanciati o da un training rate troppo alto.
*Cosa fare*: verifica il bilanciamento delle classi nel dataset, abbassa il learning rate, controlla che non ci siano esempi duplicati o quasi-duplicati che dominano la distribuzione.

---

## Valutare il Fine-Tuning

Come sai se il fine-tuning ha funzionato? Hai bisogno di una **eval set** — un insieme di esempi separati dal training, con le risposte corrette attese. Vedi l'approfondimento per il codice completo di valutazione.

---

## Esercizi Pratici

> Tre esercizi a difficoltà crescente. Prova a risolverli da solo prima di aprire il suggerimento.

### Esercizio 1 — Diagnosi: Fine-Tuning o No? 🟢 Base

Per ciascuno dei seguenti scenari, decidi se il fine-tuning è la soluzione giusta o se c'è un'alternativa migliore. Motiva la risposta:

1. Un'azienda vuole che il chatbot risponda sempre in italiano formale, anche se l'utente scrive in inglese
2. Un servizio legale vuole che il modello risponda basandosi solo sui contratti dell'azienda (500 contratti, aggiornati ogni mese)
3. Un'app di e-commerce vuole classificare le recensioni in 4 categorie con un'accuracy del 95%
4. Una banca vuole che il modello generi email nel preciso stile formale del loro ufficio compliance

<details>
<summary>💡 Mostra suggerimento</summary>

**Domande guida per ogni scenario:**
- La conoscenza richiesta è statica o cambia nel tempo?
- Si tratta di uno stile/formato oppure di informazioni specifiche?
- Il few-shot prompting è già stato provato? Con che risultati?
- Quanti esempi di training di alta qualità sono disponibili?

**Schema decisionale:**
- Lingua/tono/stile → **prompting** (rapido, flessibile)
- Informazioni esterne che cambiano → **RAG** (aggiornabile senza retraining)
- Comportamento molto consistente su formato specifico → **valuta fine-tuning**
- Pochi esempi disponibili → **non fare fine-tuning**

</details>

---

### Esercizio 2 — Preparare un Dataset 🟡 Intermedio

Crea un dataset JSONL per fine-tunare un modello a classificare le segnalazioni di bug in tre categorie: `CRITICO` (sistema non funzionante), `MEDIO` (funzionalità degradata), `BASSO` (problema cosmético). Scrivi 15 esempi (5 per categoria) realistici, poi scrivi una funzione Python che valida il formato del file JSONL prima di caricarlo.

<details>
<summary>💡 Mostra suggerimento</summary>

**Formato di ogni riga JSONL:**
```jsonl
{"messages": [{"role": "user", "content": "Bug: 'descrizione'"}, {"role": "assistant", "content": "CRITICO"}]}
```

**Funzione di validazione — punti da controllare:**
1. Ogni riga è JSON valido (`json.loads`)
2. Ogni oggetto ha una chiave `"messages"`
3. `messages` ha almeno 2 elementi
4. Il primo messaggio ha `"role": "user"`, l'ultimo `"role": "assistant"`
5. L'output dell'assistente è una delle categorie valide (`{"CRITICO", "MEDIO", "BASSO"}`)

```python
def valida_jsonl(filepath: str) -> tuple[bool, list[str]]:
    errori = []
    with open(filepath) as f:
        for i, riga in enumerate(f, 1):
            try:
                obj = json.loads(riga.strip())
                # controlla struttura...
            except json.JSONDecodeError as e:
                errori.append(f"Riga {i}: JSON non valido — {e}")
    return len(errori) == 0, errori
```

</details>

---

### Esercizio 3 — Confronto Sistematico 🔴 Avanzato

Progetta un esperimento per confrontare tre approcci su un compito di classificazione a tua scelta: (a) zero-shot prompting, (b) few-shot prompting con 10 esempi nel prompt, (c) fine-tuning (anche simulato se non hai accesso all'API). Definisci le metriche, la dimensione dell'eval set, e scrivi il codice per eseguire il confronto e presentare i risultati in una tabella.

<details>
<summary>💡 Mostra suggerimento</summary>

**Struttura dell'esperimento:**
1. Definisci un dataset di almeno 15 esempi (5 per classe)
2. Separa 5 per il few-shot training, 10 per la valutazione
3. Scrivi tre system prompt:
   - **Zero-shot**: solo la descrizione del compito
   - **Few-shot**: descrizione + 5 esempi nel prompt
   - **Fine-tuning simulato**: usa few-shot come proxy (o fai riferimento a `"ft:gpt-4o-mini:..."` se hai accesso)
4. Esegui ogni approccio sull'eval set, conta i corretti

**Funzione di valutazione:**
```python
def valuta(nome: str, system_prompt: str, eval_set: list) -> dict:
    corretti = 0
    for testo, atteso in eval_set:
        output = chiama_modello(system_prompt, testo)
        if output.strip() == atteso:
            corretti += 1
    return {"nome": nome, "accuracy": corretti / len(eval_set)}
```

Stampa risultati in una tabella: `Approccio | Corretti | Totale | Accuracy`.

</details>

---

<details>
<summary>⚙️ Approfondimento Avanzato</summary>

### Fine-Tuning con OpenAI (Esempio Pratico)

Anthropic non offre ancora fine-tuning diretto via API — si usano tipicamente OpenAI o provider open source.

```python
from openai import OpenAI
import time

client = OpenAI()

# Step 1: carica il file di training
with open("training_data.jsonl", "rb") as f:
    risposta = client.files.create(file=f, purpose="fine-tune")
    file_id = risposta.id

# Step 2: avvia il fine-tuning
job = client.fine_tuning.jobs.create(
    training_file=file_id,
    model="gpt-4o-mini",
    hyperparameters={"n_epochs": 3}
)
print(f"Job avviato: {job.id}")

# Step 3: monitora il progresso
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

### Fine-Tuning con Modelli Open Source (LoRA)

Con modelli open source (Llama, Mistral, Phi) puoi fare fine-tuning in locale con **LoRA** (Low-Rank Adaptation) che aggiorna solo una piccola parte dei pesi:

```python
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import LoraConfig, get_peft_model

modello = AutoModelForCausalLM.from_pretrained("mistralai/Mistral-7B-v0.1")
tokenizer = AutoTokenizer.from_pretrained("mistralai/Mistral-7B-v0.1")

config_lora = LoraConfig(
    r=16, lora_alpha=32,
    target_modules=["q_proj", "v_proj"],
    lora_dropout=0.05,
)
modello_lora = get_peft_model(modello, config_lora)
modello_lora.print_trainable_parameters()
# "trainable params: 6,815,744 || all params: 3,753,516,032 || trainable%: 0.18"
```

### Confronto Base vs Fine-Tunato

```python
def valuta_modello(modello_id: str, eval_set: list) -> dict:
    client = OpenAI()
    corretti = 0
    for esempio in eval_set:
        risposta = client.chat.completions.create(
            model=modello_id,
            messages=[{"role": "user", "content": esempio["input"]}]
        )
        if risposta.choices[0].message.content.strip() == esempio["expected"]:
            corretti += 1
    return {"accuracy": corretti / len(eval_set), "n_esempi": len(eval_set)}

base = valuta_modello("gpt-4o-mini", eval_set)
ft   = valuta_modello("ft:gpt-4o-mini:...", eval_set)
print(f"Base: {base['accuracy']:.1%}")
print(f"Fine-tunato: {ft['accuracy']:.1%}")
print(f"Miglioramento: {(ft['accuracy'] - base['accuracy']):+.1%}")
```

</details>

---

## Connessioni

- **Lezione precedente**: [Token Economics e Costi](04-08-token-economics) — il fine-tuning ha costi di training + inference da considerare
- **Capitolo 5**: [RAG: Memoria Esterna](../capitolo-05-strumenti-infrastruttura/05-03-rag) — alternativa al fine-tuning per conoscenza di dominio
- **Capitolo 5**: [Embeddings e Vector Database](../capitolo-05-strumenti-infrastruttura/05-08-embeddings-vector-db) — i modelli di embedding sono spesso fine-tunati su domini specifici
- **Capitolo 8**: [Testing e Valutazione degli LLM](../capitolo-08-workflow-multi-agente/08-06-testing-evals) — valutare il fine-tuning richiede gli stessi strumenti di valutazione degli LLM
