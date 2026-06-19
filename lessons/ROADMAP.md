# ROADMAP — Piano Completo del Corso AISchool

**Corso:** Intelligenza Artificiale Applicata — Dalla Teoria alla Costruzione di Agenti Professionali
**Livello:** Principianti → Avanzato (livello ingegneristico professionale)
**Struttura:** 8 Capitoli · 43 Lezioni

---

## CAPITOLO 1 — Il Web come lo Conosciamo

**Obiettivo:** Costruire una mappa mentale precisa di come funziona Internet e cosa significa "interagire con un sistema digitale". Senza questa mappa, i concetti dell'AI applicata galleggiano nel vuoto.

---

### Lezione 1.1 — Come funziona Internet: client, server e il viaggio di una richiesta

**Argomenti:**
- Cos'è una rete e perché esiste
- Il modello Client–Server: chi chiede, chi risponde
- Cosa succede quando scrivi un URL nel browser (DNS, HTTP, risposta)
- IP, porta, protocollo: il linguaggio delle macchine
- Il browser come interprete di contenuti

**Dipendenze:** nessuna — prima lezione del corso

---

### Lezione 1.2 — Siti Web Statici: HTML, CSS e il concetto di documento

**Argomenti:**
- Cos'è HTML: la struttura di una pagina come documento
- Cos'è CSS: la separazione tra contenuto e presentazione
- Cosa significa "statico": il file è fisso, il server lo consegna così com'è
- Vantaggi e limiti dei siti statici
- Esempi concreti: una pagina personale, una brochure online

**Dipendenze:** 1.1

---

### Lezione 1.3 — Siti Web Dinamici: server, database e la nascita della logica

**Argomenti:**
- Cosa cambia rispetto al sito statico
- Il ruolo del server backend: ricevere una richiesta, elaborarla, costruire la risposta
- Cos'è un database e perché serve
- Il ciclo richiesta → elaborazione → risposta dinamica
- Esempi concreti: un blog con commenti, una pagina prodotto in tempo reale

**Dipendenze:** 1.2

---

### Lezione 1.4 — Web Application: quando il browser diventa un'interfaccia

**Argomenti:**
- La differenza tra "consultare" un sito e "usare" un'applicazione
- Single Page Application (SPA): cos'è e perché è diversa da un sito dinamico
- Frontend e Backend come due sistemi distinti che comunicano
- Il concetto di "stato dell'applicazione"
- Esempi concreti: Google Maps, Notion, Figma nel browser

**Dipendenze:** 1.3

---

### Lezione 1.5 — Le API: il linguaggio universale tra sistemi

**Argomenti:**
- Cos'è un'API (Application Programming Interface)
- REST API: struttura di una richiesta (endpoint, metodo, payload, risposta)
- JSON e YAML: i formati dati standard e le loro differenze d'uso
- Autenticazione con API Key: perché esiste e come funziona
- Esempi concreti: chiamare un'API meteo, un'API di pagamento

**Dipendenze:** 1.4

---

## CAPITOLO 2 — L'Intelligenza Artificiale: Cosa È Davvero

**Obiettivo:** Demistificare l'AI. Non magia, non sentimenti, non coscienza — ma statistica, pattern e previsione. Chi capisce cosa fa davvero un modello AI non ne avrà mai paura né ne sopravvaluterà i limiti.

---

### Lezione 2.1 — Intelligenza Artificiale: storia, definizioni e rami principali

**Argomenti:**
- Cos'è l'AI: definizione operativa, non filosofica
- La differenza tra AI tradizionale (regole esplicite) e Machine Learning
- I grandi rami: ML, Deep Learning, NLP, Computer Vision
- Cosa significa "addestrare" un modello
- La differenza tra AI stretta (task-specific) e AI generale (AGI): dove siamo oggi

**Dipendenze:** 1.5

---

### Lezione 2.2 — Machine Learning: come una macchina impara dai dati

