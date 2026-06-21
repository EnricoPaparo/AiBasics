---
id: "05-04"
titolo: "Tool Use e Function Calling: dare al modello la capacità di agire"
sottotitolo: "Il meccanismo tecnico esatto che rende possibile, per la prima volta, parlare di 'agenti'"
capitolo: 5
capitolo_titolo: "Strumenti e Infrastruttura AI"
lezione: 4
durata_stimata: "65 minuti"
difficolta: "intermedio"
prerequisiti: ["05-02"]
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

> 📌 **In breve** · ⏱ ~45 min · 🎯 Darai all’AI degli strumenti per *fare* cose, non solo dirle.
> Il modello decide quando chiamare una tua funzione (cercare, calcolare, scrivere) e ne usa il risultato. È il mattone che trasforma un chatbot in un agente.

## Introduzione

Questa lezione segna un punto di svolta concettuale in tutto il corso. Nella Lezione 4.5 avevamo elencato, con la tabella delle cose che un LLM "grezzo" può e non può fare, un limite fondamentale: il modello **produce solo testo**, non può agire nel mondo reale. RAG, visto nella lezione precedente, estende ciò che il modello *sa*, fornendogli accesso a informazioni esterne — ma non gli dà ancora la capacità di *fare* qualcosa.

Il **Function Calling** (chiamata di funzione, spesso indicato anche come Tool Use, uso di strumenti) è il meccanismo tecnico che risolve esattamente questo limite. È, letteralmente, il meccanismo che rende possibile, per la prima volta in questo corso, iniziare a parlare seriamente di "agenti" — perché un agente, come vedremo formalmente nella Lezione 6.1, è precisamente un sistema che può percepire, ragionare, **e agire**. Questa lezione costruisce il "agire".

---

## Obiettivi di Apprendimento

Al termine di questa lezione sarai in grado di:

- Spiegare con precisione il problema che il Function Calling risolve
- Descrivere il ciclo completo: modello → richiesta di strumento → esecuzione → risultato → modello
- Definire correttamente uno strumento, con nome, descrizione e schema dei parametri
- Distinguere un tool manifest (per un singolo agente) da un tool registry (per un intero sistema)

---

## 1. Il problema: il modello non può eseguire nulla da solo

Per quanto un modello come Claude sia eccellente nel generare testo, alla sua base esegue un'unica operazione: prevede il token successivo. Non ha, di per sé, alcun meccanismo per "premere un bottone", "interrogare un database in tempo reale", "inviare una richiesta HTTP", o eseguire calcoli con garanzia assoluta di precisione.

Immagina di voler chiedere a un assistente AI: "Qual è la temperatura attuale a Milano?" Un modello, da solo, non ha alcun modo di conoscere questa informazione in tempo reale. Quello che serve è la capacità di **eseguire effettivamente** una chiamata a un servizio meteo esterno, ottenere il dato reale, e poi usarlo per formulare la risposta.

---

## 2. L'idea centrale: il modello "richiede", il programma "esegue"

Il Function Calling funziona attraverso una separazione di responsabilità cruciale: **il modello non esegue mai direttamente nulla**. Il modello può solo **richiedere**, in un formato strutturato, che una certa funzione venga chiamata con certi parametri. È il **programma che ospita il modello** — il tuo codice — a decidere se e come eseguire effettivamente quella richiesta.

```
          IL TUO PROGRAMMA

1. Invia al modello: domanda dell'utente
   + elenco degli strumenti disponibili

2. Il MODELLO risponde: "vorrei chiamare lo strumento
   'meteo' con parametro città='Milano'" (RICHIESTA,
   non esecuzione)

3. Il TUO PROGRAMMA esegue effettivamente
   la funzione meteo("Milano")
   → ottiene: {"temperatura": 18, "umidita": 62}

4. Il tuo programma invia questo risultato
   DI NUOVO al modello

5. Il modello genera la risposta finale:
   "A Milano ci sono attualmente 18°C"
```

Questa separazione rende il sistema sicuro e controllabile: un modello non potrà mai, da solo, eseguire un'azione non autorizzata, perché ogni esecuzione passa obbligatoriamente attraverso codice scritto e controllato da chi costruisce il sistema.

---

## 3. Definire uno strumento: nome, descrizione, schema dei parametri

