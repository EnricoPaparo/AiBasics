---
id: "07-01"
titolo: "Progettare un Workflow Agentivo: dal problema al grafo"
sottotitolo: "Il design thinking dell'AI engineering: pensare in nodi, archi e condizioni prima di scrivere codice"
capitolo: 7
capitolo_titolo: "Workflow Multi-Agente: Design e Implementazione"
lezione: 1
durata_stimata: "70 minuti"
difficolta: "avanzato"
prerequisiti: ["06-07"]
concetti_chiave:
  - workflow
  - pipeline vs workflow
  - nodo
  - arco
  - checkpoint
  - A2A
obiettivi:
  - "Distinguere pipeline statica da workflow adattivo"
  - "Mappare un processo reale in un grafo agentivo con nodi e archi"
  - "Identificare i checkpoint necessari in un workflow complesso"
  - "Descrivere il protocollo A2A e il suo ruolo nell'interoperabilità"
stato: "pubblicata"
versione: "1.0"
---

# Progettare un Workflow Agentivo: dal problema al grafo

## Introduzione

Con il Capitolo 6 abbiamo costruito tutti i mattoni: agent package completi (6.2), Agent Card per la discovery (6.3), prompt versionati (6.4), contratti che garantiscono coerenza (6.5), handoff che trasferiscono responsabilità (6.6), skill condivise (6.7). Questo capitolo li assembla in **workflow completi** — sistemi multi-agente reali, supervisionati, pronti per la produzione.

Ma prima di scrivere una sola riga di codice di implementazione (che affronteremo nella Lezione 7.2 con LangGraph), questa lezione insegna a **pensare** in termini di workflow — un'abilità progettuale che precede e guida ogni scelta tecnica successiva. Un workflow mal progettato sulla carta produce un sistema fragile, indipendentemente da quanto bene sia implementato il codice che lo realizza.

---

## Obiettivi di Apprendimento

Al termine di questa lezione sarai in grado di:

- Distinguere con precisione una pipeline statica da un workflow adattivo
- Mappare un processo reale in un grafo agentivo, identificando nodi, archi e condizioni
- Identificare i checkpoint necessari in un workflow complesso, e dove posizionarli
- Descrivere il protocollo A2A e il suo ruolo nell'interoperabilità tra agenti di sistemi diversi

---

## 1. Pipeline statica vs Workflow adattivo

Avevamo già incontrato, nella Lezione 5.4, la distinzione tra pipeline sequenziale e architettura a grafo. Formalizziamo ora questa distinzione con il vocabolario specifico di "workflow", che useremo per il resto del capitolo.

```
PIPELINE (statica)                     WORKFLOW (adattivo)

Sequenza FISSA di passi,               Sequenza che si ADATTA in
decisa in anticipo, identica           base ai risultati intermedi:
per ogni esecuzione                    può saltare passi, ripeterne
                                        altri, o seguire percorsi
                                        diversi in base alle condizioni

Esempio: estrai → analizza →           Esempio: estrai → SE i dati
scrivi (Lezione 5.3)                   sono incompleti, richiedi
                                        chiarimenti → altrimenti
                                        analizza → SE il revisore
                                        rileva un problema, torna
                                        all'estrazione → altrimenti
                                        scrivi
```

Un workflow non è "una pipeline più complicata": è un cambio di paradigma. Una pipeline assume che il processo sia sempre lo stesso; un workflow assume che il processo **debba adattarsi** alla natura specifica di ogni singolo caso che incontra.

---

## 2. Mappare un processo reale in un grafo: nodi, archi, condizioni

Il vocabolario tecnico di un workflow agentivo si fonda su tre elementi:

```
NODO
  Un'unità di lavoro: un agente (Capitolo 5), una funzione
  di trasformazione dati, o un punto di decisione

ARCO
  La transizione da un nodo al successivo — può essere
  INCONDIZIONATO (sempre questo percorso) o CONDIZIONATO
  (questo percorso solo se una certa condizione è vera)

CHECKPOINT
  Un punto specifico nel grafo dove il processo si ferma
  per VERIFICARE qualcosa prima di continuare — può
  coincidere con un nodo di revisione (Lezione 7.3) o
  con un punto di intervento umano (Lezione 7.4)
```

Applichiamo questo vocabolario al caso che hai in mente per il tuo progetto: un Requirement Analyst Agent che riceve una cartella di file misti e produce un handoff per un Architect Agent.

