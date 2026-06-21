---
id: "07-02"
titolo: "LangGraph: costruire workflow come grafi orientati con stato"
sottotitolo: "Dal diagramma su carta al codice funzionante: lo strumento standard per workflow agentivi"
capitolo: 7
capitolo_titolo: "Workflow Multi-Agente: Design e Implementazione"
lezione: 2
durata_stimata: "80 minuti"
difficolta: "avanzato"
prerequisiti: ["07-01", "04-05"]
concetti_chiave:
  - LangGraph
  - StateGraph
  - nodo LangGraph
  - arco condizionale
  - checkpointing
obiettivi:
  - "Spiegare quando LangGraph offre un vantaggio rispetto al codice Python diretto"
  - "Implementare un StateGraph completo con nodi e archi condizionali"
  - "Costruire nodi paralleli per l'esecuzione simultanea di agenti"
  - "Configurare il checkpointing per la persistenza dello stato tra esecuzioni"
stato: "pubblicata"
versione: "1.0"
---

# LangGraph: costruire workflow come grafi orientati con stato

## Introduzione

Nella lezione precedente abbiamo progettato un workflow interamente su "carta": diagrammi, principi di posizionamento dei checkpoint, vocabolario di nodi e archi. Questa lezione trasforma quel design in codice eseguibile, usando **LangGraph**, il framework oggi più diffuso per costruire esattamente questo tipo di sistema.

È importante affrontare LangGraph con la giusta prospettiva: non è uno strumento che introduce concetti nuovi rispetto a quanto già costruito nel corso — è un framework che **formalizza e rende robusta** l'implementazione di pattern che, fino a questa lezione, abbiamo scritto a mano con cicli `for` e funzioni Python (Lezioni 5.1, 5.3, 5.4). Tutto quello che LangGraph fa, lo hai già fatto tu stesso, in forma più semplice, nelle lezioni precedenti — qui ne vediamo la versione professionale e scalabile.

---

## Obiettivi di Apprendimento

Al termine di questa lezione sarai in grado di:

- Spiegare con precisione quando LangGraph offre un vantaggio concreto rispetto al codice Python diretto delle lezioni precedenti
- Implementare un `StateGraph` completo, con nodi e archi condizionali, per un workflow reale
- Costruire nodi paralleli per l'esecuzione simultanea di più agenti
- Configurare il checkpointing per garantire la persistenza dello stato tra esecuzioni diverse

---

## 1. Perché LangGraph, e non solo cicli Python

Negli esempi del Capitolo 5 (in particolare la Lezione 5.4), abbiamo costruito pipeline con cicli `for` e chiamate di funzione sequenziali. Questo approccio funziona bene per workflow semplici, ma incontra limiti concreti quando il grafo progettato nella Lezione 7.1 diventa più complesso:

```
LIMITI DEL CODICE PYTHON "FATTO A MANO"

- Gestire archi condizionali multipli (Sezione 2 della
  Lezione 7.1) con semplici if/else diventa rapidamente
  illeggibile quando le condizioni si moltiplicano

- Implementare cicli controllati (tornare a un nodo
  precedente, come nel checkpoint "Ambiguità rilevata?")
  richiede di gestire manualmente la logica di iterazione,
  con rischio di loop infiniti se non si presta attenzione

- La PERSISTENZA dello stato tra un'esecuzione e la
  successiva (es. un workflow che si interrompe per
  attendere revisione umana, e deve poter RIPRENDERE
  esattamente da dove si era fermato) richiede di
  implementare manualmente serializzazione, salvataggio,
  e ripristino dello stato
```

LangGraph risolve questi tre problemi fornendo un'API dedicata per dichiarare nodi, archi (anche condizionali e ciclici), e un meccanismo di persistenza dello stato — il **checkpointing**, che approfondiremo nella Sezione 4 — pronto all'uso, senza doverlo implementare da zero.

---

## 2. Il concetto di StateGraph

Un `StateGraph` è, letteralmente, l'implementazione tecnica del grafo progettato nella Lezione 7.1: un insieme di nodi, ciascuno dei quali legge e scrive su uno **stato condiviso**, esattamente come il `StatoWorkflowRequisiti` definito in quella lezione.

