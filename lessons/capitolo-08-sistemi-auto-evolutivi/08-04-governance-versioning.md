---
id: "08-04"
titolo: "Governance, Versioning e Ciclo di Vita degli Artefatti Agentivi"
sottotitolo: "Mettere ordine in tutto quello che abbiamo costruito: la disciplina che tiene insieme un sistema maturo"
capitolo: 8
capitolo_titolo: "Sistemi Agentici che si Auto-Migliorano"
lezione: 4
durata_stimata: "65 minuti"
difficolta: "avanzato"
prerequisiti: ["08-03"]
concetti_chiave:
  - governance
  - ciclo di vita
  - change management
  - audit trail
  - semantic versioning
obiettivi:
  - "Elencare e classificare tutti gli artefatti di un sistema agentivo maturo"
  - "Implementare un audit trail per tracciare modifiche agli artefatti"
  - "Applicare il semantic versioning in modo coerente a tutto il sistema"
  - "Progettare un processo di change management per un team che cresce"
stato: "pubblicata"
versione: "1.0"
---

# Governance, Versioning e Ciclo di Vita degli Artefatti Agentivi

## Introduzione

In ogni lezione di questo capitolo, e in buona parte del Capitolo 6, abbiamo rimandato qui — alla Lezione 8.4 — la trattazione formale e completa della governance. Il versionamento dei prompt (6.4), il ciclo di vita di un'Agent Card (6.3), la disciplina necessaria per i prompt auto-evolutivi (8.2), la revisione obbligatoria prima di integrare conoscenza riassorbita (8.3): tutti questi fili si raccolgono ora in un'unica trattazione organica.

Questa lezione non introduce un singolo concetto tecnico nuovo e isolato — fa qualcosa di diverso e altrettanto importante: **sistematizza** la disciplina che, applicata con costanza a ogni artefatto del sistema, è ciò che separa un progetto agentivo che funziona per una demo da un sistema che un'organizzazione può mantenere, far crescere, e di cui può fidarsi nel tempo.

---

## Obiettivi di Apprendimento

Al termine di questa lezione sarai in grado di:

- Elencare e classificare tutti gli artefatti di un sistema agentivo maturo, riconoscendone le interdipendenze
- Implementare un audit trail che traccia chi ha modificato cosa, quando, e perché
- Applicare il semantic versioning in modo coerente a tutti gli artefatti del sistema, non solo al codice
- Progettare un processo di change management adatto a un team che cresce nel tempo

---

## 1. Mappare tutti gli artefatti di un sistema agentivo

Prima di poter governare qualcosa, serve un inventario completo. Ripercorriamo, in chiusura del corso, ogni tipo di artefatto costruito nei capitoli precedenti:

```
ARTEFATTI DI UN SISTEMA AGENTIVO MATURO

agent.yaml          (Lezione 6.2) — configurazione interna
agent_card.yaml      (Lezione 6.3) — interfaccia pubblica
prompts/*.md         (Lezione 6.4) — istruzioni versionate
schemas/*.json        (Lezione 6.5) — contratti di input/output
skills/*.md           (Lezione 6.7) — competenze condivise
handoff (runtime)      (Lezione 6.6) — documenti di trasferimento
evals/*.yaml           (Lezione 7.5) — casi di test
policy di escalation   (Lezione 7.4) — regole di routing umano
episodi di memoria      (Lezione 8.3) — log strutturati di esecuzione
regole riassorbite       (Lezione 8.3) — conoscenza sintetizzata
```

Ogni riga di questo elenco è un tipo di file o dato che **cambia nel tempo**, ha un proprietario, e influenza il comportamento del sistema. La governance è precisamente la disciplina che gestisce questi cambiamenti in modo tracciabile, sicuro, e reversibile.

---

## 2. Il ciclo di vita di un artefatto

Indipendentemente dal tipo specifico — un prompt, una skill, uno schema — ogni artefatto segue lo stesso ciclo di vita generale, che formalizza con precisione il campo `stato` introdotto fin dalla Lezione 6.1.

```
   BOZZA
     │  (un membro del team propone una modifica
     │   o un nuovo artefatto)
     ▼
  REVISIONE
     │  (un collega, o per modifiche critiche un
     │   processo automatico come il regression
     │   testing della Lezione 7.5, verifica la
     │   proposta)
     ▼
 APPROVAZIONE
     │  (la modifica viene formalmente accettata,
     │   con un nuovo numero di versione)
     ▼
   DEPLOY
     │  (l'artefatto entra effettivamente in uso
     │   nel sistema in produzione)
     ▼
MONITORAGGIO
     │  (le metriche della Lezione 7.5 osservano
     │   il comportamento dell'artefatto in uso reale)
     ▼
AGGIORNAMENTO
     (un nuovo ciclo inizia, tornando a BOZZA,
      eventualmente innescato dal riassorbimento
      della conoscenza, Lezione 8.3)
```

