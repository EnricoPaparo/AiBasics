---
id: "08-05"
titolo: "Valutazione dei Workflow: metriche, evals e testing end-to-end"
sottotitolo: "Chiudere il capitolo con la domanda che conta davvero: come sai se il sistema funziona?"
capitolo: 8
capitolo_titolo: "Workflow Multi-Agente"
lezione: 5
durata_stimata: "65 minuti"
difficolta: "avanzato"
prerequisiti: ["08-04"]
concetti_chiave:
  - metriche di sistema
  - LLM-as-judge
  - evals
  - regression testing
  - osservabilità in produzione
obiettivi:
  - "Distinguere metriche per agente singolo da metriche di sistema"
  - "Implementare una test suite di evals per un workflow completo"
  - "Spiegare i rischi dell'LLM-as-judge e come mitigarli"
  - "Progettare un dashboard minimo di osservabilità in produzione"
stato: "pubblicata"
versione: "1.0"
---
# Valutazione dei Workflow: metriche, evals e testing end-to-end

## Introduzione

Chiudiamo il Capitolo 8 — e l'intera parte del corso dedicata all'implementazione di workflow multi-agente — con la domanda che, in ultima analisi, conta più di ogni altra: **come sai se il sistema che hai costruito funziona davvero?** Avere un workflow elegantemente progettato (8.1), implementato con un framework robusto (8.2), arricchito da review automatico (8.3) e supervisione umana (8.4), non garantisce automaticamente che il sistema, nel suo complesso, produca risultati di qualità in modo consistente.

Questa lezione costruisce la disciplina di valutazione che chiude il ciclo di sviluppo: senza di essa, ogni modifica al sistema — un prompt aggiornato (Lezione 7.4), una skill corretta (Lezione 7.7), una nuova versione di un agente (Lezione 7.3) — sarebbe un salto nel buio, senza modo di sapere se ha effettivamente migliorato o peggiorato il comportamento complessivo.

---

## Obiettivi di Apprendimento

Al termine di questa lezione sarai in grado di:

- Distinguere le metriche rilevanti per un singolo agente da quelle rilevanti per l'intero sistema
- Implementare una test suite di evals per un workflow multi-agente completo
- Spiegare i rischi dell'LLM-as-judge come tecnica di valutazione, e come mitigarli
- Progettare un dashboard minimo di osservabilità per un workflow in produzione

---

## 1. Il problema: non si misura solo l'output finale

In un sistema multi-agente, valutare solo l'output finale del workflow (ad esempio, "il report prodotto dall'Agente Scrittore è di buona qualità?") nasconde informazioni cruciali su **dove**, esattamente, il processo ha funzionato bene o male.

```
VALUTARE SOLO L'OUTPUT FINALE              VALUTARE OGNI NODO

Sai SE il risultato finale è buono         Sai DOVE, esattamente,
o cattivo, ma non PERCHÉ                   un problema è stato
                                            introdotto: nel nodo di
                                            estrazione? di analisi?
                                            di scrittura?

Un errore nel nodo di estrazione           Puoi correggere la CAUSA
(Lezione 8.1) potrebbe essere              specifica, invece di
"corretto" casualmente da un nodo          rivedere genericamente
di scrittura molto abile — mascherando     tutto il sistema
il problema reale invece di risolverlo
```

Questo principio — valutare ogni componente, non solo il risultato complessivo — riprende direttamente la logica del logging strutturato della Lezione 6.5: senza visibilità granulare, la diagnosi di un problema diventa enormemente più difficile.

---

## 2. Metriche per agente singolo vs metriche di sistema

