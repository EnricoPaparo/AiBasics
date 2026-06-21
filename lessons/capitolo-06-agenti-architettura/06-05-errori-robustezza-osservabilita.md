---
id: "05-05"
titolo: "Gestione degli Errori, Robustezza e Osservabilità negli Agenti"
sottotitolo: "Chiudere il capitolo con maturità ingegneristica: cosa serve prima di andare in produzione"
capitolo: 5
capitolo_titolo: "Agenti AI: Architettura e Ragionamento"
lezione: 5
durata_stimata: "60 minuti"
difficolta: "intermedio"
prerequisiti: ["05-04"]
concetti_chiave:
  - retry
  - fallback
  - circuit breaker
  - graceful degradation
  - logging
  - tracing
  - osservabilità
obiettivi:
  - "Classificare i tipi di errore tipici di un sistema agentivo"
  - "Implementare retry, fallback e circuit breaker in un agente"
  - "Spiegare il principio di graceful degradation con un esempio concreto"
  - "Progettare un sistema minimo di logging per l'osservabilità di un agente"
stato: "pubblicata"
versione: "1.0"
---

# Gestione degli Errori, Robustezza e Osservabilità negli Agenti

## Introduzione

Chiudiamo il Capitolo 5 con la lezione che separa un prototipo interessante da un sistema pronto per l'uso reale. Negli esempi delle lezioni precedenti, abbiamo costruito agenti che **funzionano quando tutto va bene**: il modello risponde correttamente, gli strumenti restituiscono i dati attesi, le chiamate API non falliscono. Ma un sistema in produzione deve gestire anche tutto ciò che, prima o poi, **non va bene** — ed è precisamente questa capacità di gestire i fallimenti, in modo controllato e prevedibile, che distingue un'architettura matura da un esperimento fragile.

Questa lezione raccoglie e formalizza precauzioni che abbiamo già introdotto in forma semplice — il `max_iterazioni` della Lezione 5.1, l'exponential backoff della Lezione 4.1 — e le organizza in una strategia coerente di robustezza, completando così tutta l'architettura concettuale necessaria prima di affrontare, nel Capitolo 6, come impacchettare un agente in modo professionale.

---

## Obiettivi di Apprendimento

Al termine di questa lezione sarai in grado di:

- Classificare i tipi di errore tipici di un sistema agentivo: errori di strumento, loop, allucinazioni, errori di piano
- Implementare pattern di retry, fallback e circuit breaker in un agente reale
- Spiegare il principio di graceful degradation con un esempio concreto applicato a un agente
- Progettare un sistema minimo di logging per rendere osservabile il comportamento di un agente

---

## 1. Classificare i tipi di errore in un sistema agentivo

Non tutti gli errori che un agente può incontrare sono della stessa natura, e ciascun tipo richiede una strategia di gestione diversa.

```
ERRORI DI STRUMENTO
  Una chiamata a uno strumento esterno (Lezione 4.4) fallisce:
  timeout di rete, API esterna non disponibile, parametri
  non validi. È l'equivalente, nel mondo agentivo, degli
  errori HTTP visti nella Lezione 4.1 (429, 500, ecc.)

LOOP
  L'agente ripete la stessa azione, o un piccolo ciclo di
  azioni, senza fare progressi verso l'obiettivo (problema
  già identificato nella Lezione 5.2)

ALLUCINAZIONI
  Il modello genera, nel proprio PENSIERO (Lezione 5.2) o
  nella risposta finale, informazioni inventate o non
  supportate dai dati effettivamente raccolti — il limite
  strutturale visto nella Lezione 3.5, qui nel contesto
  specifico di un processo agentivo multi-passo

ERRORI DI PIANO
  L'agente (o l'orchestratore, Lezione 5.3) scompone il
  problema in modo inadeguato fin dall'inizio: anche se
  ogni singolo passo viene eseguito correttamente, la
  STRATEGIA complessiva non porta al risultato desiderato
```

Questa classificazione conta perché la soluzione tecnica appropriata è diversa per ciascun caso: un errore di strumento si gestisce con retry; un loop si gestisce con limiti e rilevamento di pattern ripetitivi; un'allucinazione si gestisce con verifica e ancoraggio ai dati (lo stesso principio del RAG, Lezione 4.3); un errore di piano richiede spesso intervento umano (Lezione 7.4) o un meccanismo di revisione del piano stesso.

