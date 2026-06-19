---
id: "07-03"
titolo: "Il Layer di Review: agenti critici e quality assurance nel workflow"
sottotitolo: "Prima di chiamare un umano, fai controllare un altro agente: il primo livello di qualità"
capitolo: 7
capitolo_titolo: "Workflow Multi-Agente: Design e Implementazione"
lezione: 3
durata_stimata: "65 minuti"
difficolta: "avanzato"
prerequisiti: ["07-02"]
concetti_chiave:
  - critic agent
  - rubrica di valutazione
  - ciclo produce-critica-revisione
  - quality gate
obiettivi:
  - "Spiegare il pattern Critic-Agent e la sua differenza dalla revisione umana"
  - "Definire una rubrica di valutazione strutturata per un agente reviewer"
  - "Implementare un nodo di review in LangGraph con ciclo di correzione"
  - "Decidere quando il review automatico è sufficiente e quando serve escalation"
stato: "pubblicata"
versione: "1.0"
---

# Il Layer di Review: agenti critici e quality assurance nel workflow

## Introduzione

Prima di affrontare, nella prossima lezione, la supervisione umana — che hai giustamente segnalato come concetto da non dimenticare — questa lezione costruisce un livello di qualità che precede e spesso riduce la necessità di intervento umano: il **layer di review automatico**, dove un agente specializzato valuta criticamente l'output di un altro agente, prima che quell'output proceda nel workflow.

Questo non sostituisce la supervisione umana della Lezione 7.4: la **precede**, in una logica a strati. Molti problemi possono essere rilevati e corretti automaticamente, senza bisogno di fermare il processo per un intervento umano; solo i casi che superano la soglia di affidabilità del review automatico devono essere effettivamente escalati. Costruire bene questo strato riduce drasticamente il carico di lavoro umano richiesto nella fase successiva.

---

## Obiettivi di Apprendimento

Al termine di questa lezione sarai in grado di:

- Spiegare il pattern Critic-Agent e distinguerlo con precisione dalla revisione umana
- Definire una rubrica di valutazione strutturata, applicabile automaticamente da un agente reviewer
- Implementare un nodo di review in LangGraph, con un ciclo di correzione basato sul feedback ricevuto
- Decidere, con criteri espliciti, quando il review automatico è sufficiente e quando è necessaria l'escalation a un umano

---

## 1. Il pattern Critic-Agent

L'idea centrale è semplice da enunciare e potente nella sua applicazione: **un agente produce, un secondo agente — indipendente dal primo — critica il risultato**, prima che questo proceda al passo successivo del workflow.

```
                [Agente Produttore]
                (es. Requirement Analyst,
                 Lezione 6.6)
                        │
                        ▼
              [Agente Critico / Reviewer]
              (valuta l'output secondo
               criteri espliciti)
                        │
              ┌─────────┴─────────┐
              ▼                   ▼
         VALIDO              PROBLEMA RILEVATO
              │                   │
              ▼                   ▼
      [Procedi nel workflow]  [Torna al Produttore
                                con feedback specifico]
```

> **Perché un secondo agente, e non lo stesso agente che si autovaluta:** un agente che valuta il proprio stesso output rischia di ripetere gli stessi errori di giudizio che hanno prodotto l'output originale (un problema che approfondiremo con rigore nella Lezione 8.1, parlando di self-critique). Un agente **indipendente**, con un prompt e un'istruzione di valutazione separati da quelli del produttore, è meno soggetto a questo tipo di bias di conferma.

---

## 2. Definire una rubrica di valutazione strutturata

Una rubrica è precisamente l'applicazione, al contesto della valutazione, dei principi di output strutturato già visti nella Lezione 4.2 e dei contratti della Lezione 6.5: criteri **espliciti e verificabili**, non un giudizio vago e discorsivo.

