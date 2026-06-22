---
id: "07-02"
titolo: "L'Agent Package: struttura di file e directory di un agente professionale"
sottotitolo: "Dall'agente come script all'agente come unità deployabile e mantenibile"
capitolo: 7
capitolo_titolo: "L'Agent Package"
lezione: 2
durata_stimata: "75 minuti"
difficolta: "avanzato"
prerequisiti: ["07-01"]
concetti_chiave:
  - agent package
  - agent.yaml
  - struttura directory
  - unità deployabile
  - manutenibilità
obiettivi:
  - "Spiegare perché un agente professionale ha bisogno di una struttura di file standard"
  - "Descrivere il ruolo di ciascuna cartella di un agent package"
  - "Costruire un agent package completo e funzionante per un caso reale"
  - "Distinguere un agente 'script' da un agente 'pacchetto'"
stato: "pubblicata"
versione: "1.0"
---
# L'Agent Package: struttura di file e directory di un agente professionale

## Introduzione

Questa è una delle lezioni più importanti dell'intero corso. Fino a ora, ogni agente che abbiamo costruito — nelle Lezioni 6.1, 6.2, 6.3 — viveva interamente dentro un singolo script Python: il system prompt era una stringa inline, gli strumenti erano funzioni definite nello stesso file, la configurazione era cablata direttamente nel codice. Questo approccio è perfetto per imparare e per prototipare velocemente, ma si rompe non appena un sistema reale deve essere mantenuto da un team, versionato nel tempo, e fatto evolvere senza il rischio costante di rompere qualcosa.

L'**agent package** è la risposta a questo problema: una struttura di file e cartelle standardizzata che trasforma un agente da "script che funziona sul mio computer" a **unità deployabile, testabile, e mantenibile** — esattamente come un progetto software professionale ha una struttura prevedibile (codice, test, configurazione, documentazione), invece di essere un singolo file disordinato.

---

## Obiettivi di Apprendimento

Al termine di questa lezione sarai in grado di:

- Spiegare con precisione perché un agente professionale richiede una struttura di file standard
- Descrivere il ruolo specifico di ciascuna cartella di un agent package
- Costruire un agent package completo e funzionante per un caso d'uso reale
- Distinguere concretamente un agente "script" da un agente "pacchetto", con le implicazioni pratiche di questa differenza

---

## 1. Il problema: cosa succede quando un agente "script" cresce

Riprendiamo l'agente Analista della Lezione 6.3, e immaginiamo la sua evoluzione naturale in un contesto professionale reale: il team vuole aggiungere nuovi strumenti, vuole poter testare il comportamento dell'agente prima di ogni modifica, vuole che un collega possa capire rapidamente cosa fa l'agente senza leggere tutto il codice Python riga per riga, e vuole poter aggiornare il prompt senza dover modificare (e potenzialmente rompere) la logica di esecuzione.

```
AGENTE "SCRIPT" (come nelle Lezioni 6.1-5.5)

agente_analista.py
├── system prompt cablato come stringa
├── definizioni strumenti inline
├── logica del loop agentivo
├── nessuna documentazione separata
└── nessun test strutturato

PROBLEMI quando il sistema cresce:
- Modificare il prompt richiede toccare il codice Python
  (rischio di introdurre bug non correlati al prompt)
- Nessun modo rapido per un nuovo collega di capire
  "cosa fa questo agente" senza leggere tutto il codice
- Nessuna struttura per testare il comportamento in
  isolamento prima di un deploy
- Difficile riusare gli stessi strumenti in un altro agente
```

L'agent package risolve ciascuno di questi problemi separando, in file e cartelle distinte, responsabilità che nello script erano tutte mescolate insieme.

---

## 2. La struttura completa di un Agent Package

```
/agente-analista-vendite/
├── agent.yaml              ← configurazione e identità dell'agente
├── README.md               ← documentazione per gli umani
├── prompts/
│   ├── system.md            ← il prompt di sistema (Lezione 4.4)
│   └── esempi_few_shot.md   ← esempi per few-shot prompting (Lezione 4.4)
├── tools/
│   ├── query_database.py    ← implementazione dello strumento
│   └── manifest.yaml        ← tool manifest (Lezione 5.4)
├── skills/
│   └── analisi_trend.md     ← competenza riutilizzabile (Lezione 7.7)
├── schemas/
│   ├── input_schema.json    ← contratto di input (Lezione 7.5)
│   └── output_schema.json   ← contratto di output (Lezione 7.5)
├── memory/
│   └── config.yaml          ← configurazione memoria (Lezione 5.6)
└── evals/
    └── casi_test.yaml        ← test e valutazione (Lezione 8.5)
```

Esaminiamo il ruolo specifico di ciascun componente.