Questo ciclo si applica identicamente a un prompt (Lezione 6.4), a una skill (Lezione 6.7), o a una regola sintetizzata dall'agente archivista (Lezione 8.3) — è precisamente l'uniformità di questo processo, applicato senza eccezioni a ogni tipo di artefatto, che rende un sistema governabile su scala, invece di richiedere processi diversi e scoordinati per ogni categoria di componente.

---

## 3. Implementazione pratica: un Audit Trail

Un **audit trail** registra, per ogni modifica a un artefatto, chi l'ha proposta, quando, e perché — informazione indispensabile quando, mesi dopo, qualcuno deve capire perché il sistema si comporta in un certo modo, o deve fare rollback a una versione precedente.

```python
from pydantic import BaseModel
from datetime import datetime

class VoceAuditTrail(BaseModel):
    """
    Una singola voce dell'audit trail, registrata per
    ogni modifica a un artefatto del sistema.
    """
    artefatto_id: str  # es. "prompts/system-analista-vendite"
    versione_precedente: str
    versione_nuova: str
    autore: str
    timestamp: datetime
    motivazione: str
    fonte_modifica: str  # "umano" | "apo-automatico" (Lezione 8.2)
                          # | "riassorbimento" (Lezione 8.3)
    approvato_da: str | None  # presente se la modifica ha
                                # richiesto revisione esplicita


def registra_modifica(artefatto_id: str, versione_precedente: str,
                        versione_nuova: str, autore: str,
                        motivazione: str, fonte: str) -> VoceAuditTrail:
    """
    Ogni volta che un artefatto viene modificato — un prompt
    riscritto a mano, una variante APO adottata (Lezione 8.2),
    una regola riassorbita integrata (Lezione 8.3) — questa
    funzione registra il cambiamento in modo permanente e
    interrogabile.
    """
    voce = VoceAuditTrail(
        artefatto_id=artefatto_id,
        versione_precedente=versione_precedente,
        versione_nuova=versione_nuova,
        autore=autore,
        timestamp=datetime.now(),
        motivazione=motivazione,
        fonte_modifica=fonte,
        approvato_da=None  # da popolare se richiesta revisione
    )
    salva_audit_trail(voce)  # persistenza esterna, Lezione 4.6
    return voce


# Esempio: traccia di una modifica proposta dal sistema APO
registra_modifica(
    artefatto_id="prompts/system-analista-vendite",
    versione_precedente="2.1.0",
    versione_nuova="2.2.0",
    autore="sistema-apo-automatico",
    motivazione="Corretta gestione del caso limite: valore "
                "precedente uguale a zero (5 casi di test "
                "falliti risolti)",
    fonte="apo-automatico"
)
```

Notare il campo `fonte_modifica`: distinguere esplicitamente se una modifica è stata proposta da un umano, da un sistema di ottimizzazione automatica (Lezione 8.2), o da un processo di riassorbimento della conoscenza (Lezione 8.3) è precisamente ciò che permette, in caso di problemi futuri, di capire rapidamente **quale processo** ha introdotto un determinato comportamento — un'informazione che, senza un audit trail strutturato, andrebbe persa nel tempo.

---

## 4. Semantic Versioning applicato a tutti gli artefatti

Il **semantic versioning**, già menzionato più volte nel corso (Lezioni 6.1, 6.3), segue una convenzione precisa: `MAGGIORE.MINORE.PATCH` (es. `2.1.0`).

```
PATCH (es. 2.1.0 → 2.1.1)
  Correzione che non cambia il comportamento osservabile
  dall'esterno — es. una correzione di un errore di
  battitura nel prompt, che non altera la logica

MINORE (es. 2.1.0 → 2.2.0)
  Aggiunta di una capacità, senza rompere la compatibilità
  con chi già usa l'artefatto — es. l'Agente Analista
  Vendite ora gestisce anche un nuovo formato di input,
  oltre a quelli già supportati

MAGGIORE (es. 2.1.0 → 3.0.0)
  Cambiamento che ROMPE la compatibilità con l'interfaccia
  pubblica dichiarata (Lezione 6.3) — es. il campo
  "trend" dello schema di output (Lezione 6.5) viene
  rinominato, richiedendo a tutti gli agenti a valle di
  aggiornare il proprio codice
```

> **Perché questa disciplina applicata uniformemente conta:** se un orchestratore (Lezione 5.3) o un sistema di discovery (Lezione 6.3) osserva che un agente è passato da `2.1.0` a `3.0.0`, può **automaticamente** sapere che potrebbe essere necessaria una verifica di compatibilità, senza dover leggere manualmente il changelog. Questa è precisamente la stessa logica che useremo, applicata in modo identico, sia per i prompt (Lezione 6.4) sia per le skill (Lezione 6.7) sia per i contratti (Lezione 6.5) — un'unica convenzione, applicata a tutto.

---

## 5. Change Management per un team che cresce

L'ultimo elemento di governance riguarda il **processo organizzativo**, non solo tecnico: come si gestiscono le modifiche quando il sistema è mantenuto da più persone, o più team, contemporaneamente?