**Argomenti:**
- Il paradigma dell'apprendimento: dati → pattern → previsione
- Apprendimento supervisionato, non supervisionato, per rinforzo (introduzione intuitiva)
- Cos'è un modello: una funzione matematica ottimizzata
- Training, validation, test: il ciclo di vita di un modello
- Overfitting e underfitting spiegati con esempi visivi

**Dipendenze:** 2.1

---

### Lezione 2.3 — Reti Neurali e Deep Learning: il cervello artificiale spiegato bene

**Argomenti:**
- Cos'è un neurone artificiale: pesi, somma, funzione di attivazione
- Come si costruisce una rete a strati
- Il concetto di profondità: perché più strati permettono rappresentazioni più complesse
- Backpropagation spiegata intuitivamente (senza derivate)
- Perché il Deep Learning ha rivoluzionato l'AI dal 2012 in poi

**Dipendenze:** 2.2

---

### Lezione 2.4 — NLP e il problema del linguaggio: perché il testo è difficile per le macchine

**Argomenti:**
- Il Natural Language Processing: la sfida di far "capire" il testo a una macchina
- Come si rappresenta il testo numericamente: bag of words, embeddings, spazi vettoriali
- Il concetto di embedding: parole come punti nello spazio
- La similarità semantica: "re - uomo + donna = regina"
- Perché il contesto è fondamentale e perché i modelli precedenti faticavano a gestirlo

**Dipendenze:** 2.3

---

### Lezione 2.5 — L'architettura Transformer: la rivoluzione che ha reso possibile gli LLM

**Argomenti:**
- Il problema della memoria nelle reti ricorrenti (RNN): perché non scalavano
- Il paper "Attention Is All You Need" (2017): cosa ha cambiato
- Il meccanismo di Attention: come il modello decide cosa è rilevante nel contesto
- Encoder e Decoder: due ruoli distinti
- Perché i Transformer si parallelizzano bene e possono essere addestrati su scala enorme

**Dipendenze:** 2.4

---

## CAPITOLO 3 — I Modelli Linguistici di Grandi Dimensioni (LLM)

**Obiettivo:** Capire cosa sono realmente gli LLM, come vengono costruiti, cosa possono fare e — altrettanto importante — cosa non possono fare. Questo capitolo trasforma l'utente da consumatore inconsapevole a operatore consapevole.

---

### Lezione 3.1 — Cos'è un LLM: previsione del token successivo come intelligenza emergente

**Argomenti:**
- La definizione tecnica: un modello addestrato a predire il token successivo
- Cosa sono i token: non parole, non lettere — qualcosa in mezzo
- Come da un'operazione apparentemente semplice emergono capacità complesse
- I parametri: cosa sono i "miliardi di parametri" di un modello
- La differenza tra modello e prodotto (GPT-4 vs ChatGPT, Claude vs Claude.ai)

**Dipendenze:** 2.5

---

### Lezione 3.2 — Training, Fine-tuning e RLHF: come si costruisce un assistente AI

**Argomenti:**
- Pre-training: addestramento su enormi corpus di testo
- Fine-tuning: adattare un modello base a un compito specifico
- RLHF (Reinforcement Learning from Human Feedback): come si insegna al modello a essere utile e sicuro
- La differenza tra un modello base e un modello istruito (instruct model)
- I costi computazionali e perché non tutti possono addestrare un LLM da zero

**Dipendenze:** 3.1

---

### Lezione 3.3 — Il Portale ChatGPT e i suoi equivalenti: anatomia di un prodotto AI

**Argomenti:**
- ChatGPT come applicazione web che si appoggia a un LLM via API
- La chat come interfaccia: turns, contesto, memoria della conversazione
- Il context window: cos'è, quanto conta, perché ha un limite
- System prompt, user message, assistant message: i ruoli nella conversazione
- Panoramica dei principali prodotti: ChatGPT, Claude, Gemini, Perplexity — cosa li differenzia

**Dipendenze:** 3.2

