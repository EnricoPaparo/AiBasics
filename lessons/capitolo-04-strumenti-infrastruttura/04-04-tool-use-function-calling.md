---
id: "04-04"
titolo: "Tool Use e Function Calling: dare al modello la capacità di agire"
sottotitolo: "Il meccanismo tecnico esatto che rende possibile, per la prima volta, parlare di 'agenti'"
capitolo: 4
capitolo_titolo: "Strumenti e Infrastruttura per Sistemi AI"
lezione: 4
durata_stimata: "65 minuti"
difficolta: "intermedio"
prerequisiti: ["04-02"]
concetti_chiave:
  - function calling
  - tool use
  - tool manifest
  - tool registry
  - JSON Schema
obiettivi:
  - "Spiegare il problema che il Function Calling risolve"
  - "Descrivere il ciclo completo modello-richiesta-esecuzione-risultato"
  - "Definire correttamente uno strumento con nome, descrizione e schema parametri"
  - "Distinguere tool manifest e tool registry"
stato: "pubblicata"
versione: "1.0"
---

# Tool Use e Function Calling: dare al modello la capacità di agire

## Introduzione

Questa lezione segna un punto di svolta concettuale in tutto il corso. Nella Lezione 3.5 avevamo elencato, con la tabella delle cose che un LLM "grezzo" può e non può fare, un limite fondamentale: il modello **produce solo testo**, non può agire nel mondo reale. RAG, visto nella lezione precedente, estende ciò che il modello *sa*, fornendogli accesso a informazioni esterne — ma non gli dà ancora la capacità di *fare* qualcosa.

Il **Function Calling** (chiamata di funzione, spesso indicato anche come Tool Use, uso di strumenti) è il meccanismo tecnico che risolve esattamente questo limite. È, letteralmente, il meccanismo che rende possibile, per la prima volta in questo corso, iniziare a parlare seriamente di "agenti" — perché un agente, come vedremo formalmente nella Lezione 5.1, è precisamente un sistema che può percepire, ragionare, **e agire**. Questa lezione costruisce il "agire".

---

## Obiettivi di Apprendimento

Al termine di questa lezione sarai in grado di:

- Spiegare con precisione il problema che il Function Calling risolve
- Descrivere il ciclo completo: modello → richiesta di strumento → esecuzione → risultato → modello
- Definire correttamente uno strumento, con nome, descrizione e schema dei parametri
- Distinguere un tool manifest (per un singolo agente) da un tool registry (per un intero sistema)

---

## 1. Il problema: il modello non può eseguire nulla da solo

Per quanto un modello come Claude sia eccellente nel generare testo, ricordiamo dalla Lezione 3.1 che, alla sua base, esegue un'unica operazione: prevede il token successivo. Non ha, di per sé, alcun meccanismo per "premere un bottone", "interrogare un database in tempo reale", "inviare una richiesta HTTP", o eseguire calcoli con garanzia assoluta di precisione (un modello può "calcolare a mente" tramite la previsione di token, come visto nella Lezione 3.4 parlando di chain-of-thought, ma questo non equivale all'esecuzione affidabile di codice).

Immagina di voler chiedere a un assistente AI: "Qual è la temperatura attuale a Milano?" Un modello, da solo, non ha alcun modo di conoscere questa informazione in tempo reale — non è nei suoi dati di addestramento (Lezione 3.2, knowledge cutoff), e non è qualcosa che si possa risolvere con RAG su documenti statici (la temperatura cambia continuamente). Quello che serve è la capacità di **eseguire effettivamente** una chiamata a un servizio meteo esterno, ottenere il dato reale, e poi usarlo per formulare la risposta.

---

## 2. L'idea centrale: il modello "richiede", il programma "esegue"

Il Function Calling funziona attraverso una separazione di responsabilità elegante e cruciale da comprendere con precisione: **il modello non esegue mai direttamente nulla**. Il modello può solo **richiedere**, in un formato strutturato (esattamente come gli output strutturati visti nella Lezione 4.2), che una certa funzione venga chiamata con certi parametri. È il **programma che ospita il modello** — il tuo codice — a decidere se e come eseguire effettivamente quella richiesta, e a restituire il risultato al modello per il passo successivo.