```python
from langgraph.graph import StateGraph, END
from pydantic import BaseModel
from typing import Optional

class StatoWorkflowRequisiti(BaseModel):
    """Lo stesso stato definito nella Lezione 7.1."""
    cartella_input: str
    testo_estratto: Optional[str] = None
    requisiti_identificati: Optional[dict] = None
    ambiguita_rilevate: list[str] = []
    handoff_pronto: bool = False


def nodo_estrazione(stato: StatoWorkflowRequisiti) -> dict:
    """
    Un NODO del grafo: riceve lo stato attuale, esegue
    il proprio lavoro (qui useremmo l'agente di estrazione,
    Lezione 5.1), e restituisce gli AGGIORNAMENTI allo stato.
    """
    testo = f"Testo estratto dalla cartella {stato.cartella_input}"
    return {"testo_estratto": testo}


def nodo_analisi_requisiti(stato: StatoWorkflowRequisiti) -> dict:
    """Un secondo nodo, che usa l'output del nodo precedente."""
    requisiti = {"funzionali": ["upload multi-formato"]}
    ambiguita = ["formato output non specificato chiaramente"]
    return {
        "requisiti_identificati": requisiti,
        "ambiguita_rilevate": ambiguita
    }


def decidi_se_richiedere_chiarimento(stato: StatoWorkflowRequisiti) -> str:
    """
    Una FUNZIONE DI ROUTING: decide quale arco seguire,
    implementando il checkpoint "Ambiguità rilevata?"
    della Lezione 7.1.
    """
    if stato.ambiguita_rilevate:
        return "richiedi_chiarimento"
    return "costruisci_handoff"


# Costruzione del grafo
grafo = StateGraph(StatoWorkflowRequisiti)

grafo.add_node("estrazione", nodo_estrazione)
grafo.add_node("analisi", nodo_analisi_requisiti)
grafo.add_node("richiedi_chiarimento", lambda s: {"handoff_pronto": False})
grafo.add_node("costruisci_handoff", lambda s: {"handoff_pronto": True})

grafo.set_entry_point("estrazione")
grafo.add_edge("estrazione", "analisi")

# ARCO CONDIZIONALE: implementa il checkpoint della Lezione 7.1
grafo.add_conditional_edges(
    "analisi",
    decidi_se_richiedere_chiarimento,
    {
        "richiedi_chiarimento": "richiedi_chiarimento",
        "costruisci_handoff": "costruisci_handoff"
    }
)

grafo.add_edge("richiedi_chiarimento", END)
grafo.add_edge("costruisci_handoff", END)

workflow_compilato = grafo.compile()

# Esecuzione
risultato = workflow_compilato.invoke(
    StatoWorkflowRequisiti(cartella_input="documenti_cliente_X/")
)
```

Confronta questo codice con il diagramma della Lezione 7.1: `add_node` corrisponde esattamente ai nodi disegnati, `add_conditional_edges` implementa precisamente il checkpoint "Ambiguità rilevata?" con la sua diramazione condizionale. **Il design ha preceduto l'implementazione**, e l'implementazione la rispetta fedelmente — questo è precisamente il valore della disciplina di progettazione insegnata nella lezione precedente.

---

## 3. Nodi paralleli: eseguire più agenti contemporaneamente

Un vantaggio significativo di LangGraph, difficile da replicare correttamente a mano senza introdurre bug di concorrenza, è l'esecuzione di **nodi paralleli**: più agenti che lavorano contemporaneamente su parti indipendenti dello stato, i cui risultati vengono poi raccolti insieme.

```python
def nodo_estrazione_pdf(stato: StatoWorkflowRequisiti) -> dict:
    return {"testo_da_pdf": "contenuto estratto dai PDF"}

def nodo_estrazione_audio(stato: StatoWorkflowRequisiti) -> dict:
    return {"testo_da_audio": "trascrizione dei file audio"}

def nodo_estrazione_immagini(stato: StatoWorkflowRequisiti) -> dict:
    return {"testo_da_immagini": "descrizione delle immagini"}

# Tutti e tre questi nodi possono partire dallo stesso punto
# del grafo ed essere eseguiti IN PARALLELO, perché operano
# su parti indipendenti dello stato (non c'è dipendenza
# tra l'estrazione PDF e l'estrazione audio)

grafo.add_edge("inizio", "estrazione_pdf")
grafo.add_edge("inizio", "estrazione_audio")
grafo.add_edge("inizio", "estrazione_immagini")

# Un nodo successivo "unisce" i risultati solo dopo che
# TUTTI i nodi paralleli hanno completato il proprio lavoro
grafo.add_edge("estrazione_pdf", "unisci_risultati")
grafo.add_edge("estrazione_audio", "unisci_risultati")
grafo.add_edge("estrazione_immagini", "unisci_risultati")
```

Questo pattern è esattamente ciò che serve per il tuo caso d'uso: una cartella con file misti (PDF, immagini, audio) può essere elaborata con **tre estrazioni parallele indipendenti**, invece di un'elaborazione sequenziale file per file — un guadagno di tempo significativo quando la cartella contiene molti file di tipi diversi.

---

## 4. Persistenza dello stato: il checkpointing di LangGraph