```python
strumento_meteo = {
    "name": "ottieni_meteo",
    "description": "Restituisce la temperatura attuale e le condizioni meteo "
                   "per una città specifica. Usa questo strumento quando "
                   "l'utente chiede informazioni meteo in tempo reale.",
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
- **`description`**: una spiegazione di cosa fa lo strumento e **quando** dovrebbe essere usato — questo campo è cruciale per permettere al modello di decidere se usarlo
- **`input_schema`**: uno schema JSON che descrive precisamente quali parametri lo strumento richiede

---

## 4. Il ciclo completo, in codice

```python
import anthropic
import json

def ottieni_meteo(citta: str) -> dict:
    return {"temperatura": 18, "condizione": "nuvoloso"}  # simulato

def chiedi_con_strumenti(domanda_utente: str):
    client = anthropic.Anthropic()

    risposta = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        tools=[strumento_meteo],
        messages=[{"role": "user", "content": domanda_utente}]
    )

    if risposta.stop_reason == "tool_use":
        richiesta = risposta.content[-1]
        risultato = ottieni_meteo(**richiesta.input)

        risposta_finale = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            tools=[strumento_meteo],
            messages=[
                {"role": "user", "content": domanda_utente},
                {"role": "assistant", "content": risposta.content},
                {"role": "user", "content": [{
                    "type": "tool_result",
                    "tool_use_id": richiesta.id,
                    "content": json.dumps(risultato)
                }]}
            ]
        )
        return risposta_finale.content[0].text

    return risposta.content[0].text
```

Nota la struttura dei `messages` nella seconda chiamata: includiamo l'intera cronologia precedente, inclusa la richiesta di strumento generata dal modello e il risultato che il nostro programma ha effettivamente calcolato.

---

## 5. Tool Manifest e Tool Registry

- **Tool Manifest**: l'elenco degli strumenti disponibili **a uno specifico agente** — dichiara "questo agente può usare esattamente questi strumenti, e nessun altro"
- **Tool Registry**: il catalogo **centralizzato** di tutti gli strumenti disponibili nell'intero sistema, da cui i singoli agenti possono "pescare" un sottoinsieme specifico

```
        TOOL REGISTRY (centralizzato)
    ─────────────────────────────────────
    - ottieni_meteo     - invia_email
    - cerca_sul_web     - interroga_database
             │                    │
    ┌────────┘              ┌─────┘
    TOOL MANIFEST           TOOL MANIFEST
    Agente "Meteo"          Agente "Clienti"
    - ottieni_meteo         - cerca_sul_web
                            - invia_email
                            - interroga_database
