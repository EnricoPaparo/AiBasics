---
id: "03-04"
titolo: "Il Prompting: comunicare con un LLM in modo efficace"
sottotitolo: "La prima competenza pratica e trasferibile di tutto il corso"
capitolo: 3
capitolo_titolo: "I Modelli Linguistici di Grandi Dimensioni (LLM)"
lezione: 4
durata_stimata: "60 minuti"
difficolta: "base"
prerequisiti: ["03-03"]
concetti_chiave:
  - prompt
  - zero-shot
  - few-shot
  - chain-of-thought
  - system prompt
  - temperature
  - top-p
obiettivi:
  - "Spiegare perché la formulazione di un prompt cambia il risultato"
  - "Distinguere zero-shot, few-shot e chain-of-thought con esempi"
  - "Descrivere il ruolo del system prompt nella definizione del comportamento"
  - "Capire cosa controllano temperature e altri parametri di generazione"
stato: "pubblicata"
versione: "1.0"
---

# Il Prompting: comunicare con un LLM in modo efficace

## Introduzione

Fino a questa lezione, abbiamo costruito comprensione: cosa è un LLM, come viene addestrato, come è strutturato un prodotto che lo utilizza. Da qui in poi iniziamo a costruire **competenza pratica**: come comunicare efficacemente con un modello per ottenere il risultato che desideri.

Questa è, volutamente, la prima lezione del corso che ha un taglio più immediatamente applicabile. Tutto quello che imparerai qui — come strutturare istruzioni, come fornire esempi, come guidare il ragionamento — sarà esattamente la base tecnica su cui costruiremo, dal Capitolo 6 in avanti, i prompt professionali e versionati che faranno funzionare i nostri agenti. Il prompting non è un'abilità "soft" o intuitiva: è ingegneria della comunicazione con un sistema che si comporta secondo regole precise, anche se probabilistiche.

---

## Obiettivi di Apprendimento

Al termine di questa lezione sarai in grado di:

- Spiegare perché la formulazione di un prompt cambia sistematicamente il risultato ottenuto
- Distinguere zero-shot, few-shot e chain-of-thought prompting, con esempi concreti
- Descrivere il ruolo del system prompt nella definizione del comportamento del modello
- Capire cosa controllano concretamente la temperature e altri parametri di generazione

---

## 1. Perché la formulazione conta: il prompt come contesto che guida la previsione

Ricorda la definizione di LLM data nella Lezione 3.1: il modello prevede il token successivo più probabile **dato il contesto fornito finora**. Questo significa, in modo diretto e non metaforico, che **il prompt è l'unico strumento che hai per influenzare quel contesto**, e quindi l'unico strumento per influenzare quale risposta il modello considererà più probabile generare.

Un prompt vago produce un contesto vago, che lascia ampio spazio a molteplici continuazioni plausibili — non perché il modello sia "confuso", ma perché, dato un contesto poco specifico, esistono effettivamente molte continuazioni statisticamente ragionevoli. Un prompt preciso restringe drasticamente lo spazio delle continuazioni plausibili, aumentando la probabilità che il modello produca esattamente il tipo di risposta che desideri.

```
PROMPT VAGO:
"Parlami di Roma"
→ Il modello potrebbe rispondere con storia, turismo, cucina,
  politica attuale, calcio — tutte continuazioni plausibili
  dato un contesto così aperto

PROMPT PRECISO:
"Elenca 3 monumenti dell'antica Roma da visitare in un giorno,
con il tempo di visita consigliato per ciascuno, in formato elenco"
→ Lo spazio delle risposte plausibili si restringe
  drasticamente: il modello sa esattamente quale tipo
  di contenuto, formato e ampiezza produrre
```

---

## 2. Zero-shot, Few-shot, Chain-of-thought: le tecniche fondamentali

### Zero-shot prompting

**Zero-shot** significa chiedere al modello di svolgere un compito senza fornire alcun esempio di come farlo — ti affidi interamente alla conoscenza e capacità già acquisite dal modello durante l'addestramento (Lezione 3.2).

```
Prompt zero-shot:
"Classifica il sentimento di questa recensione come
positivo, negativo o neutro: 'Il prodotto è arrivato
in ritardo ma la qualità è eccellente.'"
```

Per molti compiti comuni e ben rappresentati nei dati di addestramento, lo zero-shot funziona sorprendentemente bene — il modello istruito (Lezione 3.2) ha già "visto", durante il proprio addestramento, moltissimi esempi di classificazione di sentimento, e ha generalizzato il compito.

### Few-shot prompting

**Few-shot** significa fornire, all'interno del prompt stesso, alcuni esempi di come vuoi che il compito venga svolto, prima di presentare il caso reale su cui vuoi una risposta.

```
Prompt few-shot:

Esempio 1:
Recensione: "Consegna velocissima, prodotto difettoso."
Sentimento: misto

Esempio 2:
Recensione: "Tutto perfetto, lo consiglio."
Sentimento: positivo

Ora classifica questa:
Recensione: "Il prodotto è arrivato in ritardo ma la
qualità è eccellente."
Sentimento: ?
```

