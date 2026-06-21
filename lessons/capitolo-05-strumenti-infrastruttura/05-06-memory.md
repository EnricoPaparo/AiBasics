---
id: "04-06"
titolo: "Memory nei sistemi AI: breve e lungo termine"
sottotitolo: "L'ultimo mattone prima degli agenti: come un sistema 'ricorda' nel tempo"
capitolo: 4
capitolo_titolo: "Strumenti e Infrastruttura per Sistemi AI"
lezione: 6
durata_stimata: "60 minuti"
difficolta: "intermedio"
prerequisiti: ["04-03", "04-04"]
concetti_chiave:
  - memoria in-context
  - memoria esterna
  - memoria episodica
  - memoria semantica
  - summarization
  - sliding window
obiettivi:
  - "Distinguere i quattro tipi di memoria in un sistema AI"
  - "Spiegare come si implementa memoria persistente oltre il context window"
  - "Descrivere tecniche di compressione della cronologia conversazionale"
  - "Valutare quando la memoria aggiunge valore e quando introduce rischi"
stato: "pubblicata"
versione: "1.0"
---

# Memory nei sistemi AI: breve e lungo termine

## Introduzione

Chiudiamo il Capitolo 4 — e con esso l'intera infrastruttura tecnica necessaria prima di poter parlare seriamente di agenti — affrontando un problema che abbiamo incontrato, in forme diverse, fin dall'inizio del corso: la **memoria**. L'avevamo vista nella Lezione 1.3 a proposito dei cookie nei siti dinamici, nella Lezione 3.3 a proposito dei turni conversazionali e del context window, e nella Lezione 3.5 come limite strutturale: il modello, di per sé, non ha memoria persistente tra le chiamate.

Questa lezione sistematizza tutto questo in un quadro coerente, e introduce le tecniche concrete con cui i sistemi AI costruiscono qualcosa che si comporta come memoria, pur partendo da un modello fondamentalmente stateless. È l'ultimo passaggio infrastrutturale prima del Capitolo 5: un agente che non ricorda nulla di ciò che ha fatto nei passi precedenti del proprio compito non potrebbe svolgere alcun compito che richieda più di un singolo passaggio — e vedremo che quasi nessun compito interessante si risolve in un solo passaggio.

---

## Obiettivi di Apprendimento

Al termine di questa lezione sarai in grado di:

- Distinguere i quattro tipi di memoria rilevanti in un sistema AI: in-context, esterna, episodica, semantica
- Spiegare come si implementa memoria persistente che va oltre i limiti del context window
- Descrivere tecniche di compressione e riassunto della cronologia conversazionale
- Valutare quando la memoria aggiunge valore concreto e quando introduce rischi di coerenza o privacy

---

## 1. I quattro tipi di memoria in un sistema AI

Il termine "memoria", applicato ai sistemi AI, copre in realtà concetti tecnicamente distinti, ciascuno con uno scopo e un'implementazione diversa. Distinguerli con precisione è essenziale per progettare correttamente un sistema.

```
┌────────────────────────────────────────────────────────┐
│  MEMORIA IN-CONTEXT                                       │
│  La cronologia della conversazione corrente, rinviata      │
│  a ogni chiamata (Lezione 3.3). Esiste solo durante         │
│  la sessione attiva, limitata dal context window.          │
├────────────────────────────────────────────────────────┤
│  MEMORIA ESTERNA (persistente)                             │
│  Dati salvati in un database o file, che sopravvivono       │
│  oltre la singola sessione. Es: preferenze utente,           │
│  cronologia di conversazioni passate, salvate per essere     │
│  recuperate in futuro.                                       │
├────────────────────────────────────────────────────────┤
│  MEMORIA EPISODICA                                           │
│  Il ricordo di EVENTI specifici: "la settimana scorsa        │
│  l'utente ha chiesto X e la risposta è stata Y".              │
│  Riguarda esperienze passate, concrete e situate nel tempo.   │
├────────────────────────────────────────────────────────┤
│  MEMORIA SEMANTICA                                            │
│  Conoscenza GENERALE accumulata, non legata a un evento       │
│  specifico: "l'utente preferisce risposte concise",            │
│  "l'utente lavora nel settore finanziario". Fatti distillati   │
│  da molte interazioni, non il ricordo di una singola di esse.  │
└────────────────────────────────────────────────────────┘
```