---

## 2. Retry e Fallback: la prima linea di difesa

Per gli **errori di strumento**, la strategia più diretta — già introdotta in forma semplice nella Lezione 4.1 con l'exponential backoff — è il **retry**: ritentare l'operazione fallita, eventualmente con un'attesa crescente tra i tentativi.

Quando il retry esaurisce i propri tentativi senza successo, entra in gioco il **fallback**: una strategia alternativa che permette al sistema di continuare a funzionare, anche con informazioni o capacità ridotte, invece di fallire completamente.

```python
import time

def chiama_strumento_con_resilienza(funzione_strumento, parametri,
                                      tentativi_massimi=3,  # 3 tentativi è il punto dove il tempo di attesa totale (con backoff esponenziale: 1s + 2s + 4s = 7s) supera la soglia di tolleranza di un utente medio. Aumenta solo per operazioni batch non interattive.
                                      funzione_fallback=None):
    """
    Esegue uno strumento con retry automatico e fallback opzionale.
    """
    for tentativo in range(tentativi_massimi):
        try:
            return funzione_strumento(**parametri)
        except Exception as errore:
            attesa = 2 ** tentativo
            print(f"[RETRY] Tentativo {tentativo + 1} fallito: {errore}. "
                  f"Riprovo in {attesa}s...")
            time.sleep(attesa)

    # Tutti i tentativi sono falliti: FALLBACK
    if funzione_fallback:
        print("[FALLBACK] Uso strategia alternativa.")
        return funzione_fallback(**parametri)

    # Nessun fallback disponibile: fallimento esplicito
    raise RuntimeError(
        f"Strumento fallito dopo {tentativi_massimi} tentativi, "
        f"nessun fallback disponibile."
    )


# Esempio di utilizzo con un fallback concreto:
def cerca_prezzo_aggiornato(prodotto: str) -> dict:
    """Strumento primario: ricerca in tempo reale."""
    # In un caso reale, qui ci sarebbe una chiamata API esterna
    raise ConnectionError("Servizio prezzi non disponibile")

def usa_prezzo_da_cache(prodotto: str) -> dict:
    """Fallback: usa un'ultima copia salvata, anche se non recentissima."""
    return {"prezzo": 49.99, "fonte": "cache locale", "aggiornato": False}

risultato = chiama_strumento_con_resilienza(
    cerca_prezzo_aggiornato,
    {"prodotto": "Prodotto X"},
    funzione_fallback=usa_prezzo_da_cache
)
```

Nota che il fallback restituisce un risultato **esplicitamente marcato** come proveniente da una fonte diversa (`"fonte": "cache locale", "aggiornato": False`) — questa trasparenza è essenziale: l'agente (e, in ultima analisi, l'utente) deve poter sapere che l'informazione ricevuta è un compromesso, non il dato primario richiesto in origine.

---

## 3. Il Circuit Breaker: prevenire il sovraccarico di un servizio in difficoltà

Un pattern più sofisticato, mutuato dall'ingegneria del software tradizionale, è il **circuit breaker** (interruttore di circuito): se uno strumento fallisce ripetutamente in un breve periodo, il sistema "apre il circuito" e **smette temporaneamente di tentare quella chiamata**, invece di continuare a provare (e fallire) ripetutamente, sovraccaricando inutilmente un servizio già in difficoltà.

```
STATO CHIUSO (normale)
  Le chiamate allo strumento procedono normalmente
         │
         ▼ (troppi fallimenti consecutivi)
STATO APERTO
  Le chiamate vengono BLOCCATE immediatamente,
  senza nemmeno tentare — si usa subito il fallback
  o si segnala un errore, per un periodo di "raffreddamento"
         │
         ▼ (dopo il periodo di raffreddamento)
STATO SEMI-APERTO
  Si tenta UNA chiamata di prova
         │
    ┌────┴────┐
    ▼         ▼
 successo   fallimento
    │         │
    ▼         ▼
 CHIUSO    APERTO
(torna     (resta bloccato,
normale)    nuovo raffreddamento)
```