```
                    [Nodo: Estrazione Multimediale]
                    (PDF, immagini, audio → testo)
                              │
                              ▼
                    [Nodo: Requirement Analyst]
                    (analizza il testo estratto,
                     identifica requisiti)
                              │
                              ▼
                    [CHECKPOINT: Ambiguità rilevata?]
                         │              │
                    SÌ   │              │  NO
                         ▼              ▼
              [Nodo: Richiedi       [Nodo: Costruisci
               Chiarimento]          Handoff completo]
                    │                     │
                    └──────┐      ┌───────┘
                           ▼      ▼
                  [Nodo: Genera PDF per revisione umana]
                              │
                              ▼
                    [CHECKPOINT: Revisione umana]
                    (Lezione 7.4 — Human-in-the-Loop)
                              │
                              ▼
                    [Handoff verso Architect Agent]
```

Questo diagramma **non è ancora codice**: è il design del processo, costruito prima di scegliere quale framework userai per implementarlo (Lezione 7.2). Disegnare questo grafo su carta, o in uno strumento di diagramming, prima di scrivere codice, è precisamente la disciplina di "design thinking" che questa lezione vuole trasmettere.

---

## 3. Input, output e stato globale del workflow

Esattamente come un singolo agente ha un contratto di input/output (Lezione 6.5), un intero workflow ha un proprio **stato globale** che si accumula e si trasforma man mano che il processo avanza attraverso i nodi.

```python
from pydantic import BaseModel
from typing import Optional

class StatoWorkflowRequisiti(BaseModel):
    """
    Lo stato che viaggia attraverso TUTTI i nodi del workflow,
    accumulando informazioni man mano che il processo avanza.
    """
    cartella_input: str
    testo_estratto: Optional[str] = None
    requisiti_identificati: Optional[dict] = None
    ambiguita_rilevate: list[str] = []
    handoff_pronto: bool = False
    revisione_umana_completata: bool = False
```

Ogni nodo del grafo della Sezione 2 **legge** una parte di questo stato e **scrive** un'altra parte, esattamente come abbiamo visto con i contratti di input/output nella Lezione 6.5 — ma qui applicato a un oggetto di stato condiviso che persiste attraverso l'intero workflow, non solo tra una singola coppia di agenti.

---

## 4. Dove posizionare i checkpoint

Una decisione progettuale cruciale, che vale la pena affrontare esplicitamente in questa lezione di design, prima di passare all'implementazione: **dove**, nel grafo, posizionare i checkpoint di verifica?

```
PRINCIPIO 1: Dopo ogni nodo che introduce INCERTEZZA
  Un nodo di estrazione da documenti non strutturati
  (come nel tuo caso d'uso) è una fonte naturale di
  incertezza — un checkpoint subito dopo è spesso
  giustificato

PRINCIPIO 2: Prima di ogni AZIONE IRREVERSIBILE
  Se un nodo successivo comporta un'azione difficile
  da annullare (es. inviare una comunicazione esterna,
  avviare un processo costoso), un checkpoint PRIMA di
  quel nodo è quasi sempre necessario

PRINCIPIO 3: Ai confini di RESPONSABILITÀ
  Quando un handoff (Lezione 6.6) trasferisce
  responsabilità a un agente o un team diverso, un
  checkpoint a quel confine garantisce che il
  trasferimento avvenga solo con materiale verificato
```