Fornendo esempi, stai effettivamente "restringendo il contesto" in modo molto più specifico di quanto farebbe una semplice istruzione: mostri esattamente il formato di risposta desiderato (qui, "misto" come categoria che forse non sarebbe stata scelta in zero-shot), il livello di dettaglio, lo stile. Il few-shot è particolarmente utile quando il compito è ambiguo, specifico di un dominio, o quando vuoi un formato di output molto preciso che difficilmente il modello indovinerebbe da una sola descrizione testuale.

### Chain-of-thought prompting

**Chain-of-thought** (catena di pensiero) significa istruire il modello a esplicitare il proprio ragionamento passo per passo, prima di arrivare alla risposta finale, invece di fornire direttamente una conclusione.

```
Prompt senza chain-of-thought:
"Se un treno parte da Roma alle 14:00 viaggiando a 120 km/h
e deve percorrere 360 km, a che ora arriva?"
→ Rischio: il modello potrebbe generare direttamente una
  risposta, saltando passaggi intermedi, con più probabilità
  di errore nei calcoli

Prompt con chain-of-thought:
"Risolvi questo problema mostrando il ragionamento passo
per passo: Se un treno parte da Roma alle 14:00 viaggiando
a 120 km/h e deve percorrere 360 km, a che ora arriva?"
→ Il modello tende a generare: "Prima calcolo il tempo di
  viaggio: 360 km ÷ 120 km/h = 3 ore. Poi aggiungo questo
  tempo all'orario di partenza: 14:00 + 3 ore = 17:00.
  Risposta: arriva alle 17:00."
```

> **Perché questo funziona, collegandolo a quanto già sai:** ricorda che ogni token generato diventa parte del contesto per il token successivo (Lezione 3.1). Quando il modello genera esplicitamente "360 km ÷ 120 km/h = 3 ore", questo calcolo intermedio diventa disponibile come contesto per generare il passo successivo, riducendo la probabilità di errori che potrebbero verificarsi se il modello dovesse "saltare" direttamente a una conclusione complessa senza passaggi intermedi espliciti nel proprio stesso output.

Questa tecnica anticipa direttamente un concetto centrale del Capitolo 5: il pattern **ReAct**, che vedremo nella Lezione 5.2, estende esattamente questa idea di "ragionamento esplicito prima dell'azione" al contesto degli agenti che devono decidere quali strumenti usare.

---

## 3. Il ruolo del system prompt nella definizione del comportamento

Avevamo introdotto il ruolo `system` nella lezione precedente come "istruzioni che definiscono il comportamento generale per l'intera conversazione". Approfondiamo ora perché questo ruolo è strategicamente diverso dai messaggi `user`.

Un'istruzione inserita nel `system` prompt si applica, concettualmente, **come sfondo costante** per tutta la conversazione, mentre un'istruzione inserita in un singolo messaggio `user` riguarda primariamente quel turno specifico.

```
SYSTEM: "Sei un assistente che risponde sempre in modo
         conciso, massimo 3 frasi per risposta, in
         italiano formale."

USER (turno 1): "Spiegami la fotosintesi"
→ Risposta concisa, 3 frasi, italiano formale

USER (turno 5, molto dopo): "E la respirazione cellulare?"
→ ANCORA concisa, 3 frasi, italiano formale —
  l'istruzione di sistema continua ad applicarsi,
  senza doverla ripetere a ogni turno
```

Questa persistenza è esattamente ciò che rende il system prompt lo strumento giusto per definire **ruolo, tono, vincoli di formato, e regole di comportamento stabili** — mentre i messaggi `user` sono lo strumento giusto per richieste specifiche di quel particolare turno. Questa distinzione, qui vista a livello di utilizzo base, diventerà cruciale nel Capitolo 6 quando parleremo di prompt come artefatti versionati: il system prompt di un agente è tipicamente un file stabile, raramente modificato, mentre i task prompt (costruiti dinamicamente con i dati del turno specifico) cambiano a ogni esecuzione.

---

## 4. Temperature e altri parametri: cosa controllano davvero

Oltre al testo del prompt, le API dei modelli linguistici esposero tipicamente alcuni parametri numerici che influenzano **come** il modello seleziona il token successivo tra quelli ad alta probabilità.

Ricorda, dalla Lezione 3.1, che il modello calcola una distribuzione di probabilità su tutti i token possibili. La **temperature** controlla quanto "audacemente" il modello si allontana dalla scelta più probabile in assoluto:

```
Temperature BASSA (es. 0.1):
Il modello tende quasi sempre a scegliere il token con
probabilità più alta → risposte più prevedibili, coerenti,
ripetibili. Adatta per compiti che richiedono precisione
(calcoli, estrazione di dati, codice)

Temperature ALTA (es. 1.0 o superiore):
Il modello è più disposto a scegliere anche token con
probabilità più basse → risposte più varie, creative,
meno prevedibili. Adatta per compiti creativi (scrittura
narrativa, brainstorming)
```

