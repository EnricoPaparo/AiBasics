# ROADMAP — Piano Completo del Corso

**Corso:** Intelligenza Artificiale Applicata — Dalla Teoria alla Costruzione di Agenti Professionali
**Struttura:** 10 Capitoli · 68 Lezioni

---

## CAPITOLO 1 — Il Web come lo Conosciamo

**Obiettivo:** Costruire una mappa mentale precisa di come funziona Internet e cosa significa "interagire con un sistema digitale". Senza questa mappa, i concetti dell'AI applicata galleggiano nel vuoto.

### Lezione 1.1 — Come funziona Internet
Client, server, DNS, HTTP, IP, porta, protocollo. Il viaggio di una richiesta.

### Lezione 1.2 — Siti Web Statici
HTML, CSS, la separazione tra contenuto e presentazione. Vantaggi e limiti.

### Lezione 1.3 — Siti Web Dinamici
Backend, database, il ciclo richiesta → elaborazione → risposta dinamica.

### Lezione 1.4 — Web Application
SPA, frontend e backend separati, stato dell'applicazione.

### Lezione 1.5 — Le API
REST API, endpoint, metodo, payload, JSON/YAML, autenticazione con API Key.

---

## CAPITOLO 2 — Git e GitHub

**Obiettivo:** Padroneggiare il version control professionale. Git è lo strumento quotidiano di ogni sviluppatore — e i pattern di branching ispirano direttamente i pattern dei workflow multi-agente.

### Lezione 2.1 — Version Control e Git
Commit, staging area, repository. I comandi fondamentali, .gitignore, ciclo di lavoro tipico.

### Lezione 2.2 — Branch, Merge e Conflitti
Branch come puntatori, merge, rebase, risoluzione dei conflitti, strategie di branching (Git Flow, trunk-based).

### Lezione 2.3 — GitHub e Lavoro Collaborativo
Remote repositories, push/pull/fetch, Pull Request workflow, code review, fork, Issues.

### Lezione 2.4 — GitHub Actions e CI/CD
Cos'è CI/CD, anatomia di un workflow YAML, trigger, job paralleli, matrix strategy, secrets, branch protection.

---

## CAPITOLO 3 — L'Intelligenza Artificiale: Cosa È Davvero

**Obiettivo:** Demistificare l'AI. Non magia, non sentimenti, non coscienza — ma statistica, pattern e previsione. Chi capisce cosa fa davvero un modello AI non ne avrà mai paura né ne sopravvaluterà i limiti.

### Lezione 3.1 — AI: Storia e Definizioni
Definizione operativa, AI tradizionale vs ML, i grandi rami, la differenza tra AI stretta e AGI.

### Lezione 3.2 — Machine Learning
Il paradigma dati → pattern → previsione. Supervisionato, non supervisionato, per rinforzo. Overfitting.

### Lezione 3.3 — Reti Neurali e Deep Learning
Neuroni artificiali, strati, backpropagation intuitiva, perché il DL ha rivoluzionato l'AI dal 2012.

### Lezione 3.4 — NLP e il Problema del Linguaggio
Natural Language Processing, embedding, spazi vettoriali, similarità semantica.

### Lezione 3.5 — L'architettura Transformer
Il paper "Attention Is All You Need", meccanismo di Attention, encoder/decoder, perché scala.

---

## CAPITOLO 4 — I Modelli Linguistici (LLM)

**Obiettivo:** Capire cosa sono realmente gli LLM, come vengono costruiti, cosa possono fare e — altrettanto importante — cosa non possono fare. Trasforma l'utente da consumatore inconsapevole a operatore consapevole.

### Lezione 4.1 — Cos'è un LLM
Previsione del token successivo, token, parametri, differenza tra modello e prodotto.

### Lezione 4.2 — Training, Fine-tuning e RLHF
Pre-training, fine-tuning, RLHF, modello base vs modello istruito, costi computazionali.

### Lezione 4.3 — Anatomia di un Prodotto AI
ChatGPT/Claude come app su LLM via API, context window, system/user/assistant, panoramica provider.

### Lezione 4.4 — Il Prompting
Zero-shot, few-shot, chain-of-thought. Temperature, top-p. Limiti del prompting semplice.

### Lezione 4.5 — Limiti e Allucinazioni
Allucinazioni strutturali, knowledge cutoff, mancanza di stato, mancanza di azione, bias.

### Lezione 4.6 — Il Context Window
Cos'è il context window, token counting, input vs output, perché si riempie, conseguenze pratiche.

### Lezione 4.7 — Gestire il Contesto
Sliding window, summarization, RAG come memoria esterna, budget del contesto, prompt caching.

### Lezione 4.8 — Token Economics e Costi
Prezzi input/output per provider, costi aggregati, ottimizzazione, routing intelligente.

### Lezione 4.9 — Fine-Tuning: Quando e Come
Prompting vs RAG vs fine-tuning: albero decisionale. Dataset JSONL, OpenAI fine-tuning API, LoRA, evaluation.

---