Questo pattern è particolarmente importante in sistemi multi-agente (Lezione 5.4) dove un singolo strumento può essere chiamato da più agenti contemporaneamente: senza un circuit breaker, un servizio esterno in difficoltà potrebbe essere sommerso da tentativi di retry provenienti da ogni agente, aggravando ulteriormente il problema invece di lasciarlo recuperare.

---

## 4. Graceful Degradation: fallire in modo controllato

Il principio di **graceful degradation** (degradazione controllata), già menzionato nella Lezione 4.2 a proposito degli output parser, va ora generalizzato a livello di intero sistema agentivo: quando una componente fallisce e nessun fallback è in grado di sostituirla completamente, il sistema deve **comunicare chiaramente i propri limiti**, invece di produrre un risultato silenziosamente incompleto o, peggio, inventato.

```python
def agente_con_degradazione_controllata(domanda: str) -> dict:
    """
    Un agente che, in caso di fallimento di componenti critiche,
    comunica esplicitamente i propri limiti invece di
    'fingere' un risultato completo.
    """
    risultato = {"risposta": None, "limitazioni": [], "completo": True}

    try:
        dati_realtime = cerca_dati_in_tempo_reale(domanda)
    except Exception:
        risultato["limitazioni"].append(
            "Dati in tempo reale non disponibili: la risposta "
            "potrebbe basarsi su informazioni non aggiornate."
        )
        dati_realtime = None
        risultato["completo"] = False

    risultato["risposta"] = genera_risposta(domanda, dati_realtime)
    return risultato
```

Questo approccio — restituire sempre, insieme alla risposta, un'indicazione esplicita di eventuali limitazioni — è precisamente il tipo di onestà sui propri limiti che, ricordando la Lezione 3.2 (RLHF), un buon assistente AI dovrebbe avere anche a livello di singola risposta testuale; qui lo applichiamo a livello di **architettura del sistema**, rendendolo un comportamento garantito dal codice, non solo sperato dal comportamento del modello.

---

## 5. Logging e Tracing: rendere visibile cosa sta facendo un agente

Tutta la gestione degli errori descritta finora è inutile se non si ha **visibilità** su cosa è effettivamente accaduto durante l'esecuzione di un agente. Il **logging** (registrazione di eventi) e il **tracing** (tracciamento dettagliato dell'intero percorso di esecuzione) sono le pratiche che rendono questa visibilità possibile.

```python
import logging
import json
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("agente")

def esegui_agente_osservabile(obiettivo: str, max_iterazioni: int = 5) -> str:
    """
    Estende il loop agentivo della Lezione 5.1 con logging
    strutturato a ogni fase del ciclo.
    """
    client = anthropic.Anthropic()
    messaggi = [{"role": "user", "content": obiettivo}]

    logger.info(json.dumps({
        "evento": "inizio_esecuzione",
        "obiettivo": obiettivo,
        "timestamp": datetime.now().isoformat()
    }))

    for iterazione in range(max_iterazioni):
        risposta = client.messages.create(
            model="claude-sonnet-4-6", max_tokens=1024,
            tools=DEFINIZIONI_STRUMENTI, messages=messaggi
        )

        logger.info(json.dumps({
            "evento": "iterazione_completata",
            "numero_iterazione": iterazione,
            "stop_reason": risposta.stop_reason,
            "token_usati": risposta.usage.output_tokens
        }))

        messaggi.append({"role": "assistant", "content": risposta.content})

        if risposta.stop_reason != "tool_use":
            logger.info(json.dumps({"evento": "esecuzione_completata"}))
            return risposta.content[0].text

        # ... gestione strumenti come nella Lezione 5.1 ...

    logger.warning(json.dumps({
        "evento": "limite_iterazioni_raggiunto",
        "obiettivo": obiettivo
    }))
    return "Limite di iterazioni raggiunto."
```

Nota la scelta di registrare i log in **formato strutturato** (JSON), riprendendo direttamente il principio della Lezione 4.2: un log strutturato può essere interrogato, filtrato, e analizzato automaticamente — ad esempio, per scoprire quante esecuzioni raggiungono il limite di iterazioni, o qual è il consumo medio di token per tipo di richiesta — invece di restare testo grezzo difficile da analizzare su larga scala.