Un parametro correlato, **top-p** (o nucleus sampling), limita la selezione solo all'insieme più ristretto di token la cui probabilità cumulativa raggiunge una certa soglia, escludendo la "coda" di opzioni molto improbabili — un meccanismo complementare per controllare la varietà delle risposte senza permettere scelte assurde o totalmente fuori contesto.

> **Implicazione pratica diretta:** quando costruiremo agenti nel Capitolo 5, la scelta della temperature non sarà un dettaglio estetico. Un agente che deve eseguire calcoli precisi o seguire un protocollo rigoroso vorrà tipicamente una temperature bassa (comportamento prevedibile, ripetibile); un agente coinvolto in compiti di brainstorming creativo potrebbe beneficiare di una temperature più alta.

---

## 5. I limiti del prompting semplice

Per quanto potenti, le tecniche descritte in questa lezione hanno limiti che è importante riconoscere onestamente, perché motivano direttamente tutto ciò che costruiremo nei capitoli successivi:

- **Il prompting non dà accesso a informazioni che il modello non possiede** (problema risolto dal RAG, Lezione 4.3)
- **Il prompting non permette al modello di eseguire azioni reali nel mondo** — può solo generare testo (problema risolto dal Function Calling, Lezione 4.4)
- **Il prompting non garantisce, da solo, un comportamento coerente su compiti molto lunghi e complessi** che richiedono pianificazione, verifica, correzione (problema affrontato dall'intera architettura agentiva, a partire dal Capitolo 5)

Tieni a mente questi limiti: non significano che il prompting sia "insufficiente" o "superato" — significa che il prompting è la **base fondamentale e indispensabile** su cui si costruiscono tecniche più sofisticate, non un'alternativa a esse.

---

## Esempio Pratico: Trasformare un Prompt Vago in un Prompt Efficace

Prendi questo prompt vago: *"Scrivimi qualcosa sul cambiamento climatico."*

Applicando i principi di questa lezione, potresti trasformarlo in:

```
"Scrivi un paragrafo di massimo 150 parole sul cambiamento
climatico, indirizzato a studenti delle scuole medie.
Usa un linguaggio semplice, evita tecnicismi, e concludi
con un'azione concreta che chiunque può fare per contribuire.

Esempio di tono desiderato:
'Sai che anche piccole azioni quotidiane possono fare
la differenza? Per esempio, spegnere le luci quando esci
da una stanza...'"
```

Nota come questo prompt migliorato combina più tecniche viste in questa lezione: specifica il formato (150 parole, paragrafo), il pubblico (studenti scuole medie, che vincola implicitamente anche il registro), e fornisce un esempio parziale di tono (few-shot, anche se incompleto) — restringendo drasticamente lo spazio delle risposte plausibili rispetto al prompt originale.

---

## Riepilogo

- Il **prompt** è l'unico strumento per influenzare il contesto su cui il modello basa la previsione del token successivo: maggiore precisione nel prompt significa minore ambiguità nello spazio delle risposte plausibili.
- **Zero-shot** si affida alla conoscenza già acquisita dal modello; **few-shot** fornisce esempi espliciti nel prompt; **chain-of-thought** istruisce il modello a esplicitare il ragionamento passo per passo, riducendo errori nei compiti complessi.
- Il **system prompt** definisce comportamento stabile per l'intera conversazione, mentre i messaggi **user** riguardano richieste specifiche di un singolo turno.
- **Temperature** e **top-p** controllano quanto il modello si discosta dalla scelta più probabile: bassa per precisione e coerenza, alta per creatività e varietà.
- Il prompting da solo non risolve l'accesso a informazioni esterne, l'esecuzione di azioni reali, o compiti complessi che richiedono pianificazione — limiti che motivano direttamente RAG, Function Calling e architetture agentive.

---

## Domande di Verifica

1. Perché un prompt più specifico tende a produrre risposte più prevedibili e coerenti, collegando questa osservazione alla definizione di LLM come "previsione del token più probabile dato il contesto"?

2. In quale scenario useresti il few-shot prompting invece dello zero-shot? Costruisci un esempio concreto, diverso da quelli della lezione, in cui fornire esempi sarebbe chiaramente vantaggioso.

3. Se dovessi costruire un assistente che genera codice Python e deve essere assolutamente preciso e prevedibile, quale valore di temperature (basso o alto) scegliere? E se invece dovessi costruire un assistente per generare idee di nomi creativi per un nuovo prodotto?

---

## Connessioni

**Viene da:** Lezione 3.3 — qui rendiamo operativa la distinzione tra ruoli system/user/assistant appena introdotta.

**Porta a:** Lezione 3.5 (Limiti e allucinazioni) — vedremo che, per quanto ben formulato, un prompt non può eliminare completamente alcuni limiti strutturali del modello.

**Ritroverai questi concetti in:** Lezione 5.2 (ReAct e Chain-of-Thought) — la tecnica chain-of-thought vista qui in forma semplice si estenderà a un intero pattern architetturale per gli agenti. Lezione 6.4 (I Prompt come Artefatti) — system prompt e task prompt, qui distinti a livello di utilizzo, diventeranno artefatti professionali versionati e strutturati.
