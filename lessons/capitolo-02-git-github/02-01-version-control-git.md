---
titolo: "Version Control e Git"
durata_stimata: "25 min"
difficolta: "Base"
---

# Version Control e Git

Prima di scrivere codice, hai bisogno di uno strumento per non perderlo. Git è quello strumento — ed è probabilmente il software più usato da ogni sviluppatore al mondo, ogni giorno.

## Il Problema che Git Risolve

Immagina di lavorare su un progetto. Salvi il file. Poi lo modifichi. Poi ti accorgi che la versione precedente era meglio. Come torni indietro?

Senza un sistema di version control, la risposta è: non puoi. A meno che tu non abbia fatto copie manuali (`progetto_v1.py`, `progetto_v2_finale.py`, `progetto_v2_finale_VERO.py`...).

**Git** è un sistema di **version control distribuito**: tiene traccia di ogni modifica che fai ai tuoi file, nel tempo. Ogni "salvataggio" in Git è chiamato **commit** e rappresenta uno snapshot completo del tuo progetto in quel momento.

Con Git puoi:
- Tornare a qualsiasi versione passata del tuo codice
- Vedere esattamente cosa è cambiato, quando, e chi l'ha cambiato
- Lavorare su funzionalità diverse in parallelo (branch)
- Collaborare con altri senza sovrascrivere il loro lavoro

## Come Funziona Git

Git divide il lavoro in tre aree:

```
┌─────────────────────────────────────────────────────┐
│  WORKING DIRECTORY  │  STAGING AREA  │  REPOSITORY  │
│                     │                │              │
│  I tuoi file        │  Cosa andrà    │  La storia   │
│  su disco           │  nel prossimo  │  di tutti i  │
│  (modificati)       │  commit        │  commit      │
│                     │                │              │
│   git add →         │   git commit → │              │
└─────────────────────────────────────────────────────┘
```

**Working Directory**: i file che vedi nella cartella del tuo progetto. Qui fai le modifiche.

**Staging Area (Index)**: un'area intermedia dove "prepari" le modifiche che vuoi includere nel prossimo commit. Non tutto quello che hai modificato deve necessariamente andare nello stesso commit.

**Repository**: il database nascosto (cartella `.git/`) dove Git salva tutta la storia del progetto.

## I Comandi Fondamentali

### Inizializzare un repository

```bash
# Crea un nuovo repository Git nella cartella corrente
git init

# Oppure clona un repository esistente da remoto
git clone https://github.com/utente/progetto.git
```

### Vedere lo stato del tuo lavoro

```bash
git status
# Mostra quali file sono stati modificati, quali sono in staging, quali sono nuovi
```

```bash
git diff
# Mostra le modifiche riga per riga nei file non ancora in staging

git diff --staged
# Mostra le modifiche riga per riga nei file già in staging
```

### Aggiungere modifiche allo staging

```bash
git add nomefile.py        # aggiunge un file specifico
git add .                  # aggiunge tutti i file modificati
git add cartella/          # aggiunge tutta una cartella
```

### Creare un commit

```bash
git commit -m "Aggiungi funzione di login"
```

Il messaggio di commit deve descrivere **cosa fa** la modifica, non come la fa. Messaggi buoni:
- `Aggiungi validazione email nel form di registrazione`
- `Correggi bug nel calcolo delle tasse`
- `Refactoring: estrai logica di autenticazione in classe separata`

Messaggi cattivi: `fix`, `aggiornamento`, `wip`, `aaa`

### Vedere la storia

```bash
git log
# Lista di tutti i commit con autore, data, messaggio

git log --oneline
# Versione compatta: solo hash breve e messaggio

git log --oneline --graph
# Con grafico ASCII che mostra i branch
```

### Tornare indietro

```bash
git checkout abc1234 -- nomefile.py
# Ripristina un singolo file a come era in quel commit

git revert abc1234
# Crea un nuovo commit che annulla le modifiche di quel commit
# (sicuro: non riscrive la storia)
```

## Il File .gitignore

Non tutto deve essere tracciato da Git. File con segreti, dipendenze scaricabili, file generati automaticamente — non servono nel repository.

```bash
# .gitignore
.env                 # variabili d'ambiente (contiene segreti!)
__pycache__/         # cache Python
*.pyc                # file compilati Python
node_modules/        # dipendenze Node (scaricabili con npm install)
.DS_Store            # file macOS (inutile per tutti gli altri)
dist/                # output della build
*.log                # file di log
```

Regola: **mai committare file `.env`**. Una API key committata per errore rimane nella storia di Git anche dopo che la rimuovi — bisogna revocarla immediatamente e ricrearla.

## Il Ciclo di Lavoro Tipico