---

### Lezione 3.4 — Il Prompting: comunicare con un LLM in modo efficace

**Argomenti:**
- Cos'è il prompting e perché la formulazione cambia il risultato
- Zero-shot, few-shot, chain-of-thought: le tecniche fondamentali
- Il ruolo del system prompt nella definizione del comportamento
- Temperature, top-p e altri parametri: cosa controllano davvero
- Limiti del prompting semplice: quando non basta e cosa serve in più

**Dipendenze:** 3.3

---

### Lezione 3.5 — Limiti, allucinazioni e confini degli LLM

**Argomenti:**
- Cosa sono le allucinazioni e perché avvengono strutturalmente
- Il knowledge cutoff: i modelli non sanno cosa è successo dopo il training
- Mancanza di stato: ogni chiamata API è indipendente per il modello
- Mancanza di azione: il modello produce testo, non fa cose nel mondo
- Il bias nei dati di training e le implicazioni etiche e operative

**Dipendenze:** 3.4

---

## CAPITOLO 4 — Strumenti e Infrastruttura per Sistemi AI

**Obiettivo:** Introdurre i componenti tecnologici che trasformano un LLM isolato in un sistema capace di fare cose nel mondo reale. Questo capitolo introduce anche gli standard di comunicazione e strutturazione che reggono i sistemi agentici moderni.

---

### Lezione 4.1 — L'API degli LLM: come si usa un modello da un programma

**Argomenti:**
- Richiamare un LLM via API: endpoint, autenticazione, payload
- La struttura del messaggio: system / user / assistant
- Streaming della risposta: perché le parole arrivano una alla volta
- Gestione degli errori e dei rate limit
- Confronto tra i principali provider: OpenAI, Anthropic, Google, Mistral, provider open source

**Dipendenze:** 3.5, 1.5

---

### Lezione 4.2 — Output Strutturati e Output Parser: forzare il modello a rispondere in formato preciso

**Argomenti:**
- Il problema: il modello risponde in linguaggio naturale, ma il sistema ha bisogno di dati strutturati
- JSON Mode e Structured Output API: come richiedere un output garantito in JSON
- Pydantic e la validazione degli output: definire uno schema e forzare il modello a rispettarlo
- XML come formato alternativo per output strutturati complessi
- Output parser: la componente che trasforma il testo del modello in oggetti del programma
- Gestione degli errori di parsing: cosa fare quando il modello non rispetta il formato

**Dipendenze:** 4.1

---

### Lezione 4.3 — RAG (Retrieval-Augmented Generation): dare memoria esterna ai modelli

**Argomenti:**
- Il problema: il modello non conosce i tuoi documenti né le informazioni recenti
- La soluzione RAG: recupera il contesto → inseriscilo nel prompt → genera
- Vector database: cos'è, come funziona, perché serve (Pinecone, Chroma, Weaviate)
- Il processo di embedding e indicizzazione dei documenti
- Quando usare RAG e quando non basta: i suoi limiti

**Dipendenze:** 4.2

---

### Lezione 4.4 — Tool Use / Function Calling: dare al modello la capacità di agire

**Argomenti:**
- Il problema: il modello produce testo, ma come esegue azioni reali?
- Il meccanismo del Function Calling: il modello decide quale strumento usare e con quali parametri
- Il ciclo completo: modello → richiesta strumento → esecuzione → risultato → modello
- Definizione di uno strumento: nome, descrizione, schema dei parametri (JSON Schema)
- Tool manifest: il documento che elenca tutti gli strumenti disponibili a un agente
- Tool registry: il catalogo centralizzato degli strumenti disponibili nell'intero sistema

**Dipendenze:** 4.2

---

### Lezione 4.5 — MCP (Model Context Protocol): lo standard per connettere agenti a risorse esterne