### `agent.yaml`: l'identità e la configurazione

```yaml
id: "agente-analista-vendite"
versione: "1.2.0"
nome: "Analista Vendite"
descrizione: >
  Analizza dati di vendita trimestrali e identifica
  trend significativi per il team commerciale.
modello: "claude-sonnet-4-6"
parametri:
  max_tokens: 1024
  temperature: 0.2  # bassa: precisione richiesta (Lezione 4.4)
prompt_sistema: "prompts/system.md"
strumenti:
  - "tools/manifest.yaml"
schema_input: "schemas/input_schema.json"
schema_output: "schemas/output_schema.json"
owner: "team-data-engineering"
stato: "produzione"
```

Questo file, scritto secondo le convenzioni YAML viste nella Lezione 7.1, è il **punto di ingresso unico**: chiunque (un collega, un orchestratore, uno script di deploy automatico) può leggere `agent.yaml` e capire immediatamente identità, configurazione, e dove trovare ogni altro componente dell'agente — senza dover esplorare manualmente l'intera struttura di cartelle.

### `prompts/`: i prompt come file separati e versionabili

```markdown
---
tipo: "system_prompt"
versione: "2.1"
ultima_modifica: "2026-05-10"
---

Sei un analista di dati specializzato in vendite. Il tuo
compito è identificare trend significativi nei dati forniti,
SENZA fornire interpretazioni di business strategiche —
quelle restano responsabilità del team umano.

Rispondi sempre con numeri precisi e percentuali, evitando
linguaggio vago come "buono" o "non ottimale".
```

Separare il prompt in un file dedicato, con il proprio frontmatter (Lezione 7.1) e il proprio numero di versione, è esattamente ciò che permette a un membro del team di **modificare e migliorare il comportamento dell'agente senza toccare una sola riga di codice Python**. Approfondiremo questo principio con grande rigore nella Lezione 7.4.

### `tools/`: implementazione e manifest degli strumenti

```yaml
# tools/manifest.yaml — il tool manifest, già anticipato nella Lezione 5.4

strumenti:
  - nome: "query_database"
    descrizione: "Interroga il database vendite per un periodo specifico"
    file_implementazione: "tools/query_database.py"
    schema_parametri:
      type: object
      properties:
        periodo: {type: string}
      required: ["periodo"]
```

### `skills/`, `schemas/`, `memory/`, `evals/`: anticipazioni delle prossime lezioni

Le restanti cartelle corrispondono a concetti che approfondiremo singolarmente: `skills/` conterrà competenze riutilizzabili (Lezione 7.7), `schemas/` i contratti formali di input e output (Lezione 7.5), `memory/` la configurazione della memoria persistente (estendendo la Lezione 5.6), `evals/` i casi di test per la valutazione (anticipando la Lezione 8.5). In questa lezione ci concentriamo sulla **struttura complessiva**; il contenuto specifico di ciascuna cartella sarà oggetto delle lezioni successive.

---

## 3. Implementazione pratica: caricare un Agent Package in codice

Vediamo ora come un programma può **leggere** questa struttura e costruire, a partire da essa, un agente effettivamente eseguibile — collegando l'organizzazione su file vista sopra al codice degli agenti costruito nel Capitolo 6.

```python
import yaml
import json
import os
import anthropic

def carica_agent_package(percorso_cartella: str) -> dict:
    """
    Legge un agent package completo dalla sua struttura
    di file, e prepara tutto il necessario per eseguirlo.
    """
    # 1. Leggi la configurazione principale
    with open(os.path.join(percorso_cartella, "agent.yaml")) as f:
        config = yaml.safe_load(f)

    # 2. Leggi il prompt di sistema (riusando il parser
    #    di frontmatter della Lezione 7.1)
    percorso_prompt = os.path.join(percorso_cartella, config["prompt_sistema"])
    _, system_prompt = estrai_frontmatter(percorso_prompt)

    # 3. Leggi il tool manifest
    percorso_manifest = os.path.join(percorso_cartella, config["strumenti"][0])
    with open(percorso_manifest) as f:
        manifest = yaml.safe_load(f)

    definizioni_strumenti = [
        {
            "name": s["nome"],
            "description": s["descrizione"],
            "input_schema": s["schema_parametri"]
        }
        for s in manifest["strumenti"]
    ]

    return {
        "config": config,
        "system_prompt": system_prompt,
        "strumenti": definizioni_strumenti
    }


def esegui_da_package(percorso_cartella: str, obiettivo: str) -> str:
    """
    Esegue un agente costruito interamente a partire dal
    suo agent package, riusando il loop della Lezione 6.1.
    """
    agente = carica_agent_package(percorso_cartella)
    client = anthropic.Anthropic()

    risposta = client.messages.create(
        model=agente["config"]["modello"],
        max_tokens=agente["config"]["parametri"]["max_tokens"],
        temperature=agente["config"]["parametri"]["temperature"],
        system=agente["system_prompt"],
        tools=agente["strumenti"],
        messages=[{"role": "user", "content": obiettivo}]
    )

    return risposta.content[0].text


# Utilizzo:
risultato = esegui_da_package(
    "agenti/agente-analista-vendite/",
    "Analizza le vendite del Q3 2026"
)
```