> **Un parallelo utile con la memoria umana:** la memoria episodica umana è quella che ti permette di ricordare "ieri ho cenato in quel ristorante e il servizio è stato lento" — un evento specifico. La memoria semantica è quella che ti fa sapere, in generale, "i ristoranti affollati il sabato sera tendono ad avere servizio più lento" — una conoscenza generale, distillata da molte esperienze, senza che tu debba ricordare ogni singola cena che ha contribuito a formarla. I sistemi AI distinguono questi stessi due tipi di "ricordo" per ragioni progettuali molto simili a quelle umane.

---

## 2. Il problema del context window, ripreso e risolto in pratica

Avevamo descritto, nella Lezione 3.3, il limite tecnico del context window: superata una certa lunghezza di conversazione, semplicemente non c'è più spazio per inviare tutta la cronologia al modello. Questa lezione affronta concretamente come si gestisce questo limite in un sistema reale.

### Strategia 1: Sliding Window (finestra scorrevole)

La strategia più semplice consiste nel mantenere solo gli **ultimi N messaggi** della conversazione, scartando progressivamente quelli più vecchi.

```
Conversazione con 50 messaggi totali

Sliding window di 10 messaggi:
[messaggi 41-50] → questi vengono inviati al modello
[messaggi 1-40]  → scartati, non più disponibili
                    al modello in questa chiamata
```

Questa strategia è semplice da implementare, ma ha un limite evidente: se l'utente fa riferimento a qualcosa detto molto all'inizio della conversazione (oltre la finestra), il modello non avrà più alcuna informazione su quel contenuto, e potrebbe rispondere in modo incoerente o chiedere nuovamente informazioni già fornite.

> **Limite critico della sliding window**: se l'utente fa riferimento a qualcosa fuori dalla finestra ("come quello che ti ho detto la settimana scorsa" o "ricordi quando abbiamo discusso del progetto X?"), il sistema semplicemente non lo trova e risponde in modo incoerente — spesso senza nemmeno segnalare all'utente che le informazioni non sono disponibili. Soluzione: mantieni un **indice delle entità chiave** menzionate dall'utente (nomi, preferenze espresse, decisioni prese, vincoli dichiarati) in una struttura separata dalla cronologia cronologica. Questo indice cresce nel tempo ma rimane compatto (solo entità, non l'intera conversazione), e le informazioni importanti non vengono perse anche se la conversazione è molto lunga. Quando l'utente fa riferimento a un'entità, la si recupera dall'indice indipendentemente da quando è stata menzionata.

### Strategia 2: Summarization progressiva (riassunto progressivo)

Una strategia più sofisticata consiste nell'usare il modello stesso (con una chiamata API dedicata, come visto nella Lezione 4.1) per **riassumere periodicamente** la parte più vecchia della conversazione, mantenendo nel contesto un riassunto compatto invece della cronologia integrale.

```
1. La conversazione raggiunge una certa lunghezza

2. Si invia al modello una richiesta dedicata:
   "Riassumi i punti chiave di questa conversazione
    in massimo 200 parole"

3. Il riassunto generato SOSTITUISCE i messaggi
   più vecchi nel contesto inviato nelle chiamate
   successive

4. Il contesto inviato al modello diventa:
   [Riassunto compatto dei primi 40 messaggi]
   + [ultimi 10 messaggi originali, non riassunti]
```

Questa tecnica permette di "comprimere" informazioni che altrimenti occuperebbero molto spazio nel context window, preservando i punti essenziali a un costo (in token) molto inferiore. Il compromesso, naturalmente, è che un riassunto perde inevitabilmente alcuni dettagli specifici della conversazione originale.

### Strategia 3: Memoria esterna con recupero selettivo

Una terza strategia, concettualmente più vicina a RAG (Lezione 4.3), consiste nel salvare l'intera cronologia in una memoria esterna persistente (un database, eventualmente con embedding per la ricerca semantica), e **recuperare solo le porzioni rilevanti** per la domanda attuale, invece di mantenere tutto nel context window in ogni momento.