```
              IL TUO PROGRAMMA

  ┌─────────────────────────────────────────────┐
  │                                                 │
  │   1. Invia al modello: domanda dell'utente     │
  │      + elenco degli strumenti disponibili       │
  │                                                 │
  │   2. Il MODELLO risponde: "vorrei chiamare      │
  │      lo strumento 'meteo' con parametro         │
  │      città='Milano'"  (RICHIESTA, non           │
  │      esecuzione)                                 │
  │                                                 │
  │   3. Il TUO PROGRAMMA esegue effettivamente      │
  │      la funzione meteo("Milano")                │
  │      → ottiene: {"temperatura": 18, "umidita":  │
  │         62}                                       │
  │                                                 │
  │   4. Il tuo programma invia questo risultato     │
  │      DI NUOVO al modello                         │
  │                                                 │
  │   5. Il modello genera la risposta finale,       │
  │      ora basata su un dato reale e aggiornato:   │
  │      "A Milano ci sono attualmente 18°C"         │
  │                                                 │
  └─────────────────────────────────────────────┘
```

Questa separazione — il modello decide *cosa* sarebbe utile fare, il programma decide *se* e *come* farlo effettivamente — è precisamente ciò che rende questo meccanismo sicuro e controllabile: un modello non potrà mai, da solo, eseguire un'azione dannosa o non autorizzata, perché ogni esecuzione passa obbligatoriamente attraverso codice scritto e controllato da chi costruisce il sistema.

---

## 3. Definire uno strumento: nome, descrizione, schema dei parametri

Per permettere al modello di "richiedere" correttamente uno strumento, occorre prima **descriverglielo** in un formato che possa comprendere e usare correttamente. Questa descrizione, fornita insieme alla richiesta API (esattamente come visto nella Lezione 4.1), ha tipicamente tre componenti:

```python
strumento_meteo = {
    "name": "ottieni_meteo",
    "description": "Restituisce la temperatura attuale e le "
                    "condizioni meteo per una città specifica. "
                    "Usa questo strumento quando l'utente chiede "
                    "informazioni meteo in tempo reale.",
    "input_schema": {
        "type": "object",
        "properties": {
            "citta": {
                "type": "string",
                "description": "Il nome della città, es. 'Milano'"
            }
        },
        "required": ["citta"]
    }
}
```

- **`name`**: un identificativo univoco e chiaro dello strumento
- **`description`**: una spiegazione in linguaggio naturale di cosa fa lo strumento e **quando** dovrebbe essere usato — questo campo è cruciale, perché è precisamente il testo che il modello "legge" per decidere se questo strumento è rilevante per la richiesta dell'utente, secondo lo stesso principio di costruzione del contesto visto nella Lezione 3.4 sul prompting
- **`input_schema`**: uno schema JSON (esattamente lo stesso principio di Pydantic visto nella Lezione 4.2, qui espresso nel formato JSON Schema) che descrive precisamente quali parametri lo strumento richiede, con quali tipi e vincoli

> **Perché la descrizione conta moltissimo:** se la descrizione di uno strumento è vaga o ambigua, il modello potrebbe non riconoscere quando usarlo, o potrebbe usarlo in modo inappropriato. Scrivere bene la descrizione di uno strumento è, a tutti gli effetti, un esercizio di prompt engineering (Lezione 3.4) applicato a un contesto specifico — un tema che approfondiremo con grande precisione nel Capitolo 6, parlando dei prompt come artefatti professionali.

---

## 4. Il ciclo completo, in codice

Vediamo ora come si implementa concretamente l'intero ciclo descritto nella Sezione 2, estendendo la funzione di chiamata API costruita nella Lezione 4.1:

