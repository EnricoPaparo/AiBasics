---
titolo: "GitHub e Lavoro Collaborativo"
durata_stimata: "20 min"
difficolta: "Base"
---

# GitHub e Lavoro Collaborativo

Git è uno strumento locale. GitHub è la piattaforma che porta Git su internet e lo trasforma in uno strumento di collaborazione. Sono cose diverse — ma così integrate nel workflow professionale che spesso si confondono.

## Git vs GitHub

**Git** è il software di version control che gira sul tuo computer. Esiste dal 2005, è open source, funziona completamente offline.

**GitHub** è una piattaforma web che ospita repository Git remoti e aggiunge strumenti di collaborazione: Pull Request, Issues, Actions, Projects, wiki, code review. Fondato nel 2008, acquisito da Microsoft nel 2018. Esistono alternative (GitLab, Bitbucket) ma GitHub è lo standard de facto per l'open source e per la maggior parte delle aziende.

## Il Repository Remoto

Un **repository remoto** è una copia del tuo repository su un server. Quando lavori in team, il remoto è il punto di sincronizzazione tra tutti.

```bash
# Aggiungere un remoto a un repository locale esistente
git remote add origin https://github.com/tuonome/progetto.git

# Vedere i remoti configurati
git remote -v
# origin  https://github.com/tuonome/progetto.git (fetch)
# origin  https://github.com/tuonome/progetto.git (push)
```

Il nome `origin` è una convenzione — è il nome che Git dà al remoto principale.

## Push e Pull

```bash
# Invia i tuoi commit locali al remoto
git push origin main

# Scarica i commit del remoto e aggiorna il branch locale
git pull origin main

# Prima volta su un nuovo branch: imposta il tracking
git push -u origin feature/login
# Dopo, puoi fare solo: git push
```

**`git fetch` vs `git pull`**:
- `git fetch`: scarica le modifiche remote ma non le applica ai tuoi file locali. Ti permette di vedere cosa c'è senza toccare il tuo lavoro.
- `git pull`: `fetch` + `merge`. Scarica e applica. Più comodo ma meno controllabile.

## Il Workflow con Pull Request

Le **Pull Request** (PR) — su GitLab si chiamano Merge Request — sono il cuore del lavoro collaborativo su GitHub.

Invece di mergare direttamente su `main`, proponi le tue modifiche attraverso una PR. Il team le rivede, fa commenti, richiede cambiamenti, e alla fine approva il merge.

**Flusso tipico**:

```
1. git checkout -b feature/nuova-funzionalita
2. [lavori, fai commit]
3. git push origin feature/nuova-funzionalita
4. [apri PR su GitHub dalla UI web]
5. [i colleghi reviewano il codice]
6. [tu applichi i feedback con nuovi commit]
7. [la PR viene approvata]
8. [merge su main dalla UI GitHub]
9. [il branch viene eliminato]
```

### Cosa Contiene una Buona PR

**Titolo**: breve, descrive cosa fa la modifica (`Aggiungi autenticazione JWT`).

**Descrizione**:
- Cosa fa questa PR e perché
- Come testare le modifiche
- Screenshot se ci sono modifiche UI
- Link a issue o ticket correlati

**Dimensione**: PR piccole (< 300 righe cambiate) vengono reviewate meglio e più velocemente di PR enormi. Se una PR è troppo grande, dividila.

## Il Code Review

Il code review su GitHub avviene tramite commenti inline sul diff. Il reviewer può:
- Approvare la PR (`Approve`)
- Richiedere modifiche (`Request changes`)
- Fare commenti neutri

Come sviluppatore che riceve review:
- I commenti non sono attacchi personali — sono miglioramenti al codice
- Se non capisci un commento, chiedi spiegazioni
- Se non sei d'accordo, motiva la tua posizione — il dialogo è normale
- Quando applichi una modifica, rispondi al commento ("risolto nel commit abc1234")

Come reviewer:
- Sii specifico: "questa funzione dovrebbe usare un dizionario invece di una lista" è meglio di "questo non va bene"
- Distingui tra problemi bloccanti e suggerimenti opzionali
- Approva quando sei soddisfatto, anche se il codice non è perfetto

## Fork e Open Source

Quando vuoi contribuire a un progetto open source di cui non sei collaboratore, usi il **fork**:

```
Repository originale (microsoft/vscode)
         ↓ fork
Il tuo fork (tuonome/vscode)    ← hai accesso completo qui
         ↓ clone locale
Il tuo computer
```

Il flusso:
1. Fai fork del repository originale
2. Clona il tuo fork in locale
3. Crea un branch per la tua modifica
4. Push sul tuo fork
5. Apri PR dal tuo fork verso il repository originale

I maintainer del progetto originale reviewano la tua PR e decidono se mergare.

## Issues: Gestire il Lavoro

Le **Issues** di GitHub sono il sistema di ticketing integrato: bug report, richieste di feature, discussioni tecniche.

Una buona issue ha:
- **Titolo** chiaro (`Login fallisce con email maiuscole`)
- **Descrizione** del problema con passi per riprodurlo
- **Comportamento atteso** vs **comportamento attuale**
- **Ambiente**: OS, versione del software, etc.
- **Label**: `bug`, `enhancement`, `documentation`, etc.

