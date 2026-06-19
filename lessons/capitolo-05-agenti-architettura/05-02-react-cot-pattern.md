---
id: "05-02"
titolo: "ReAct, Chain-of-Thought e Pattern di Ragionamento Agentivo"
sottotitolo: "Rendere visibile e affidabile la fase più critica del loop: il ragionamento"
capitolo: 5
capitolo_titolo: "Agenti AI: Architettura e Ragionamento"
lezione: 2
durata_stimata: "65 minuti"
difficolta: "intermedio"
prerequisiti: ["05-01"]
concetti_chiave:
  - ReAct
  - reasoning
  - acting
  - chain-of-thought
  - tree of thoughts
  - traccia di ragionamento
obiettivi:
  - "Spiegare il pattern ReAct e come estende il chain-of-thought visto nel Capitolo 3"
  - "Implementare un agente che esplicita il proprio ragionamento prima di ogni azione"
  - "Descrivere il Tree of Thoughts e quando aggiunge valore rispetto a ReAct"
  - "Riconoscere i fallimenti tipici di questi pattern: loop e ragionamento circolare"
stato: "pubblicata"
versione: "1.0"
---

# ReAct, Chain-of-Thought e Pattern di Ragionamento Agentivo

## Introduzione

Nella lezione precedente abbiamo costruito un loop agentivo funzionante: il modello riceve un obiettivo, decide se usare uno strumento, osserva il risultato, e ripete. Funziona — ma c'è un problema che il codice della Lezione 5.1 lascia silenziosamente irrisolto: **non vediamo perché il modello ha deciso di fare ciò che ha fatto**. Se l'agente sceglie uno strumento sbagliato, o si blocca in un comportamento ripetitivo, non abbiamo alcuna visibilità sul processo decisionale che ha portato a quella scelta.

Questa lezione introduce **ReAct**, il pattern che risolve esattamente questo problema, rendendo il ragionamento del modello **esplicito e osservabile** prima di ogni azione. Non è una tecnica nuova dal nulla: è un'estensione naturale e diretta del chain-of-thought che abbiamo già visto nella Lezione 3.4, applicato specificamente al contesto del loop agentivo appena costruito.

---

## Obiettivi di Apprendimento

Al termine di questa lezione sarai in grado di:

- Spiegare il pattern ReAct e come estende il chain-of-thought visto nel Capitolo 3
- Implementare un agente che esplicita il proprio ragionamento prima di ogni azione
- Descrivere il Tree of Thoughts e le circostanze in cui aggiunge valore rispetto a ReAct
- Riconoscere i fallimenti tipici di questi pattern: loop e ragionamento circolare

---

## 1. Da Chain-of-Thought a ReAct: estendere un concetto già noto

Ricorda dalla Lezione 3.4 il principio del chain-of-thought: istruire il modello a esplicitare il proprio ragionamento passo per passo prima di arrivare a una conclusione, perché ogni passaggio intermedio generato diventa contesto disponibile per il passaggio successivo (un principio radicato nella stessa natura autoregressiva del modello, vista nella Lezione 3.1).

