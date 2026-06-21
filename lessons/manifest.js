const MANIFEST_DATA = {
  "corso": "Intelligenza Artificiale Applicata",
  "sottotitolo": "Dalla Teoria alla Costruzione di Agenti Professionali",
  "versione": "2.0",
  "anno": "2026",
  "totale_lezioni": 67,
  "roadmap": [
    {
      "id": "capitolo-00-setup",
      "numero": 0,
      "titolo": "Prima di Iniziare",
      "icona": "⚡",
      "colore": "#00ff41",
      "lezioni": [
        {
          "id": "00-01-ambiente-sviluppo",
          "titolo": "Ambiente di Sviluppo"
        }
      ]
    },
    {
      "id": "capitolo-01-il-web",
      "numero": 1,
      "titolo": "Il Web come lo Conosciamo",
      "icona": "⬡",
      "colore": "#00ff41",
      "lezioni": [
        {
          "id": "01-01-come-funziona-internet",
          "titolo": "Come funziona Internet"
        },
        {
          "id": "01-02-siti-web-statici",
          "titolo": "Siti Web Statici"
        },
        {
          "id": "01-03-siti-web-dinamici",
          "titolo": "Siti Web Dinamici"
        },
        {
          "id": "01-04-web-application",
          "titolo": "Web Application"
        },
        {
          "id": "01-05-le-api",
          "titolo": "Le API"
        }
      ]
    },
    {
      "id": "capitolo-02-git-github",
      "numero": 2,
      "titolo": "Git e GitHub",
      "icona": "◎",
      "colore": "#f05033",
      "lezioni": [
        {
          "id": "02-01-version-control-git",
          "titolo": "Version Control e Git"
        },
        {
          "id": "02-02-branch-merge-conflitti",
          "titolo": "Branch, Merge e Conflitti"
        },
        {
          "id": "02-03-github-collaborazione",
          "titolo": "GitHub e Lavoro Collaborativo"
        },
        {
          "id": "02-04-github-actions-cicd",
          "titolo": "GitHub Actions e CI/CD"
        }
      ]
    },
    {
      "id": "capitolo-03-intelligenza-artificiale",
      "numero": 3,
      "titolo": "L'Intelligenza Artificiale: Cosa È Davvero",
      "icona": "◈",
      "colore": "#00d4ff",
      "lezioni": [
        {
          "id": "03-01-ai-storia-definizioni",
          "titolo": "AI: Storia e Definizioni"
        },
        {
          "id": "03-02-machine-learning",
          "titolo": "Machine Learning"
        },
        {
          "id": "03-03-reti-neurali-deep-learning",
          "titolo": "Reti Neurali e Deep Learning"
        },
        {
          "id": "03-04-nlp-problema-linguaggio",
          "titolo": "NLP e il Problema del Linguaggio"
        },
        {
          "id": "03-05-transformer",
          "titolo": "L'architettura Transformer"
        }
      ]
    },
    {
      "id": "capitolo-04-llm",
      "numero": 4,
      "titolo": "I Modelli Linguistici (LLM)",
      "icona": "◉",
      "colore": "#ff0080",
      "lezioni": [
        {
          "id": "04-01-cose-un-llm",
          "titolo": "Cos'è un LLM"
        },
        {
          "id": "04-02-training-finetuning-rlhf",
          "titolo": "Training, Fine-tuning e RLHF"
        },
        {
          "id": "04-03-anatomia-prodotto-ai",
          "titolo": "Anatomia di un Prodotto AI"
        },
        {
          "id": "04-04-prompting",
          "titolo": "Il Prompting"
        },
        {
          "id": "04-05-limiti-allucinazioni",
          "titolo": "Limiti e Allucinazioni"
        },
        {
          "id": "04-06-context-window",
          "titolo": "Il Context Window"
        },
        {
          "id": "04-07-gestire-il-contesto",
          "titolo": "Gestire il Contesto"
        },
        {
          "id": "04-08-token-economics",
          "titolo": "Token Economics e Costi"
        },
        {
          "id": "04-09-fine-tuning",
          "titolo": "Fine-Tuning: Quando e Come"
        }
      ]
    },
    {
      "id": "capitolo-05-strumenti-infrastruttura",
      "numero": 5,
      "titolo": "Strumenti e Infrastruttura AI",
      "icona": "⬢",
      "colore": "#ffd700",
      "lezioni": [
        {
          "id": "05-01-api-llm",
          "titolo": "L'API degli LLM"
        },
        {
          "id": "05-02-output-strutturati-parser",
          "titolo": "Output Strutturati e Parser"
        },
        {
          "id": "05-08-embeddings-vector-db",
          "titolo": "Embeddings e Vector Database"
        },
        {
          "id": "05-03-rag",
          "titolo": "RAG: Memoria Esterna"
        },
        {
          "id": "05-04-tool-use-function-calling",
          "titolo": "Tool Use / Function Calling"
        },
        {
          "id": "05-05-mcp-model-context-protocol",
          "titolo": "MCP: Model Context Protocol"
        },
        {
          "id": "05-06-memory",
          "titolo": "Memory nei Sistemi AI"
        },
        {
          "id": "05-07-vibe-coding",
          "titolo": "Vibe Coding"
        },
        {
          "id": "05-09-struttura-progetto-python",
          "titolo": "Struttura di un Progetto Python Reale"
        },
        {
          "id": "05-10-streaming-ux-realtime",
          "titolo": "Streaming e UX Real-Time"
        },
        {
          "id": "05-11-debugging-osservabilita",
          "titolo": "Debugging e Osservabilità degli Agenti"
        },
        {
          "id": "05-12-come-testare-un-agente",
          "titolo": "Come Testare un Agente"
        }
      ]
    },
    {
      "id": "capitolo-06-agenti-architettura",
      "numero": 6,
      "titolo": "Agenti AI: Architettura e Ragionamento",
      "icona": "★",
      "colore": "#ff6b00",
      "lezioni": [
        {
          "id": "06-01-cose-un-agente",
          "titolo": "Cos'è un Agente AI"
        },
        {
          "id": "06-02-react-cot-pattern",
          "titolo": "ReAct e Chain-of-Thought"
        },
        {
          "id": "06-03-orchestratore",
          "titolo": "L'Orchestratore"
        },
        {
          "id": "06-04-single-vs-multi-agent",
          "titolo": "Single vs Multi-Agent"
        },
        {
          "id": "06-05-errori-robustezza-osservabilita",
          "titolo": "Errori, Robustezza, Osservabilità"
        },
        {
          "id": "06-06-harness",
          "titolo": "L'Harness"
        },
        {
          "id": "06-07-sicurezza-prompt-injection",
          "titolo": "Sicurezza e Prompt Injection"
        },
        {
          "id": "06-08-async-concorrenza",
          "titolo": "Async e Concorrenza negli Agenti"
        }
      ]
    },
    {
      "id": "capitolo-07-agent-package",
      "numero": 7,
      "titolo": "L'Agent Package",
      "icona": "◆",
      "colore": "#7700ff",
      "lezioni": [
        {
          "id": "07-01-yaml-frontmatter",
          "titolo": "YAML e Frontmatter"
        },
        {
          "id": "07-02-agent-package",
          "titolo": "L'Agent Package"
        },
        {
          "id": "07-03-agent-card",
          "titolo": "Agent Card"
        },
        {
          "id": "07-04-prompt-come-artefatti",
          "titolo": "Prompt come Artefatti"
        },
        {
          "id": "07-05-contratti-tra-agenti",
          "titolo": "Contratti tra Agenti"
        },
        {
          "id": "07-06-handoff",
          "titolo": "Gli Handoff"
        },
        {
          "id": "07-07-skills-skill-library",
          "titolo": "Skills e Skill Library"
        },
        {
          "id": "07-08-prompt-versioning",
          "titolo": "Prompt Versioning Pratico"
        }
      ]
    },
    {
      "id": "capitolo-08-workflow-multi-agente",
      "numero": 8,
      "titolo": "Workflow Multi-Agente",
      "icona": "⬣",
      "colore": "#00ffcc",
      "lezioni": [
        {
          "id": "08-01-progettare-workflow",
          "titolo": "Progettare un Workflow"
        },
        {
          "id": "08-02-langgraph",
          "titolo": "LangGraph"
        },
        {
          "id": "08-03-review-layer",
          "titolo": "Il Layer di Review"
        },
        {
          "id": "08-04-human-in-the-loop",
          "titolo": "Human-in-the-Loop"
        },
        {
          "id": "08-05-valutazione-workflow",
          "titolo": "Valutazione dei Workflow"
        },
        {
          "id": "08-06-testing-evals",
          "titolo": "Testing e Valutazione degli LLM"
        },
        {
          "id": "08-07-deployment",
          "titolo": "Deployment e Ambienti"
        }
      ]
    },
    {
      "id": "capitolo-09-sistemi-auto-evolutivi",
      "numero": 9,
      "titolo": "Sistemi Auto-Evolutivi",
      "icona": "∞",
      "colore": "#ff00ff",
      "lezioni": [
        {
          "id": "09-01-self-reflection",
          "titolo": "Self-Reflection e Self-Critique"
        },
        {
          "id": "09-02-prompt-auto-evolutivi",
          "titolo": "Prompt Auto-Evolutivi"
        },
        {
          "id": "09-03-riassorbimento-conoscenza",
          "titolo": "Riassorbimento della Conoscenza"
        },
        {
          "id": "09-04-governance-versioning",
          "titolo": "Governance e Versioning"
        },
        {
          "id": "09-05-progetto-finale",
          "titolo": "Progetto Finale"
        },
        {
          "id": "09-06-etica-responsabilita",
          "titolo": "Etica e Responsabilità nell'AI"
        },
        {
          "id": "09-07-pubblicare-monetizzare",
          "titolo": "Pubblicare e Monetizzare un Progetto AI"
        },
        {
          "id": "09-08-ai-e-diritto-in-italia",
          "titolo": "AI e Diritto in Italia"
        }
      ]
    }
  ]
};