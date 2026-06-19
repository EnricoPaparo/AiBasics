---
id: "05-03"
titolo: "L'Orchestratore: il direttore d'orchestra del sistema agentivo"
sottotitolo: "Quando un singolo agente non basta più: chi decide chi fa cosa"
capitolo: 5
capitolo_titolo: "Agenti AI: Architettura e Ragionamento"
lezione: 3
durata_stimata: "70 minuti"
difficolta: "intermedio"
prerequisiti: ["05-02"]
concetti_chiave:
  - orchestratore
  - pianificazione
  - delega
  - scomposizione di task
  - stato condiviso
obiettivi:
  - "Spiegare perché serve un orchestratore quando un compito richiede specializzazione"
  - "Descrivere le quattro responsabilità di un orchestratore"
  - "Implementare un orchestratore minimo che delega a due agenti specializzati"
  - "Distinguere i pattern di orchestrazione top-down, event-driven e ibrido"
stato: "pubblicata"
versione: "1.0"
---

# L'Orchestratore: il direttore d'orchestra del sistema agentivo

## Introduzione

Nella Lezione 5.1 abbiamo costruito un singolo agente, capace di usare più strumenti all'interno di un proprio loop. Nella Lezione 5.2 abbiamo reso quel ragionamento esplicito e osservabile. Ma c'è una domanda che non abbiamo ancora affrontato: cosa succede quando un compito è così ampio, o richiede competenze così diverse tra loro, che **un singolo agente, per quanto ben progettato, non è la soluzione più efficace**?

Questa lezione introduce l'**orchestratore**: un componente specifico, con responsabilità distinte da quelle di un agente "esecutore", il cui compito non è risolvere direttamente un problema, ma **decidere come scomporlo e a chi affidarne le parti**. È una lezione cruciale perché, senza un orchestratore ben compreso, l'intera architettura multi-agente che affronteremo nella prossima lezione, e poi nel Capitolo 7, risulterebbe ingestibile.

---

## Obiettivi di Apprendimento

Al termine di questa lezione sarai in grado di:

- Spiegare perché serve un orchestratore quando un compito richiede specializzazione o scomposizione
- Descrivere le quattro responsabilità fondamentali di un orchestratore: pianificazione, delega, monitoraggio, sintesi
- Implementare un orchestratore minimo che delega compiti a due agenti specializzati
- Distinguere i pattern di orchestrazione top-down, event-driven e ibrido

---

## 1. Perché un agente "generalista" raggiunge un limite

Immagina di voler costruire un sistema che, data una richiesta come "Analizza le vendite del trimestre, confrontale con l'anno precedente, e scrivi un report con raccomandazioni", debba davvero eseguire questo compito end-to-end. Potresti, in linea di principio, dare a un singolo agente (come quello della Lezione 5.1) accesso a **tutti** gli strumenti necessari — accesso al database vendite, capacità di fare calcoli statistici, capacità di scrivere testo ben strutturato — e lasciare che il suo loop ReAct (Lezione 5.2) gestisca l'intero processo.

Questo approccio, però, incontra limiti pratici concreti man mano che il compito cresce in complessità:

- **Il contesto si affolla**: ogni strumento aggiunto, ogni passo intermedio, si accumula nella memoria dell'agente (Lezione 4.6), avvicinandosi sempre più al limite del context window (Lezione 3.3)
- **Le competenze richieste sono eterogenee**: analizzare dati richiede un tipo di "ragionamento" diverso da scrivere un report ben argomentato — un singolo prompt di sistema (Lezione 3.4) capace di guidare bene entrambi i compiti diventa via via più difficile da scrivere e mantenere
- **Gli errori si propagano senza controllo intermedio**: se l'agente unico commette un errore nell'analisi dei dati, questo errore si propaga silenziosamente nel report finale, senza un punto di verifica intermedio

La soluzione architetturale a questi limiti non è "un agente più grande e più capace": è **scomporre il problema** in sotto-compiti più piccoli e specializzati, ciascuno affidato a un agente dedicato — e introdurre un componente che coordina questa scomposizione.

