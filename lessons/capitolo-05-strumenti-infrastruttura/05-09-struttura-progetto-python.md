---
titolo: "Struttura di un Progetto Python Reale"
durata_stimata: "20 min"
difficolta: "Base"
---

# Struttura di un Progetto Python Reale

Sai scrivere codice Python. Sai usare le API di un LLM. Ma quando passi da "script che funziona sul mio computer" a "progetto che posso condividere, mantenere, e deployare", hai bisogno di struttura. Questa lezione copre le convenzioni usate nei progetti Python professionali.

## Il Problema dello Script Singolo

```python
# main.py (il problema)
import anthropic
import os

API_KEY = "sk-ant-xxxx"  # ← esposto!
client = anthropic.Anthropic(api_key=API_KEY)

# 300 righe di codice mischiate...
```

Questo approccio ha tre problemi: la chiave API è hardcoded nel codice, tutto è in un unico file impossibile da navigare, e non c'è modo di installare il progetto su un'altra macchina senza copiare manualmente le dipendenze.

## La Struttura Standard

```
mio-progetto-ai/
│
├── .env                    # variabili d'ambiente (NON committare!)
├── .env.example            # template senza valori reali (committare)
├── .gitignore
├── pyproject.toml          # metadati e dipendenze del progetto
├── README.md
│
├── src/
│   └── mio_progetto/
│       ├── __init__.py
│       ├── main.py         # entrypoint
│       ├── agent.py        # logica dell'agente
│       ├── tools.py        # tool definitions
│       └── config.py       # configurazione centralizzata
│
└── tests/
    ├── test_agent.py
    └── test_tools.py
```

Per progetti piccoli va bene anche senza la cartella `src/`.

## Ambienti Virtuali

Un **virtual environment** isola le dipendenze del tuo progetto dal resto del sistema. Senza di esso, tutti i tuoi progetti condividono le stesse versioni dei pacchetti — e i conflitti sono inevitabili.

```bash
# Crea e attiva un virtual environment
python -m venv .venv
source .venv/bin/activate    # Linux/Mac
# .venv\Scripts\activate     # Windows

pip install anthropic
deactivate  # quando hai finito
```

Il virtual environment non si committa su Git — aggiungilo a `.gitignore` insieme a `.env` e `__pycache__/`.

### uv — Il Sostituto Moderno di pip

`uv` è uno strumento Rust che sostituisce `pip` e `venv` con performance 10-100x superiori. Sta diventando lo standard de facto:

```bash
pip install uv
uv init mio-progetto && cd mio-progetto
uv add anthropic
uv add --dev pytest
uv run python main.py  # attiva il venv automaticamente
```

## pyproject.toml — Il Cuore del Progetto

```toml
[project]
name = "mio-agente-ai"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = [
    "anthropic>=0.40.0",
    "chromadb>=0.5.0",
    "python-dotenv>=1.0.0",
]

[project.optional-dependencies]
dev = ["pytest>=8.0.0", "pytest-asyncio>=0.23.0"]
```

## Gestire i Segreti con .env

Le API key e le configurazioni sensibili vanno in un file `.env` — mai hardcoded nel codice, mai committate su Git.

```bash
# .env (NON committare)
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
ENVIRONMENT=development
```

```python
# config.py
from dotenv import load_dotenv
import os

load_dotenv()

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
if not ANTHROPIC_API_KEY:
    raise ValueError("ANTHROPIC_API_KEY non trovata nelle variabili d'ambiente")
```

## Logging: Non Usare print()

In produzione, `print()` non basta. Il modulo `logging` permette livelli (DEBUG, INFO, WARNING, ERROR) e destinazioni configurabili:

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

logger.info("Nuova query ricevuta")
logger.error("Errore API: %s", e)
```

---

## Esercizi Pratici

> Tre esercizi a difficoltà crescente. Prova a risolverli da solo prima di aprire il suggerimento.

### Esercizio 1 — Setup di un Progetto 🟢 Base

Crea un nuovo progetto Python con la struttura corretta: `pyproject.toml`, `.env`, `.env.example`, `.gitignore`, e una funzione `chiedi(domanda)` in `agent.py` che legge la API key dall'ambiente (non hardcoded). Verifica che funzioni eseguendo una query semplice.

<details>
<summary>💡 Mostra suggerimento</summary>

**File da creare:**
- `pyproject.toml`: con `name`, `requires-python = ">=3.11"`, e `dependencies = ["anthropic", "python-dotenv"]`
- `.env`: con `ANTHROPIC_API_KEY=sk-ant-...`
- `.env.example`: stessa struttura ma con `your_key_here`
- `.gitignore`: deve escludere `.env`, `.venv/`, `__pycache__/`

**Struttura di `config.py`:**
```python
from dotenv import load_dotenv
import os
load_dotenv()
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
if not ANTHROPIC_API_KEY:
    raise ValueError("ANTHROPIC_API_KEY mancante")
```

**Struttura di `agent.py`:**
```python
import anthropic
from config import ANTHROPIC_API_KEY

client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

def chiedi(domanda: str) -> str:
    # chiama client.messages.create con il modello haiku
    # restituisce risposta.content[0].text
    ...