```
METRICHE PER AGENTE SINGOLO            METRICHE DI SISTEMA

- Tasso di violazione del contratto    - Latenza end-to-end (tempo
  dichiarato (Lezione 7.5)               totale dall'input
                                          dell'utente all'output
- Tasso di approvazione dal              finale)
  Critic-Agent (Lezione 8.3)
                                        - Numero medio di cicli di
- Numero di token consumati per          revisione prima
  esecuzione (costo, Lezione 5.1)        dell'approvazione (8.3)

- Frequenza di escalation a            - Tasso di escalation a
  revisione umana (Lezione 8.4)          umano sull'INTERO processo
                                          (non solo per singolo nodo)

                                        - Tasso di errore END-TO-END
                                          (quante esecuzioni complete
                                          falliscono, indipendentemente
                                          da dove)
```

Un sistema può avere ottime metriche per ogni singolo agente, e tuttavia una metrica di sistema preoccupante — ad esempio, se ogni singolo nodo individualmente ha un tasso di errore basso, ma la **combinazione** di piccoli errori in più nodi consecutivi produce un tasso di fallimento end-to-end significativamente più alto della somma delle singole probabilità. Questo è precisamente il motivo per cui entrambi i livelli di metrica sono necessari, e nessuno dei due da solo è sufficiente.

---

## 3. LLM-as-Judge: vantaggi e rischi

Per molte valutazioni — specialmente quelle che riguardano la **qualità** di un output testuale, non solo la sua conformità a un contratto strutturato (Lezione 7.5) — non esiste una metrica numerica oggettiva immediata. La tecnica **LLM-as-judge** usa un modello linguistico per valutare la qualità dell'output di un altro componente del sistema, riprendendo lo stesso principio del Critic-Agent (Lezione 8.3) ma applicato specificamente al contesto di valutazione e misurazione, non di correzione in tempo reale.

```python
def valuta_qualita_report_llm_judge(report_generato: str,
                                       criteri_attesi: list[str]) -> dict:
    """
    Usa un modello come 'giudice' per valutare la qualità
    di un report, secondo criteri espliciti.
    """
    client = anthropic.Anthropic()

    risposta = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=400,
        system="Sei un valutatore indipendente di qualità. "
               "Valuta il report secondo i criteri forniti, "
               "con un punteggio da 1 a 5 per ciascuno, e una "
               "motivazione concisa.",
        messages=[{
            "role": "user",
            "content": f"Report: {report_generato}\n\n"
                       f"Criteri da valutare: {criteri_attesi}"
        }]
    )
    return json.loads(risposta.content[0].text)
```

### I rischi da gestire con attenzione

```
RISCHIO 1: Il giudice condivide gli stessi bias del
            sistema valutato (se usa lo stesso modello
            sottostante, Capitolo 4)

RISCHIO 2: Inconsistenza tra valutazioni dello stesso
            output in esecuzioni diverse (la natura
            probabilistica vista nella Lezione 4.1
            si applica anche al giudice)

RISCHIO 3: Il giudice può essere "ingannato" da un
            output ben scritto stilisticamente ma
            sostanzialmente carente — lo stesso problema
            di plausibilità vs verità della Lezione 4.5
```

**Mitigazioni pratiche:** usare criteri di valutazione il più possibile **strutturati e specifici** (riprendendo le rubriche della Lezione 8.3), eseguire la stessa valutazione **più volte** e verificarne la consistenza, e — per le decisioni più critiche — non affidarsi mai esclusivamente all'LLM-as-judge senza un campione di verifica umana periodica, esattamente il principio di supervisione della Lezione 8.4 applicato qui al processo di valutazione stesso.

---

## 4. Implementazione pratica: una test suite di evals

Costruiamo una test suite che verifica il comportamento del workflow Requirement Analyst → Architect su casi noti, con risultati attesi predefiniti.

