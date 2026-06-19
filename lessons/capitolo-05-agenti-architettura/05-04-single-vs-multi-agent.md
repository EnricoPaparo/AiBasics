---
id: "05-04"
titolo: "Agenti Single vs Multi-Agent: quando un agente non basta"
sottotitolo: "Formalizzare le topologie di sistema, e capire dove si rompe la coerenza"
capitolo: 5
capitolo_titolo: "Agenti AI: Architettura e Ragionamento"
lezione: 4
durata_stimata: "65 minuti"
difficolta: "intermedio"
prerequisiti: ["05-03"]
concetti_chiave:
  - topologia
  - pipeline sequenziale
  - architettura a grafo
  - architettura a rete
  - coerenza inter-agente
obiettivi:
  - "Riconoscere i segnali concreti che indicano la necessità di un sistema multi-agente"
  - "Distinguere pipeline sequenziale, architettura a grafo e architettura a rete"
  - "Implementare una pipeline a quattro agenti con passaggio di contesto controllato"
  - "Identificare il problema della coerenza terminologica tra agenti diversi"
stato: "pubblicata"
versione: "1.0"
---

# Agenti Single vs Multi-Agent: quando un agente non basta

## Introduzione

Nella lezione precedente abbiamo costruito un orchestratore che coordina due agenti specializzati. Questa lezione fa un passo indietro per formalizzare con maggiore rigore una domanda che abbiamo solo accennato: **quando, esattamente, conviene passare da un singolo agente a un sistema multi-agente?** E, una volta presa questa decisione, **quali forme può assumere** l'architettura risultante?

Non è una domanda accademica. Costruire un sistema multi-agente quando un singolo agente ben progettato sarebbe stato sufficiente introduce complessità non necessaria — più chiamate API (Lezione 4.1), più punti di possibile fallimento, più difficoltà di debug. Costruire un singolo agente sovraccaricato quando la situazione richiederebbe specializzazione produce, come visto nella lezione precedente, errori che si propagano senza controllo. Questa lezione ti dà i criteri per scegliere correttamente.

---

## Obiettivi di Apprendimento

Al termine di questa lezione sarai in grado di:

- Riconoscere i segnali concreti che indicano la necessità di un sistema multi-agente
- Distinguere tre topologie principali: pipeline sequenziale, architettura a grafo, architettura a rete
- Implementare una pipeline a più agenti con passaggio di contesto controllato tra le fasi
- Identificare e prevenire il problema della coerenza terminologica tra agenti diversi

---

## 1. I segnali concreti che indicano la necessità di più agenti

Riprendendo e formalizzando quanto visto nella Lezione 5.3, i segnali che indicano che un singolo agente generalista ha raggiunto il proprio limite sono tipicamente:

```
SEGNALE 1: Eterogeneità delle competenze richieste
  Il compito richiede "modalità di ragionamento" molto
  diverse tra loro (es. rigore quantitativo vs creatività
  discorsiva) — un singolo system prompt fatica a guidare
  bene entrambe

SEGNALE 2: Crescita incontrollata del contesto
  Il numero di strumenti, istruzioni, ed esempi necessari
  per un singolo agente continua a crescere, avvicinandosi
  ai limiti del context window (Lezione 3.3)

SEGNALE 3: Necessità di checkpoint intermedi
  Vuoi poter VERIFICARE un risultato parziale prima che il
  processo continui, invece di ottenere solo un output
  finale monolitico

SEGNALE 4: Riusabilità
  Una parte specifica del compito (es. "estrai dati da un
  documento") è utile anche in ALTRI contesti, e vorresti
  poterla riutilizzare come componente indipendente
```

Se nessuno di questi segnali è presente, un singolo agente ben progettato — con un buon prompt (Lezione 3.4), gli strumenti giusti (Lezione 4.4), e un loop ReAct (Lezione 5.2) — resta spesso la scelta più semplice ed efficiente.

---

## 2. Pipeline Sequenziale: la topologia più semplice

La **pipeline sequenziale** è la topologia multi-agente più semplice: gli agenti operano in un ordine fisso e predeterminato, ciascuno riceve l'output del precedente come proprio input.

```
Agente A → Agente B → Agente C → Agente D
(estrae)   (analizza)  (verifica)  (scrive)
```

È precisamente la topologia usata, in forma semplificata, nella Lezione 5.3 (Analista → Scrittore). È facile da progettare, da prevedere, e da debuggare — ma è anche la più **rigida**: se un risultato intermedio richiedesse di tornare a una fase precedente (ad esempio, l'agente di verifica scopre un problema nei dati estratti dall'Agente A), una pipeline puramente sequenziale non gestisce nativamente questo tipo di retroazione.

---

## 3. Architettura a Grafo: flessibilità con cicli e condizioni

Un'**architettura a grafo** generalizza la pipeline sequenziale permettendo **archi condizionali** (il percorso successivo dipende dal risultato di una fase) e **cicli** (è possibile tornare a una fase precedente se necessario).

