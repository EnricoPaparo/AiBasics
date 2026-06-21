---
id: "08-05"
titolo: "Progetto Finale: Costruzione di un Workflow Agentivo Supervisionato e Auto-Evolutivo"
sottotitolo: "Quarantatré lezioni, un solo sistema: la sintesi completa del percorso"
capitolo: 8
capitolo_titolo: "Sistemi Agentici che si Auto-Migliorano"
lezione: 5
durata_stimata: "120 minuti"
difficolta: "avanzato"
prerequisiti: ["08-04"]
concetti_chiave:
  - sintesi architetturale
  - progetto end-to-end
  - revisione critica
  - portfolio professionale
obiettivi:
  - "Progettare l'architettura completa di un sistema agentivo reale"
  - "Costruire tutti gli agent package necessari, con Agent Card, contratti e skill"
  - "Implementare il workflow completo in LangGraph con review e HITL"
  - "Valutare criticamente i propri limiti architetturali con onestà professionale"
stato: "pubblicata"
versione: "1.0"
---

# Progetto Finale: Costruzione di un Workflow Agentivo Supervisionato e Auto-Evolutivo

## Introduzione

Questa è l'ultima lezione del corso. Non introduce concetti nuovi: il suo compito è diverso e, in un certo senso, più importante — chiederti di **mettere insieme** tutto ciò che hai imparato in quarantatré lezioni, in un singolo sistema coerente, progettato e — per quanto possibile nel formato di questo materiale — implementato con la stessa cura che abbiamo dedicato a ogni singolo componente lungo il percorso.

Useremo, come filo conduttore, il caso d'uso che è stato presente, esplicitamente o implicitamente, in molte lezioni del Capitolo 6 e 7: un **Requirement Analyst Agent** che ingerisce cartelle di file misti e produce un handoff strutturato per un **Architect Agent**, con supervisione umana nel punto critico del processo. Non è un esempio scelto a caso per questa lezione conclusiva — è il progetto che hai indicato fin dall'inizio come il tuo obiettivo reale su opencode. Questa lezione lo porta a sintesi completa.

---

## Obiettivi di Apprendimento

Al termine di questa lezione sarai in grado di:

- Progettare l'architettura completa di un sistema agentivo reale, partendo da un problema enunciato in linguaggio naturale
- Costruire tutti gli agent package necessari, completi di Agent Card, contratti, prompt versionati e skill condivise
- Implementare il workflow completo in LangGraph, con review automatico e checkpoint di supervisione umana
- Valutare criticamente i propri limiti architetturali con la stessa onestà professionale praticata in tutto il corso

---

## 1. Definizione del problema

Il punto di partenza di ogni sistema ben progettato è una definizione chiara del problema, prima di qualsiasi scelta tecnica — esattamente la disciplina costruita nella Lezione 7.1.

```
PROBLEMA: Un team di consulenza riceve, da ogni nuovo
cliente, una cartella con materiale eterogeneo (documenti
PDF di specifiche, registrazioni audio di interviste con
gli stakeholder, screenshot di sistemi esistenti). Il
team deve produrre, da questo materiale, un documento di
requisiti strutturato, e passarlo al team di architettura
per la progettazione tecnica.

VINCOLI:
- Il materiale è spesso ambiguo o contraddittorio
  (rilevato, non risolto autonomamente — Lezione 6.6)
- Serve sempre una revisione umana prima che il documento
  raggiunga il team di architettura (Lezione 7.4)
- Il sistema deve migliorare nel tempo, riducendo
  progressivamente i casi che richiedono chiarimenti
  ripetuti per le stesse tipologie di ambiguità
  (Lezione 8.3)
```

---

## 2. Design dell'architettura completa

Applicando il vocabolario della Lezione 7.1, disegniamo il grafo completo del sistema:

```
[Nodo: Ingestione Cartella]
       │
       ├──────────┬──────────┐
       ▼          ▼          ▼
 [Estrazione  [Estrazione  [Estrazione
   PDF]         Audio]       Immagini]
   (paralleli, Lezione 7.2)
       │          │          │
       └──────────┴──────────┘
                  ▼
       [Nodo: Requirement Analyst]
       (usa skill "rilevamento-ambiguita",
        Lezione 6.7)
                  ▼
       [Nodo: Review — Critic-Agent]
       (Lezione 7.3, rubrica strutturata)
                  │
        ┌─────────┼─────────┐
        ▼         ▼          ▼
    APPROVA   RICHIEDI    ESCALA
        │     REVISIONE   A UMANO
        │         │         │
        │    (torna ad      ▼
        │     Analyst)  [CHECKPOINT
        │               UMANO]
        │               (async review,
        │                Lezione 7.4)
        │                   │
        └─────────┬─────────┘
                  ▼
       [Nodo: Costruisci Handoff]
       (Lezione 6.6, conforme al
        contratto Lezione 6.5)
                  ▼
       [Handoff → Architect Agent]
                  ▼
       [Nodo: Registra Episodio]
       (memoria episodica, Lezione 8.3)
```

