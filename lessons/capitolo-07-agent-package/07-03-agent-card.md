---
id: "06-03"
titolo: "Agent Card: il documento di identità di un agente"
sottotitolo: "Dal config interno all'interfaccia pubblica: come un agente si presenta al resto del mondo"
capitolo: 6
capitolo_titolo: "L'Agent Package: Struttura, Contratti e Artefatti"
lezione: 3
durata_stimata: "65 minuti"
difficolta: "avanzato"
prerequisiti: ["06-02"]
concetti_chiave:
  - agent card
  - interoperabilità
  - contratto di servizio
  - discovery
  - versioning
obiettivi:
  - "Distinguere Agent Card da agent.yaml con precisione"
  - "Costruire un'Agent Card completa per un agente reale"
  - "Spiegare come un orchestratore usa le Agent Card per la discovery"
  - "Descrivere il ciclo di vita di un'Agent Card: versioning e deprecazione"
stato: "pubblicata"
versione: "1.0"
---

# Agent Card: il documento di identità di un agente

## Introduzione

Nella lezione precedente abbiamo costruito `agent.yaml`: il file di configurazione **interno** di un agente, che dichiara modello, parametri, e riferimenti a prompt e strumenti. Questo file risponde a una domanda specifica: "come si configura ed esegue questo agente?" — una domanda rilevante per chi **mantiene** l'agente.

Questa lezione introduce un documento diverso, con uno scopo diverso: l'**Agent Card**. Risponde a una domanda altrettanto importante ma distinta: "**cosa fa** questo agente, e come posso usarlo, senza dover conoscere nulla della sua implementazione interna?" — una domanda rilevante per chi **usa** l'agente, che potrebbe essere un orchestratore (Lezione 5.3), un altro agente in un sistema multi-agente (Lezione 5.4), o persino un sistema costruito da un'organizzazione completamente diversa.

---

## Obiettivi di Apprendimento

Al termine di questa lezione sarai in grado di:

- Distinguere con precisione un'Agent Card da `agent.yaml`, riconoscendo a quale domanda ciascuno risponde
- Costruire un'Agent Card completa per un agente reale
- Spiegare come un orchestratore usa le Agent Card per il processo di discovery (scoperta delle capacità disponibili)
- Descrivere il ciclo di vita di un'Agent Card: versioning e deprecazione

---

## 1. Configurazione interna vs interfaccia pubblica

Riprendiamo il principio di incapsulamento introdotto nella Lezione 5.3, parlando dell'orchestratore: "vede i risultati, non i meccanismi interni". L'Agent Card è precisamente l'applicazione concreta e formale di questo principio.

```
AGENT.YAML (Lezione 6.2)              AGENT CARD (questa lezione)

Risponde a: "come funziona            Risponde a: "cosa fa questo
QUESTO agente, internamente?"          agente, e come ci si interfaccia
                                        con lui, dall'ESTERNO?"

Contiene: modello specifico            Contiene: capacità dichiarate,
usato, parametri di temperature,       schema di input/output atteso,
percorsi di file interni,              limiti noti, informazioni di
dettagli implementativi                contatto/responsabilità

Letto da: chi MANTIENE l'agente        Letto da: chi USA l'agente
(sviluppatori del team che lo          (orchestratori, altri agenti,
possiede)                              sistemi di terze parti)

Cambia: spesso, a ogni modifica         Cambia: raramente, solo quando
implementativa interna                 l'interfaccia pubblica cambia
                                        (es. nuova versione con nuove
                                        capacità)
```

Questa distinzione tra interno ed esterno è la stessa logica delle API REST (Lezione 1.5): l'implementazione interna di un servizio può cambiare liberamente, purché l'interfaccia pubblica dichiarata resti stabile e prevedibile per chi la consuma.

---

## 2. Anatomia di una Agent Card completa