```
Cronologia completa salvata esternamente
(es. in un vector database, Lezione 4.3)
              │
              ▼
Domanda attuale dell'utente
              │
              ▼
Ricerca per similarità semantica: quali porzioni
della cronologia passata sono effettivamente
rilevanti per QUESTA domanda specifica?
              │
              ▼
Solo queste porzioni rilevanti vengono incluse
nel contesto inviato al modello
```

Questa è, in sostanza, l'applicazione del principio RAG non a documenti esterni generici, ma alla **cronologia stessa della conversazione** — un'idea che ritroveremo, formalizzata con maggiore rigore, quando parleremo di memoria episodica degli agenti nel Capitolo 8.

---

## 3. Memoria persistente tra sessioni diverse

Tutto quanto descritto finora riguarda la gestione della memoria **all'interno di una singola sessione** di conversazione. Ma molti sistemi AI reali — incluso, presumibilmente, qualsiasi prodotto che usi regolarmente — mantengono memoria anche **tra sessioni diverse**: l'assistente "ricorda" qualcosa che hai detto settimane prima, in una conversazione completamente diversa.

Questo richiede necessariamente una **memoria esterna** (Sezione 1), salvata in un database che sopravvive alla chiusura della sessione attiva. Il flusso tipico è:

```
1. Durante una conversazione, alcune informazioni
   ritenute rilevanti vengono ESTRATTE e salvate
   esternamente (es. "l'utente lavora come avvocato",
   "l'utente preferisce risposte concise")

2. In una conversazione FUTURA, completamente nuova,
   queste informazioni salvate vengono recuperate
   e inserite nel contesto iniziale, PRIMA che
   l'utente scriva il primo messaggio

3. Il modello, fin dal primo turno della nuova
   conversazione, ha già accesso a queste
   informazioni di sfondo, pur non avendo mai
   "visto" la conversazione originale in cui
   sono state raccolte
```

Questo meccanismo — qui descritto in modo semplificato — è precisamente il principio su cui si basano i sistemi di memoria a lungo termine dei prodotti AI più avanzati, ed è anche un'anticipazione diretta e dichiarata del problema del **riassorbimento della conoscenza** che affronteremo formalmente nella Lezione 8.3, parlando di sistemi che migliorano accumulando esperienza nel tempo.

---

## Memoria Persistente tra Sessioni

### Il problema: il contesto svanisce alla chiusura della sessione

La sezione precedente ha descritto il flusso concettuale della memoria tra sessioni. Ma c'è un problema pratico immediato che chiunque costruisce un sistema reale si trova ad affrontare: se l'utente torna domani, il contesto è completamente perso. Il modello, stateless per costruzione (Lezione 3.5), non ricorda nulla di ciò che è stato detto nella sessione precedente — a meno che quella cronologia non venga salvata da qualche parte e ricaricata esplicitamente all'avvio della nuova sessione.

### Soluzione concreta: salvare e ricaricare la cronologia con SQLite

La soluzione più diretta è salvare la lista dei messaggi in un database locale al termine di ogni sessione, e ricaricarla all'inizio della successiva. SQLite è la scelta naturale per applicazioni monoutente o prototipi: è un file unico, non richiede un server, e Python lo include nella libreria standard.

```python
import sqlite3
import json

def salva_conversazione(session_id: str, messaggi: list[dict]) -> None:
    """Salva la cronologia della conversazione su SQLite."""
    with sqlite3.connect("memoria.db") as conn:
        conn.execute(
            "CREATE TABLE IF NOT EXISTS sessioni "
            "(session_id TEXT PRIMARY KEY, messaggi TEXT)"
        )
        conn.execute(
            "INSERT OR REPLACE INTO sessioni VALUES (?, ?)",
            (session_id, json.dumps(messaggi, ensure_ascii=False))
        )

def carica_conversazione(session_id: str) -> list[dict]:
    """Ricarica la cronologia di una sessione precedente."""
    with sqlite3.connect("memoria.db") as conn:
        row = conn.execute(
            "SELECT messaggi FROM sessioni WHERE session_id = ?",
            (session_id,)
        ).fetchone()
    return json.loads(row[0]) if row else []
```