```python
import yaml

CASI_TEST = [
    {
        "id": "caso-001-requisiti-chiari",
        "input": "cartella_test_001/",
        "atteso": {
            "ambiguita_rilevate": [],  # nessuna ambiguità prevista
            "handoff_pronto": True
        }
    },
    {
        "id": "caso-002-formati-contraddittori",
        "input": "cartella_test_002/",
        "atteso": {
            "ambiguita_rilevate_minimo": 1,  # almeno un'ambiguità
                                               # DEVE essere rilevata
            "richiede_escalation": True
        }
    }
]

def esegui_test_suite(casi_test: list[dict],
                        workflow_compilato) -> dict:
    """
    Esegue il workflow su ogni caso di test e confronta
    il risultato con quanto atteso, riportando un sommario.
    """
    risultati = {"passati": 0, "falliti": 0, "dettagli": []}

    for caso in casi_test:
        configurazione = {"configurable": {"thread_id": caso["id"]}}
        risultato = workflow_compilato.invoke(
            StatoWorkflowRequisiti(cartella_input=caso["input"]),
            config=configurazione
        )

        successo = verifica_caso(risultato, caso["atteso"])
        risultati["passati" if successo else "falliti"] += 1
        risultati["dettagli"].append({
            "caso": caso["id"], "successo": successo
        })

    return risultati


def verifica_caso(risultato: dict, atteso: dict) -> bool:
    """Logica di confronto specifica per ogni tipo di assertion."""
    if "ambiguita_rilevate" in atteso:
        if risultato["ambiguita_rilevate"] != atteso["ambiguita_rilevate"]:
            return False
    if "ambiguita_rilevate_minimo" in atteso:
        if len(risultato["ambiguita_rilevate"]) < atteso["ambiguita_rilevate_minimo"]:
            return False
    return True


# Esecuzione e report
report = esegui_test_suite(CASI_TEST, workflow_compilato)
print(f"Test passati: {report['passati']}/{len(CASI_TEST)}")
```

---

## 5. Regression Testing: garantire che una modifica non rompa nulla

Il valore più importante di una test suite come quella della Sezione 4 emerge non al primo utilizzo, ma **ogni volta che qualcosa nel sistema cambia**: un prompt aggiornato (Lezione 7.4), una nuova versione di una skill (Lezione 7.7), un aggiustamento alla policy di escalation (Lezione 8.4).

```
PRIMA DI UNA MODIFICA              DOPO LA MODIFICA

Esegui la test suite               Esegui DI NUOVO la stessa
→ 8/10 casi passano                test suite
                                    → se ancora 8/10 (o di più):
                                      la modifica non ha introdotto
                                      regressioni
                                    → se MENO di 8/10: la modifica
                                      ha introdotto un problema,
                                      da investigare PRIMA di
                                      procedere con il deploy
```

Questo principio — eseguire la stessa suite di test prima e dopo ogni modifica, confrontando i risultati — è precisamente ciò che rende possibile far evolvere un sistema agentivo nel tempo **con fiducia**, invece di temere che ogni piccolo aggiustamento possa silenziosamente rompere un comportamento che funzionava correttamente in un caso non più testato attivamente.

---

## 6. Osservabilità in produzione: dashboard e alert

Riprendendo e completando il logging strutturato della Lezione 6.5, un sistema in produzione beneficia di una visualizzazione aggregata delle metriche raccolte, non solo di singoli log da consultare manualmente.

```
DASHBOARD MINIMO DI OSSERVABILITÀ

┌─────────────────────────────────────────────┐
│  Esecuzioni ultime 24h: 142                    │
│  Tasso di successo end-to-end: 94.3%           │
│  Tasso di escalation umana: 8.1%               │
│  Tempo medio per esecuzione: 47 secondi        │
│                                                  │
│  ⚠ ALERT: tasso di escalation in crescita       │
│     (+3.2% rispetto alla settimana precedente)  │
└─────────────────────────────────────────────┘
```