Osserva la trasformazione concettuale rispetto al codice della Lezione 6.1: **nessuna informazione di configurazione è più scritta direttamente nel codice Python**. Il modello da usare, i parametri di generazione, il prompt di sistema, gli strumenti disponibili — tutto viene letto dinamicamente dalla struttura di file dell'agent package. Questo significa che modificare il comportamento dell'agente (cambiare il prompt, aggiungere uno strumento, aggiustare la temperature) non richiede più toccare `esegui_da_package`, ma solo modificare i file di configurazione appropriati.

---

## 4. Agente "script" vs Agente "pacchetto": le implicazioni pratiche

```
                    SCRIPT                    PACKAGE

Modificare prompt   Editare codice Python     Editare un file .md,
                     (rischio di bug)           nessun rischio per
                                                 la logica di esecuzione

Capire cosa fa       Leggere tutto il          Leggere agent.yaml
l'agente             codice                     e README.md

Riusare strumenti    Copiare/incollare         Riferimento al file
in un altro agente   codice tra script          tools/ condiviso

Testare prima        Nessuna struttura         evals/ con casi di
di un deploy         dedicata                   test versionati

Versionare           L'intero file .py         Ogni componente
le modifiche         cambia a ogni             (prompt, schema,
                      modifica, difficile        tools) versionato
                      isolare COSA è            indipendentemente
                      cambiato
```

> **Perché questo non è "solo organizzazione":** la differenza più profonda è che un agent package rende possibile la **separazione delle responsabilità** tra ruoli diversi in un team. Chi scrive prompt (spesso un esperto di dominio, non necessariamente uno sviluppatore) può lavorare su `prompts/system.md` senza toccare codice. Chi sviluppa strumenti lavora su `tools/`. Chi valuta la qualità lavora su `evals/`. Questa separazione, impossibile in un singolo script monolitico, è precisamente ciò che permette a un sistema agentivo di scalare oltre il lavoro di una singola persona.

---

## Esempio Pratico: Da Script a Package, una Migrazione Concreta

Confrontiamo direttamente l'agente Analista della Lezione 6.3 (uno script) con la sua trasformazione in agent package:

```
PRIMA (Lezione 6.3, script):

def agente_analista(dati_richiesta: str) -> str:
    client = anthropic.Anthropic()
    risposta = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=500,
        system="Sei un analista di dati. Fornisci SOLO numeri...",
        messages=[{"role": "user", "content": dati_richiesta}]
    )
    return risposta.content[0].text


DOPO (questa lezione, agent package):

agenti/agente-analista-vendite/
├── agent.yaml          (modello, parametri, riferimenti ai file)
├── prompts/system.md   (il prompt, ora un file versionabile)
└── (eventualmente tools/, schemas/, evals/ se servono)

+ la funzione generica esegui_da_package(), che funziona
  per QUALSIASI agente organizzato in questo modo, non
  solo per l'Analista Vendite
```

Il punto cruciale: `esegui_da_package` non contiene **nulla** di specifico sull'Analista Vendite. È una funzione generica, riutilizzabile per qualsiasi agent package ben strutturato — un vantaggio impossibile da ottenere con l'approccio a script della Lezione 6.3, dove ogni agente richiedeva la propria funzione dedicata con configurazione cablata internamente.

---

## Riepilogo

- L'**agent package** trasforma un agente da script monolitico a unità deployabile, con responsabilità separate in cartelle dedicate: `agent.yaml` (configurazione), `prompts/` (istruzioni), `tools/` (strumenti), `skills/`, `schemas/`, `memory/`, `evals/`.
- `agent.yaml` è il **punto di ingresso unico**: dichiara identità, configurazione, e riferimenti a tutti gli altri componenti, leggibile sia da umani sia da programmi.
- Un codice generico (`carica_agent_package`, `esegui_da_package`) può leggere QUALSIASI agent package ben strutturato ed eseguirlo, senza bisogno di codice specifico per ogni singolo agente.
- La differenza pratica tra script e package non è estetica: riguarda manutenibilità, possibilità di separare i ruoli in un team, versionamento granulare, e possibilità di testare in modo strutturato.

---

## Domande di Verifica