> **Perché questo conta enormemente nel Capitolo 7:** quando parleremo di valutazione dei workflow nella Lezione 7.5, questi stessi log strutturati saranno la materia prima su cui costruire metriche, dashboard, e test di regressione. L'osservabilità non è un accessorio: è l'infrastruttura di dati su cui si basa ogni miglioramento futuro del sistema.

---

## Esempio Pratico: Diagnosticare un Problema da un Log

Immagina di osservare questa sequenza di log, prodotta da un agente in produzione:

```json
{"evento": "iterazione_completata", "numero_iterazione": 0, "stop_reason": "tool_use"}
{"evento": "iterazione_completata", "numero_iterazione": 1, "stop_reason": "tool_use"}
{"evento": "iterazione_completata", "numero_iterazione": 2, "stop_reason": "tool_use"}
{"evento": "iterazione_completata", "numero_iterazione": 3, "stop_reason": "tool_use"}
{"evento": "limite_iterazioni_raggiunto"}
```

Cosa puoi dedurre, solo da questi log, senza nemmeno guardare il contenuto specifico delle chiamate? Il fatto che **ogni singola iterazione** abbia richiesto uno strumento (`stop_reason: tool_use`), senza mai arrivare a una risposta finale, è un segnale fortemente indicativo del problema di **loop** descritto nella Sezione 1 — l'agente non sta convergendo verso una conclusione. Questo tipo di diagnosi rapida, possibile solo grazie alla strutturazione dei log, è esattamente il valore pratico dell'osservabilità: identificare la categoria del problema prima ancora di analizzarne i dettagli specifici.

---

## Riepilogo

- I sistemi agentivi incontrano quattro categorie distinte di errore: **errori di strumento**, **loop**, **allucinazioni**, **errori di piano**, ciascuna con una strategia di gestione appropriata diversa.
- **Retry** (ritentare con attesa crescente) e **fallback** (strategia alternativa esplicitamente marcata come tale) sono la prima linea di difesa contro errori di strumento temporanei.
- Il **circuit breaker** previene il sovraccarico di un servizio già in difficoltà, bloccando temporaneamente le chiamate dopo fallimenti ripetuti.
- La **graceful degradation** richiede che un sistema comunichi esplicitamente i propri limiti quando una componente fallisce, invece di produrre un risultato silenziosamente incompleto.
- **Logging strutturato** e **tracing** rendono osservabile il comportamento di un agente, permettendo diagnosi rapide e fornendo la base dati per la valutazione e il miglioramento futuro del sistema.

---

## Domande di Verifica

1. Un agente multi-agente (Lezione 5.4) ha un nodo che chiama frequentemente un servizio esterno ora in down per manutenzione programmata. Spiega perché un circuit breaker sarebbe preferibile al solo retry con backoff in questo scenario specifico.

2. Riprendi l'esempio di codice della Sezione 4 (`agente_con_degradazione_controllata`). Perché restituire un dizionario con il campo `"limitazioni"` è una scelta migliore, dal punto di vista dell'utente finale, rispetto a fallire silenziosamente e mostrare comunque solo `risultato["risposta"]`?