```
PRINCIPI DI CHANGE MANAGEMENT

1. Ogni artefatto critico (in produzione, Lezione 6.1)
   ha un OWNER dichiarato, responsabile dell'approvazione
   delle modifiche che lo riguardano

2. Le modifiche AUTOMATICHE (APO, Lezione 8.2; riassorbimento,
   Lezione 8.3) non bypassano mai completamente la revisione
   umana per gli artefatti più critici — solo per quelli
   esplicitamente marcati come a basso rischio

3. Esiste un canale di COMUNICAZIONE delle modifiche
   maggiori (MAGGIORE nel semantic versioning) a tutti i
   team che dipendono dall'artefatto modificato — non solo
   un commit silenzioso in un repository

4. Esiste sempre un percorso di ROLLBACK rapido e testato,
   non solo teoricamente possibile (riprendendo
   esplicitamente la necessità di versionamento rigoroso
   discussa nella Lezione 8.2)
```

Questi principi non sono puramente tecnici di per sé — sono organizzativi, ma **dipendono** dall'infrastruttura tecnica costruita in questo capitolo (audit trail, versionamento, test suite) per essere effettivamente applicabili, non solo dichiarati su carta.

---

## Esempio Pratico: Diagnosticare un Problema Usando l'Audit Trail

Immagina che, due settimane dopo una modifica automatica (APO, Lezione 8.2) al prompt dell'Agente Analista, il tasso di escalation a revisione umana (Lezione 7.4) aumenti inspiegabilmente del 15%. Senza un audit trail, diagnosticare la causa richiederebbe di esaminare manualmente i log di centinaia di esecuzioni.

Con l'audit trail costruito in questa lezione, la diagnosi diventa diretta:

```python
storico_modifiche = interroga_audit_trail(
    artefatto_id="prompts/system-analista-vendite",
    intervallo_temporale="ultime_3_settimane"
)

# Risultato:
# [VoceAuditTrail(versione_nuova="2.2.0", fonte_modifica="apo-automatico",
#                  timestamp="2026-06-05", motivazione="...")]
```

L'audit trail rivela immediatamente: la modifica `2.1.0 → 2.2.0`, proposta dal sistema APO due settimane fa, coincide temporalmente con l'inizio dell'aumento delle escalation. Questo non prova automaticamente una relazione causale, ma fornisce **immediatamente** il candidato più probabile da investigare — esattamente il tipo di diagnosi rapida che, senza questa infrastruttura, richiederebbe ore di indagine manuale nei log grezzi.

---

## Riepilogo

- Un sistema agentivo maturo ha numerosi tipi di **artefatti** (agent.yaml, Agent Card, prompt, schemi, skill, evals, policy, episodi di memoria), ciascuno soggetto allo stesso ciclo di vita.
- Il **ciclo di vita** — bozza, revisione, approvazione, deploy, monitoraggio, aggiornamento — si applica uniformemente a ogni tipo di artefatto, rendendo il sistema governabile su scala.
- Un **audit trail** registra chi ha modificato cosa, quando, perché, e attraverso quale fonte (umano, APO automatico, riassorbimento), permettendo diagnosi rapide di problemi futuri.
- Il **semantic versioning**, applicato uniformemente a tutti gli artefatti, comunica automaticamente il livello di rischio di una modifica (patch, minore, maggiore) a chiunque dipenda da quell'artefatto.
- Il **change management** organizzativo (owner dichiarati, comunicazione delle modifiche maggiori, percorsi di rollback testati) dipende dall'infrastruttura tecnica costruita in questa lezione per essere effettivamente applicabile.

---

## Domande di Verifica

1. Riprendi l'elenco degli artefatti della Sezione 1. Scegli due artefatti diversi e spiega come una modifica all'uno potrebbe richiedere, per coerenza, una modifica anche all'altro (un esempio di interdipendenza tra artefatti).

2. Nel codice della Sezione 3, perché il campo `fonte_modifica` è importante quanto il campo `autore`, anche se concettualmente simile? Cosa distingue le informazioni che forniscono?

3. Spiega perché una modifica che cambia il formato dello schema di output di un agente (Lezione 6.5) dovrebbe sempre corrispondere a un incremento MAGGIORE nel semantic versioning, collegando la tua risposta al concetto di "contratto di servizio" introdotto nella Lezione 6.3.

---

## Connessioni

**Viene da:** L'intero Capitolo 6 (artefatti) e Capitolo 8 (i meccanismi di auto-modifica che rendono la governance necessaria, non opzionale) — questa lezione sistematizza principi distribuiti in molte lezioni precedenti.

**Porta a:** Lezione 8.5 (Progetto Finale) — la disciplina di governance qui costruita è parte integrante di un sistema professionale completo, e sarà applicata nel progetto che chiude il corso.

**Ritroverai questi concetti in:** Qualsiasi sistema agentivo che costruirai dopo questo corso — la governance non è un capitolo da "finire e archiviare", ma una disciplina continua che accompagna ogni sistema agentivo per tutta la sua vita operativa.