Torniamo a un limite identificato nella Sezione 1: cosa succede se il workflow deve **fermarsi** (ad esempio, al checkpoint di revisione umana che affronteremo nella Lezione 7.4) e riprendere solo dopo che un umano ha fornito un feedback, potenzialmente ore o giorni dopo?

```python
from langgraph.checkpoint.memory import MemorySaver

memoria_checkpoint = MemorySaver()
workflow_compilato = grafo.compile(checkpointer=memoria_checkpoint)

# Ogni esecuzione è associata a un thread_id univoco,
# che permette di RIPRENDERE esattamente da dove si era
# interrotta, anche in un processo completamente separato
configurazione = {"configurable": {"thread_id": "progetto-cliente-X-2026"}}

# Prima esecuzione: il workflow si ferma al checkpoint umano
risultato_parziale = workflow_compilato.invoke(
    StatoWorkflowRequisiti(cartella_input="documenti_cliente_X/"),
    config=configurazione
)

# ... giorni dopo, un umano ha fornito il proprio feedback ...

# Il workflow RIPRENDE esattamente dallo stato salvato,
# senza dover ripetere l'estrazione e l'analisi già completate
risultato_finale = workflow_compilato.invoke(
    None,  # nessun nuovo input: riprende dal checkpoint salvato
    config=configurazione
)
```

Questo meccanismo di persistenza è precisamente ciò che rende possibile, in modo robusto e senza dover implementare manualmente serializzazione e ripristino, il pattern di **handoff asincrono** introdotto nella Lezione 6.6: il workflow può fermarsi per un tempo arbitrariamente lungo, in attesa di un intervento esterno, senza perdere il lavoro già svolto.

---

## Esempio Pratico: Tracciare l'Esecuzione del Grafo Completo

Riprendendo il codice della Sezione 2, seguiamo l'esecuzione concettuale per il caso in cui un'ambiguità viene effettivamente rilevata:

```
1. ENTRY POINT: "estrazione"
   nodo_estrazione() viene eseguito
   → stato.testo_estratto = "Testo estratto..."

2. ARCO INCONDIZIONATO: estrazione → analisi
   nodo_analisi_requisiti() viene eseguito
   → stato.requisiti_identificati = {...}
   → stato.ambiguita_rilevate = ["formato output..."]

3. ARCO CONDIZIONALE: analisi → ?
   decidi_se_richiedere_chiarimento(stato) viene chiamata
   → stato.ambiguita_rilevate NON è vuota
   → restituisce "richiedi_chiarimento"

4. Il grafo segue l'arco verso il nodo "richiedi_chiarimento"
   → stato.handoff_pronto = False

5. ARCO verso END: il grafo termina questa esecuzione,
   con un risultato che indica che è necessario un
   chiarimento PRIMA di poter procedere
```

Questa traccia rende esplicito un punto importante: il **codice del grafo non decide direttamente** se procedere o richiedere chiarimento — quella decisione è interamente delegata alla funzione `decidi_se_richiedere_chiarimento`, che a sua volta dipende dal lavoro svolto dal nodo di analisi. Il grafo definisce la **struttura delle possibilità**; il comportamento effettivo emerge dall'interazione tra stato e logica di routing.

---

## Riepilogo

- **LangGraph** non introduce concetti nuovi rispetto al Capitolo 5, ma fornisce un'implementazione robusta e leggibile per pattern (cicli, archi condizionali, persistenza) che diventano difficili da gestire correttamente a mano quando il workflow cresce in complessità.
- Un **StateGraph** dichiara nodi (funzioni che leggono e scrivono sullo stato) e archi (incondizionati o condizionali tramite funzioni di routing dedicate), implementando fedelmente il design concettuale della Lezione 7.1.
- I **nodi paralleli** permettono di eseguire più agenti contemporaneamente su parti indipendenti dello stato, un guadagno significativo per casi come l'elaborazione di cartelle con file di tipo misto.
- Il **checkpointing** garantisce la persistenza dello stato tra esecuzioni separate, rendendo possibile, in modo robusto, l'interruzione del workflow per un intervento umano che potrebbe avvenire molto tempo dopo.

---

## Domande di Verifica

1. Riprendi il codice della Sezione 2. Se la funzione `decidi_se_richiedere_chiarimento` contenesse un bug che restituisce sempre `"richiedi_chiarimento"`, indipendentemente dallo stato, quale conseguenza avrebbe sul comportamento osservabile del workflow?

2. Spiega perché i tre nodi di estrazione paralleli della Sezione 3 (PDF, audio, immagini) possono essere eseguiti simultaneamente, mentre i nodi "estrazione" e "analisi" della Sezione 2 non potrebbero esserlo. Cosa li differenzia, in termini di dipendenza dei dati?

3. Nel meccanismo di checkpointing della Sezione 4, perché è necessario un `thread_id` univoco per ogni esecuzione, invece di un singolo checkpoint condiviso per tutte le esecuzioni del workflow?