**Argomenti:**
- Cos'è MCP: il protocollo open sviluppato da Anthropic per connettere LLM a tool e risorse in modo standardizzato
- Il problema che risolve: prima di MCP ogni integrazione era custom e non interoperabile
- L'architettura MCP: Host, Client, Server — chi fa cosa
- MCP Server: come si espone una risorsa o uno strumento tramite protocollo standard
- MCP vs Function Calling classico: quando usare uno, quando l'altro
- Perché MCP è importante per i workflow agentici: interoperabilità, riutilizzo, standardizzazione

**Dipendenze:** 4.4

---

### Lezione 4.6 — Memory nei sistemi AI: breve e lungo termine

**Argomenti:**
- I quattro tipi di memoria in un sistema AI: in-context, external, episodic, semantic
- Come si implementa la memoria persistente tra sessioni
- Il problema del context window: cosa succede quando la conversazione è troppo lunga
- Tecniche di compressione e summarization della memoria
- Quando la memoria è utile e quando diventa un problema (coerenza, privacy, costo)

**Dipendenze:** 4.3, 4.4

---

## CAPITOLO 5 — Agenti AI: Architettura e Ragionamento

**Obiettivo:** Passare dalla comprensione dei componenti alla comprensione del sistema agentivo. Un agente non è solo un LLM con strumenti — è un'architettura con un loop, un piano, una memoria e una capacità di correzione.

---

### Lezione 5.1 — Cos'è un Agente AI: definizione, componenti e loop agentivo

**Argomenti:**
- Definizione operativa di "agente": percepisce, ragiona, agisce, osserva il risultato
- I quattro componenti di un agente: LLM core, memoria, strumenti, obiettivo
- Il loop agentivo: Observe → Think → Act → Observe
- La differenza tra sistema reattivo (risponde a input) e sistema agentivo (persegue obiettivi)
- Esempi concreti di agenti: un agente di ricerca, un agente di codice, un agente di customer service

**Dipendenze:** 4.6

---

### Lezione 5.2 — ReAct, Chain-of-Thought e Pattern di Ragionamento Agentivo

**Argomenti:**
- Chain-of-Thought (CoT): far pensare ad alta voce il modello per migliorare il ragionamento
- ReAct (Reasoning + Acting): il pattern che alterna pensiero esplicito e azione
- Come il modello decide se usare uno strumento o rispondere direttamente
- Tree of Thoughts: esplorare più rami di ragionamento in parallelo
- Limiti di questi pattern: loop, errori a cascata, ragionamento circolare

**Dipendenze:** 5.1

---

### Lezione 5.3 — L'Orchestratore: il direttore d'orchestra del sistema agentivo

**Argomenti:**
- Cos'è un orchestratore e perché è diverso da un semplice agente
- Le responsabilità dell'orchestratore: pianificazione, delega, monitoraggio, sintesi
- Come l'orchestratore riceve un obiettivo ad alto livello e lo scompone in sotto-task
- Il flusso di controllo: come l'orchestratore decide a quale agente delegare e quando
- Pattern di orchestrazione: top-down planning, event-driven, ibrido
- L'orchestratore come stato condiviso del workflow: cosa vede e cosa non vede

**Dipendenze:** 5.2

---

### Lezione 5.4 — Agenti Single vs Multi-Agent: quando un agente non basta

**Argomenti:**
- I limiti di un singolo agente: complessità del task, lunghezza del contesto, specializzazione
- Il concetto di sistema multi-agente: agenti specializzati che collaborano
- Topologie di sistema: pipeline sequenziale, architettura a grafo, architettura a rete
- Esempi concreti e realistici: estrattore + analista + scrittore + reviewer
- Il problema della coerenza: come garantire che agenti diversi parlino lo stesso "linguaggio"

**Dipendenze:** 5.3

---

### Lezione 5.5 — Gestione degli Errori, Robustezza e Osservabilità negli Agenti