---

## 2. Le quattro responsabilità dell'orchestratore

Un **orchestratore** è un componente (a sua volta, tipicamente, basato su un modello linguistico, ma con un ruolo molto specifico) che si occupa di:

```
┌──────────────────────────────────────────────────────┐
│                    ORCHESTRATORE                        │
│                                                            │
│  1. PIANIFICAZIONE                                        │
│     Riceve l'obiettivo generale e lo scompone in           │
│     sotto-task più piccoli e gestibili                     │
│                                                            │
│  2. DELEGA                                                 │
│     Decide quale agente specializzato deve occuparsi       │
│     di ciascun sotto-task                                  │
│                                                            │
│  3. MONITORAGGIO                                           │
│     Osserva i risultati prodotti da ciascun agente,        │
│     verifica che siano coerenti e completi                 │
│                                                            │
│  4. SINTESI                                                 │
│     Combina i risultati dei singoli agenti in un           │
│     output finale coerente, rispondendo all'obiettivo      │
│     originale                                              │
└──────────────────────────────────────────────────────┘
```

Riprendendo l'esempio di apertura — "Analizza le vendite, confronta, scrivi un report" — un orchestratore potrebbe operare così:

```
PIANIFICAZIONE: "Questo compito richiede tre fasi: (1) estrarre
                  e analizzare i dati di vendita, (2) confrontarli
                  con l'anno precedente, (3) scrivere un report
                  con raccomandazioni"

DELEGA:          Fase 1 e 2 → Agente "Analista Dati"
                  Fase 3 → Agente "Scrittore di Report"

MONITORAGGIO:     Verifica che l'Agente Analista abbia prodotto
                  numeri coerenti e completi prima di procedere

SINTESI:          Passa l'analisi completata all'Agente Scrittore,
                  e infine restituisce il report finale all'utente
```

---

## 3. Implementazione pratica: un orchestratore minimo

Costruiamo un esempio concreto, estendendo i pattern già visti. Per chiarezza didattica, useremo due agenti specializzati semplici (riutilizzando la struttura della Lezione 5.1), e un orchestratore che li coordina.

```python
import anthropic
import json

# --- AGENTE SPECIALIZZATO 1: Analista ---
def agente_analista(dati_richiesta: str) -> str:
    """Un agente specializzato SOLO nell'analisi di dati numerici."""
    client = anthropic.Anthropic()
    risposta = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=500,
        system="Sei un analista di dati. Fornisci SOLO numeri, "
               "percentuali e confronti quantitativi precisi. "
               "Non scrivere prosa discorsiva.",
        messages=[{"role": "user", "content": dati_richiesta}]
    )
    return risposta.content[0].text


# --- AGENTE SPECIALIZZATO 2: Scrittore ---
def agente_scrittore(analisi: str) -> str:
    """Un agente specializzato SOLO nella scrittura di report."""
    client = anthropic.Anthropic()
    risposta = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=800,
        system="Sei un redattore di report aziendali. Trasforma "
               "i dati grezzi che ricevi in un report ben "
               "strutturato, con un tono professionale e "
               "raccomandazioni concrete.",
        messages=[{"role": "user", "content": analisi}]
    )
    return risposta.content[0].text


# --- ORCHESTRATORE ---
def orchestratore(obiettivo_utente: str) -> str:
    """
    Coordina gli agenti specializzati per raggiungere
    l'obiettivo complessivo dell'utente.
    """
    client = anthropic.Anthropic()

    # FASE 1: PIANIFICAZIONE
    # L'orchestratore stesso usa un modello per decidere
    # come scomporre il compito
    piano = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=300,
        system="Sei un pianificatore. Data una richiesta "
               "complessa, descrivi in massimo 3 frasi quali "
               "dati grezzi servono per l'analisi, separandoli "
               "chiaramente dalla parte di scrittura.",
        messages=[{"role": "user", "content": obiettivo_utente}]
    )
    istruzioni_analisi = piano.content[0].text

    # FASE 2: DELEGA all'agente Analista
    risultato_analisi = agente_analista(istruzioni_analisi)

    # FASE 3: MONITORAGGIO (verifica minima di coerenza)
    if len(risultato_analisi.strip()) < 10:
        return "Errore: l'analisi prodotta è insufficiente."

    # FASE 4: DELEGA all'agente Scrittore + SINTESI
    report_finale = agente_scrittore(risultato_analisi)

    return report_finale


# Utilizzo:
risultato = orchestratore(
    "Analizza l'andamento delle vendite del trimestre Q3 2025 "
    "rispetto al Q3 2024 e scrivi un report con raccomandazioni."
)
print(risultato)
```