```python
import anthropic
import json

def ottieni_meteo(citta: str) -> dict:
    """La funzione REALE che esegue l'azione richiesta."""
    # In un caso reale, qui ci sarebbe una chiamata API
    # a un servizio meteo esterno (Lezione 1.5)
    return {"temperatura": 18, "condizione": "nuvoloso"}


def chiedi_con_strumenti(domanda_utente: str):
    client = anthropic.Anthropic()

    strumenti_disponibili = [strumento_meteo]  # definito sopra

    risposta = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        tools=strumenti_disponibili,
        messages=[{"role": "user", "content": domanda_utente}]
    )

    # Il modello potrebbe richiedere l'uso di uno strumento
    if risposta.stop_reason == "tool_use":
        richiesta_strumento = risposta.content[-1]
        nome_strumento = richiesta_strumento.name
        parametri = richiesta_strumento.input

        # Il PROGRAMMA esegue effettivamente la funzione
        if nome_strumento == "ottieni_meteo":
            risultato = ottieni_meteo(**parametri)

        # Il risultato viene rimandato al modello,
        # per generare la risposta finale
        risposta_finale = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            tools=strumenti_disponibili,
            messages=[
                {"role": "user", "content": domanda_utente},
                {"role": "assistant", "content": risposta.content},
                {"role": "user", "content": [{
                    "type": "tool_result",
                    "tool_use_id": richiesta_strumento.id,
                    "content": json.dumps(risultato)
                }]}
            ]
        )
        return risposta_finale.content[0].text

    return risposta.content[0].text
```

Osserva con attenzione la struttura dei `messages` nella seconda chiamata: includiamo l'intera cronologia precedente (esattamente il principio dei turni conversazionali visto nella Lezione 3.3), inclusa la richiesta di strumento generata dal modello e il risultato che il nostro programma ha effettivamente calcolato. Questo è ciò che permette al modello, nella generazione finale, di "vedere" sia la domanda originale sia il risultato dello strumento, e di formulare una risposta coerente basata su un dato reale.

---

## 5. Tool Manifest e Tool Registry

Quando un sistema cresce in complessità — specialmente quando, dal Capitolo 6 in avanti, inizieremo a parlare di agenti strutturati come "package" professionali — diventa utile distinguere due concetti correlati ma diversi:

- **Tool Manifest**: l'elenco degli strumenti disponibili **a uno specifico agente**. È, concettualmente, la lista `strumenti_disponibili` vista nell'esempio di codice sopra, ma formalizzata come un documento esplicito (tipicamente un file di configurazione) che dichiara: "questo agente può usare esattamente questi strumenti, e nessun altro"
- **Tool Registry**: il catalogo **centralizzato** di tutti gli strumenti disponibili nell'intero sistema, da cui i singoli agenti possono "pescare" un sottoinsieme specifico per il proprio manifest

```
                TOOL REGISTRY (centralizzato)
        ┌──────────────────────────────────────┐
        │  - ottieni_meteo                        │
        │  - cerca_sul_web                        │
        │  - invia_email                          │
        │  - interroga_database_clienti           │
        │  - esegui_codice_python                 │
        └──────────────────────────────────────┘
                    │              │
         ┌──────────┘              └──────────┐
         ▼                                     ▼
  TOOL MANIFEST                         TOOL MANIFEST
  Agente "Assistente Meteo"             Agente "Servizio Clienti"
  - ottieni_meteo                       - cerca_sul_web
                                         - invia_email
                                         - interroga_database_clienti
```

Questa distinzione, qui introdotta solo concettualmente, diventerà strutturalmente importante nella Lezione 6.2, quando descriveremo la cartella `tools/` all'interno di un agent package professionale: un agente specifico avrà accesso solo a un sottoinsieme controllato e dichiarato degli strumenti disponibili nel sistema più ampio — un principio di sicurezza e di chiarezza progettuale, non solo di organizzazione del codice.

---

## Esempio Pratico: Decidere Quando uno Strumento è Necessario