## CAPITOLO 5 — Strumenti e Infrastruttura AI

**Obiettivo:** Introdurre i componenti tecnologici che trasformano un LLM isolato in un sistema capace di fare cose nel mondo reale. Dalla chiamata API alla struttura di un progetto deployabile.

### Lezione 5.1 — L'API degli LLM
Endpoint, autenticazione, payload, streaming, gestione errori, confronto provider.

### Lezione 5.2 — Output Strutturati e Parser
JSON Mode, Structured Output API, Pydantic, XML alternativo, gestione errori di parsing.

### Lezione 5.3 — RAG: Memoria Esterna
Il problema, la soluzione RAG, vector database, embedding e indicizzazione, limiti.

### Lezione 5.4 — Tool Use / Function Calling
Il meccanismo, il ciclo modello→tool→risultato→modello, definizione di strumenti con JSON Schema.

### Lezione 5.5 — MCP: Model Context Protocol
Lo standard Anthropic, architettura Host/Client/Server, MCP vs Function Calling classico.

### Lezione 5.6 — Memory nei Sistemi AI
In-context, external, episodic, semantic memory. Memoria persistente tra sessioni. Compressione.

### Lezione 5.7 — Vibe Coding
AI-assisted development, rischi e responsabilità, uso corretto, limiti del paradigma.

### Lezione 5.8 — Embeddings e Vector Database
Cosine similarity, come si generano embedding, Chroma/Pinecone/pgvector, chunking strategies, hybrid search.

### Lezione 5.9 — Struttura di un Progetto Python Reale
venv, uv, pyproject.toml, .env e segreti, logging strutturato, configurazione multi-ambiente.

### Lezione 5.10 — Streaming e UX Real-Time
Anthropic SDK streaming, SSE, FastAPI backend, frontend JavaScript, streaming con tool use.

### Lezione 5.11 — Debugging e Osservabilità degli Agenti
Logging strutturato LLM calls, LangSmith tracing, local trace system, prompt inspector, bug comuni e fix.

---

## CAPITOLO 6 — Agenti AI: Architettura e Ragionamento

**Obiettivo:** Passare dalla comprensione dei componenti alla comprensione del sistema agentivo. Un agente non è solo un LLM con strumenti — è un'architettura con un loop, un piano, una memoria e una capacità di correzione.

### Lezione 6.1 — Cos'è un Agente AI
Definizione operativa, i 4 componenti, il loop Observe→Think→Act→Observe, esempi concreti.

### Lezione 6.2 — ReAct e Chain-of-Thought
Chain-of-Thought, ReAct (Reasoning + Acting), Tree of Thoughts, limiti dei pattern.

### Lezione 6.3 — L'Orchestratore
Responsabilità, pianificazione e delega, flusso di controllo, pattern di orchestrazione.

### Lezione 6.4 — Single vs Multi-Agent
Limiti del singolo agente, topologie di sistema, coerenza tra agenti.

### Lezione 6.5 — Errori, Robustezza, Osservabilità
Tipi di errore, retry/fallback/circuit breaker, graceful degradation, logging e tracing.

### Lezione 6.6 — L'Harness
Il loop di esecuzione, tool dispatch, esempi reali (Claude Code, LangGraph).

### Lezione 6.7 — Sicurezza e Prompt Injection
Injection diretta e indiretta, OWASP LLM Top 10, difese pratiche.

### Lezione 6.8 — Async e Concorrenza negli Agenti
async/await, AsyncAnthropic, semafori per rate limiting, fan-out/fan-in, asyncio.Queue pipeline.

---

## CAPITOLO 7 — L'Agent Package

**Obiettivo:** Trasformare uno sviluppatore AI in un ingegnere AI. Un agente non è solo codice — è un pacchetto con struttura precisa, file definiti, interfacce dichiarate e artefatti che evolvono nel tempo.

### Lezione 7.1 — YAML e Frontmatter
Sintassi YAML, frontmatter in Markdown, parsing, validazione, convenzioni di naming.

### Lezione 7.2 — L'Agent Package
Struttura directory di un agente professionale, il file agent.yaml, perché questa struttura.

### Lezione 7.3 — Agent Card
Documento di identità di un agente, standard emergenti (A2A, Anthropic), versioning.

### Lezione 7.4 — Prompt come Artefatti
Anatomia di un prompt professionale, template vs istanza, versionamento in git, prompt per ruolo.

### Lezione 7.5 — Contratti tra Agenti
JSON Schema e Pydantic, input/output schema, validazione automatica, gestione violazioni.

### Lezione 7.6 — Gli Handoff
Trasferimento formale di contesto e stato, handoff package, formati sincrono e asincrono.

### Lezione 7.7 — Skills e Skill Library
Skill come competenza riutilizzabile, skill library, skill injection, governance.

### Lezione 7.8 — Prompt Versioning Pratico
Semantic versioning per prompt, suite di regressione, CI/CD per prompt, confronto A/B automatizzato.

---

## CAPITOLO 8 — Workflow Multi-Agente