Nel diagramma della Sezione 2, il checkpoint di revisione umana è posizionato precisamente al confine tra il lavoro del Requirement Analyst e l'handoff verso l'Architect — un'applicazione diretta del Principio 3, perché quell'handoff trasferisce la responsabilità a un processo successivo (l'architettura) che si baserebbe su requisiti potenzialmente errati se non verificati.

---

## 5. Il protocollo A2A: interoperabilità tra agenti di sistemi diversi

Concludiamo questa lezione di design con un concetto che estende, su scala più ampia, i principi di interoperabilità già visti nella Lezione 4.5 a proposito di MCP. **A2A** (Agent-to-Agent) è un protocollo, promosso da Google, pensato specificamente per la comunicazione **tra agenti appartenenti a sistemi diversi**, potenzialmente costruiti da organizzazioni diverse, con modelli diversi.

```
MCP (Lezione 4.5)                      A2A

Standardizza la connessione tra        Standardizza la comunicazione
UN AGENTE e RISORSE/STRUMENTI          tra AGENTI DIVERSI, anche
esterni                                appartenenti a sistemi e
                                        organizzazioni diverse

Esempio: un agente che usa un          Esempio: un agente costruito
server MCP per accedere a              dalla tua azienda che
Google Drive                           comunica con un agente di
                                        un fornitore esterno, senza
                                        condividere la stessa
                                        infrastruttura
```

A2A si basa su un principio che hai già incontrato: ogni agente esposto secondo questo protocollo pubblica una propria **Agent Card** (Lezione 6.3), permettendo a un sistema esterno di scoprire le sue capacità e interfacciarsi correttamente, senza dover conoscere nulla dell'implementazione interna. Questo è precisamente il principio di incapsulamento e discovery che abbiamo costruito con cura in tutto il Capitolo 6, qui esteso oltre i confini di un singolo sistema, verso un'interoperabilità tra organizzazioni diverse.

---

## Esempio Pratico: Disegnare il Tuo Workflow

Prendendo il diagramma della Sezione 2 come modello, prova a disegnare (anche solo su carta) il workflow per un caso diverso: un sistema che riceve una richiesta di supporto clienti, e deve decidere se risolverla autonomamente o escalarla a un operatore umano.

```
Suggerimento di partenza:

[Nodo: Classificazione Richiesta]
              │
              ▼
[CHECKPOINT: Richiesta risolvibile autonomamente?]
       │                    │
      SÌ                   NO
       │                    │
       ▼                    ▼
[Nodo: Risolvi          [Nodo: Prepara contesto
 Autonomamente]          per operatore umano]
       │                    │
       ▼                    ▼
  (fine processo)    [CHECKPOINT: Escalation
                       a operatore umano]
```

Completa tu stesso questo schema, identificando quali altri checkpoint, secondo i tre principi della Sezione 4, meriterebbero di essere aggiunti.

---

## Riepilogo

- Un **workflow** si distingue da una **pipeline statica** per la capacità di adattare il proprio percorso in base ai risultati intermedi, non solo eseguire una sequenza fissa.
- Il vocabolario di progettazione si fonda su **nodi** (unità di lavoro), **archi** (transizioni, condizionate o incondizionate), e **checkpoint** (punti di verifica prima di procedere).
- Lo **stato globale** del workflow, definito come un contratto esplicito (Pydantic, riprendendo la Lezione 6.5), accumula informazioni mentre il processo avanza attraverso i nodi.
- I checkpoint vanno posizionati dopo nodi che introducono incertezza, prima di azioni irreversibili, e ai confini di trasferimento di responsabilità (handoff, Lezione 6.6).
- Il protocollo **A2A** estende i principi di interoperabilità di MCP (Lezione 4.5) alla comunicazione tra agenti di sistemi e organizzazioni diverse, basandosi sulle Agent Card (Lezione 6.3) per la discovery.

---

## Domande di Verifica

1. Riprendi il diagramma della Sezione 2. Perché il checkpoint "Ambiguità rilevata?" è un arco condizionato e non un semplice passo sequenziale? Cosa cambierebbe se fosse rimosso, tornando a una pipeline statica?

2. Applicando il Principio 2 della Sezione 4 (azioni irreversibili), in quale punto del workflow disegnato nell'Esempio Pratico aggiungeresti un checkpoint, anche se non esplicitamente indicato nello schema suggerito?

3. Spiega, collegandolo alla Lezione 6.3, perché un agente esposto tramite il protocollo A2A deve necessariamente avere un'Agent Card ben progettata, con una sezione "NON_fa" chiara, prima di poter essere usato in modo sicuro da un sistema esterno mai incontrato prima.

---

## Connessioni

**Viene da:** L'intero Capitolo 6 — questa lezione assembla gli agent package in un processo coordinato. Lezione 5.4 (Single vs Multi-Agent) — qui formalizziamo con il vocabolario di "workflow" le topologie introdotte in quella lezione.

**Porta a:** Lezione 7.2 (LangGraph) — il grafo progettato concettualmente in questa lezione troverà un'implementazione tecnica precisa in quel framework.

**Ritroverai questi concetti in:** Lezione 7.3 (Il Layer di Review) e Lezione 7.4 (Human-in-the-Loop) — i checkpoint qui posizionati concettualmente diventeranno nodi specifici e formalizzati in quelle lezioni, con particolare attenzione al checkpoint di revisione umana già anticipato nel diagramma della Sezione 2.