Questo grafo **non è un nuovo concetto**: è la composizione esatta di pattern già costruiti — nodi paralleli (7.2), review layer (7.3), HITL asincrono (7.4), handoff con contratto (6.5, 6.6), registrazione per riassorbimento futuro (8.3). Il valore di questa lezione è mostrare che questi pattern **si compongono naturalmente** in un sistema reale, senza richiedere alcuna invenzione architetturale aggiuntiva.

---

## 3. Gli Agent Package necessari

Seguendo la struttura della Lezione 6.2, il progetto richiede almeno tre agent package completi:

```
/agente-requirement-analyst/
├── agent.yaml
├── agent_card.yaml        (Lezione 6.3 — dichiara "NON_fa
│                            decisioni di business strategiche")
├── prompts/
│   └── system.md           (Lezione 6.4)
├── skills/
│   └── rilevamento-ambiguita.md  (Lezione 6.7)
├── schemas/
│   ├── input_schema.json   (Lezione 6.5)
│   └── output_schema.json
└── evals/
    └── casi_test.yaml       (Lezione 7.5)

/agente-critic-requisiti/
├── agent.yaml
├── agent_card.yaml
├── prompts/
│   └── system.md            (rubrica di valutazione, Lezione 7.3)
└── schemas/
    └── output_schema.json   (ValutazioneReview, Lezione 7.3)

/agente-architect/
├── agent.yaml
├── agent_card.yaml
├── prompts/
│   └── system.md
└── schemas/
    └── input_schema.json    (deve essere COMPATIBILE con
                                l'output_schema del Requirement
                                Analyst — Lezione 6.5)
```

> **Il punto di disciplina più importante di questo progetto:** lo schema di output del Requirement Analyst e lo schema di input dell'Architect Agent devono essere **lo stesso contratto**, condiviso, non due definizioni separate scritte indipendentemente — esattamente il problema di coerenza terminologica identificato nella Lezione 5.4 e risolto formalmente nella Lezione 6.5. Una violazione di questo principio, anche in un progetto di portfolio, riprodurrebbe esattamente l'errore che l'intero Capitolo 6 è stato costruito per prevenire.

---

## 4. Implementazione guidata: dal diagramma al codice

L'implementazione segue, passo per passo, gli strumenti costruiti nel Capitolo 7:

```python
# 1. Definizione dello stato globale (Lezione 7.1)
class StatoProgetto(BaseModel):
    cartella_input: str
    testo_pdf: str | None = None
    testo_audio: str | None = None
    testo_immagini: str | None = None
    requisiti: dict | None = None
    valutazione_review: dict | None = None
    decisione_umana: dict | None = None
    handoff_completato: bool = False

# 2. Costruzione del grafo (Lezione 7.2)
grafo = StateGraph(StatoProgetto)

grafo.add_node("estrazione_pdf", nodo_estrazione_pdf)
grafo.add_node("estrazione_audio", nodo_estrazione_audio)
grafo.add_node("estrazione_immagini", nodo_estrazione_immagini)
grafo.add_node("requirement_analyst", nodo_requirement_analyst)
grafo.add_node("review", nodo_review_critic_agent)
grafo.add_node("checkpoint_umano", nodo_checkpoint_umano)
grafo.add_node("costruisci_handoff", nodo_costruisci_handoff)
grafo.add_node("registra_episodio", nodo_registra_episodio)

# Nodi paralleli di estrazione (Lezione 7.2, Sezione 3)
grafo.set_entry_point("estrazione_pdf")
# ... archi paralleli verso requirement_analyst ...

grafo.add_edge("requirement_analyst", "review")
grafo.add_conditional_edges(
    "review", decidi_dopo_review,  # Lezione 7.3
    {
        "approva": "costruisci_handoff",
        "richiedi_revisione": "requirement_analyst",  # ciclo
        "escala_a_umano": "checkpoint_umano"
    }
)
grafo.add_edge("checkpoint_umano", "costruisci_handoff")
grafo.add_edge("costruisci_handoff", "registra_episodio")
grafo.add_edge("registra_episodio", END)

# 3. Compilazione con checkpointing per HITL asincrono (Lezione 7.4)
workflow_finale = grafo.compile(
    checkpointer=memoria_checkpoint,
    interrupt_before=["costruisci_handoff"]
)
```