```yaml
---
# AGENT CARD — agente-analista-vendite
# Questo documento descrive l'INTERFACCIA PUBBLICA dell'agente,
# non la sua implementazione interna.

identita:
  id: "agente-analista-vendite"
  nome: "Analista Vendite"
  versione: "1.2.0"
  owner: "team-data-engineering"
  contatto: "data-eng@azienda.esempio"

capacita:
  descrizione: >
    Analizza dati di vendita strutturati e identifica trend
    significativi, confronti temporali, e anomalie statistiche.
  domini_competenza:
    - "analisi dati di vendita"
    - "confronti temporali (anno su anno, trimestre su trimestre)"
  NON_fa:
    - "raccomandazioni strategiche di business"
    - "previsioni a lungo termine (oltre 1 anno)"

interfaccia:
  schema_input:
    riferimento: "schemas/input_schema.json"
    esempio:
      periodo: "Q3-2026"
      metrica: "vendite_totali"
  schema_output:
    riferimento: "schemas/output_schema.json"
    esempio:
      trend: "crescita"
      percentuale_variazione: 12.5
      confidenza: "alta"

limiti_noti:
  - "Richiede dati già strutturati: non elabora documenti non strutturati"
  - "Accuratezza ridotta per periodi con meno di 30 giorni di dati"

stato: "produzione"
ultima_modifica: "2026-06-01"
---
```

Nota la sezione **`NON_fa`**: dichiarare esplicitamente cosa un agente *non* fa è altrettanto importante, per chi deve decidere se usarlo, quanto dichiarare cosa fa. Questo previene un errore comune nei sistemi multi-agente: un orchestratore (o uno sviluppatore umano) che assume erroneamente che un agente possa gestire un compito fuori dal suo dominio dichiarato, semplicemente perché nessuno lo ha esplicitamente escluso.

> **Perché questo richiama direttamente la Lezione 4.4:** ricorda l'importanza della `description` di uno strumento nel Function Calling — un testo vago produce un uso scorretto dello strumento. La stessa identica logica si applica, su scala più ampia, alla descrizione delle capacità di un intero agente nella sua Agent Card.

---

## 3. Implementazione pratica: discovery automatica tramite Agent Card

Il valore pratico più significativo delle Agent Card emerge quando un orchestratore deve scegliere, tra molti agenti disponibili, quale sia il più adatto per un compito specifico — un processo chiamato **discovery**.

```python
import yaml
import os

def carica_tutte_le_agent_card(cartella_agenti: str) -> list[dict]:
    """Carica le Agent Card di tutti gli agenti disponibili nel sistema."""
    cards = []
    for nome_cartella in os.listdir(cartella_agenti):
        percorso_card = os.path.join(
            cartella_agenti, nome_cartella, "agent_card.yaml"
        )
        if os.path.exists(percorso_card):
            with open(percorso_card) as f:
                cards.append(yaml.safe_load(f))
    return cards


def trova_agente_adatto(cards: list[dict], dominio_richiesto: str) -> dict | None:
    """
    Discovery semplificata: trova il primo agente la cui Agent Card
    dichiara competenza nel dominio richiesto.
    """
    for card in cards:
        domini = card["capacita"]["domini_competenza"]
        if any(dominio_richiesto.lower() in d.lower() for d in domini):
            return card
    return None


def orchestratore_con_discovery(richiesta_utente: str, cartella_agenti: str) -> str:
    """
    Un orchestratore che, invece di avere agenti cablati
    direttamente nel codice (come nella Lezione 5.3), li
    SCOPRE dinamicamente leggendo le loro Agent Card.
    """
    cards_disponibili = carica_tutte_le_agent_card(cartella_agenti)

    # In un caso reale, questa classificazione del dominio
    # richiesto sarebbe essa stessa una chiamata al modello
    # (Lezione 4.1), qui semplificata per chiarezza
    dominio = "analisi dati di vendita"

    agente_scelto = trova_agente_adatto(cards_disponibili, dominio)

    if not agente_scelto:
        return "Nessun agente disponibile per questo tipo di richiesta."

    return f"Richiesta delegata a: {agente_scelto['identita']['nome']}"
```