Prova a determinare, per ciascuna di queste richieste, se il modello avrebbe probabilmente bisogno di richiedere uno strumento, oppure se potrebbe rispondere basandosi solo sulla propria conoscenza interna (collegando questa valutazione ai criteri di rischio di allucinazione visti nella Lezione 3.5):

1. "Quanto fa 347 × 28?" — un calcolo preciso, dove uno strumento di calcolo elimina il rischio di errore aritmetico nella generazione token-per-token
2. "Spiegami cos'è la fotosintesi" — conoscenza stabile e ben rappresentata, nessuno strumento necessario
3. "Qual è il prezzo attuale delle azioni di un'azienda specifica?" — informazione che cambia continuamente, richiede uno strumento di accesso a dati finanziari in tempo reale
4. "Riassumi questo testo che ti ho fornito" — il testo è già nel contesto fornito dall'utente, nessuno strumento necessario

Questo tipo di valutazione — quando un compito richiede l'intervento di uno strumento esterno e quando la sola generazione del modello è sufficiente e affidabile — è esattamente il tipo di "decisione" che un modello istruito (Lezione 3.2) impara a fare autonomamente, basandosi sulle descrizioni degli strumenti disponibili, ma è anche una valutazione che tu, come progettista del sistema, dovrai costantemente affinare scegliendo quali strumenti rendere disponibili e con quali descrizioni.

---

## Riepilogo

- Il **Function Calling** risolve il limite strutturale per cui un LLM, da solo, può solo generare testo e non eseguire azioni reali nel mondo.
- Il principio centrale è una separazione di responsabilità: il **modello richiede** l'uso di uno strumento con certi parametri, ma è il **programma** a eseguirlo effettivamente e a restituire il risultato.
- Uno strumento si definisce con **nome**, **descrizione** (cruciale per permettere al modello di capire quando usarlo) e **schema dei parametri** (basato sullo stesso principio di JSON Schema/Pydantic visto nella Lezione 4.2).
- Il ciclo completo richiede **due chiamate API**: la prima in cui il modello eventualmente richiede uno strumento, la seconda in cui gli si fornisce il risultato per generare la risposta finale.
- Un **tool manifest** (strumenti di un singolo agente) e un **tool registry** (catalogo centralizzato di tutto il sistema) sono concetti distinti che diventeranno strutturalmente rilevanti nella progettazione di agent package professionali.

---

## Domande di Verifica

1. Perché è importante che il modello "richieda" l'uso di uno strumento invece di eseguirlo direttamente? Quali rischi di sicurezza emergerebbero se il modello potesse eseguire azioni senza l'intermediazione del programma?

2. Immagina di dover scrivere la descrizione di uno strumento che invia email. Quali informazioni dovrebbe contenere questa descrizione per permettere al modello di capire correttamente quando usarlo, e quando invece NON dovrebbe usarlo (ad esempio, per evitare di inviare email senza un'esplicita richiesta dell'utente)?

3. Un agente ha accesso, nel proprio tool manifest, solo a uno strumento di lettura di un database, non a uno strumento di scrittura. Che tipo di garanzia di sicurezza fornisce questa scelta progettuale, anche se il modello "volesse" (in senso figurato) modificare quei dati?

---

## Connessioni

**Viene da:** Lezione 3.5 (Limiti degli LLM) — il Function Calling risolve direttamente il limite "mancanza di azione" descritto lì. Lezione 4.2 (Output Strutturati) — la richiesta di uno strumento da parte del modello è, essa stessa, un output strutturato secondo uno schema preciso.

**Porta a:** Lezione 4.5 (MCP) — vedremo come standardizzare la connessione tra modelli e strumenti esterni, andando oltre l'implementazione custom vista in questa lezione.

**Ritroverai questi concetti in:** Lezione 5.1 (Cos'è un Agente AI) — il ciclo modello-richiesta-esecuzione-risultato visto qui è precisamente uno dei quattro componenti fondamentali di un agente. Lezione 6.2 (L'Agent Package) — il tool manifest qui introdotto concettualmente diventerà la cartella `tools/` esplicita di un agente professionale.