```python
from pydantic import BaseModel
from typing import Literal

class ValutazioneReview(BaseModel):
    """
    Rubrica di valutazione strutturata per l'output del
    Requirement Analyst Agent (riprendendo l'esempio della
    Lezione 6.6).
    """
    completezza: Literal["completo", "parziale", "insufficiente"]
    coerenza_interna: bool  # i requisiti si contraddicono tra loro?
    ambiguita_non_segnalate: list[str]  # ambiguità che il
                                          # produttore NON ha rilevato
    decisione: Literal["approva", "richiedi_revisione", "escala_a_umano"]
    motivazione: str
```

Il campo `decisione` con tre valori possibili (`approva`, `richiedi_revisione`, `escala_a_umano`) è precisamente il meccanismo che separa i tre possibili esiti di un review: tutto a posto, problema correggibile automaticamente, problema che richiede intervento umano (un'anteprima diretta della Lezione 7.4).

---

## 3. Implementazione pratica: il nodo di review in LangGraph

Estendiamo il grafo costruito nella Lezione 7.2, aggiungendo un nodo di review subito dopo l'analisi dei requisiti, con un ciclo di correzione automatica.

```python
import anthropic
import json

def nodo_review_requisiti(stato: StatoWorkflowRequisiti) -> dict:
    """
    Un agente CRITICO, indipendente dal Requirement Analyst,
    valuta l'output prodotto secondo la rubrica della Sezione 2.
    """
    client = anthropic.Anthropic()

    risposta = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=500,
        system="Sei un revisore indipendente di requisiti software. "
               "Valuta CRITICAMENTE l'analisi fornita, cercando "
               "ambiguità non rilevate, contraddizioni interne, "
               "o completezza insufficiente. Rispondi SOLO in "
               "formato JSON conforme allo schema fornito.",
        messages=[{
            "role": "user",
            "content": f"Requisiti da valutare: "
                       f"{json.dumps(stato.requisiti_identificati)}\n"
                       f"Ambiguità già segnalate dal produttore: "
                       f"{stato.ambiguita_rilevate}"
        }]
    )

    valutazione = ValutazioneReview(**json.loads(risposta.content[0].text))

    return {"valutazione_review": valutazione.model_dump()}


def decidi_dopo_review(stato: StatoWorkflowRequisiti) -> str:
    """
    Funzione di ROUTING (Lezione 7.2): instrada il workflow
    in base alla decisione del Critic-Agent.
    """
    decisione = stato.valutazione_review["decisione"]
    if decisione == "approva":
        return "costruisci_handoff"
    elif decisione == "richiedi_revisione":
        return "analisi"  # CICLO: torna al produttore con feedback
    else:  # "escala_a_umano"
        return "checkpoint_umano"  # Lezione 7.4


# Aggiunta al grafo della Lezione 7.2
grafo.add_node("review", nodo_review_requisiti)
grafo.add_edge("analisi", "review")  # sostituisce l'arco diretto
                                       # analisi → decidi_se_richiedere

grafo.add_conditional_edges(
    "review",
    decidi_dopo_review,
    {
        "costruisci_handoff": "costruisci_handoff",
        "analisi": "analisi",
        "checkpoint_umano": "checkpoint_umano"
    }
)
```

Osserva l'arco `"analisi": "analisi"` nella mappa delle destinazioni: questo implementa un **ciclo controllato**, esattamente il concetto introdotto nella Lezione 7.2 come uno dei vantaggi di LangGraph rispetto al codice scritto a mano. Se il reviewer richiede una revisione, il workflow torna al nodo di analisi, ma questa volta con il feedback del reviewer disponibile nello stato — permettendo al Requirement Analyst di correggere specificamente i problemi rilevati, invece di ripartire da zero.

---

## 4. Quando il review automatico basta, e quando serve l'umano

Il campo `decisione` della rubrica (Sezione 2) formalizza esattamente questa scelta, ma vale la pena esplicitare i criteri che dovrebbero guidare un reviewer (umano o agente) nella scelta tra queste tre opzioni:

```
APPROVA
  Il problema, se esiste, è chiaramente all'interno della
  competenza dichiarata dell'agente produttore (Agent Card,
  Lezione 6.3), e i criteri della rubrica sono pienamente
  soddisfatti

RICHIEDI REVISIONE (ciclo automatico)
  Il problema è SPECIFICO e CORREGGIBILE con un nuovo
  tentativo guidato da feedback puntuale — es. "hai
  dimenticato di specificare il formato di output per
  il requisito 3"

ESCALA A UMANO (Lezione 7.4)
  Il problema è di natura AMBIGUA o richiede un giudizio
  che esula dalla competenza dichiarata dell'agente (es.
  una decisione di business strategica, non solo tecnica),
  oppure il ciclo di correzione automatica ha già fallito
  un numero di tentativi superiore a una soglia di sicurezza
  (collegandosi al max_iterazioni della Lezione 5.1)
```

> **Perché questa gerarchia a tre livelli è efficiente:** se ogni singola imperfezione richiedesse intervento umano, il vantaggio di automazione del sistema agentivo andrebbe perso. Se nessuna imperfezione venisse mai escalata, il sistema rischierebbe di propagare errori che richiedono effettivamente un giudizio umano. Il layer di review automatico, posizionato strategicamente PRIMA dell'escalation, è ciò che bilancia questi due rischi opposti.

---

## Esempio Pratico: Distinguere i Tre Esiti su Casi Concreti

Applichiamo i criteri della Sezione 4 a tre scenari, riprendendo il caso del Requirement Analyst:

1. **"Il requisito 2 non specifica un limite di tempo massimo"** — probabilmente **richiedi_revisione**: è un'omissione specifica, correggibile chiedendo al produttore di aggiungere quel dettaglio
2. **"I documenti del cliente sono contraddittori su un requisito di business strategico (vogliono sia massima personalizzazione sia massima standardizzazione)"** — probabilmente **escala_a_umano**: non è un problema tecnico risolvibile rianalizzando i documenti, è una decisione che richiede un giudizio di business
3. **"Tutti i criteri della rubrica sono soddisfatti, nessuna ambiguità rilevata"** — **approva**: il workflow procede senza ulteriori interventi

---

## Riepilogo

- Il pattern **Critic-Agent** introduce un agente indipendente che valuta criticamente l'output di un agente produttore, prima che questo proceda nel workflow, riducendo i bias di auto-valutazione.
- Una **rubrica di valutazione strutturata** (con Pydantic, riprendendo la Lezione 4.2 e la Lezione 6.5) rende il giudizio del reviewer esplicito e verificabile, non discorsivo e ambiguo.
- L'implementazione in LangGraph (Lezione 7.2) usa un **ciclo controllato**: se il reviewer richiede una revisione, il workflow torna al nodo produttore con feedback specifico, invece di procedere con un output insufficiente.
- La gerarchia a tre livelli — **approva**, **richiedi revisione** (ciclo automatico), **escala a umano** — bilancia l'efficienza dell'automazione con la necessità di intervento umano per problemi che esulano dalla competenza tecnica del sistema.

---

## Domande di Verifica

1. Spiega perché un agente che valuta il proprio stesso output (invece di un Critic-Agent indipendente) rischierebbe di non rilevare gli stessi errori che ha commesso nel produrre quell'output.

2. Nel codice della Sezione 3, cosa garantisce che il ciclo `"analisi": "analisi"` non diventi un loop infinito, ripetendo all'infinito la stessa correzione senza mai arrivare a un'approvazione? (Suggerimento: ricollega la tua risposta al concetto di `max_iterazioni` della Lezione 5.1.)

3. Riprendi il secondo scenario dell'esempio pratico (requisiti di business contraddittori). Perché questo caso specifico non potrebbe essere risolto efficacemente nemmeno con un numero illimitato di tentativi di "richiedi_revisione"?

---

## Esercizi Pratici

> Tre esercizi a difficoltà crescente. Prova a risolverli da solo prima di aprire la soluzione.

### Esercizio 1 — Perché un critico indipendente 🟢 Base

Perché far valutare l'output da un **agente critico indipendente** è meglio che far auto-valutare lo stesso agente che l'ha prodotto?

<details>
<summary>💡 Mostra soluzione</summary>

Un agente che valuta il **proprio** output tende a **ripetere gli stessi errori di giudizio** che hanno prodotto l'output: se ha trascurato un'ambiguità nel produrre, è probabile che la trascuri anche nel valutare. È una forma di **bias di conferma**.

Un agente **indipendente**, con prompt e criteri di valutazione separati, guarda l'output con "occhi diversi" ed è meno soggetto a questo bias. (La self-critique resta utile come *primo* filtro economico, ma non sostituisce il critico indipendente — vedi Lezione 8.1.)

</details>

### Esercizio 2 — I tre esiti del review 🟡 Intermedio

Il campo `decisione` ha tre valori: `approva`, `richiedi_revisione`, `escala_a_umano`. Classifica: (a) "il requisito 2 non specifica un limite di tempo"; (b) "i documenti chiedono sia massima personalizzazione sia massima standardizzazione"; (c) "tutti i criteri soddisfatti".

<details>
<summary>💡 Mostra soluzione</summary>

- **(a) manca il limite di tempo** → **richiedi_revisione**: omissione **specifica e correggibile** con un nuovo tentativo guidato dal feedback.
- **(b) personalizzazione vs standardizzazione** → **escala_a_umano**: è una **contraddizione di business strategico**, non un problema tecnico risolvibile rianalizzando i documenti. Richiede un giudizio umano.
- **(c) tutto a posto** → **approva**: il workflow procede.

Criterio: correggibile da solo → richiedi_revisione; fuori dalla competenza tecnica/ambiguo → escala a umano; conforme → approva.

</details>

### Esercizio 3 — Contraddizioni e loop infiniti 🔴 Avanzato

(a) Perché la contraddizione di business (caso b sopra) non si risolve nemmeno con infiniti `richiedi_revisione`? (b) Cosa impedisce al ciclo `analisi → review → analisi` di diventare infinito?

<details>
<summary>💡 Mostra soluzione</summary>

**(a)** `richiedi_revisione` fa rianalizzare gli **stessi documenti** dal **produttore**. Ma la contraddizione è **nei dati di partenza** (gli stakeholder vogliono due cose incompatibili) — nessuna rianalisi può inventare una decisione che spetta a un umano con autorità di business. Ripetere all'infinito produrrebbe solo lo stesso stallo. Serve l'escalation: è un problema di *contenuto*, non di *qualità dell'analisi*.

**(b)** Serve un **limite di tentativi** sul ciclo di revisione (lo stesso principio del `max_iterazioni`, Lezione 5.1): dopo N round di `richiedi_revisione` senza arrivare ad `approva`, il sistema deve forzare l'`escala_a_umano`. Senza questo contatore, un problema non auto-correggibile (come la contraddizione di business) farebbe rimbalzare il workflow tra analisi e review all'infinito. La soglia trasforma un loop potenzialmente infinito in un'escalation controllata.

</details>

---

## Connessioni

**Viene da:** Lezione 7.2 (LangGraph) — il nodo di review è implementato esattamente con i meccanismi di ciclo controllato visti in quella lezione. Lezione 6.5 (Contratti tra Agenti) — la rubrica di valutazione è un'applicazione diretta dei principi di validazione strutturata.

**Porta a:** Lezione 7.4 (Human-in-the-Loop) — l'esito "escala_a_umano" di questa lezione è precisamente il punto di ingresso del pattern che formalizzeremo nella prossima lezione.

**Ritroverai questi concetti in:** Lezione 8.1 (Self-Reflection) — la distinzione tra valutazione da un agente indipendente (questa lezione) e auto-valutazione (quella lezione) sarà approfondita con maggiore rigore. Lezione 7.5 (Valutazione dei Workflow) — le rubriche di review qui costruite diventeranno parte delle metriche di sistema misurate in quella lezione.