Questa è una versione semplificata, ma il principio è esattamente quello usato in sistemi multi-agente professionali su scala più ampia: invece di un orchestratore che "conosce" staticamente ogni singolo agente disponibile (come nell'esempio della Lezione 5.3, dove gli agenti erano funzioni Python importate direttamente), un orchestratore con discovery può adattarsi dinamicamente a un catalogo di agenti che **cresce nel tempo**, senza richiedere modifiche al codice dell'orchestratore stesso ogni volta che un nuovo agente viene aggiunto al sistema.

---

## 4. Agent Card come contratto di servizio

Una volta che altri componenti del sistema (o, in scenari di interoperabilità più ampia, sistemi di organizzazioni terze) iniziano a **dipendere** dall'interfaccia dichiarata in un'Agent Card, quella dichiarazione diventa, di fatto, un **contratto di servizio**: una promessa che deve essere rispettata con disciplina.

```
SCENARIO PROBLEMATICO:

L'Agente Analista Vendite, versione 1.2.0, dichiara nello
schema_output un campo "percentuale_variazione" (numero)

Il team decide di rinominarlo in "variazione_percentuale"
nella versione 1.3.0, SENZA preavviso

→ Ogni orchestratore o agente che si aspettava il campo
  originale ora fallisce silenziosamente o produce errori
  difficili da diagnosticare
```

Questo scenario motiva direttamente perché il versionamento (già introdotto nella Lezione 6.1, e approfondito con maggiore rigore nella Lezione 8.4) sia così importante per le Agent Card: una modifica che rompe la compatibilità con l'interfaccia pubblica dichiarata dovrebbe sempre corrispondere a un cambiamento di versione esplicito (tipicamente, nel semantic versioning, un incremento del numero "maggiore" — da `1.x.x` a `2.0.0`), permettendo a chi dipende dall'agente di sapere, semplicemente guardando il numero di versione, se un aggiornamento potrebbe richiedere modifiche dal proprio lato.

---

## Esempio Pratico: Identificare Cosa Appartiene all'Agent Card

Per consolidare la distinzione della Sezione 1, classifica ciascuna di queste informazioni come appartenente più correttamente ad `agent.yaml` (configurazione interna) o all'Agent Card (interfaccia pubblica):

1. Il valore specifico del parametro `temperature` usato nelle chiamate API → **agent.yaml** (dettaglio implementativo interno, irrilevante per chi usa l'agente dall'esterno)
2. La descrizione dei domini di competenza dell'agente → **Agent Card** (informazione necessaria per decidere se delegare un compito a questo agente)
3. Il percorso del file Python che implementa un determinato strumento → **agent.yaml** (dettaglio implementativo)
4. Lo schema esatto del formato di output che l'agente garantisce di produrre → **Agent Card** (un orchestratore o un altro agente deve conoscere questo per poter elaborare correttamente il risultato)
5. Quali compiti l'agente esplicitamente NON gestisce → **Agent Card** (essenziale per la discovery e per evitare un uso scorretto)

Questo esercizio di classificazione, semplice in apparenza, è precisamente il tipo di giudizio progettuale che applicherai costantemente costruendo agent package reali: ogni nuova informazione che aggiungi a un agente richiede di chiederti "questo serve a chi mantiene l'agente, o a chi lo usa dall'esterno?"

---

## Riepilogo

- L'**Agent Card** dichiara l'interfaccia pubblica di un agente — cosa fa, cosa non fa, quale formato di input si aspetta e quale output garantisce — distinta da `agent.yaml`, che configura il funzionamento interno.
- Una sezione esplicita di capacità **NON dichiarate** (`NON_fa`) è altrettanto importante della dichiarazione delle capacità presenti, per prevenire un uso scorretto dell'agente.
- Il processo di **discovery** permette a un orchestratore di scegliere dinamicamente l'agente più adatto per un compito, leggendo le Agent Card disponibili, invece di avere ogni agente cablato staticamente nel codice.
- Una volta che altri componenti dipendono dall'interfaccia dichiarata, l'Agent Card diventa un **contratto di servizio**: modifiche che rompono questa interfaccia devono essere accompagnate da un cambiamento di versione esplicito.

---

## Domande di Verifica

1. Spiega perché un cambiamento al valore di `temperature` in `agent.yaml` non richiede tipicamente un aggiornamento di versione dell'Agent Card, mentre un cambiamento al formato dello schema di output sì.

2. Nel codice della Sezione 3, la funzione `trova_agente_adatto` usa una corrispondenza testuale molto semplice. Quale tecnica, vista in una lezione precedente del corso, potrebbe rendere questa discovery più robusta, capace di trovare un agente adatto anche quando la richiesta non condivide parole esatte con i domini dichiarati?

3. Un'Agent Card dichiara, nella sezione `NON_fa`, che l'agente "non elabora documenti non strutturati". Un orchestratore, nonostante questa dichiarazione, gli invia comunque un PDF non strutturato. Di chi è, secondo te, la responsabilità del comportamento scorretto risultante: dell'agente, dell'orchestratore, o di chi ha progettato il sistema di discovery?

---

## Esercizi Pratici

> Tre esercizi a difficoltà crescente. Prova a risolverli da solo prima di aprire la soluzione.

### Esercizio 1 — agent.yaml o Agent Card? 🟢 Base

Classifica ciascuna informazione come **agent.yaml** (config interna) o **Agent Card** (interfaccia pubblica): (a) valore di `temperature`, (b) domini di competenza dell'agente, (c) percorso del file Python di uno strumento, (d) schema di output garantito, (e) cosa l'agente NON fa.

<details>
<summary>💡 Mostra soluzione</summary>

- **(a) temperature** → **agent.yaml**: dettaglio implementativo interno, irrilevante dall'esterno.
- **(b) domini di competenza** → **Agent Card**: serve a chi decide se delegare un compito.
- **(c) percorso file dello strumento** → **agent.yaml**: dettaglio implementativo.
- **(d) schema di output** → **Agent Card**: chi usa l'agente deve conoscerlo per elaborare il risultato.
- **(e) cosa NON fa** → **Agent Card**: essenziale per la discovery ed evitare usi scorretti.

Domanda guida: "questo serve a chi *mantiene* l'agente o a chi lo *usa* dall'esterno?"

</details>

### Esercizio 2 — NON_fa e discovery 🟡 Intermedio

(a) Perché dichiarare esplicitamente cosa un agente NON fa è importante quanto dichiarare cosa fa? (b) Cos'è la "discovery" e quale vantaggio dà rispetto ad agenti cablati nel codice dell'orchestratore?

<details>
<summary>💡 Mostra soluzione</summary>

**(a) `NON_fa`:** previene l'errore comune di assumere che un agente gestisca un compito fuori dal suo dominio solo perché nessuno lo ha escluso. È la stessa logica della `description` di uno strumento (Lezione 4.4): l'ambiguità porta a usi scorretti. Dichiarare i confini protegge il sistema.

**(b) Discovery:** è il processo con cui un orchestratore **sceglie dinamicamente** l'agente adatto leggendo le Agent Card disponibili, invece di avere ogni agente importato/cablato staticamente. Vantaggio: il catalogo di agenti può **crescere nel tempo** senza modificare il codice dell'orchestratore — basta aggiungere un nuovo agente con la sua Agent Card.

</details>

### Esercizio 3 — Quando cambia la versione 🔴 Avanzato

Il team rinomina nello schema di output `percentuale_variazione` in `variazione_percentuale` senza preavviso. (a) Cosa succede a chi dipende dall'agente? (b) Cosa imponeva di fare il versionamento semantico? (c) Perché cambiare `temperature` invece non richiede un cambio di versione dell'Agent Card?

<details>
<summary>💡 Mostra soluzione</summary>

**(a) Conseguenza:** ogni orchestratore/agente che si aspettava `percentuale_variazione` ora **non trova il campo** → fallimento silenzioso o errori difficili da diagnosticare. L'Agent Card è un **contratto di servizio**: romperlo senza avviso rompe i consumatori.

**(b) Versionamento semantico:** una modifica che **rompe la compatibilità** dell'interfaccia pubblica deve corrispondere a un incremento della versione **maggiore** (es. `1.2.0` → `2.0.0`). Così chi dipende dall'agente sa, dal solo numero di versione, che l'aggiornamento potrebbe richiedere modifiche dal suo lato.

**(c) `temperature`:** è un **dettaglio interno** (agent.yaml), non fa parte dell'interfaccia pubblica dichiarata. Cambiarlo non altera cosa l'agente riceve/restituisce, quindi non rompe nessun consumatore → nessun cambio di versione dell'Agent Card. (Stesso principio dell'incapsulamento delle API, Lezione 1.5: l'interno può cambiare se l'interfaccia resta stabile.)

</details>

---

## Connessioni

**Viene da:** Lezione 6.2 (L'Agent Package) — l'Agent Card è un componente specifico, con uno scopo distinto da `agent.yaml`, di quella stessa struttura. Lezione 5.3 (L'Orchestratore) — il principio di incapsulamento introdotto lì trova qui una formalizzazione completa.

**Porta a:** Lezione 6.5 (Contratti tra Agenti) — gli schemi di input/output referenziati nell'Agent Card riceveranno qui un trattamento tecnico completo e rigoroso.

**Ritroverai questi concetti in:** Lezione 7.1 (Progettare un Workflow Agentivo) — il protocollo A2A menzionerà esplicitamente le Agent Card come meccanismo di interoperabilità tra agenti di sistemi diversi. Lezione 8.4 (Governance e Versioning) — il ciclo di vita e il versionamento delle Agent Card, qui solo introdotti, riceveranno un trattamento formale completo.