Osserva la struttura: l'**orchestratore non esegue mai direttamente** l'analisi dei dati né la scrittura del report — queste responsabilità sono interamente delegate agli agenti specializzati. Il ruolo dell'orchestratore è, letteralmente, decidere **come** scomporre il problema e **a chi** affidare ciascuna parte, esattamente come descritto nella Sezione 2.

> **Perché questa separazione conta:** ciascun agente specializzato ha un system prompt (Lezione 3.4) molto più focalizzato e semplice da scrivere correttamente, rispetto a un singolo prompt che dovrebbe gestire sia l'analisi quantitativa sia la scrittura discorsiva. Questo principio di "responsabilità singola per agente" è lo stesso che ritroveremo, formalizzato con maggiore rigore, parlando di agent package nella Lezione 6.2.

---

## 4. Pattern di orchestrazione: top-down, event-driven, ibrido

L'esempio della Sezione 3 segue un pattern **top-down**: l'orchestratore pianifica in anticipo l'intera sequenza di delega, prima che qualsiasi agente specializzato inizi a lavorare. Esistono però pattern alternativi, utili in circostanze diverse.

```
TOP-DOWN (pianificazione anticipata)

  Orchestratore pianifica TUTTO in anticipo
         │
         ▼
  Esegue la sequenza pianificata, passo dopo passo
  (l'esempio della Sezione 3 segue questo pattern)


EVENT-DRIVEN (reattivo agli eventi)

  L'orchestratore non pianifica tutto in anticipo:
  reagisce a EVENTI man mano che si presentano
  (es. "è arrivato un nuovo dato", "un agente ha
   completato il proprio task") decidendo il passo
  successivo solo quando necessario


IBRIDO

  Una pianificazione iniziale di alto livello
  (top-down), ma con la flessibilità di ADATTARE
  il piano in base a come procedono i risultati
  intermedi (event-driven), invece di seguire
  rigidamente la sequenza originale
```

Il pattern top-down è più semplice da implementare e da prevedere, ma meno flessibile: se un risultato intermedio rivela che il piano originale era inadeguato, un orchestratore puramente top-down non si adatta automaticamente. Il pattern event-driven è più flessibile ma più complesso da progettare e da rendere prevedibile. Il pattern ibrido — il più comune nei sistemi professionali maturi — combina una struttura di base con la capacità di adattarsi quando le circostanze lo richiedono.

---

## 5. L'orchestratore come stato condiviso: cosa vede e cosa non vede