**ReAct** (Reasoning + Acting, ragionamento + azione) applica esattamente questo stesso principio al loop agentivo: prima di ogni singola azione (l'uso di uno strumento), il modello viene istruito a esplicitare **perché** sta scegliendo quell'azione specifica.

```
SENZA ReAct (il loop "muto" della Lezione 5.1):

  Obiettivo → [il modello decide silenziosamente] → Azione

  Non vediamo IL PERCHÉ della scelta — solo il risultato


CON ReAct:

  Obiettivo
     │
     ▼
  PENSIERO: "Per rispondere a questa domanda, devo prima
             sapere il prezzo attuale, quindi userò lo
             strumento di ricerca prezzi"
     │
     ▼
  AZIONE: cerca_prezzo(prodotto="X")
     │
     ▼
  OSSERVAZIONE: "Il prezzo è 49,99€"
     │
     ▼
  PENSIERO: "Ora ho il prezzo, ma l'utente vuole sapere
             se conviene rispetto al mese scorso, quindi
             devo anche cercare lo storico prezzi"
     │
     ▼
  AZIONE: cerca_storico_prezzi(prodotto="X")
     │
     ▼
  ... (continua finché il PENSIERO conclude che
       si hanno informazioni sufficienti)
```

Il nome del pattern descrive esattamente questa alternanza: **Reasoning** (il PENSIERO esplicito) e **Acting** (l'AZIONE concreta), in un ciclo ripetuto.

---

## 2. Perché rendere il ragionamento esplicito migliora il comportamento dell'agente

Ci sono almeno due ragioni, una tecnica e una pratica, per cui ReAct produce agenti più affidabili rispetto al loop "muto" della Lezione 5.1.

### Ragione tecnica: il ragionamento esplicito migliora la decisione stessa

Esattamente come nella Lezione 3.4 (il problema del treno risolto meglio con chain-of-thought esplicito), costringere il modello a **scrivere** il proprio ragionamento prima di scegliere un'azione tende a produrre scelte più accurate. Senza questo passaggio esplicito, il modello potrebbe "saltare" direttamente a un'azione plausibile ma non ottimale; con il ragionamento esplicito, possibili errori di valutazione hanno più probabilità di essere corretti dal modello stesso, nel processo di "scriverli ad alta voce".

### Ragione pratica: l'osservabilità per chi costruisce il sistema

Dal punto di vista di chi sviluppa e mantiene un agente, avere accesso al PENSIERO esplicito a ogni passo è un vantaggio enorme per il debug e la comprensione del comportamento del sistema. Se un agente sceglie un'azione inaspettata, la traccia ReAct permette di leggere esattamente il ragionamento che ha portato a quella scelta — invece di dover indovinare le motivazioni di una "scatola nera".

> **Perché questo anticipa la Lezione 5.5:** questa stessa traccia di ragionamento, salvata e ispezionabile, è precisamente la base su cui si costruiscono i sistemi di **logging e tracing** che vedremo parlando di osservabilità degli agenti.

---

## 3. Implementazione pratica: ReAct nel loop agentivo

Estendiamo il codice della Lezione 5.1, aggiungendo l'istruzione che richiede al modello di esplicitare il proprio ragionamento. La modifica principale riguarda il **system prompt** (Lezione 3.3 e 3.4) fornito all'agente:

```python
SYSTEM_PROMPT_REACT = """
Sei un agente che risolve compiti usando gli strumenti disponibili.

Per OGNI azione che decidi di compiere, segui questo schema:

1. PENSIERO: spiega esplicitamente perché stai per compiere
   questa azione, cosa ti aspetti di ottenere, e come si
   collega all'obiettivo finale.

2. Poi richiedi l'azione (lo strumento) appropriata.

Quando hai raccolto informazioni sufficienti per rispondere
completamente, fornisci la risposta finale, precedendola
sempre con un PENSIERO che riassume perché ritieni di avere
ora tutte le informazioni necessarie.
"""

def esegui_agente_react(obiettivo: str, max_iterazioni: int = 5) -> str:
    client = anthropic.Anthropic()

    messaggi = [{"role": "user", "content": obiettivo}]

    for iterazione in range(max_iterazioni):
        risposta = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            system=SYSTEM_PROMPT_REACT,
            tools=DEFINIZIONI_STRUMENTI,  # definiti nella Lezione 5.1
            messages=messaggi
        )

        # OSSERVABILITÀ: stampiamo il pensiero esplicito del modello,
        # estraendolo dai blocchi di testo prima della richiesta di
        # strumento (la struttura esatta dipende dal provider/SDK)
        for blocco in risposta.content:
            if blocco.type == "text":
                print(f"[PENSIERO - iterazione {iterazione}]: {blocco.text}")

        messaggi.append({"role": "assistant", "content": risposta.content})

        if risposta.stop_reason != "tool_use":
            return risposta.content[0].text

        risultati_strumenti = []
        for blocco in risposta.content:
            if blocco.type == "tool_use":
                funzione = STRUMENTI_DISPONIBILI[blocco.name]
                risultato = funzione(**blocco.input)
                risultati_strumenti.append({
                    "type": "tool_result",
                    "tool_use_id": blocco.id,
                    "content": json.dumps(risultato)
                })

        messaggi.append({"role": "user", "content": risultati_strumenti})

    return "Limite di iterazioni raggiunto senza una risposta finale."
```

La differenza strutturale rispetto al codice della Lezione 5.1 è minima — un system prompt più dettagliato, e una riga aggiuntiva per esporre il pensiero — ma l'impatto sulla qualità e sulla trasparenza del comportamento dell'agente è significativo. Questo è un esempio concreto di come, nei sistemi agentivi, **la qualità del prompt engineering (Lezione 3.4) pesi quanto, se non più, della struttura del codice**.

---

## 4. Tree of Thoughts: esplorare più rami in parallelo

ReAct, come descritto, segue un **singolo filo di ragionamento**: pensiero, azione, osservazione, pensiero successivo, e così via, in sequenza lineare. Per compiti particolarmente complessi o ambigui, dove esistono **più strategie plausibili** per raggiungere l'obiettivo, può essere utile che il modello esplori **più rami di ragionamento in parallelo**, confrontandoli prima di procedere — un pattern chiamato **Tree of Thoughts** (albero dei pensieri).

```
                    Obiettivo
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
     RAMO A          RAMO B        RAMO C
   (strategia 1)   (strategia 2)  (strategia 3)
          │             │             │
          ▼             ▼             ▼
   [valutazione]  [valutazione]  [valutazione]
          │             │             │
          └─────────────┼─────────────┘
                        ▼
            Si prosegue con il ramo
            valutato più promettente
            (o si combinano elementi
             di più rami)
```

Questo pattern ha un costo computazionale superiore a ReAct (esplorare più rami significa, tipicamente, più chiamate API, Lezione 4.1), e per questo si usa selettivamente: tipicamente per compiti di pianificazione complessa, problemi con più soluzioni valide da confrontare, o situazioni in cui un errore di strategia iniziale sarebbe costoso da correggere in seguito. Per la maggior parte dei compiti agentivi comuni, il ReAct lineare resta il pattern predefinito, più semplice ed economico.

---

## 5. Limiti di questi pattern: loop e ragionamento circolare

È importante, come sempre in questo corso, riconoscere onestamente i limiti di queste tecniche, non solo i loro vantaggi.

### Il problema del loop

Un agente ReAct può, in alcune circostanze, entrare in un ciclo in cui il PENSIERO conclude ripetutamente "devo fare X" per la stessa azione X già tentata, senza fare progressi reali verso l'obiettivo — ad esempio, se uno strumento restituisce costantemente un errore che il modello non riesce a diagnosticare correttamente.

```
ITERAZIONE 3: PENSIERO: "Lo strumento ha restituito un errore,
              riprovo con parametri leggermente diversi"
ITERAZIONE 4: PENSIERO: "Ancora errore, riprovo di nuovo"
ITERAZIONE 5: PENSIERO: "Ancora errore, riprovo di nuovo"
... (potenzialmente fino a max_iterazioni, senza progresso)
```

Il parametro `max_iterazioni`, introdotto nella Lezione 5.1 come precauzione semplice, è precisamente la prima linea di difesa contro questo scenario — ma vedremo, nella Lezione 5.5, strategie più sofisticate per riconoscere e interrompere questi loop in modo più intelligente, prima di raggiungere il limite massimo.

### Il problema del ragionamento circolare

Un rischio più sottile: il modello può produrre un PENSIERO che **sembra** una valida giustificazione logica, ma che in realtà non fa avanzare la comprensione del problema — una forma di razionalizzazione plausibile a posteriori, piuttosto che un ragionamento che guida effettivamente la decisione. Questo è collegato direttamente al limite delle allucinazioni visto nella Lezione 3.5: il modello genera testo statisticamente plausibile nel ruolo di "pensiero", che non garantisce automaticamente di essere un ragionamento corretto o utile.

> **Implicazione pratica:** la presenza di un PENSIERO esplicito migliora l'osservabilità e spesso la qualità delle decisioni, ma non è una garanzia assoluta di correttezza. Un agente ReAct va comunque sottoposto a verifica e supervisione — temi che affronteremo nelle Lezioni 5.5, 7.3 e 7.4.

---

## Esempio Pratico: Confrontare un Loop "Muto" con ReAct sullo Stesso Compito

Riprendiamo l'esempio della Lezione 5.1 — "Quanto fa 47 al quadrato, e poi cerca informazioni sul numero risultante" — e osserviamo la differenza di osservabilità tra le due implementazioni:

```
LOOP "MUTO" (Lezione 5.1):
  [nessuna visibilità sul perché]
  → richiesta strumento: calcola("47**2")
  → richiesta strumento: cerca_sul_web("2209")
  → risposta finale

LOOP ReAct (questa lezione):
  PENSIERO: "Devo prima calcolare 47 al quadrato per
             sapere quale numero cercare successivamente"
  → richiesta strumento: calcola("47**2")
  OSSERVAZIONE: risultato = 2209
  PENSIERO: "Ora che conosco il risultato (2209), posso
             cercare se questo numero ha qualche
             significato particolare"
  → richiesta strumento: cerca_sul_web("2209")
  OSSERVAZIONE: risultati della ricerca
  PENSIERO: "Ho sia il calcolo sia le informazioni di
             contesto, posso ora fornire una risposta completa"
  → risposta finale
```

Il risultato finale potrebbe essere identico in entrambi i casi — ma solo nella versione ReAct un essere umano che revisiona il comportamento dell'agente può capire, leggendo la traccia, esattamente perché ogni passo è stato compiuto, e individuare rapidamente dove un eventuale errore di ragionamento si sia verificato.

---

## Riepilogo

- **ReAct** estende il chain-of-thought della Lezione 3.4 al contesto del loop agentivo: il modello esplicita un **PENSIERO** prima di ogni **AZIONE**, alternando ragionamento e azione in modo osservabile.
- Rendere il ragionamento esplicito migliora sia la qualità delle decisioni (lo stesso principio tecnico del chain-of-thought) sia l'osservabilità del sistema per chi lo sviluppa e lo mantiene.
- L'implementazione pratica richiede principalmente un system prompt che istruisce il modello a seguire questo schema, con un costo aggiuntivo minimo rispetto al loop "muto" della Lezione 5.1.
- **Tree of Thoughts** estende ReAct esplorando più rami di ragionamento in parallelo, utile per compiti complessi con più strategie plausibili, a un costo computazionale superiore.
- I limiti di questi pattern includono il rischio di **loop** (azioni ripetute senza progresso) e di **ragionamento circolare** (un PENSIERO plausibile ma non realmente corretto), entrambi da gestire con supervisione e meccanismi di sicurezza aggiuntivi.

---

## Domande di Verifica

1. Spiega, collegandolo esplicitamente al meccanismo autoregressivo visto nella Lezione 3.1, perché scrivere un PENSIERO esplicito prima di un'azione può effettivamente migliorare la qualità della decisione, non solo la sua osservabilità.

2. In quale tipo di compito agentivo ritieni che il costo aggiuntivo di Tree of Thoughts (più rami, più chiamate API) sarebbe giustificato, rispetto al ReAct lineare più semplice ed economico?

3. Un agente ReAct produce, per tre iterazioni consecutive, il PENSIERO "Riprovo lo strumento con parametri diversi" per la stessa identica azione. Quali due tipi di problema, descritti in questa lezione, potrebbero spiegare questo comportamento?

---

## Esercizi Pratici

> Tre esercizi a difficoltà crescente. Prova a risolverli da solo prima di aprire la soluzione.

### Esercizio 1 — Cosa aggiunge ReAct 🟢 Base

Rispetto al loop "muto" della Lezione 5.1, cosa aggiunge ReAct? Cita le due ragioni (una tecnica, una pratica) per cui rendere il ragionamento esplicito migliora l'agente.

<details>
<summary>💡 Mostra soluzione</summary>

ReAct aggiunge un **PENSIERO esplicito prima di ogni AZIONE**: il modello scrive *perché* sta scegliendo quell'azione, alternando ragionamento e azione in modo osservabile.

Le due ragioni:
1. **Tecnica:** scrivere il ragionamento migliora la **qualità della decisione** stessa (stesso principio del chain-of-thought, Lezione 3.4 — ogni passaggio esplicito diventa contesto per il successivo, riducendo errori).
2. **Pratica:** dà **osservabilità** a chi sviluppa il sistema. Se l'agente sbaglia, la traccia mostra il perché di ogni scelta, invece di una scatola nera.

</details>

### Esercizio 2 — Quando usare Tree of Thoughts 🟡 Intermedio

ReAct segue un singolo filo di ragionamento; Tree of Thoughts ne esplora più in parallelo, ma costa di più. In quale tipo di compito il costo extra è giustificato? E quando invece basta il ReAct lineare?

<details>
<summary>💡 Mostra soluzione</summary>

**Tree of Thoughts è giustificato** quando esistono **più strategie plausibili** da confrontare e un errore di strategia iniziale sarebbe costoso da correggere: pianificazione complessa, problemi con più soluzioni valide, ragionamenti dove conviene valutare alternative prima di impegnarsi.

**ReAct lineare basta** per la maggior parte dei compiti comuni, dove esiste un percorso ragionevolmente chiaro: è più semplice ed economico (meno chiamate API).

Criterio: il costo extra di esplorare più rami si ripaga solo quando il rischio/valore della scelta strategica è alto. Per compiti diretti, l'esplorazione parallela è uno spreco.

</details>

### Esercizio 3 — Diagnosi di un agente bloccato 🔴 Avanzato

Un agente ReAct produce per tre iterazioni il PENSIERO "Riprovo lo strumento con parametri diversi" sulla stessa azione, senza progredire. Quali due problemi descritti nella lezione possono spiegarlo? Cosa lo ferma e cosa servirebbe di meglio?

<details>
<summary>💡 Mostra soluzione</summary>

I due problemi:
1. **Loop:** l'agente ripete la stessa azione senza fare progressi reali (es. uno strumento restituisce sempre un errore che il modello non sa diagnosticare).
2. **Ragionamento circolare:** il PENSIERO *sembra* una giustificazione valida ("riprovo con parametri diversi") ma in realtà non fa avanzare la comprensione — una razionalizzazione plausibile a posteriori, collegata al fatto che il modello genera testo plausibile, non necessariamente corretto (Lezione 3.5).

**Cosa lo ferma:** `max_iterazioni` (Lezione 5.1) — ma solo dopo aver sprecato tutte le iterazioni.

**Cosa servirebbe di meglio:** rilevare il loop *prima* del limite (es. riconoscere azioni/risultati ripetuti e cambiare strategia o interrompere), più supervisione e gestione errori — i temi della Lezione 5.5. Il PENSIERO esplicito aiuta a *diagnosticare*, ma non garantisce da solo la correttezza.

</details>

---

## Connessioni

**Viene da:** Lezione 5.1 (Cos'è un Agente AI) — qui rendiamo esplicita e osservabile la fase "ragiona" del loop costruito in quella lezione. Lezione 3.4 (Il Prompting) — ReAct è l'estensione diretta del chain-of-thought al contesto agentivo.

**Porta a:** Lezione 5.3 (L'Orchestratore) — vedremo come un sistema può coordinare più agenti, ciascuno potenzialmente basato sul pattern ReAct, per compiti che richiedono specializzazione.

**Ritroverai questi concetti in:** Lezione 5.5 (Gestione degli Errori) — il problema del loop, qui solo identificato, riceverà soluzioni tecniche più sofisticate. Lezione 7.3 (Il Layer di Review) — la traccia di ragionamento esplicito prodotta da ReAct è precisamente il materiale che un agente critico (reviewer) può ispezionare per valutare la qualità del processo decisionale, non solo del risultato finale.