**Argomenti:**
- I tipi di errore in un sistema agentivo: errori di strumento, loop infiniti, allucinazioni, errori di piano
- Strategie di retry, fallback e circuit breaker
- Come progettare strumenti resistenti agli errori con output prevedibili
- Il concetto di graceful degradation: fallire in modo controllato senza bloccare il sistema
- Logging, tracing e osservabilità: come vedere cosa sta facendo un agente (LangSmith, Langfuse)

**Dipendenze:** 5.4

---

## CAPITOLO 6 — L'Agent Package: Struttura, Contratti e Artefatti

**Obiettivo:** Questo è il capitolo che trasforma uno sviluppatore AI in un ingegnere AI. Un agente non è solo codice che gira — è un pacchetto con una struttura precisa, file definiti, interfacce dichiarate e artefatti che evolvono nel tempo.

---

### Lezione 6.1 — YAML e Frontmatter: il linguaggio dei metadati strutturati

**Argomenti:**
- Cos'è YAML: sintassi, tipi di dati, differenze rispetto a JSON
- Il frontmatter: blocco YAML all'inizio di un file Markdown che aggiunge metadati machine-readable
- Perché il frontmatter è lo standard per gli artefatti dei workflow agentici
- Esempi concreti: frontmatter di una lezione, di un documento di requisiti, di una agent card
- Come un programma legge e usa il frontmatter: parsing, validazione, routing
- Convenzioni di naming e struttura per frontmatter coerenti in un sistema multi-agente

**Dipendenze:** 5.5, 1.5

---

### Lezione 6.2 — L'Agent Package: struttura di file e directory di un agente professionale

**Argomenti:**
- Cos'è un agent package: l'agente come unità deployabile e autonoma
- La struttura tipo di un package agentivo:
  ```
  /agent-name/
  ├── agent.yaml       ← definizione e configurazione dell'agente
  ├── prompts/         ← prompt di sistema, task prompt, few-shot examples
  ├── tools/           ← definizione e implementazione degli strumenti
  ├── skills/          ← competenze riutilizzabili iniettate a runtime
  ├── schemas/         ← contratti di input e output (JSON Schema)
  ├── memory/          ← configurazione e seed della memoria
  ├── evals/           ← test, valutazioni, casi di test
  └── README.md        ← documentazione human-readable dell'agente
  ```
- Il file `agent.yaml`: nome, ruolo, modello, strumenti, memoria, parametri, dipendenze
- Perché questa struttura rende l'agente manutenibile, testabile e sostituibile
- La differenza tra un agente "script" e un agente "pacchetto"

**Dipendenze:** 6.1

---

### Lezione 6.3 — Agent Card: il documento di identità di un agente

**Argomenti:**
- Cos'è una Agent Card: il documento standardizzato che descrive un agente in modo completo e interoperabile
- Lo standard emergente: come Google (A2A protocol), Anthropic e OpenAI stanno convergendo su un formato comune
- Le sezioni di una Agent Card: identità, capacità, strumenti disponibili, schema di input/output, limiti, contatti, versione
- La differenza tra Agent Card (descrizione per altri sistemi) e agent.yaml (configurazione interna)
- Come un orchestratore usa le Agent Card per decidere quale agente chiamare per quale task
- Agent Card come contratto di servizio: versioning, deprecation, compatibilità

**Dipendenze:** 6.2

---

### Lezione 6.4 — I Prompt come Artefatti: struttura, template, istanze e versionamento

**Argomenti:**
- I prompt non sono stringhe casuali: sono artefatti con struttura e ciclo di vita
- Anatomia di un prompt professionale: ruolo, contesto, istruzioni, vincoli, formato output, esempi
- Prompt template vs Prompt instance: la differenza tra il template riutilizzabile e l'istanza compilata a runtime con i dati reali
- Il file di prompt come documento `.md` strutturato: frontmatter YAML + corpo del prompt
- Versionamento dei prompt in git: perché un prompt è come un file di codice
- Prompt per ruolo: system prompt, task prompt, few-shot examples, output format prompt
- La separazione tra prompt stabili (raramente modificati) e prompt dinamici (costruiti a runtime)