3. Nell'esempio pratico della Sezione finale, i log mostrano 4 iterazioni che richiedono sempre uno strumento. Quale altra informazione, se fosse presente nei log, ti aiuterebbe a distinguere un loop "innocuo" (l'agente sta semplicemente eseguendo un compito che richiede molti passi legittimi) da un loop "problematico" (l'agente è bloccato, senza progresso reale)?

---

## Esercizi Pratici

> Tre esercizi a difficoltà crescente. Prova a risolverli da solo prima di aprire la soluzione.

### Esercizio 1 — Ogni errore, la sua strategia 🟢 Base

Associa ogni tipo di errore alla strategia di gestione più appropriata: (a) errore di strumento (timeout di rete), (b) loop, (c) allucinazione, (d) errore di piano.

<details>
<summary>💡 Mostra soluzione</summary>

- **(a) errore di strumento** → **retry** (con backoff) ed eventuale **fallback**.
- **(b) loop** → **limiti** (`max_iterazioni`) e **rilevamento di pattern ripetitivi**.
- **(c) allucinazione** → **verifica e ancoraggio ai dati** (principio del RAG, Lezione 4.3).
- **(d) errore di piano** → **intervento umano** (Lezione 7.4) o **revisione del piano**.

Lezione chiave: non esiste una soluzione unica. Classificare correttamente il tipo di errore è il primo passo per scegliere la difesa giusta.

</details>

### Esercizio 2 — Circuit breaker vs retry 🟡 Intermedio

Un servizio esterno è in down per manutenzione programmata. Più agenti continuano a chiamarlo. Perché il solo retry con backoff non basta, e cosa aggiunge un circuit breaker?

<details>
<summary>💡 Mostra soluzione</summary>

**Perché il solo retry non basta:** se il servizio è *davvero* giù, ogni agente continua a ritentare (anche con backoff), sommando tentativi inutili. In un sistema multi-agente, decine di agenti che ritentano **sovraccaricano** un servizio già in difficoltà, rallentandone il recupero.

**Cosa aggiunge il circuit breaker:** dopo troppi fallimenti consecutivi, "apre il circuito" e **smette di tentare** per un periodo di raffreddamento — usando subito il fallback o segnalando errore, senza nemmeno provare. Dopo il raffreddamento, prova *una* chiamata di test (semi-aperto): se riesce, torna normale; se no, resta bloccato. Così protegge il servizio e libera risorse, invece di accanirsi.

</details>

### Esercizio 3 — Diagnosi dai log e degradazione controllata 🔴 Avanzato

(a) I log mostrano 4 iterazioni consecutive con `stop_reason: tool_use` e poi `limite_iterazioni_raggiunto`. Cosa sospetti? Quale dato aggiuntivo distinguerebbe un loop "problematico" da uno legittimo? (b) Perché restituire un campo `"limitazioni"` è meglio che fallire in silenzio?

<details>
<summary>💡 Mostra soluzione</summary>

**(a) Diagnosi:** probabile **loop** — l'agente richiede sempre uno strumento senza mai convergere a una risposta finale. Dato aggiuntivo utile: **quale strumento e con quali parametri** a ogni iterazione. Se sono *sempre gli stessi*, è un loop problematico (nessun progresso); se sono strumenti/parametri *diversi*, potrebbe essere un compito legittimo che richiede molti passi (basterebbe alzare `max_iterazioni`). Anche loggare un riassunto del risultato di ogni strumento aiuterebbe a vedere se c'è progresso.

**(b) Graceful degradation:** restituire `"limitazioni"` rende **esplicito** all'utente che la risposta è un compromesso (es. dati non aggiornati perché il servizio realtime era down). Fallire in silenzio e mostrare solo la risposta darebbe l'illusione di un risultato completo e affidabile quando non lo è — pericoloso. La trasparenza sui limiti è onestà resa garanzia *del codice*, non lasciata al comportamento del modello.

</details>

---

## Connessioni

**Viene da:** Lezione 4.1 (exponential backoff), Lezione 5.1 (max_iterazioni), Lezione 5.2 (problema del loop) — questa lezione raccoglie e sistematizza precauzioni introdotte in forma semplice nelle lezioni precedenti.

**Porta a:** Capitolo 6 (L'Agent Package) — un agente robusto, con gestione degli errori e logging ben progettati, è precisamente ciò che merita di essere impacchettato secondo gli standard professionali che vedremo in quel capitolo.

**Ritroverai questi concetti in:** Lezione 7.5 (Valutazione dei Workflow) — i log strutturati qui introdotti sono la materia prima per le metriche e i test di regressione di quella lezione. Lezione 8.1 (Self-Reflection) — il principio di un agente che riconosce e comunica i propri limiti, qui applicato a livello di gestione degli errori, anticipa il concetto più ampio di un agente che valuta criticamente il proprio stesso comportamento.

---

**CHIUSURA DEL CAPITOLO 5.** Con questa lezione si conclude l'intera architettura concettuale degli agenti: cosa sono (5.1), come ragionano in modo osservabile (5.2), come si coordinano tramite un orchestratore (5.3), quali topologie può assumere un sistema multi-agente (5.4), e come si rendono robusti e osservabili (5.5). Il Capitolo 6 affronta ora la dimensione che trasforma questi pattern architetturali in pratica professionale: come impacchettare un agente in file, contratti e artefatti strutturati, pronti per essere mantenuti, versionati, e fatti evolvere nel tempo da un team, non solo da un singolo script.