1. Nel codice della Sezione 3, se un membro del team modifica `prompts/system.md` per migliorare il comportamento dell'agente, quali file rimangono completamente intoccati? Perché questo riduce il rischio di introdurre bug?

2. Immagina di voler costruire un secondo agente, "Agente Previsioni", che usa lo stesso strumento `query_database` già presente nell'Agente Analista Vendite. Come strutturerebbe la cartella `tools/` per evitare di duplicare il codice tra i due agent package?

3. Rifletti sulla tabella della Sezione 4. Quale riga ritieni abbia l'impatto più significativo sulla capacità di un team (non di una singola persona) di mantenere un sistema agentivo nel tempo? Motiva la risposta.

---

## Esercizi Pratici

> Tre esercizi a difficoltà crescente. Prova a risolverli da solo prima di aprire la soluzione.

### Esercizio 1 — A cosa serve ogni cartella 🟢 Base

Associa ogni cartella/file al suo ruolo: (a) `agent.yaml`, (b) `prompts/`, (c) `tools/`, (d) `schemas/`, (e) `evals/`.

<details>
<summary>💡 Mostra soluzione</summary>

- **(a) `agent.yaml`** → configurazione e identità: punto di ingresso unico (modello, parametri, riferimenti agli altri file).
- **(b) `prompts/`** → i prompt come file separati e versionabili (system prompt, esempi few-shot).
- **(c) `tools/`** → implementazione degli strumenti + manifest.
- **(d) `schemas/`** → contratti formali di input e output (input_schema, output_schema).
- **(e) `evals/`** → casi di test e valutazione.

Idea: ogni responsabilità in una cartella dedicata, invece di tutto mescolato in un unico script.

</details>

### Esercizio 2 — Modificare il prompt in sicurezza 🟡 Intermedio

Un esperto di dominio (non sviluppatore) deve migliorare il comportamento dell'agente modificando `prompts/system.md`. Quali file restano intoccati? Perché questo riduce il rischio di bug?

<details>
<summary>💡 Mostra soluzione</summary>

Restano **completamente intoccati** il codice Python di esecuzione (`carica_agent_package`, `esegui_da_package`), gli `schemas/`, i `tools/`, gli `evals/`. Si modifica **solo** il file `.md` del prompt.

**Perché riduce il rischio:** il comportamento (prompt) è separato dalla logica (codice). Cambiando solo testo non si può introdurre un bug nella logica di esecuzione. Inoltre permette la **separazione dei ruoli**: chi scrive prompt non deve toccare codice, chi sviluppa codice non deve toccare i prompt. È il vantaggio centrale del package rispetto allo script monolitico.

</details>

### Esercizio 3 — Script vs package e riuso 🔴 Avanzato

(a) Cita due differenze pratiche concrete tra agente "script" e agente "package". (b) Vuoi un secondo agente che usa lo stesso strumento `query_database` del primo. Come eviti di duplicare il codice?

<details>
<summary>💡 Mostra soluzione</summary>

**(a) Due differenze (tra le tante):**
- **Versionamento:** nello script ogni modifica cambia l'intero `.py`, difficile isolare *cosa* è cambiato; nel package ogni componente (prompt, schema, tool) è versionato indipendentemente.
- **Esecuzione generica:** una funzione come `esegui_da_package()` funziona per *qualsiasi* package ben strutturato, mentre lo script richiede una funzione dedicata per ogni agente con config cablata.

**(b) Evitare la duplicazione:** mettere `query_database` in una posizione **condivisa** (es. una cartella `tools/` comune o una libreria di strumenti riutilizzabili) e fare in modo che entrambi gli agent package vi facciano **riferimento** dal proprio manifest, invece di copiare il codice. È lo stesso principio del tool registry (Lezione 5.4) e anticipa la skill library (Lezione 7.7): centralizzare ciò che è condiviso, non duplicarlo.

</details>

---

## Connessioni

**Viene da:** Lezione 7.1 (YAML e Frontmatter) — il formato usato per ogni file di configurazione di questa lezione. Capitolo 6 (tutti gli agenti costruiti come script) — questa lezione ne mostra l'evoluzione naturale verso una forma professionale.

**Porta a:** Lezione 7.3 (Agent Card) — vedremo come dichiarare l'identità di un agente in modo standardizzato e interoperabile, oltre il semplice `agent.yaml` interno. Lezione 7.4 (I Prompt come Artefatti) — approfondiremo con grande precisione la cartella `prompts/` qui solo introdotta.

**Ritroverai questi concetti in:** Lezione 7.5 (Contratti tra Agenti) — la cartella `schemas/` qui anticipata riceverà un trattamento completo. Lezione 8.1 (Progettare un Workflow) — un workflow multi-agente professionale è, essenzialmente, una collezione di agent package come quello costruito in questa lezione, coordinati da un orchestratore.