**Dipendenze:** 6.2

---

### Lezione 6.5 — Contratti tra Agenti: schemi di input/output e validazione

**Argomenti:**
- Cos'è un contratto in un sistema distribuito: la promessa su cosa entra e cosa esce
- Perché i contratti sono critici nei sistemi multi-agente: l'agente A non può "sperare" che B risponda nel formato giusto
- Definire contratti con JSON Schema o Pydantic: campi, tipi, vincoli, valori obbligatori e facoltativi
- Il file `schema.json` nel package dell'agente: input schema e output schema separati
- Validazione automatica dell'output: come verificare che l'agente rispetti il contratto
- Cosa fare quando il contratto viene violato: errori strutturati, retry, escalation

**Dipendenze:** 6.3, 4.2

---

### Lezione 6.6 — Gli Handoff: come un agente passa il controllo a un altro

**Argomenti:**
- Cos'è un Handoff: il trasferimento formale di contesto, stato e responsabilità tra agenti
- La differenza tra chiamata sincrona (A aspetta la risposta di B) e handoff (A passa a B e termina)
- Cosa contiene un handoff package: output corrente + contesto rilevante + istruzioni per il successivo + metadati di tracciabilità
- Il formato del documento di handoff come `.md` strutturato con frontmatter: sezioni standard, artefatti allegati, stato
- Handoff sincroni vs asincroni: implicazioni per il design del workflow
- Esempi concreti: handoff da Requirement Analyst Agent a Architect Agent con documento `.md` completo

**Dipendenze:** 6.5

---

### Lezione 6.7 — Skills e Skill Library: competenze riutilizzabili tra agenti

**Argomenti:**
- Cos'è una "skill" in un sistema agentivo: un'istruzione o capacità impacchettata e riutilizzabile
- La differenza tra tool (azione = codice eseguibile) e skill (competenza = istruzione strutturata)
- La skill library: un catalogo condiviso di skill disponibili a tutti gli agenti del sistema
- Struttura di una skill: frontmatter YAML (nome, versione, descrizione, prerequisiti) + corpo istruzioni
- Come un agente carica una skill a runtime: skill injection nel prompt
- Aggiornare una skill aggiorna il comportamento di tutti gli agenti che la usano
- Governance della skill library: chi può aggiungere, modificare o deprecare una skill

**Dipendenze:** 6.4

---

## CAPITOLO 7 — Workflow Multi-Agente: Design e Implementazione

**Obiettivo:** Costruire workflow multi-agente completi, partendo dalla progettazione del grafo fino all'implementazione con LangGraph. Questo capitolo mette insieme tutti i componenti dei capitoli precedenti in sistemi funzionanti e supervisionati.

---

### Lezione 7.1 — Progettare un Workflow Agentivo: dal problema al grafo

**Argomenti:**
- La differenza tra pipeline (statica, sequenziale) e workflow (adattivo, condizionale)
- Come mappare un processo reale in un grafo agentivo: nodi, archi, condizioni di branch
- Input, output e stato globale del workflow
- Il concetto di checkpoint: quando fermarsi, verificare, e decidere se continuare
- Pattern di design: sequenziale, parallelo, fan-out/fan-in, iterativo con ciclo
- Il protocollo A2A (Agent-to-Agent): lo standard Google per la comunicazione inter-agente in sistemi eterogenei

**Dipendenze:** 6.7

---

### Lezione 7.2 — LangGraph: costruire workflow come grafi orientati con stato

**Argomenti:**
- LangGraph: cos'è, perché è diverso da LangChain semplice, quando usarlo
- Il concetto di StateGraph: un grafo dove ogni nodo legge e scrive su uno stato condiviso
- Definire nodi (agenti, funzioni, tool call), archi (transizioni), e archi condizionali
- Nodi paralleli: eseguire più agenti contemporaneamente e raccogliere i risultati
- Il concetto di ciclo controllato in LangGraph: come iterare senza loop infiniti
- Persistenza dello stato tra run: checkpointing e memoria a lungo termine in LangGraph

