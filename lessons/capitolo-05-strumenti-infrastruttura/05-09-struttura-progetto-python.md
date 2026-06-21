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
│   └── mio_progetto/       # il tuo codice
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

Per progetti piccoli va bene anche senza la cartella `src/`:

```
mio-progetto/
├── .env
├── .gitignore
├── pyproject.toml
├── agent.py
├── tools.py
├── config.py
└── tests/
```

## Ambienti Virtuali

Un **virtual environment** isola le dipendenze del tuo progetto dal resto del sistema. Senza di esso, tutti i tuoi progetti condividono le stesse versioni dei pacchetti — e i conflitti sono inevitabili.

```bash
# Crea un virtual environment nella cartella .venv
python -m venv .venv

# Attivalo (Linux/Mac)
source .venv/bin/activate

# Attivalo (Windows)
.venv\Scripts\activate

# Ora i pacchetti che installi vanno solo qui
pip install anthropic

# Disattiva quando hai finito
deactivate
```

Il virtual environment è una cartella locale — non si committa su Git:

```bash
# .gitignore
.venv/
__pycache__/
*.pyc
.env
```

### uv — Il Sostituto Moderno di pip

`uv` è uno strumento Rust che sostituisce `pip` e `venv` con performance 10-100x superiori. Sta diventando lo standard de facto:

```bash
# Installa uv
pip install uv

# Crea progetto e venv in un colpo solo
uv init mio-progetto
cd mio-progetto

# Aggiungi dipendenze (aggiorna automaticamente pyproject.toml)
uv add anthropic
uv add --dev pytest  # dipendenze solo per sviluppo

# Esegui il progetto (attiva il venv automaticamente)
uv run python main.py

# Installa le dipendenze da pyproject.toml (es. dopo un git clone)
uv sync
```

## pyproject.toml — Il Cuore del Progetto

Il file `pyproject.toml` sostituisce il vecchio `requirements.txt` e `setup.py`:

```toml
[project]
name = "mio-agente-ai"
version = "0.1.0"
description = "Agente AI per analisi documenti"
requires-python = ">=3.11"
dependencies = [
    "anthropic>=0.40.0",
    "chromadb>=0.5.0",
    "python-dotenv>=1.0.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0.0",
    "pytest-asyncio>=0.23.0",
]

[tool.pytest.ini_options]
asyncio_mode = "auto"
```

Il vecchio `requirements.txt` è ancora comune ma meno espressivo — non distingue dipendenze di produzione da quelle di sviluppo, e non specifica la versione Python.

## Gestire i Segreti con .env

Le API key e le configurazioni sensibili vanno in un file `.env` — mai hardcoded nel codice, mai committate su Git.

```bash
# .env (NON committare)
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
DATABASE_URL=postgresql://user:password@localhost/mydb
ENVIRONMENT=development
MAX_TOKENS=4096
```

```bash
# .env.example (committare — senza valori reali)
ANTHROPIC_API_KEY=your_key_here
DATABASE_URL=postgresql://user:password@localhost/mydb
ENVIRONMENT=development
MAX_TOKENS=4096
```

Nel codice, leggi i valori con `python-dotenv`:

```python
# config.py
from dotenv import load_dotenv
import os

load_dotenv()  # carica .env nella cartella corrente

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
if not ANTHROPIC_API_KEY:
    raise ValueError("ANTHROPIC_API_KEY non trovata nelle variabili d'ambiente")

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
MAX_TOKENS = int(os.getenv("MAX_TOKENS", "4096"))
```

```python
# agent.py
import anthropic
from .config import ANTHROPIC_API_KEY, MAX_TOKENS

client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
```

## Logging: Non Usare print()

In produzione, `print()` non basta. Il modulo `logging` permette di configurare livelli (DEBUG, INFO, WARNING, ERROR), formati, e destinazioni (console, file, servizi esterni):

```python
# config.py (aggiungi qui)
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)
```

```python
# agent.py
import logging
logger = logging.getLogger(__name__)

def chiedi_al_modello(domanda: str) -> str:
    logger.info(f"Nuova query: {domanda[:50]}...")
    
    try:
        risposta = client.messages.create(...)
        logger.debug(f"Risposta ricevuta: {risposta.usage.output_tokens} token")
        return risposta.content[0].text
    except anthropic.APIError as e:
        logger.error(f"Errore API: {e}")
        raise
```

**Livelli di logging**:
- `DEBUG`: dettagli tecnici, solo in sviluppo
- `INFO`: eventi normali del flusso (query ricevute, risposte inviate)
- `WARNING`: situazioni anomale ma non bloccanti
- `ERROR`: errori che richiedono attenzione
- `CRITICAL`: errori che bloccano il sistema

## Un Progetto di Esempio Completo

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
        # Modalità CLI: python main.py "domanda"
        domanda = " ".join(sys.argv[1:])
        risposta = agente.rispondi(domanda)
        print(risposta)
    else:
        # Modalità interattiva
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

---

## Esercizi Pratici

> Tre esercizi a difficoltà crescente. Prova a risolverli da solo prima di aprire la soluzione.

### Esercizio 1 — Setup di un Progetto 🟢 Base

Crea un nuovo progetto Python con la struttura corretta: `pyproject.toml`, `.env`, `.env.example`, `.gitignore`, e una funzione `chiedi(domanda)` in `agent.py` che legge la API key dall'ambiente (non hardcoded). Verifica che funzioni eseguendo una query semplice.

<details>
<summary>💡 Mostra soluzione</summary>

```bash
mkdir mio-agente && cd mio-agente
```

