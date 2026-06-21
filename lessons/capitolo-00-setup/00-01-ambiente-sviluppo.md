---
titolo: "Ambiente di Sviluppo"
difficolta: "Base"
---

# Ambiente di Sviluppo

> Prima di tutto il resto: fai girare il codice sul tuo computer. Questo capitolo ti porta da zero a "Hello, Claude" funzionante in meno di 20 minuti. Ogni lezione del corso che contiene codice presuppone che tu abbia completato questi passi.

## 1. Installa Python

Python è il linguaggio che useremo in tutto il corso. Versione minima richiesta: **3.10**.

### Windows
1. Vai su [python.org/downloads](https://python.org/downloads) e scarica l'installer
2. Durante l'installazione, **spunta "Add Python to PATH"** — fondamentale
3. Apri il Terminale (cerca "cmd" nel menu Start) e verifica:

```bash
python --version
# Dovresti vedere: Python 3.10.x o superiore
```

### macOS
macOS moderno include Python 3. Verifica dalla app Terminal:

```bash
python3 --version
```

Se la versione è inferiore a 3.10, installa tramite [Homebrew](https://brew.sh):

```bash
brew install python@3.11
```

### Linux (Ubuntu/Debian)
```bash
sudo apt update && sudo apt install python3.11 python3.11-venv python3-pip
python3 --version
```

---

## 2. Crea un Ambiente Virtuale

Un **ambiente virtuale** (virtualenv) isola le librerie del tuo progetto dal resto del sistema. È buona pratica usarne uno per ogni progetto.

```bash
# Crea una cartella per i tuoi progetti del corso
mkdir machina-corso
cd machina-corso

# Crea l'ambiente virtuale
python -m venv .venv

# Attivalo
# Su Windows:
.venv\Scripts\activate
# Su macOS/Linux:
source .venv/bin/activate
```

Quando l'ambiente è attivo, vedrai `(.venv)` all'inizio della riga del terminale. Ogni volta che apri un nuovo terminale, devi riattivarlo.

---

## 3. Ottieni una Chiave API

Per chiamare un LLM dal codice hai bisogno di una **chiave API**. Ti servono crediti — ma esistono opzioni gratuite per iniziare.

### Opzione A — Anthropic (Claude) ✓ Consigliata
1. Registrati su [console.anthropic.com](https://console.anthropic.com)
2. Anthropic offre crediti gratuiti ai nuovi account
3. Vai su "API Keys" → "Create Key" → copia la chiave

### Opzione B — Google Gemini (gratuito senza carta)
1. Vai su [aistudio.google.com](https://aistudio.google.com)
2. Crea un account Google → "Get API Key"
3. Il tier gratuito ha limiti generosi per lo studio

> **Importante**: una chiave API è come una password. Non metterla mai nel codice direttamente, non caricarla su GitHub. La gestiamo nel passo successivo.

---

## 4. Crea il File `.env`

Il file `.env` conserva le variabili d'ambiente — tra cui la chiave API — fuori dal codice sorgente.

```bash
# Nella cartella machina-corso, crea il file
# Su Windows (cmd):
echo ANTHROPIC_API_KEY=sk-ant-la-tua-chiave > .env

# Su macOS/Linux:
echo "ANTHROPIC_API_KEY=sk-ant-la-tua-chiave" > .env
```

Aggiungi subito `.env` al `.gitignore` per non caricarlo per errore su GitHub:

```bash
echo ".env" >> .gitignore
```

---

## 5. Installa le Librerie Base

Con l'ambiente virtuale attivo:

```bash
pip install anthropic python-dotenv
```

- `anthropic` — SDK ufficiale per chiamare Claude via API
- `python-dotenv` — legge automaticamente le variabili dal file `.env`

Verifica che l'installazione sia andata a buon fine:

```bash
pip list | grep anthropic
# Dovresti vedere: anthropic    x.x.x
```

---

## 6. Hello, Claude — Il Primo Test

Crea un file `hello.py` nella cartella `machina-corso`:

```python
from dotenv import load_dotenv
import anthropic

load_dotenv()  # carica ANTHROPIC_API_KEY dal file .env

client = anthropic.Anthropic()

risposta = client.messages.create(
    model="claude-haiku-4-5-20251001",
    max_tokens=100,
    messages=[
        {"role": "user", "content": "Presentati in una frase sola, in italiano."}
    ]
)

print(risposta.content[0].text)
```

Eseguilo:

```bash
python hello.py
```

✅ **Se funziona**, vedrai una risposta di Claude nel terminale. Da questo momento in poi, ogni snippet di codice del corso è eseguibile nel tuo ambiente.

❌ **Se ricevi un errore**, le cause più comuni sono:

| Errore | Causa | Soluzione |
|--------|-------|-----------|
| `ModuleNotFoundError: anthropic` | Libreria non installata o ambiente non attivo | Attiva `.venv` e ri-esegui `pip install anthropic` |
| `AuthenticationError` | Chiave API mancante o sbagliata | Controlla il file `.env` e la chiave su console.anthropic.com |
| `python: command not found` | Python non nel PATH | Su Windows, reinstalla spuntando "Add to PATH" |
| `RateLimitError` | Crediti esauriti | Passa a Google Gemini (Opzione B) o ricarica i crediti |

---

## 7. Struttura Consigliata del Progetto

Per organizzare gli esercizi del corso, usa questa struttura:

```
machina-corso/
├── .env                  ← chiave API (mai su GitHub)
├── .gitignore            ← contiene ".env"
├── .venv/                ← ambiente virtuale
├── cap01-web/            ← esercizi Capitolo 1
├── cap02-git/
├── cap03-ai/
├── cap04-llm/
├── cap05-strumenti/
├── cap06-agenti/
├── cap07-package/
├── cap08-workflow/
└── cap09-evolutivi/
```

---

## Riepilogo

| Passo | Risultato atteso |
|-------|-----------------|
| Python installato | `python --version` → 3.10+ |
| Ambiente virtuale | `(.venv)` nel terminale |
| Chiave API | Visibile su console.anthropic.com |
| File `.env` | Esiste nella cartella del progetto |
| `pip install anthropic` | `pip list` mostra anthropic |
| `python hello.py` | Claude risponde in italiano |

---

## 🧪 Prova Tu

1. Modifica `hello.py` cambiando il messaggio: chiedi a Claude di spiegare cosa farà il corso in 3 parole
2. Cambia `max_tokens=100` in `max_tokens=20` e osserva come cambia la risposta
3. Prova a cancellare una lettera dalla chiave API nel `.env` e osserva l'errore — così sai riconoscerlo in futuro

---

## Connessioni

- **Prossima lezione**: 01-01 Come funziona Internet — ora che il tuo ambiente funziona, inizia il percorso
- **Quando serve**: ogni lezione del Capitolo 5 in poi usa librerie Python — torna qui se hai problemi

## 🌐 Per Approfondire in Inglese

Per la gestione delle variabili d'ambiente nei progetti Python → **"python-dotenv documentation"** (documentazione ufficiale su pypi.org/project/python-dotenv)