**Dipendenze:** 7.1, 4.5

---

### Lezione 7.3 — Il Layer di Review: agenti critici e quality assurance nel workflow

**Argomenti:**
- Cos'è un Review Layer: un agente dedicato a valutare l'output di un agente precedente
- Pattern Critic-Agent: un agente produce, un altro critica, il primo rivede
- Come definire i criteri di review in modo strutturato: rubrica di valutazione come schema
- Il ciclo produce → critica → revisione → (ri-critica) → approvazione
- Quando il review automatico è sufficiente e quando serve escalation all'umano
- Implementazione pratica: il reviewer come nodo condizionale nel grafo LangGraph

**Dipendenze:** 7.2

---

### Lezione 7.4 — Supervisione Umana: Human-in-the-Loop come componente architetturale

**Argomenti:**
- Perché la supervisione umana è necessaria: non solo etica, ma tecnica
- I punti di intervento umano nel grafo: approval nodes, correction nodes, escalation nodes
- Pattern HITL: interrupt-and-wait (sincrono) vs async review (asincrono con coda)
- Come progettare l'interfaccia di supervisione: cosa mostrare all'operatore, come raccogliere il feedback
- Integrare il feedback umano nel workflow: come l'approvazione o la correzione modifica il percorso del grafo
- Policy di escalation: regole basate su confidence score, tipo di task, valore in gioco

**Dipendenze:** 7.3

---

### Lezione 7.5 — Valutazione dei Workflow: metriche, evals e testing end-to-end

**Argomenti:**
- Il problema della valutazione in sistemi multi-agente: non si misura solo l'output finale
- Metriche per agente singolo vs metriche di sistema (latenza, tasso di errore per nodo, cicli di revisione)
- LLM-as-judge: vantaggi, rischi e come usarlo in modo affidabile
- Evals automatizzate: costruire una test suite per il workflow
- Regression testing: come garantire che una modifica a un agente non rompa il sistema
- Osservabilità in produzione: dashboards, alert, tracce di esecuzione

**Dipendenze:** 7.4

---

## CAPITOLO 8 — Sistemi Agentici che si Auto-Migliorano

**Obiettivo:** Un sistema agentivo maturo non è statico — impara dall'esperienza, migliora i propri prompt, accumula conoscenza e riduce gli errori nel tempo. Questo capitolo affronta la frontiera dell'AI engineering professionale.

---

### Lezione 8.1 — Self-Reflection e Self-Critique: l'agente che valuta sé stesso

**Argomenti:**
- Il pattern Reflexion: un agente che valuta la qualità del proprio output dopo averlo prodotto
- Come implementare la self-critique: il modello come giudice di sé stesso
- Il ciclo act → reflect → revise → re-evaluate
- La differenza tra self-critique durante il task (online) e post-task (offline)
- I rischi: echo chamber, bias di conferma, spirali di auto-valutazione senza convergenza

**Dipendenze:** 7.5

---

### Lezione 8.2 — Prompt Auto-Evolutivi: come i prompt migliorano nel tempo

**Argomenti:**
- Il problema: un prompt scritto oggi è subottimale domani, ma chi lo aggiorna?
- Automatic Prompt Optimization (APO): usare un LLM per migliorare i prompt di un altro LLM
- Il ciclo: esegui → valuta output → identifica debolezze → proponi variante del prompt → testa → aggiorna se migliore
- Versionamento dei prompt come prerequisito: senza tracciabilità, l'ottimizzazione automatica è cieca
- DSPy e altri framework per l'ottimizzazione automatica dei prompt
- Limiti e rischi: prompt drift, over-optimization, perdita di interpretabilità

**Dipendenze:** 8.1, 6.4

---

### Lezione 8.3 — Riassorbimento della Conoscenza: la Knowledge Base che cresce con l'uso