```

---

## Esempio Pratico: Decidere Quando uno Strumento è Necessario

1. "Quanto fa 347 × 28?" → **strumento** (calcolatrice), per eliminare il rischio di errore aritmetico
2. "Spiegami cos'è la fotosintesi" → **nessuno strumento**, conoscenza stabile e ben rappresentata
3. "Qual è il prezzo attuale delle azioni di un'azienda?" → **strumento**, dato in tempo reale
4. "Riassumi questo testo che ti ho fornito" → **nessuno strumento**, il testo è già nel contesto

---

## Riepilogo

- Il **Function Calling** risolve il limite per cui un LLM può solo generare testo e non eseguire azioni reali nel mondo.
- Il principio centrale è una separazione di responsabilità: il **modello richiede** l'uso di uno strumento, ma è il **programma** a eseguirlo e a restituire il risultato.
- Uno strumento si definisce con **nome**, **descrizione** (cruciale) e **schema dei parametri**.
- Il ciclo completo richiede **due chiamate API**: la prima in cui il modello richiede uno strumento, la seconda in cui gli si fornisce il risultato.

---

## Domande di Verifica

1. Perché è importante che il modello "richieda" l'uso di uno strumento invece di eseguirlo direttamente? Quali rischi di sicurezza emergerebbero se il modello potesse eseguire azioni senza l'intermediazione del programma?

2. Immagina di dover scrivere la descrizione di uno strumento che invia email. Quali informazioni dovrebbe contenere per permettere al modello di capire quando usarlo — e quando invece NON dovrebbe usarlo?

3. Un agente ha accesso, nel proprio tool manifest, solo a uno strumento di lettura di un database, non a uno strumento di scrittura. Che tipo di garanzia di sicurezza fornisce questa scelta progettuale?

---

## Esercizi Pratici

> Tre esercizi a difficoltà crescente. Prova a risolverli da solo prima di aprire il suggerimento.

### Esercizio 1 — Serve uno strumento? 🟢 Base

Per ciascuna richiesta indica se serve uno **strumento esterno** o basta la conoscenza del modello: (a) "Quanto fa 8347 × 219?", (b) "Spiega cos'è la gravità", (c) "Che tempo fa adesso a Tokyo?", (d) "Riassumi questo testo che ti ho incollato".

<details>
<summary>💡 Mostra suggerimento</summary>

**Criterio generale:** serve uno strumento per **dati in tempo reale, calcoli esatti, o azioni nel mondo**; non serve per conoscenza stabile o testo già fornito.

Pensa per ciascun caso:
- L'informazione è già nel contesto della conversazione?
- È una conoscenza stabile e ben consolidata?
- Richiede un dato che cambia nel tempo?
- Richiede un calcolo che deve essere esatto (non approssimato)?

</details>

### Esercizio 2 — Definisci uno strumento 🟡 Intermedio

Scrivi (in forma di dizionario Python) la definizione di uno strumento `invia_email` con parametri `destinatario`, `oggetto` e `corpo`. Perché il campo `description` è così importante?

<details>
<summary>💡 Mostra suggerimento</summary>

**Struttura da seguire:**
```python
strumento_email = {
    "name": "invia_email",
    "description": "... spiegazione di cosa fa e quando usarlo ...",
    "input_schema": {
        "type": "object",
        "properties": {
            "destinatario": {"type": "string", "description": "..."},
            "oggetto":      {"type": "string", "description": "..."},
            "corpo":        {"type": "string", "description": "..."},
        },
        "required": ["destinatario", "oggetto", "corpo"]
    }
}
```

**Nella descrizione** specifica anche quando NON usare lo strumento — es. "SOLO quando l'utente chiede esplicitamente di inviare un'email". Scrivere bene la descrizione è prompt engineering applicato: serve sia a indicare quando usarlo sia a evitare invii indesiderati.

</details>

### Esercizio 3 — Sicurezza: chi esegue cosa 🔴 Avanzato

Spiega perché è importante che il modello "richieda" uno strumento invece di eseguirlo direttamente. Poi: un agente ha nel suo tool manifest solo uno strumento di *lettura* del database, non di *scrittura*. Che garanzia di sicurezza offre questa scelta?

<details>
<summary>💡 Mostra suggerimento</summary>

**Prima parte:** rifletti sulla separazione di responsabilità — chi decide *se* eseguire l'azione e chi la esegue effettivamente. Cosa succede se il modello genera output inaspettato o malevolo?

**Seconda parte:** se lo strumento di scrittura non è nel manifest, può il modello modificare i dati in qualsiasi circostanza? La garanzia dipende dal comportamento del modello o dalla struttura del sistema?

Concetto chiave: sicurezza per **costruzione** (il tool non esiste nel manifest) vs sicurezza per **fiducia** (il modello non lo farà mai) — quale delle due è più robusta?

</details>

---

## Connessioni

**Viene da:** Lezione 4.5 (Limiti degli LLM) — il Function Calling risolve direttamente il limite "mancanza di azione" descritto lì. Lezione 5.2 (Output Strutturati) — la richiesta di uno strumento da parte del modello è essa stessa un output strutturato.

**Porta a:** Lezione 5.5 (MCP) — vedremo come standardizzare la connessione tra modelli e strumenti esterni.

**Ritroverai questi concetti in:** Lezione 6.1 (Cos'è un Agente AI) — il ciclo modello-richiesta-esecuzione-risultato visto qui è uno dei quattro componenti fondamentali di un agente. Lezione 7.2 (L'Agent Package) — il tool manifest diventerà la cartella `tools/` esplicita di un agente professionale.

---

## 🌐 Per Approfondire in Inglese

La documentazione ufficiale Anthropic sul tool use, con esempi di codice aggiornati, spiegazione del ciclo di vita di una chiamata strumento e casi d'uso avanzati → **"Tool use (function calling)"** nella documentazione ufficiale Anthropic su docs.anthropic.com (tipo: documentazione)