```
                  Agente A (estrae)
                        │
                        ▼
                  Agente B (analizza)
                        │
              ┌─────────┴─────────┐
              ▼                   ▼
       dati validi?          dati problematici?
              │                   │
              ▼                   ▼
       Agente C (scrive)    torna ad Agente A
                              con istruzioni
                              correttive
```

Questa topologia risolve direttamente il limite di rigidità della pipeline sequenziale, al costo di una maggiore complessità di progettazione: bisogna decidere esplicitamente quali condizioni attivano quali percorsi, ed evitare di costruire cicli che non terminano mai — lo stesso problema di loop incontrato nella Lezione 5.2, qui a un livello di sistema invece che di singolo agente. Anticipiamo qui che questa topologia troverà, nella Lezione 7.2, un'implementazione tecnica precisa tramite il framework LangGraph, pensato esattamente per costruire grafi di questo tipo.

---

## 4. Architettura a Rete: comunicazione paritaria tra agenti

Una terza topologia, meno comune ma utile in scenari specifici, è l'**architettura a rete**, dove non esiste necessariamente un orchestratore centrale (Lezione 5.3) che dirige il flusso: gli agenti comunicano tra loro in modo più paritario, ciascuno potendo, in linea di principio, interagire con qualsiasi altro.

```
        Agente A ←──────→ Agente B
           │  ╲           ╱  │
           │    ╲       ╱    │
           │      ╲   ╱      │
           ▼        ╲ ╱       ▼
        Agente D ←──╳──→ Agente C
```

Questa topologia è più flessibile ma anche più difficile da rendere prevedibile e da debuggare, perché non esiste un singolo punto di coordinamento che mantiene una visione d'insieme del processo (a differenza dell'orchestratore della Lezione 5.3). Per questo motivo, la maggior parte dei sistemi multi-agente professionali — incluso tutto ciò che costruiremo nel resto di questo corso — preferisce topologie con un grado di coordinamento centrale (pipeline o grafo), riservando l'architettura a rete a casi specifici in cui la comunicazione paritaria tra agenti specializzati è effettivamente il modello più naturale per il problema.

---

## 5. Implementazione pratica: una pipeline a quattro agenti

Estendiamo l'esempio della Lezione 5.3 con un esempio più completo e realistico: una pipeline a quattro fasi, che include un punto di verifica intermedio — esattamente il "Segnale 3" descritto nella Sezione 1.

```python
import anthropic

def chiama_agente(system_prompt: str, input_testo: str, max_tok: int = 600) -> str:
    """Funzione di base riutilizzata per ogni agente specializzato."""
    client = anthropic.Anthropic()
    risposta = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=max_tok,
        system=system_prompt,
        messages=[{"role": "user", "content": input_testo}]
    )
    return risposta.content[0].text


def pipeline_analisi_documento(testo_documento: str) -> str:
    """
    Pipeline a 4 fasi:
    Estrazione → Analisi → Verifica → Scrittura
    """

    # FASE 1: ESTRAZIONE
    dati_estratti = chiama_agente(
        system_prompt="Estrai SOLO i dati numerici e i fatti "
                      "rilevanti dal testo fornito, in elenco. "
                      "Non aggiungere interpretazioni.",
        input_testo=testo_documento
    )

    # FASE 2: ANALISI
    analisi = chiama_agente(
        system_prompt="Analizza i dati forniti e identifica "
                      "trend, anomalie o pattern significativi.",
        input_testo=dati_estratti
    )

    # FASE 3: VERIFICA (il checkpoint intermedio)
    verifica = chiama_agente(
        system_prompt="Verifica se l'analisi fornita è "
                      "coerente con i dati originali. Rispondi "
                      "SOLO con 'VALIDO' o 'PROBLEMA: <motivo>'.",
        input_testo=f"DATI ORIGINALI:\n{dati_estratti}\n\n"
                     f"ANALISI DA VERIFICARE:\n{analisi}",
        max_tok=200
    )

    if verifica.strip().startswith("PROBLEMA"):
        # ARCO CONDIZIONALE: torniamo a un'analisi corretta,
        # invece di procedere con un risultato inaffidabile
        return f"Pipeline interrotta al checkpoint: {verifica}"

    # FASE 4: SCRITTURA
    report = chiama_agente(
        system_prompt="Scrivi un report professionale basato "
                      "sull'analisi fornita, con un tono chiaro "
                      "e raccomandazioni concrete.",
        input_testo=analisi,
        max_tok=900
    )

    return report


# Utilizzo:
risultato = pipeline_analisi_documento(
    "Le vendite del Q3 sono state di 1.2M€, in calo del 8% "
    "rispetto al Q3 dell'anno precedente (1.3M€)..."
)
print(risultato)
```

Nota la **Fase 3**: a differenza della pipeline puramente sequenziale della Sezione 2, qui introduciamo un arco condizionale — se la verifica rileva un problema, la pipeline si interrompe esplicitamente invece di propagare un'analisi potenzialmente errata fino al report finale. Questo è precisamente il principio dell'architettura a grafo (Sezione 3) applicato in forma minima e concreta.