**Argomenti:**
- Il problema fondamentale: ogni run dell'agente è stateless, la conoscenza accumulata svanisce
- Memoria episodica: registrare i run passati con input, output, errori e feedback
- Sintesi periodica: un agente "archivista" che consolida le esperienze in regole e pattern
- Come aggiornare la knowledge base del sistema con nuova conoscenza estratta dall'esperienza
- Il concetto di flywheel cognitivo: un sistema che migliora usandosi
- Governance della knowledge base: chi approva le nuove conoscenze, come si versiona, come si fa rollback

**Dipendenze:** 8.2

---

### Lezione 8.4 — Governance, Versioning e Ciclo di Vita degli Artefatti Agentivi

**Argomenti:**
- Gli artefatti di un sistema agentivo: prompt, skill, schemi, tool definition, knowledge base, evals, agent card
- Versionamento con git: come applicare le pratiche software engineering agli artefatti AI
- Il ciclo di vita di un artefatto: bozza → review → approvazione → deploy → monitoraggio → aggiornamento
- Change management: come propagare un aggiornamento a uno schema o una skill senza rompere il sistema
- Audit trail: tracciare chi ha cambiato cosa, quando e perché
- La governance come problema organizzativo oltre che tecnico

**Dipendenze:** 8.3

---

### Lezione 8.5 — Progetto Finale: Costruzione di un Workflow Agentivo Supervisionato e Auto-Evolutivo

**Argomenti:**
- Definizione del problema: scegliere un caso d'uso reale e complesso
- Design completo dell'architettura: agenti, orchestratore, skill library, contratti, handoff, review layer, supervisione umana
- Struttura completa dei package agentivi: creare tutti i file per ogni agente del sistema (agent.yaml, agent card, prompt, schemi, skills)
- Implementazione guidata in LangGraph: dal diagramma al codice funzionante
- Aggiunta del layer di auto-miglioramento: self-critique, memoria episodica, ottimizzazione prompt
- Testing e valutazione del sistema completo
- Discussione critica: cosa funziona, cosa migliorerebbe, dove il sistema ha i suoi limiti strutturali

**Dipendenze:** 8.4

---

## Riepilogo del Percorso

| Cap. | Titolo | Lez. | Nuclei Tematici |
|------|--------|------|-----------------|
| 1 | Il Web come lo Conosciamo | 5 | HTTP, client/server, web app, API, JSON/YAML |
| 2 | L'Intelligenza Artificiale | 5 | ML, DL, NLP, Transformer, Attention |
| 3 | Large Language Models | 5 | LLM, training, prompting, limiti, prodotti AI |
| 4 | Strumenti e Infrastruttura | 6 | API LLM, output parser, RAG, Function Calling, MCP, memoria |
| 5 | Agenti AI — Architettura | 5 | Loop agentivo, ReAct, Orchestratore, multi-agent, robustezza |
| 6 | L'Agent Package | 7 | YAML/frontmatter, package structure, agent card, prompt artefatti, contratti, handoff, skills |
| 7 | Workflow Multi-Agente | 5 | Grafo, LangGraph, review layer, HITL, valutazione, A2A |
| 8 | Sistemi Auto-Evolutivi | 5 | Self-reflection, prompt auto-evolutivi, knowledge absorption, governance, progetto finale |
| **Totale** | | **43 lezioni** | **Fondamenti → Produzione → Auto-miglioramento** |

---

## Mappa delle Dipendenze

```
Cap.1 → Cap.2 → Cap.3 → Cap.4 → Cap.5
                                   │
                        ┌──────────┤
                        ▼          ▼
                      Cap.6 → Cap.7 → Cap.8
                   (Package) (Workflow) (Evoluzione)
```

I Capitoli 1–4 sono fondamenta teoriche e tecnologiche.
Il Capitolo 5 è il ponte concettuale verso i sistemi reali.
I Capitoli 6–8 sono il corpus ingegneristico professionale.