```bash
# 1. Vedi cosa hai modificato
git status

# 2. Guarda le differenze
git diff

# 3. Aggiungi allo staging le modifiche che vuoi includere
git add src/login.py tests/test_login.py

# 4. Crea il commit con un messaggio descrittivo
git commit -m "Aggiungi autenticazione JWT"

# 5. Ripeti per il prossimo blocco di lavoro
```

**Principio**: i commit piccoli e frequenti sono meglio di un singolo commit enorme. Ogni commit dovrebbe rappresentare un'unità logica di lavoro.

---

## Esercizi Pratici

> Tre esercizi a difficoltà crescente. Prova a risolverli da solo prima di aprire la soluzione.

### Esercizio 1 — Il Tuo Primo Repository 🟢 Base

Crea una cartella `progetto-test`, inizializza un repository Git, crea un file `README.md` con una riga di testo, fai il tuo primo commit. Poi modifica il file, guarda il diff, e fai un secondo commit. Infine mostra la storia con `git log --oneline`.

<details>
<summary>💡 Mostra soluzione</summary>

```bash
mkdir progetto-test
cd progetto-test
git init

echo "# Il mio progetto" > README.md
git status             # mostra README.md come untracked
git add README.md
git commit -m "Aggiungi README iniziale"

echo "Questo è un progetto di test." >> README.md
git diff               # mostra la riga aggiunta in verde
git add README.md
git commit -m "Aggiungi descrizione al README"

git log --oneline
# Output simile a:
# a3f1b2c Aggiungi descrizione al README
# 8d9e012 Aggiungi README iniziale
```

Nota: il primo `git init` crea una cartella `.git/` nascosta — non toccarla mai direttamente.

</details>

---

### Esercizio 2 — Capire lo Staging 🟡 Intermedio

Crea un progetto con tre file: `main.py`, `utils.py`, `config.py`. Modifica tutti e tre. Poi crea DUE commit separati: uno con solo `main.py` e `utils.py`, uno con solo `config.py`. Spiega perché questa separazione ha senso in un workflow reale.

<details>
<summary>💡 Mostra soluzione</summary>

```bash
# Crea e modifica i file (simulato)
echo "def main(): pass" > main.py
echo "def helper(): pass" > utils.py
echo "DEBUG = True" > config.py

git add main.py utils.py
git commit -m "Aggiungi logica principale e utility"

git add config.py
git commit -m "Aggiungi configurazione debug"

git log --oneline
# a1b2c3d Aggiungi configurazione debug
# x9y8z7w Aggiungi logica principale e utility
```

**Perché separare?** Ogni commit dovrebbe avere una responsabilità unica. Se tra un mese devi tornare indietro solo sulla configurazione (es. il flag DEBUG ha causato un bug in produzione), puoi fare `git revert` su quel commit specifico senza toccare la logica. Con un commit unico, dovresti disfare tutto.

</details>

---

### Esercizio 3 — Recupero da un Errore 🔴 Avanzato

Hai committato per errore un file `.env` con le tue API key. Descrivere: (a) cosa fare immediatamente per limitare i danni, (b) come rimuovere il file dalla storia Git corrente, (c) perché questo è comunque insufficiente se il repository è già su GitHub. Cosa fare per prevenire questo errore in futuro?

<details>
<summary>💡 Mostra soluzione</summary>

**(a) Cosa fare immediatamente**: revocare e rigenerare tutte le API key esposte. Non aspettare — i bot scansionano GitHub in tempo reale alla ricerca di credenziali. Una chiave committata è da considerare compromessa dalla seconda in cui è stata pushata.

**(b) Rimuovere il file dalla storia**:

```bash
# Rimuovi il file dall'ultimo commit (se non ancora pushato)
git rm --cached .env
echo ".env" >> .gitignore
git commit -m "Rimuovi .env e aggiungi a .gitignore"

# Se serve rimuovere da commit precedenti (storia intera):
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch .env' \
  --prune-empty --tag-name-filter cat -- --all
```

**(c) Perché è insufficiente**: se il repository è pubblico su GitHub, chiunque abbia già clonato il repo o visto il commit ha la chiave. GitHub mantiene anche cache dei commit rimossi. La chiave è **compromessa** — non importa che tu la rimuova, deve essere **revocata**.

**Prevenzione futura**:
1. `.gitignore` con `.env` prima di scrivere qualsiasi file di configurazione
2. `git-secrets` o `detect-secrets` come pre-commit hook
3. Usa sempre variabili d'ambiente, mai hardcoding

</details>

---

## Connessioni

- **Lezione successiva**: [Branch, Merge e Conflitti](02-02-branch-merge-conflitti) — come lavorare su più funzionalità in parallelo
- **Capitolo 1**: [Le API](../capitolo-01-il-web/01-05-le-api) — le API che usi come sviluppatore sono spesso distribuite tramite repository Git
- **Capitolo 9**: [Governance e Versioning](../capitolo-09-sistemi-auto-evolutivi/09-04-governance-versioning) — il versioning degli agenti AI usa gli stessi principi di Git