Un **alert** automatico su una metrica che si discosta significativamente dal proprio andamento storico (come nell'esempio, il tasso di escalation in crescita) permette di intervenire **prima** che un problema sistemico diventi grave, invece di scoprirlo solo quando qualcuno si lamenta esplicitamente di risultati insatisfacenti.

---

## Esempio Pratico: Diagnosticare una Regressione da un Report di Test

Immagina questo confronto tra due esecuzioni della test suite, prima e dopo aver aggiornato il prompt dell'Agente Analista (Lezione 7.4):

```
PRIMA della modifica al prompt:
  Test passati: 9/10
  Caso fallito: "caso-007-dati-incompleti"

DOPO la modifica al prompt:
  Test passati: 7/10
  Casi falliti: "caso-007-dati-incompleti",
                "caso-003-formato-standard",
                "caso-009-periodo-singolo"
```

Cosa puoi dedurre? La modifica al prompt **non ha risolto** il problema preesistente (`caso-007` fallisce ancora), e ha **introdotto due nuove regressioni** (`caso-003` e `caso-009`, che prima passavano). Questo è un segnale chiaro per **non procedere** con il deploy di questa modifica, e per investigare specificamente cosa, nel nuovo prompt, ha alterato il comportamento sui casi che prima funzionavano correttamente — un'indagine rapida e mirata, possibile solo grazie all'esistenza della test suite.

---

## Riepilogo

- Valutare un workflow richiede **metriche per agente singolo** (tasso di violazione contratti, escalation, costo) e **metriche di sistema** (latenza end-to-end, tasso di errore complessivo) — nessuna delle due basta da sola.
- **LLM-as-judge** permette di valutare qualità non riducibile a metriche numeriche oggettive, ma comporta rischi (bias condivisi, inconsistenza, vulnerabilità a output stilisticamente convincenti ma carenti) che richiedono mitigazione attiva.
- Una **test suite di evals**, con casi noti e risultati attesi, permette di verificare automaticamente il comportamento del workflow, esattamente come un test automatizzato verifica il comportamento del codice tradizionale.
- Il **regression testing** — eseguire la stessa suite prima e dopo ogni modifica — è ciò che permette di far evolvere il sistema con fiducia, rilevando immediatamente se una modifica ha introdotto un peggioramento.
- Un **dashboard di osservabilità in produzione**, con alert su metriche anomale, permette di intervenire prima che un problema sistemico diventi grave.

---

## Domande di Verifica

1. Spiega, con un esempio concreto diverso da quello della lezione, come un workflow potrebbe avere ottime metriche per ogni singolo agente individualmente, ma una metrica di sistema (es. tasso di errore end-to-end) preoccupante.

2. Riprendi i tre rischi dell'LLM-as-judge nella Sezione 3. Quale di questi rischi ritieni più difficile da mitigare completamente, anche applicando le strategie suggerite, e perché?

3. Nell'esempio pratico della Sezione finale, oltre a non procedere con il deploy, quale altra azione concreta suggeriresti, collegandola al principio di versionamento dei prompt visto nella Lezione 7.4?

---

## Esercizi Pratici

> Tre esercizi a difficoltà crescente. Prova a risolverli da solo prima di aprire la soluzione.

### Esercizio 1 — Metriche di agente vs di sistema 🟢 Base

Classifica come **metrica di agente singolo** o **metrica di sistema**: (a) latenza end-to-end, (b) tasso di violazione del contratto di un agente, (c) tasso di errore end-to-end, (d) token consumati da un agente per esecuzione.

<details>
<summary>💡 Mostra soluzione</summary>

- **(a) latenza end-to-end** → **sistema** (tempo totale dall'input dell'utente all'output finale).
- **(b) violazione contratto di un agente** → **agente singolo**.
- **(c) tasso di errore end-to-end** → **sistema** (quante esecuzioni complete falliscono).
- **(d) token per esecuzione di un agente** → **agente singolo** (costo).

Servono **entrambi i livelli**: un sistema può avere ottime metriche per ogni agente e una metrica di sistema preoccupante (piccoli errori che si combinano in più nodi).

</details>

### Esercizio 2 — Rischi dell'LLM-as-judge 🟡 Intermedio

Elenca i rischi principali dell'usare un LLM come "giudice" della qualità, e per ciascuno una mitigazione pratica.

<details>
<summary>💡 Mostra soluzione</summary>

Rischi e mitigazioni:
1. **Bias condivisi** (se il giudice usa lo stesso modello del sistema valutato) → usare criteri molto strutturati; affiancare verifica umana periodica.
2. **Inconsistenza** tra valutazioni (natura probabilistica) → eseguire la valutazione **più volte** e controllarne la coerenza.
3. **Ingannabilità** da output stilisticamente brillante ma sostanzialmente carente (plausibilità ≠ verità, Lezione 4.5) → rubriche specifiche e oggettive; non affidarsi *solo* al giudice per le decisioni critiche.

Regola: l'LLM-as-judge è utile per valutare qualità non riducibile a numeri, ma non va mai usato come unica fonte di verità per decisioni ad alto impatto.

</details>

### Esercizio 3 — Diagnosi di una regressione 🔴 Avanzato

Prima di una modifica al prompt: 9/10 test passano (fallisce `caso-007`). Dopo: 7/10 (falliscono `caso-007`, `caso-003`, `caso-009`). (a) Cosa deduci? (b) Cosa fai? (c) Come si collega al versionamento dei prompt (Lezione 7.4)?

<details>
<summary>💡 Mostra soluzione</summary>

**(a) Deduzione:** la modifica **non ha risolto** il problema preesistente (`caso-007` fallisce ancora) e ha **introdotto due regressioni** (`caso-003` e `caso-009` prima passavano). Bilancio netto: peggiorativo.

**(b) Azione:** **non procedere col deploy.** Investigare cosa, nel nuovo prompt, ha alterato il comportamento sui casi che prima funzionavano — un'indagine mirata, resa possibile solo dalla test suite.

**(c) Collegamento al versionamento:** poiché i prompt sono versionati in git (Lezione 7.4), puoi fare il **diff** tra la versione precedente e quella nuova per vedere esattamente cosa è cambiato, e fare **rollback** alla versione che dava 9/10. Senza versionamento e regression testing, avresti deployato un peggioramento senza accorgertene. È il prerequisito che rende possibile l'auto-miglioramento del Capitolo 9.

</details>

---

## Connessioni

**Viene da:** Lezione 6.5 (Gestione degli Errori) — il logging strutturato lì introdotto è la materia prima per le metriche di questa lezione. Lezione 8.3 (Il Layer di Review) — le rubriche di valutazione si estendono qui a un sistema di misurazione completo.

**Porta a:** Capitolo 9 (Sistemi Auto-Evolutivi) — la capacità di misurare oggettivamente le prestazioni, costruita in questa lezione, è il prerequisito indispensabile per qualsiasi sistema che pretenda di migliorarsi automaticamente nel tempo.

**Ritroverai questi concetti in:** Lezione 9.2 (Prompt Auto-Evolutivi) — il regression testing qui descritto è esattamente il meccanismo che permette di verificare se un prompt modificato automaticamente ha effettivamente migliorato le prestazioni. Lezione 9.4 (Governance) — le metriche e gli alert qui introdotti diventeranno parte del sistema di governance completo degli artefatti agentivi.

---

**CHIUSURA DEL CAPITOLO 8.** Con questa lezione si conclude l'intero ciclo di costruzione di un workflow multi-agente professionale: progettazione (8.1), implementazione tecnica con LangGraph (8.2), qualità tramite review automatico (8.3), supervisione umana strutturata (8.4), e infine la disciplina di valutazione che chiude il ciclo (8.5). Il Capitolo 9, l'ultimo del corso, affronta la frontiera più avanzata: sistemi che non si limitano a funzionare bene, ma che usano esattamente queste metriche e questa capacità di misurazione per migliorarsi autonomamente nel tempo.