**Obiettivo:** Costruire workflow multi-agente completi, dalla progettazione del grafo all'implementazione con LangGraph, fino al testing e al deployment.

### Lezione 8.1 — Progettare un Workflow
Pipeline vs workflow, grafo agentivo, checkpoint, pattern di design, protocollo A2A.

### Lezione 8.2 — LangGraph
StateGraph, nodi/archi/archi condizionali, nodi paralleli, cicli controllati, checkpointing.

### Lezione 8.3 — Il Layer di Review
Pattern Critic-Agent, criteri di review strutturati, ciclo produce→critica→revisione→approvazione.

### Lezione 8.4 — Human-in-the-Loop
Punti di intervento umano, interrupt-and-wait, async review, policy di escalation.

### Lezione 8.5 — Valutazione dei Workflow
Metriche per agente vs sistema, LLM-as-judge, evals automatizzate, regression testing.

### Lezione 8.6 — Testing e Valutazione degli LLM
Evals, dataset di test, LLM-as-judge avanzato, red teaming, CI/CD gate.

### Lezione 8.7 — Deployment e Ambienti
Ambienti local/staging/production, secrets management, hosting options, rate limiting, monitoring, rollback.

---

## CAPITOLO 9 — Sistemi Auto-Evolutivi

**Obiettivo:** Un sistema agentivo maturo non è statico — impara dall'esperienza, migliora i propri prompt, accumula conoscenza e riduce gli errori nel tempo. Questo capitolo affronta la frontiera dell'AI engineering professionale.

### Lezione 9.1 — Self-Reflection e Self-Critique
Pattern Reflexion, self-critique online e offline, ciclo act→reflect→revise, rischi.

### Lezione 9.2 — Prompt Auto-Evolutivi
Automatic Prompt Optimization, ciclo di miglioramento, DSPy, limiti e rischi.

### Lezione 9.3 — Riassorbimento della Conoscenza
Memoria episodica, sintesi periodica, flywheel cognitivo, governance della knowledge base.

### Lezione 9.4 — Governance e Versioning
Ciclo di vita degli artefatti agentivi, change management, audit trail.

### Lezione 9.5 — Progetto Finale
Design completo di un workflow agentivo supervisionato e auto-evolutivo. Implementazione in LangGraph.

### Lezione 9.6 — Etica e Responsabilità nell'AI
Bias e fairness, GDPR, EU AI Act, disclosure AI, responsabilità professionale.

### Lezione 9.7 — Pubblicare e Monetizzare un Progetto AI
PyPI, Streamlit/Gradio, API as a Service, plugin/extension. Freemium, pay-per-use, SaaS. Rate limiting, costi, compliance.

---

## Riepilogo del Percorso

| Cap. | Titolo | Lez. | Nuclei Tematici |
|------|--------|------|-----------------|
| 0 | Prima di Iniziare | 2 | Benvenuto e aggancio, ambiente di sviluppo, Python, chiave API, "Hello, Claude" |
| 1 | Il Web come lo Conosciamo | 5 | HTTP, client/server, web app, API, JSON/YAML |
| 2 | Git e GitHub | 4 | Version control, branch, GitHub, CI/CD |
| 3 | L'Intelligenza Artificiale | 5 | ML, DL, NLP, Transformer, Attention |
| 4 | I Modelli Linguistici (LLM) | 9 | LLM, training, prompting, limiti, context, costi, fine-tuning |
| 5 | Strumenti e Infrastruttura AI | 12 | API, RAG, tool use, MCP, memory, embeddings, struttura progetto, streaming, debugging, testing |
| 6 | Agenti AI: Architettura | 8 | Loop agentivo, ReAct, orchestratore, multi-agent, robustezza, harness, sicurezza, async |
| 7 | L'Agent Package | 8 | YAML, package, agent card, prompt artefatti, contratti, handoff, skills, versioning |
| 8 | Workflow Multi-Agente | 7 | Grafo, LangGraph, review layer, HITL, valutazione, testing, deployment |
| 9 | Sistemi Auto-Evolutivi | 8 | Self-reflection, prompt evolutivi, knowledge, governance, progetto finale, etica, monetizzazione, diritto |
| **Totale** | | **68 lezioni** | **Fondamenti → Strumenti → Agenti → Produzione → Auto-miglioramento** |

---

## Mappa delle Dipendenze

```
Cap.1 (Web) → Cap.2 (Git) → Cap.3 (AI) → Cap.4 (LLM) → Cap.5 (Infrastruttura)
                                                                    │
                                              ┌─────────────────────┤
                                              ▼                     ▼
                                          Cap.6 (Agenti) → Cap.7 (Package)
                                                                    │
                                                                    ▼
                                                          Cap.8 (Workflow)
                                                                    │
                                                                    ▼
                                                          Cap.9 (Evoluzione)
```

I Capitoli 1–5 sono fondamenta teoriche e tecnologiche.
Il Capitolo 6 è il ponte concettuale verso i sistemi reali.
I Capitoli 7–9 sono il corpus ingegneristico professionale.