Le Issues e le PR si collegano: se nel messaggio di commit o nella descrizione della PR scrivi `Fixes #42`, GitHub chiude automaticamente l'Issue #42 quando la PR viene mergiata.

---

## Esercizi Pratici

> Tre esercizi a difficoltà crescente. Prova a risolverli da solo prima di aprire la soluzione.

### Esercizio 1 — Setup Remoto 🟢 Base

Crea un repository su GitHub (dalla UI web), clonalo in locale, aggiungi un file `hello.py`, committa e pusha. Verifica che il file appaia su GitHub.

<details>
<summary>💡 Mostra soluzione</summary>

```bash
# Dopo aver creato il repo su github.com:
git clone https://github.com/tuonome/hello-world.git
cd hello-world

cat > hello.py << 'EOF'
def hello():
    print("Ciao, GitHub!")

if __name__ == "__main__":
    hello()
EOF

git add hello.py
git commit -m "Aggiungi script hello world"
git push origin main
```

Vai su `https://github.com/tuonome/hello-world` — dovresti vedere `hello.py` nel repository.

**Autenticazione**: GitHub richiede un Personal Access Token (PAT) al posto della password. Crealo in Settings → Developer Settings → Personal Access Tokens. In alternativa, configura l'autenticazione SSH.

</details>

---

### Esercizio 2 — Simula una Code Review 🟡 Intermedio

Crea un branch con un bug intenzionale nel codice (es. una divisione senza controllo dello zero). Pusha il branch, apri una PR su GitHub. Poi fai da reviewer: apri il tab "Files changed", trova il bug, lascia un commento inline sulla riga problematica. Infine torna in locale, correggi, committa, ripusha — vedi come il commento viene risolto.

<details>
<summary>💡 Mostra soluzione</summary>

```python
# calcolatrice.py — con bug intenzionale
def dividi(a, b):
    return a / b  # bug: nessun controllo b == 0
```

```bash
git checkout -b feature/calcolatrice
# crea il file sopra
git add calcolatrice.py
git commit -m "Aggiungi funzione divisione"
git push -u origin feature/calcolatrice
```

Su GitHub, apri PR. Nel tab "Files changed", clicca il `+` sulla riga `return a / b` e lascia il commento: "Manca il controllo per divisione per zero — se b è 0 lancia ZeroDivisionError."

Torna in locale:
```python
# calcolatrice.py — corretto
def dividi(a, b):
    if b == 0:
        raise ValueError("Il divisore non può essere zero")
    return a / b
```

```bash
git add calcolatrice.py
git commit -m "Correggi divisione per zero (da review)"
git push
```

Il commento sulla PR si aggiorna automaticamente mostrando che la riga è cambiata. Puoi rispondere "risolto nel commit xyz" e marcarlo come `Resolved`.

</details>

---

### Esercizio 3 — Contribuisci a un Repository 🔴 Avanzato

Trova un repository open source su GitHub (inizia da `awesome-*` list o cerca progetti con label `good first issue`). Leggi le linee guida di contribuzione (`CONTRIBUTING.md`). Fai fork, clona, crea un branch con una piccola modifica (correzione typo nella documentazione, aggiunta di esempio, fix di bug semplice). Apri una PR seguendo le convenzioni del progetto.

<details>
<summary>💡 Mostra soluzione</summary>

**Processo completo**:

```bash
# 1. Fork dalla UI GitHub, poi:
git clone https://github.com/TUONOME/repository-forkato.git
cd repository-forkato
git remote add upstream https://github.com/ORIGINALE/repository.git

# 2. Sincronizza con l'originale (buona pratica prima di iniziare)
git fetch upstream
git merge upstream/main

# 3. Crea branch descrittivo
git checkout -b fix/typo-readme-installation-section

# 4. Fai la modifica, verifica che funzioni

# 5. Commit con messaggio che segue le convenzioni del progetto
git add README.md
git commit -m "Fix: correggi typo 'installaton' → 'installation' nel README"

# 6. Push sul tuo fork
git push -u origin fix/typo-readme-installation-section

# 7. Apri PR dalla UI GitHub verso il repository originale
```

**Consigli per la PR**:
- Leggi CONTRIBUTING.md prima di iniziare
- Usa il template di PR se esiste
- Sii paziente: i maintainer di open source sono spesso volontari con poco tempo
- Non scoraggiarti se la PR viene rifiutata — è normale, impari comunque

</details>

---

## Connessioni

- **Lezione precedente**: [Branch, Merge e Conflitti](02-02-branch-merge-conflitti)
- **Lezione successiva**: [GitHub Actions e CI/CD](02-04-github-actions-cicd)
- **Capitolo 8**: [Testing e Valutazione](../capitolo-08-workflow-multi-agente/08-06-testing-evals) — le PR su GitHub integrano automaticamente i risultati dei test tramite GitHub Actions
- **Capitolo 8**: [Deployment e Ambienti](../capitolo-08-workflow-multi-agente/08-07-deployment) — il deploy avviene spesso automaticamente al merge di una PR