Un ultimo punto concettuale, importante per evitare un errore di progettazione comune: l'orchestratore tipicamente mantiene una visione **d'insieme** del processo (qual è l'obiettivo generale, quali fasi sono state completate, quali risultati sono stati prodotti), ma **non** è tenuto a conoscere i dettagli interni di come ciascun agente specializzato svolge il proprio compito.

```
COSA VEDE L'ORCHESTRATORE:               COSA NON VEDE:

- L'obiettivo generale                   - Il prompt di sistema
- Quali fasi sono state completate         specifico dell'Agente
- I risultati (output) prodotti da         Analista
  ciascun agente                         - Il ragionamento ReAct
- Se un agente ha fallito o prodotto       interno (Lezione 5.2)
  un risultato insufficiente               di un singolo agente
                                            specializzato
```

Questa separazione — l'orchestratore vede i risultati, non i meccanismi interni — è un principio di **incapsulamento**, concettualmente identico a quello visto nella Lezione 1.5 a proposito delle API ("non hai bisogno di sapere come funziona la cucina, solo cosa puoi ordinare dal menù"). Ogni agente specializzato è, dal punto di vista dell'orchestratore, una "scatola" con un'interfaccia chiara (cosa riceve, cosa restituisce) ma un funzionamento interno che non deve necessariamente essere visibile dall'esterno.

> **Perché questo anticipa direttamente il Capitolo 6:** questa nozione di "interfaccia chiara verso l'esterno, dettagli interni incapsulati" è esattamente il principio su cui si fonda l'Agent Card che vedremo nella Lezione 6.3 — un documento che dichiara cosa un agente fa e quali dati si aspetta, senza esporre necessariamente i dettagli della sua implementazione interna.

---

## Esempio Pratico: Cosa Succederebbe Senza Orchestratore

Per apprezzare concretamente il valore di questa architettura, immagina di rimuovere l'orchestratore e di affidare l'intero compito — "Analizza le vendite e scrivi un report" — a un singolo agente con un unico, generico system prompt.

```
PROBLEMA TIPICO SENZA ORCHESTRATORE:

System prompt unico: "Sei un assistente che analizza dati
e scrive report."

→ Il modello potrebbe mescolare numeri imprecisi con
  prosa discorsiva fin dall'inizio, senza una fase di
  analisi quantitativa rigorosa e separata

→ Se il report finale contiene un errore nei numeri,
  non c'è un punto di verifica intermedio (il
  MONITORAGGIO della Sezione 2) in cui quell'errore
  avrebbe potuto essere intercettato prima di diventare
  parte del testo finale
```

Questo confronto rende tangibile perché la scomposizione orchestrata non sia semplicemente "più complessa per il gusto della complessità", ma risponda a un'esigenza concreta: maggiore controllo, maggiore specializzazione, maggiore possibilità di verifica a ogni fase del processo.

---

## Riepilogo

- Un **orchestratore** diventa necessario quando un compito è troppo ampio o richiede competenze troppo eterogenee per un singolo agente generalista, evitando l'affollamento del context window e la propagazione incontrollata di errori.
- Le quattro responsabilità di un orchestratore sono **pianificazione** (scomporre l'obiettivo), **delega** (assegnare i sotto-task agli agenti giusti), **monitoraggio** (verificare i risultati intermedi), **sintesi** (combinare i risultati in un output finale coerente).
- L'implementazione pratica vede l'orchestratore **non eseguire mai direttamente** il lavoro specializzato, ma coordinare agenti dedicati, ciascuno con un ruolo e un system prompt più focalizzato.
- I pattern di orchestrazione **top-down** (pianificazione anticipata), **event-driven** (reattivo agli eventi), e **ibrido** offrono diversi compromessi tra semplicità e flessibilità.
- L'orchestratore mantiene una visione d'insieme del processo, ma non necessita di conoscere i dettagli interni di come ciascun agente specializzato svolge il proprio compito — un principio di incapsulamento analogo a quello delle API.

---

## Domande di Verifica

1. Riprendi l'esempio "Analizza le vendite e scrivi un report" senza orchestratore. Oltre al problema di propagazione degli errori descritto nella lezione, quale altro limite (collegandolo al context window della Lezione 3.3) incontrerebbe un singolo agente generalista su compiti via via più estesi?

2. In quale scenario concreto preferiresti un pattern di orchestrazione event-driven invece di top-down? Costruisci un esempio in cui pianificare tutto in anticipo sarebbe controproducente.

3. Nel codice della Sezione 3, il MONITORAGGIO implementato è estremamente semplice (`len(risultato_analisi.strip()) < 10`). Quali verifiche più sofisticate potrebbero rendere questo passaggio più robusto, collegando la tua risposta al concetto di output strutturati visto nella Lezione 4.2?

---

## Esercizi Pratici

> Tre esercizi a difficoltà crescente. Prova a risolverli da solo prima di aprire la soluzione.

### Esercizio 1 — Le quattro responsabilità 🟢 Base

Elenca le quattro responsabilità di un orchestratore e descrivi in una frase cosa fa ciascuna. Cosa NON fa mai l'orchestratore?

<details>
<summary>💡 Mostra soluzione</summary>

1. **Pianificazione:** scompone l'obiettivo generale in sotto-task più piccoli.
2. **Delega:** decide quale agente specializzato si occupa di ciascun sotto-task.
3. **Monitoraggio:** verifica che i risultati intermedi siano coerenti e completi.
4. **Sintesi:** combina i risultati dei singoli agenti in un output finale coerente.

**Cosa NON fa:** non esegue mai direttamente il lavoro specializzato (non analizza i dati né scrive il report). Coordina soltanto — decide *come* scomporre e *a chi* affidare. Il principio è "responsabilità singola": l'orchestratore orchestra, gli agenti eseguono.

</details>

### Esercizio 2 — Top-down o event-driven? 🟡 Intermedio

Spiega la differenza tra orchestrazione top-down e event-driven. Per ciascuno, un caso d'uso dove è la scelta migliore.

<details>
<summary>💡 Mostra soluzione</summary>

- **Top-down:** l'orchestratore pianifica *tutta* la sequenza in anticipo, poi la esegue. Più semplice e prevedibile, ma poco flessibile. **Caso adatto:** un processo ben definito e stabile, es. "estrai dati → analizza → scrivi report", dove le fasi sono note in anticipo.
- **Event-driven:** l'orchestratore reagisce a eventi man mano che si presentano, decidendo il passo successivo solo quando serve. Più flessibile, più complesso. **Caso adatto:** monitoraggio di un sistema dove le azioni dipendono da anomalie imprevedibili che si verificano nel tempo.

Il pattern **ibrido** (piano di alto livello + adattamento) è il più comune nei sistemi maturi.

</details>

### Esercizio 3 — Incapsulamento e monitoraggio robusto 🔴 Avanzato

(a) Cosa vede e cosa NON vede l'orchestratore di ciascun agente? A quale principio già visto (Lezione 1.5) corrisponde? (b) Il monitoraggio d'esempio era `len(risultato) < 10`. Come lo renderesti più robusto usando la Lezione 4.2?

<details>
<summary>💡 Mostra soluzione</summary>

**(a) Incapsulamento:** l'orchestratore vede l'**obiettivo**, le **fasi completate** e i **risultati (output)** di ciascun agente, e se un agente ha fallito. **Non** vede i dettagli interni: il system prompt specifico né il ragionamento ReAct interno di ogni agente. È il principio di **incapsulamento** delle API (Lezione 1.5): "non devi sapere come funziona la cucina, solo cosa puoi ordinare". Ogni agente è una scatola con interfaccia chiara e interni nascosti.

**(b) Monitoraggio più robusto:** invece di controllare solo la lunghezza, far produrre all'agente un **output strutturato** (Lezione 4.2) validato con uno schema Pydantic. Così il monitoraggio verifica che i **campi attesi siano presenti, dei tipi giusti e dentro i vincoli** (es. che `percentuale` sia un numero tra -100 e 100), rilevando subito un'analisi malformata invece di accorgersene solo dalla lunghezza del testo.

</details>

---

## Connessioni

**Viene da:** Lezioni 5.1 e 5.2 — l'orchestratore coordina agenti costruiti esattamente secondo i pattern (loop agentivo, ReAct) visti in quelle lezioni.

**Porta a:** Lezione 5.4 (Single vs Multi-Agent) — formalizzeremo con maggiore rigore le topologie di sistemi multi-agente, di cui l'orchestratore è il componente centrale.

**Ritroverai questi concetti in:** Lezione 6.3 (Agent Card) — il principio di incapsulamento qui descritto (l'orchestratore vede risultati, non meccanismi interni) è il fondamento concettuale dell'Agent Card. Lezione 7.2 (LangGraph) — vedremo come framework dedicati permettono di implementare pattern di orchestrazione complessi (incluso l'ibrido descritto qui) con strumenti più robusti del semplice codice Python visto in questa lezione.