Se preferisci evitare SQLite, un file JSON è l'alternativa più semplice: `json.dump(messaggi, open(f"{session_id}.json", "w"))` per salvare, `json.load(open(...))` per ricaricare. È meno robusto (niente transazioni, niente query), ma sufficiente per prototipare.

### Limitazione pratica importante: non puoi rimandare tutta la cronologia

Ricaricare e rispedire all'intero la cronologia di sessioni passate è quasi sempre un errore: dopo poche sessioni accumuli migliaia di token, si esaurisce rapidamente la finestra di contesto (Lezione 04-06), e i costi API aumentano a ogni chiamata. La soluzione corretta è non spedire tutta la cronologia, ma un **riassunto** di essa.

Il pattern standard combina due elementi:

1. **Ultime N interazioni** dalla sessione corrente, in forma integrale — perché il contesto immediato è prezioso per dettaglio e coerenza.
2. **Riassunto delle sessioni precedenti**, prodotto dal modello stesso con una chiamata dedicata — comprime centinaia di turni in pochi paragrafi.

```python
def prepara_contesto_con_riassunto(
    session_id: str,
    messaggi_correnti: list[dict],
    n_recenti: int = 10
) -> list[dict]:
    """
    Combina un riassunto delle sessioni passate con
    le ultime N interazioni della sessione corrente.
    """
    cronologia_passata = carica_conversazione(session_id)

    contesto = []

    if cronologia_passata:
        # Chiediamo al modello di riassumere le sessioni passate
        testo_da_riassumere = "\n".join(
            f"{m['role']}: {m['content']}" for m in cronologia_passata
        )
        # Questa chiamata API produce il riassunto
        # (qui semplificata; nella pratica usa il tuo client LLM)
        riassunto = chiedi_riassunto_al_modello(testo_da_riassumere)
        contesto.append({
            "role": "system",
            "content": f"Riassunto delle sessioni precedenti:\n{riassunto}"
        })

    # Aggiunge le ultime N interazioni in forma integrale
    contesto.extend(messaggi_correnti[-n_recenti:])
    return contesto
```

Questo pattern — riassunto delle sessioni precedenti più ultime interazioni integrali — è la base di quasi tutti i sistemi di memoria persistente in produzione. Ritroverai questa struttura formalizzata quando, nel Capitolo 8, parleremo di agenti che accumulano esperienza nel tempo.

---

## 4. Quando la memoria è utile, e quando diventa un problema

Seguendo lo spirito di valutazione equilibrata di questo corso, è importante riconoscere che la memoria persistente non è automaticamente un beneficio in ogni circostanza.

**Benefici concreti:**
- Evita di dover ripetere informazioni già fornite, migliorando l'esperienza dell'utente
- Permette personalizzazione progressiva del comportamento del sistema
- Consente compiti che si estendono naturalmente su più sessioni (es. un progetto di scrittura seguito nel tempo)

**Rischi concreti:**
- **Coerenza**: se la memoria salvata diventa obsoleta (es. "l'utente lavora come avvocato" non è più vero, ma il sistema continua a usare questa informazione), il comportamento del sistema può diventare inappropriato o fuorviante
- **Privacy**: salvare informazioni personali su un utente, anche con buone intenzioni, comporta responsabilità significative sulla gestione, sicurezza, e cancellabilità di quei dati
- **Costo e complessità**: ogni meccanismo di memoria aggiunge un livello di infrastruttura (database, logica di estrazione, logica di recupero) che deve essere progettato, mantenuto, e monitorato

> **Perché questa valutazione equilibrata conta per il resto del corso:** quando, nella Lezione 6.3, parleremo di Agent Card e di come un agente dichiara le proprie capacità, e quando, nel Capitolo 8, parleremo di sistemi che accumulano conoscenza nel tempo, questa stessa tensione tra beneficio e rischio tornerà costantemente. La memoria non è "sempre meglio averne di più" — è una risorsa progettuale che richiede scelte deliberate su cosa salvare, per quanto tempo, e con quali garanzie di correttezza e sicurezza.

---

## Esempio Pratico: Progettare la Memoria per un Caso d'Uso Specifico