---

## Esercizi Pratici

> Tre esercizi a difficoltà crescente. Prova a risolverli da solo prima di aprire la soluzione.

### Esercizio 1 — Perché LangGraph 🟢 Base

LangGraph non introduce concetti nuovi rispetto al Capitolo 5. Quali tre problemi del codice Python "fatto a mano" risolve quando il workflow cresce?

<details>
<summary>💡 Mostra soluzione</summary>

1. **Archi condizionali multipli:** gestirli con `if/else` annidati diventa illeggibile; LangGraph li dichiara in modo pulito.
2. **Cicli controllati:** tornare a un nodo precedente richiede logica manuale di iterazione (rischio di loop infiniti); LangGraph li gestisce in modo strutturato.
3. **Persistenza dello stato** tra esecuzioni: implementare manualmente serializzazione/salvataggio/ripristino è oneroso; LangGraph offre il **checkpointing** pronto all'uso.

In sintesi: LangGraph formalizza e rende robusti pattern (cicli, condizioni, persistenza) che a mano diventano fragili al crescere della complessità.

</details>

### Esercizio 2 — Nodi paralleli 🟡 Intermedio

Perché i tre nodi di estrazione (PDF, audio, immagini) possono essere eseguiti in parallelo, mentre i nodi "estrazione" e "analisi" no? Cosa li distingue?

<details>
<summary>💡 Mostra soluzione</summary>

I tre nodi di estrazione (PDF/audio/immagini) operano su **parti indipendenti dello stato**: l'estrazione dal PDF non dipende dal risultato dell'estrazione audio. Nessuna dipendenza di dati → possono partire insieme e i risultati si raccolgono dopo.

"Estrazione" e "analisi" invece hanno una **dipendenza di dati**: l'analisi ha bisogno del `testo_estratto` *prodotto* dall'estrazione. Non può iniziare prima che l'estrazione sia finita → devono essere sequenziali.

Criterio: si può parallelizzare solo ciò che è **indipendente nei dati**. Se B ha bisogno dell'output di A, B aspetta A.

</details>

### Esercizio 3 — Checkpointing e routing 🔴 Avanzato

(a) A cosa serve il `thread_id` nel checkpointing, e perché ne serve uno univoco per esecuzione? (b) Se la funzione di routing `decidi_se_richiedere_chiarimento` avesse un bug e restituisse sempre lo stesso ramo, cosa succederebbe?

<details>
<summary>💡 Mostra soluzione</summary>

**(a) `thread_id`:** identifica una specifica esecuzione del workflow, permettendo di **riprenderla esattamente dal punto in cui si era interrotta** (es. dopo un'attesa di revisione umana), anche in un processo separato. Serve **univoco per esecuzione** perché ogni workflow/progetto ha il proprio stato salvato: un id condiviso mischierebbe gli stati di esecuzioni diverse, facendo riprendere un workflow dallo stato sbagliato.

**(b) Bug nel routing:** il grafo seguirebbe **sempre lo stesso arco**, indipendentemente dallo stato reale. Es. se restituisse sempre `"richiedi_chiarimento"`, ogni esecuzione finirebbe per richiedere un chiarimento anche quando non ci sono ambiguità — il ramo `costruisci_handoff` non verrebbe mai raggiunto. Importante: il grafo definisce la **struttura delle possibilità**; il comportamento reale dipende dalla logica di routing. Un bug lì rompe il comportamento pur con un grafo "corretto".

</details>

---

## Connessioni

**Viene da:** Lezione 7.1 (Progettare un Workflow Agentivo) — questa lezione implementa fedelmente il grafo progettato concettualmente in quella lezione. Lezione 5.4 (Single vs Multi-Agent) — l'architettura a grafo introdotta lì trova qui un'implementazione tecnica completa.

**Porta a:** Lezione 7.3 (Il Layer di Review) — vedremo come implementare un nodo di revisione come parte specifica e formalizzata del grafo LangGraph.

**Ritroverai questi concetti in:** Lezione 7.4 (Human-in-the-Loop) — il checkpointing qui introdotto è il meccanismo tecnico esatto che rende possibile l'interruzione del workflow per attesa di feedback umano. Lezione 8.3 (Riassorbimento della Conoscenza) — la persistenza dello stato tra esecuzioni, qui vista per un singolo workflow, anticipa il problema più ampio di come un sistema accumula esperienza nel tempo.

---

## 🌐 Per Approfondire in Inglese

La documentazione ufficiale di LangGraph, con guide introduttive, tutorial passo-passo e riferimento completo all'API per costruire workflow agentivi come grafi orientati con stato → **Documentazione ufficiale LangGraph** su langchain-ai.github.io/langgraph (tipo: documentazione)