Ogni riga di questo codice corrisponde a un concetto specifico, già padroneggiato in una lezione precedente — il valore di questo progetto finale non è introdurre nuova sintassi, ma dimostrare la **composizione fluente** di tutto ciò che hai imparato.

---

## 5. Il layer di auto-miglioramento

Per completare il sistema secondo l'ambizione dichiarata fin dall'inizio del corso, aggiungiamo gli ultimi due componenti del Capitolo 8:

```python
# Self-critique opzionale PRIMA del review esterno (Lezione 8.1),
# come primo filtro economico
def nodo_requirement_analyst(stato: StatoProgetto) -> dict:
    output = genera_requisiti(stato)
    output_validato = applica_self_reflection(output)  # Lezione 8.1
    return {"requisiti": output_validato}


# Agente archivista periodico, eseguito separatamente dal
# workflow principale (es. settimanalmente), per il
# riassorbimento della conoscenza (Lezione 8.3)
def processo_settimanale_riassorbimento():
    episodi = carica_episodi_ultima_settimana()
    pattern = agente_archivista(episodi)
    if pattern["confidenza"] == "alta":
        proponi_per_revisione_umana(pattern)  # MAI automatico
```

---

## 6. Testing e valutazione del sistema completo

Prima di considerare il progetto concluso, applichiamo la disciplina della Lezione 7.5: una test suite che copre almeno i casi fondamentali.

```yaml
# evals/casi_test_sistema_completo.yaml
- id: "caso-001-requisiti-chiari-senza-ambiguita"
  atteso: {handoff_completato: true, escalation_richiesta: false}

- id: "caso-002-formati-contraddittori"
  atteso: {escalation_richiesta: true}

- id: "caso-003-audio-corrotto"
  atteso: {gestione_errore: "fallback_attivato"}  # Lezione 5.5
```

---

## 7. Discussione critica: limiti onesti del sistema

Seguendo lo spirito di onestà professionale praticato in ogni singola lezione di questo corso, nessun progetto si conclude senza un riconoscimento esplicito dei propri limiti:

```
LIMITI STRUTTURALI DI QUESTO SISTEMA

- L'estrazione da audio e immagini (nodi paralleli) dipende
  dalla qualità di modelli specializzati esterni — un
  fallimento in quella fase si propaga (mitigato solo
  parzialmente da fallback, Lezione 5.5)

- Il Critic-Agent condivide il modello sottostante con il
  Requirement Analyst — il rischio di echo chamber
  (Lezione 8.1) non è eliminato, solo ridotto rispetto
  alla pura self-reflection

- Il riassorbimento della conoscenza (Lezione 8.3) richiede
  un volume significativo di episodi prima di produrre
  pattern affidabili — nelle prime settimane di utilizzo,
  il sistema NON beneficia ancora di questo meccanismo

- La qualità delle decisioni umane registrate determina
  la qualità di ogni futuro riassorbimento — un sistema
  più "intelligente" nel tempo solo se le decisioni
  umane storiche erano effettivamente buone
```

Questo elenco non è una debolezza del progetto — è la prova che hai applicato, fino all'ultima lezione, lo stesso principio di onestà tecnica che ha guidato tutto il corso: nessuna tecnologia, nessuna architettura, elimina completamente l'incertezza. Il lavoro di un AI engineer professionale è gestirla con consapevolezza, non pretendere di averla eliminata.

---

## Esempio Pratico: Il Tuo Prossimo Passo Concreto

Questo materiale didattico descrive l'architettura e fornisce i pattern di codice; il tuo passo successivo, fuori da questo corso, è l'implementazione effettiva nel contesto specifico di opencode che hai in mente. I componenti che dovrai adattare al tuo ambiente specifico:

```
1. I nodi di estrazione (PDF/audio/immagini) dovranno
   usare gli strumenti effettivamente disponibili nel
   tuo ambiente opencode (Lezione 4.4, Function Calling,
   o Lezione 4.5, server MCP se disponibili)

2. Il meccanismo di notifica per il checkpoint umano
   (Lezione 7.4) dovrà integrarsi con il tuo flusso di
   lavoro reale — email, dashboard, o altro canale

3. La skill "rilevamento-ambiguita" (Lezione 6.7) dovrà
   essere scritta e raffinata sulla base dei primi casi
   reali che il tuo sistema incontrerà, non lasciata
   come placeholder teorico
```

---

## Riepilogo del Corso

Con questa lezione si conclude il percorso completo di AISchool. Hai costruito, capitolo dopo capitolo:

- **Capitolo 1-3**: le fondamenta — Web, intelligenza artificiale, modelli linguistici — necessarie per non trattare nessuna tecnologia successiva come una scatola nera incomprensibile
- **Capitolo 5**: l'infrastruttura tecnica — API, RAG, Function Calling, MCP, memoria — che trasforma un modello isolato in un sistema capace di agire
- **Capitolo 6**: l'architettura degli agenti — loop, ragionamento esplicito, orchestrazione, robustezza
- **Capitolo 7**: l'ingegneria professionale — agent package, Agent Card, prompt versionati, contratti, handoff, skill condivise
- **Capitolo 8**: i workflow completi — design, LangGraph, review automatico, supervisione umana, valutazione rigorosa
- **Capitolo 9**: l'auto-miglioramento — self-reflection, prompt evolutivi, riassorbimento della conoscenza, governance

Il sistema che hai progettato in questa lezione finale non è un esercizio isolato: è la prova che ogni concetto, da "come funziona Internet" fino a "come un sistema impara dalla propria esperienza", appartiene a un unico edificio coerente — esattamente come promesso nella prima lezione del corso.

---

## Esercizi Pratici

> Tre esercizi che mettono alla prova la tua capacità di **sintesi**: collegare tutto il corso. Prova a risolverli prima di aprire la soluzione.

### Esercizio 1 — La mappa dei pattern 🟢 Base

Il sistema finale "non introduce concetti nuovi": compone pattern già visti. Associa ogni componente del progetto al capitolo/lezione che lo ha introdotto: (a) nodi di estrazione paralleli, (b) review layer, (c) checkpoint umano, (d) handoff con contratto, (e) registrazione episodi.

<details>
<summary>💡 Mostra soluzione</summary>

- **(a) nodi paralleli** → LangGraph, Lezione 7.2.
- **(b) review layer (Critic-Agent)** → Lezione 7.3.
- **(c) checkpoint umano (HITL)** → Lezione 7.4.
- **(d) handoff con contratto** → Lezioni 6.6 (handoff) + 6.5 (contratti).
- **(e) registrazione episodi (memoria episodica)** → Lezione 8.3.

Il valore del progetto finale non è inventare nuova sintassi, ma dimostrare che questi pattern **si compongono naturalmente** in un sistema reale.

</details>

### Esercizio 2 — Un solo contratto, condiviso 🟡 Intermedio

Perché lo schema di **output** del Requirement Analyst e lo schema di **input** dell'Architect devono essere **lo stesso contratto condiviso**, e non due definizioni scritte separatamente?

<details>
<summary>💡 Mostra soluzione</summary>

Se fossero due definizioni separate, nulla garantirebbe che restino allineate: l'Analyst potrebbe produrre un campo `valore_vendite` mentre l'Architect ne attende `importo` — riproducendo esattamente il problema di **coerenza terminologica** della Lezione 5.4. È un errore che si scopre tardi, a valle, ed è difficile da diagnosticare.

Condividendo **un unico contratto** (un solo schema, Lezione 6.5), l'output di A e l'input di B sono **per costruzione** lo stesso formato, **verificabile automaticamente**. Una modifica al contratto si propaga a entrambi. È il principio che l'intero Capitolo 6 è stato costruito per garantire: violarlo, anche in un progetto di portfolio, riprodurrebbe l'errore che il corso insegna a prevenire.

</details>

### Esercizio 3 — Onestà sui limiti 🔴 Avanzato

Il progetto si chiude con una "discussione critica dei limiti". Cita due limiti strutturali del sistema e spiega perché riconoscerli è un segno di **maturità ingegneristica**, non una debolezza del progetto.

<details>
<summary>💡 Mostra soluzione</summary>

Due limiti strutturali (tra quelli citati):
- **Echo chamber del Critic-Agent:** se condivide il modello sottostante col Requirement Analyst, il rischio di bias condiviso è ridotto ma non eliminato (Lezione 8.1).
- **Dipendenza dalla qualità delle decisioni umane storiche:** il riassorbimento (8.3) migliora il sistema solo se le decisioni umane registrate erano buone — altrimenti propaga gli errori.
- (Altri: l'estrazione da audio/immagini dipende da modelli esterni; il riassorbimento richiede volume prima di essere affidabile.)

**Perché riconoscerli è maturità:** nessuna tecnologia elimina l'incertezza. Un ingegnere AI competente la **gestisce con consapevolezza** (supervisione, review, versioning, rollback) invece di **pretendere di averla eliminata**. Dichiarare i limiti dimostra di aver capito *dove* mettere i controlli — è la stessa onestà tecnica applicata in ogni lezione del corso. Un progetto che afferma di "non avere limiti" sarebbe il vero segnale d'allarme.

</details>

---

## Connessioni

**Viene da:** Tutte le 42 lezioni precedenti del corso, senza eccezione.

**Porta a:** Il tuo lavoro reale su opencode, sulla curriculum AISchool, e su ogni sistema agentivo che costruirai a partire da questo momento.