Immagina di dover progettare la memoria per un assistente AI di supporto allo studio, usato dallo stesso studente nel corso di un intero anno scolastico. Applichiamo le distinzioni di questa lezione:

```
MEMORIA IN-CONTEXT (durante una singola sessione di studio):
La cronologia della sessione corrente — le domande fatte
e le spiegazioni fornite in QUESTA specifica sessione

MEMORIA EPISODICA (eventi specifici nel tempo):
"Il 15 marzo, lo studente ha avuto difficoltà con le
equazioni di secondo grado e abbiamo rivisto l'argomento
insieme per 20 minuti"

MEMORIA SEMANTICA (conoscenza generale accumulata):
"Lo studente tende ad avere difficoltà con argomenti di
algebra, ma è molto a suo agio con la geometria"
(questa conoscenza generale emerge da MOLTI episodi
specifici nel tempo, distillati in un pattern generale)

MEMORIA ESTERNA (infrastruttura):
Un database che salva sia gli episodi specifici sia
le sintesi semantiche, recuperabile a ogni nuova sessione,
anche mesi dopo
```

Questo esercizio di progettazione — distinguere chiaramente cosa salvare, a quale livello di dettaglio, e con quale scopo — è precisamente il tipo di pensiero architetturale che applicherai costruendo agenti reali, a partire dal prossimo capitolo.

---

## Riepilogo

- Un sistema AI distingue tipicamente quattro tipi di memoria: **in-context** (cronologia della sessione attiva), **esterna** (persistente oltre la sessione), **episodica** (eventi specifici nel tempo), **semantica** (conoscenza generale distillata da molti episodi).
- Per gestire i limiti del context window all'interno di una sessione, le strategie principali sono **sliding window** (mantieni solo gli ultimi messaggi), **summarization progressiva** (riassumi la parte più vecchia), e **memoria esterna con recupero selettivo** (applicazione del principio RAG alla cronologia stessa).
- La memoria persistente tra sessioni diverse richiede di estrarre, salvare esternamente, e recuperare informazioni rilevanti prima che una nuova conversazione inizi.
- La memoria non è un beneficio automatico: comporta rischi di **coerenza** (informazioni obsolete), **privacy** (gestione di dati personali), e **costo/complessità** infrastrutturale, che richiedono scelte progettuali deliberate.

---

## Domande di Verifica

1. Spiega la differenza tra memoria episodica e memoria semantica usando un esempio diverso da quello dato nella lezione (lo studio) e da quello dato nel parallelo umano (i ristoranti).

2. Un sistema di summarization progressiva riassume automaticamente le parti più vecchie di una conversazione molto lunga. Quale tipo di informazione rischia di perdersi in questo processo, e in quali circostanze questa perdita potrebbe essere problematica?

3. Immagina un assistente AI che ha salvato, mesi fa, l'informazione "l'utente è vegetariano" nella propria memoria esterna. L'utente, in una nuova conversazione, chiede una ricetta di pollo. Cosa dovrebbe fare un sistema ben progettato in questa situazione di apparente contraddizione tra memoria salvata e richiesta attuale?

---

## Esercizi Pratici

> Tre esercizi a difficoltà crescente. Prova a risolverli da solo prima di aprire la soluzione.

### Esercizio 1 — I quattro tipi di memoria 🟢 Base

Associa ogni descrizione al tipo di memoria (**in-context**, **esterna**, **episodica**, **semantica**): (a) "il 3 maggio l'utente ha chiesto aiuto sulle derivate", (b) la cronologia della sessione attuale rinviata a ogni chiamata, (c) "l'utente preferisce risposte brevi", (d) dati salvati in un database che sopravvivono alla sessione.

<details>
<summary>💡 Mostra soluzione</summary>