---

## 6. Il problema della coerenza terminologica tra agenti

Un problema pratico, spesso sottovalutato, che emerge non appena un sistema include più di un agente: agenti diversi, con prompt diversi scritti magari in momenti diversi, possono usare **terminologie leggermente diverse** per concetti che dovrebbero essere identici, generando incoerenze che si propagano nella pipeline.

```
ESEMPIO DI INCOERENZA:

Agente "Estrazione" produce output con il campo:
  "importo_totale": 1200000

Agente "Analisi" si aspetta, nel proprio prompt, un campo
chiamato:
  "valore_vendite"

→ L'Agente Analisi potrebbe non trovare l'informazione che
  si aspettava, o interpretarla in modo inconsistente
```

Questo problema, qui solo identificato, è precisamente la motivazione che ci porterà, nella Lezione 6.5, a introdurre **contratti espliciti** tra agenti — schemi formali e condivisi (basati sul principio di Pydantic/JSON Schema già visto nella Lezione 4.2) che garantiscono che l'output di un agente e l'input atteso dal successivo usino esattamente la stessa terminologia e struttura, verificabile automaticamente invece di sperare in una coerenza informale tra prompt scritti separatamente.

---

## Esempio Pratico: Scegliere la Topologia Giusta per Tre Scenari

Applichiamo i criteri di questa lezione a tre scenari concreti:

1. **"Traduci questo documento in tre lingue diverse"** — i tre compiti di traduzione sono indipendenti tra loro e non richiedono coordinamento sequenziale: un'architettura a rete (o, più semplicemente, tre chiamate parallele indipendenti) sarebbe più adatta di una pipeline rigida
2. **"Estrai i dati da una fattura, verificali contro il database clienti, e genera una conferma d'ordine"** — ogni fase dipende strettamente dal risultato della precedente, e un errore in una fase deve bloccare le successive: una pipeline sequenziale (eventualmente con un arco condizionale per la verifica, come nell'esempio della Sezione 5) è la scelta naturale
3. **"Monitora continuamente un sistema, e quando rilevi un'anomalia, coordina automaticamente diagnosi, notifica e correzione"** — il flusso non è prevedibile in anticipo, dipende da eventi che si verificano nel tempo: un'architettura a grafo con pattern event-driven (Lezione 5.3) è più adatta di una pipeline fissa

---

## Riepilogo

- I segnali che indicano la necessità di un sistema multi-agente sono: eterogeneità delle competenze richieste, crescita incontrollata del contesto, necessità di checkpoint intermedi, e riusabilità di componenti specifici.
- La **pipeline sequenziale** è la topologia più semplice e prevedibile, ma rigida: non gestisce nativamente la necessità di tornare a una fase precedente.
- L'**architettura a grafo** generalizza la pipeline con archi condizionali e cicli, offrendo maggiore flessibilità a costo di maggiore complessità progettuale.
- L'**architettura a rete** permette comunicazione paritaria tra agenti senza coordinamento centrale, ma è più difficile da rendere prevedibile — riservata a scenari specifici.
- La **coerenza terminologica** tra agenti diversi è un problema pratico concreto, che richiede contratti espliciti (anticipando la Lezione 6.5) per essere risolto in modo robusto, non lasciato alla sola buona volontà di chi scrive i singoli prompt.

---

## Domande di Verifica

1. Riprendi il Segnale 2 (crescita incontrollata del contesto). Spiega, collegandolo esplicitamente al meccanismo di attention visto nella Lezione 2.5, perché un contesto molto più lungo non è solo "più lento" ma comporta un costo computazionale che cresce in modo non lineare.

2. Nel codice della Sezione 5, cosa succederebbe se rimuovessimo completamente la Fase 3 (verifica)? Quale dei quattro segnali della Sezione 1 verrebbe, di fatto, ignorato?

3. Pensa a un caso d'uso reale (diverso dai tre esempi della lezione) in cui un'architettura a rete sarebbe più naturale di una pipeline o di un grafo con coordinamento centrale. Cosa rende, in quel caso specifico, la comunicazione paritaria preferibile a un orchestratore centrale?

---

## Connessioni

**Viene da:** Lezione 5.3 (L'Orchestratore) — questa lezione formalizza e generalizza le topologie di coordinamento solo accennate in quella lezione.

**Porta a:** Lezione 5.5 (Gestione degli Errori) — vedremo come rendere robusti questi sistemi multi-agente contro fallimenti che, come visto, possono verificarsi a ogni singolo nodo della topologia.

**Ritroverai questi concetti in:** Lezione 6.5 (Contratti tra Agenti) — il problema della coerenza terminologica, qui identificato, riceverà una soluzione tecnica precisa e formale. Lezione 7.1 e 7.2 (Progettare un Workflow, LangGraph) — l'architettura a grafo qui introdotta concettualmente diventerà un'implementazione tecnica completa con un framework dedicato.