```toml
# pyproject.toml
[project]
name = "mio-agente"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = ["anthropic>=0.40.0", "python-dotenv>=1.0.0"]
```

```bash
# .env (non committare)
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

```bash
# .env.example (committare)
ANTHROPIC_API_KEY=your_key_here
```

```bash
# .gitignore
.env
.venv/
__pycache__/
*.pyc
```

```python
# config.py
from dotenv import load_dotenv
import os, logging

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
if not ANTHROPIC_API_KEY:
    raise ValueError("ANTHROPIC_API_KEY mancante")
```

```python
# agent.py
import anthropic
import logging
from config import ANTHROPIC_API_KEY

logger = logging.getLogger(__name__)
client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

def chiedi(domanda: str) -> str:
    logger.info(f"Query: {domanda[:60]}")
    risposta = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=200,
        messages=[{"role": "user", "content": domanda}]
    )
    return risposta.content[0].text
```

```python
# main.py
from agent import chiedi
print(chiedi("Ciao, in una frase: cosa fai?"))
```

```bash
python -m venv .venv && source .venv/bin/activate
pip install anthropic python-dotenv
python main.py
```

</details>

---

### Esercizio 2 — Configurazione Multi-Ambiente 🟡 Intermedio

Estendi la configurazione per supportare tre ambienti: `development` (log DEBUG, modello economico), `staging` (log INFO, modello standard), `production` (log WARNING, modello più capace). L'ambiente viene selezionato dalla variabile `ENVIRONMENT` nel `.env`. Scrivi una funzione `get_config()` che restituisce i parametri corretti.

<details>
<summary>💡 Mostra soluzione</summary>

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
        "development": Config(
            api_key=api_key,
            modello="claude-haiku-4-5-20251001",
            max_tokens=1000,
            log_level=logging.DEBUG,
        ),
        "staging": Config(
            api_key=api_key,
            modello="claude-sonnet-4-6",
            max_tokens=2000,
            log_level=logging.INFO,
        ),
        "production": Config(
            api_key=api_key,
            modello="claude-opus-4-8",
            max_tokens=4000,
            log_level=logging.WARNING,
        ),
    }
    
    if ambiente not in configurazioni:
        raise ValueError(f"ENVIRONMENT non valido: {ambiente}. Usa: {list(configurazioni.keys())}")
    
    config = configurazioni[ambiente]
    logging.basicConfig(level=config.log_level, format="%(asctime)s [%(levelname)s] %(message)s")
    logging.getLogger(__name__).info(f"Ambiente: {ambiente}, Modello: {config.modello}")
    
    return config

# Uso
# config = get_config()
# client = anthropic.Anthropic(api_key=config.api_key)
```

</details>

---

### Esercizio 3 — Test con Variabili d'Ambiente 🔴 Avanzato

Scrivi test pytest per la tua funzione `chiedi()` senza fare vere chiamate API. Usa `unittest.mock.patch` per moccare il client Anthropic. I test devono verificare: (a) che la funzione passi correttamente la domanda al client, (b) che gestisca un `anthropic.APIError` lanciando un'eccezione appropriata, (c) che log di livello INFO vengano emessi correttamente.

<details>
<summary>💡 Mostra soluzione</summary>

```python
# tests/test_agent.py
import pytest
import logging
from unittest.mock import MagicMock, patch
import anthropic

# Mock dell'environment prima dell'import
import os
os.environ["ANTHROPIC_API_KEY"] = "test-key"
os.environ["ENVIRONMENT"] = "development"

from agent import chiedi

@pytest.fixture
def mock_client():
    with patch("agent.client") as mock:
        yield mock

def test_chiedi_passa_domanda_correttamente(mock_client):
    # Arrange
    risposta_mock = MagicMock()
    risposta_mock.content = [MagicMock(text="Risposta di test")]
    mock_client.messages.create.return_value = risposta_mock
    
    # Act
    risultato = chiedi("Qual è la capitale d'Italia?")
    
    # Assert
    mock_client.messages.create.assert_called_once()
    call_kwargs = mock_client.messages.create.call_args[1]
    assert call_kwargs["messages"][0]["content"] == "Qual è la capitale d'Italia?"
    assert risultato == "Risposta di test"

def test_chiedi_gestisce_api_error(mock_client):
    # Arrange
    mock_client.messages.create.side_effect = anthropic.APIError(
        message="Rate limit exceeded",
        request=MagicMock(),
        body={}
    )
    
    # Act & Assert
    with pytest.raises(anthropic.APIError):
        chiedi("Una domanda qualsiasi")

def test_chiedi_emette_log_info(mock_client, caplog):
    risposta_mock = MagicMock()
    risposta_mock.content = [MagicMock(text="OK")]
    mock_client.messages.create.return_value = risposta_mock
    
    with caplog.at_level(logging.INFO):
        chiedi("Test logging")
    
    assert any("Query" in record.message for record in caplog.records)
```

```bash
pip install pytest
pytest tests/ -v
```

</details>

---

## Connessioni

- **Lezione precedente**: [Embeddings e Vector Database](05-08-embeddings-vector-db) — struttura il codice che usa il tuo vector DB
- **Lezione successiva**: [Streaming e UX Real-Time](05-10-streaming-ux-realtime) — aggiungi streaming al progetto strutturato
- **Capitolo 2**: [GitHub e Lavoro Collaborativo](../capitolo-02-git-github/02-03-github-collaborazione) — la struttura del progetto rende più semplice la collaborazione via Git
- **Capitolo 8**: [Deployment e Ambienti](../capitolo-08-workflow-multi-agente/08-07-deployment) — la configurazione multi-ambiente di questa lezione è la base del deployment