```

</details>

---

### Esercizio 2 — Configurazione Multi-Ambiente 🟡 Intermedio

Estendi la configurazione per supportare tre ambienti: `development` (log DEBUG, modello economico), `staging` (log INFO, modello standard), `production` (log WARNING, modello più capace). L'ambiente viene selezionato dalla variabile `ENVIRONMENT` nel `.env`. Scrivi una funzione `get_config()` che restituisce i parametri corretti.

<details>
<summary>💡 Mostra suggerimento</summary>

**Struttura suggerita con dataclass:**
```python
from dataclasses import dataclass
import logging

@dataclass
class Config:
    api_key: str
    modello: str
    max_tokens: int
    log_level: int

def get_config() -> Config:
    ambiente = os.getenv("ENVIRONMENT", "development")
    # Dizionario che mappa ambiente → Config(...)
    # development: haiku, DEBUG, 1000 token
    # staging: sonnet, INFO, 2000 token
    # production: opus, WARNING, 4000 token
    configurazioni = { ... }
    return configurazioni[ambiente]
```

Configura il logging con `logging.basicConfig(level=config.log_level)` dopo aver ottenuto la config.

</details>

---

### Esercizio 3 — Test con Variabili d'Ambiente 🔴 Avanzato

Scrivi test pytest per la tua funzione `chiedi()` senza fare vere chiamate API. Usa `unittest.mock.patch` per moccare il client Anthropic. I test devono verificare: (a) che la funzione passi correttamente la domanda al client, (b) che gestisca un `anthropic.APIError` lanciando un'eccezione appropriata, (c) che log di livello INFO vengano emessi correttamente.

<details>
<summary>💡 Mostra suggerimento</summary>

**Struttura dei test:**
```python
import os
os.environ["ANTHROPIC_API_KEY"] = "test-key"  # prima dell'import

from unittest.mock import MagicMock, patch
import pytest

@pytest.fixture
def mock_client():
    with patch("agent.client") as mock:
        yield mock

def test_chiedi_passa_domanda_correttamente(mock_client):
    # Prepara risposta mock: mock_client.messages.create.return_value = ...
    # Chiama chiedi("domanda")
    # Verifica mock_client.messages.create.assert_called_once()
    # Verifica che "domanda" sia nei kwargs passati
    ...

def test_chiedi_gestisce_api_error(mock_client):
    # mock_client.messages.create.side_effect = anthropic.APIError(...)
    # pytest.raises(anthropic.APIError): chiedi("una domanda")
    ...

def test_chiedi_emette_log_info(mock_client, caplog):
    # with caplog.at_level(logging.INFO): chiedi("Test")
    # assert any("Query" in r.message for r in caplog.records)
    ...
```

</details>

---

<details>
<summary>⚙️ Approfondimento Avanzato</summary>

### Un Progetto di Esempio Completo

```
agente-documenti/
├── .env
├── .env.example
├── .gitignore
├── pyproject.toml
│
├── config.py          # variabili d'ambiente + logging
├── embeddings.py      # logica di indicizzazione/ricerca
├── agent.py           # logica dell'agente RAG
├── main.py            # entrypoint CLI
│
└── tests/
    └── test_agent.py
```

```python
# main.py
import sys
import logging
from agent import AgentRAG

logger = logging.getLogger(__name__)

def main():
    agente = AgentRAG()
    
    if len(sys.argv) > 1:
        domanda = " ".join(sys.argv[1:])
        risposta = agente.rispondi(domanda)
        print(risposta)
    else:
        print("Agente RAG pronto. Scrivi 'exit' per uscire.")
        while True:
            domanda = input("\nDomanda: ").strip()
            if domanda.lower() == "exit":
                break
            if domanda:
                risposta = agente.rispondi(domanda)
                print(f"\nRisposta: {risposta}")

if __name__ == "__main__":
    main()
```

### Soluzione completa Esercizio 2 (Multi-Ambiente)

```python
# config.py
from dotenv import load_dotenv
import os
import logging
from dataclasses import dataclass

load_dotenv()

@dataclass
class Config:
    api_key: str
    modello: str
    max_tokens: int
    log_level: int

def get_config() -> Config:
    ambiente = os.getenv("ENVIRONMENT", "development")
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY mancante")
    
    configurazioni = {
        "development": Config(api_key=api_key, modello="claude-haiku-4-5-20251001",
                              max_tokens=1000, log_level=logging.DEBUG),
        "staging":     Config(api_key=api_key, modello="claude-sonnet-4-6",
                              max_tokens=2000, log_level=logging.INFO),
        "production":  Config(api_key=api_key, modello="claude-opus-4-8",
                              max_tokens=4000, log_level=logging.WARNING),
    }
    
    if ambiente not in configurazioni:
        raise ValueError(f"ENVIRONMENT non valido: {ambiente}")
    
    config = configurazioni[ambiente]
    logging.basicConfig(level=config.log_level, format="%(asctime)s [%(levelname)s] %(message)s")
    return config
```

</details>

---

## Connessioni

- **Lezione precedente**: [Embeddings e Vector Database](05-08-embeddings-vector-db) — struttura il codice che usa il tuo vector DB
- **Lezione successiva**: [Streaming e UX Real-Time](05-10-streaming-ux-realtime) — aggiungi streaming al progetto strutturato
- **Capitolo 2**: [GitHub e Lavoro Collaborativo](../capitolo-02-git-github/02-03-github-collaborazione) — la struttura del progetto rende più semplice la collaborazione via Git
- **Capitolo 8**: [Deployment e Ambienti](../capitolo-08-workflow-multi-agente/08-07-deployment) — la configurazione multi-ambiente di questa lezione è la base del deployment