- **(a)** → **episodica**: ricordo di un *evento specifico* situato nel tempo.
- **(b)** → **in-context**: la cronologia della sessione attiva, limitata dal context window.
- **(c)** → **semantica**: conoscenza *generale* distillata da molte interazioni, non un singolo evento.
- **(d)** → **esterna**: persistenza oltre la singola sessione (l'infrastruttura su cui poggiano episodica e semantica a lungo termine).

Nota: episodica = "cosa è successo"; semantica = "cosa ho imparato in generale".

</details>

### Esercizio 2 — Scegli la strategia 🟡 Intermedio

Una conversazione supera il context window. Tra **sliding window**, **summarization progressiva** e **memoria esterna con recupero**, quale sceglieresti se è importante non perdere mai dettagli citati all'inizio? Cosa rischia invece di perdere la summarization?

<details>
<summary>💡 Mostra soluzione</summary>

Se è cruciale non perdere dettagli iniziali, la scelta migliore è la **memoria esterna con recupero selettivo**: l'intera cronologia resta salvata e si recuperano (per similarità semantica, come in RAG) proprio le porzioni rilevanti per la domanda attuale — anche se sono all'inizio.

- **Sliding window** scarterebbe i messaggi vecchi → perderebbe quei dettagli.
- **Summarization** li comprime → rischia di perdere **dettagli specifici** (numeri esatti, nomi, eccezioni) che il riassunto non conserva. Problematico quando una risposta futura dipende proprio da un dettaglio minore detto all'inizio.

</details>

### Esercizio 3 — Memoria che contraddice la richiesta 🔴 Avanzato

Mesi fa il sistema ha salvato "l'utente è vegetariano". Ora l'utente chiede una ricetta di pollo. Cosa dovrebbe fare un sistema ben progettato? Collega la risposta ai rischi della memoria persistente.

<details>
<summary>💡 Mostra soluzione</summary>

Un sistema ben progettato **non dovrebbe rifiutare né ignorare la richiesta attuale** basandosi su una memoria potenzialmente obsoleta. La richiesta esplicita e attuale dell'utente ha la **priorità** su una preferenza salvata in passato. Comportamenti ragionevoli:
- Fornire la ricetta richiesta.
- Eventualmente segnalare con tatto la nota in memoria ("Avevo memorizzato una preferenza vegetariana — la aggiorno?"), dando all'utente il controllo.

**Collegamento ai rischi:**
- **Coerenza:** la memoria può diventare **obsoleta** (la persona è cambiata). Trattarla come verità assoluta produce comportamenti inappropriati.
- **Privacy/controllo:** l'utente dovrebbe poter vedere, correggere e cancellare ciò che è stato salvato.

Lezione: la memoria è un *suggerimento di contesto*, non un vincolo rigido. "Più memoria" non è sempre meglio — va gestita con priorità chiare e possibilità di aggiornamento.

</details>

---

## Connessioni

**Viene da:** Lezione 3.3 (context window) e Lezione 3.5 (statelessness del modello) — questa lezione fornisce le soluzioni tecniche concrete ai problemi lì identificati. Lezione 4.3 (RAG) — il principio di recupero selettivo per similarità si applica qui alla cronologia conversazionale stessa.

**Porta a:** Capitolo 5 (Agenti AI) — un agente che deve eseguire compiti complessi, articolati su più passaggi, dipende criticamente dalla capacità di "ricordare" cosa ha già fatto nei passaggi precedenti: la memoria in-context, qui descritta, è precisamente il meccanismo che rende possibile questa continuità all'interno di un singolo compito agentivo.

**Ritroverai questi concetti in:** Lezione 6.2 (L'Agent Package) — la cartella `memory/` di un agente professionale formalizza esattamente le strategie descritte in questa lezione. Lezione 8.3 (Riassorbimento della Conoscenza) — la distinzione tra memoria episodica e semantica, qui introdotta, è il fondamento concettuale per capire come un sistema agentivo trasforma esperienze specifiche in conoscenza generale che migliora il comportamento futuro.

---

**CHIUSURA DEL CAPITOLO 4.** Con questa lezione si conclude l'intera infrastruttura tecnica del corso: chiamate API (4.1), output strutturati (4.2), accesso a informazioni esterne tramite RAG (4.3), capacità di azione tramite Function Calling (4.4), standardizzazione tramite MCP (4.5), e gestione della memoria (4.6). Ogni singolo componente che un agente richiede per funzionare è stato ora costruito, pezzo per pezzo, con piena consapevolezza del problema che risolve. Il Capitolo 5 può finalmente assemblare questi componenti in un sistema coerente: il primo vero agente del corso.
