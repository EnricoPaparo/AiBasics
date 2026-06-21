---
titolo: "Branch, Merge e Conflitti"
durata_stimata: "25 min"
difficolta: "Base"
---

# Branch, Merge e Conflitti

Un repository Git non è solo una lista lineare di commit. È un albero — e i rami di quell'albero si chiamano **branch**. Capire i branch trasforma Git da un semplice sistema di backup a uno strumento di lavoro professionale.

## Cos'è un Branch

Un **branch** è un puntatore mobile a un commit. Quando crei un branch, stai essenzialmente dicendo: "da questo punto in poi, voglio sviluppare in questa direzione senza toccare il resto".

Il branch principale si chiama convenzionalmente `main` (o `master` nei progetti più vecchi).

```
main:    A ── B ── C ── D
                         ↑
                    (dove sei ora)

feature: A ── B ── C ── E ── F
                              ↑
                    (sviluppo in parallelo)
```

I commit E e F sul branch `feature` non influenzano `main`. Puoi sperimentare, rompere cose, ripartire da zero — tutto senza toccare la versione funzionante su `main`.

## Comandi per i Branch

```bash
# Vedere i branch esistenti (* = branch attuale)
git branch
# * main
#   feature-login

# Creare un nuovo branch
git branch feature-login

# Spostarsi su un branch (checkout)
git checkout feature-login

# Creare e spostarsi in un solo comando (più comune)
git checkout -b feature-login

# Eliminare un branch (dopo averlo mergiato)
git branch -d feature-login
```

## Il Merge: Unire i Branch

Quando hai finito di sviluppare una funzionalità, vuoi portare il lavoro su `main`. Questo si chiama **merge**.

```bash
# Spostati sul branch di destinazione (main)
git checkout main

# Unisci il branch feature in main
git merge feature-login
```

Git combina i cambiamenti. Se non ci sono conflitti, crea automaticamente un **merge commit** che unisce le due linee di sviluppo.

```
Prima del merge:
main:    A ── B ── C
                    \
feature:             D ── E

Dopo il merge:
main:    A ── B ── C ── M
                    \  /
feature:             D ── E
```

## Il Rebase: Alternativa al Merge

Il **rebase** è un'alternativa al merge che riscrive la storia per renderla lineare:

```bash
# Sul branch feature, prima del merge
git rebase main
# Riposiziona i commit di feature "sopra" i commit aggiornati di main
```

```
Prima del rebase:
main:    A ── B ── C ── D
                   \
feature:            E ── F

Dopo il rebase:
main:    A ── B ── C ── D
                         \
feature:                  E' ── F'
```

I commit E e F diventano E' e F' (nuovi hash, ma stesse modifiche).

**Merge vs Rebase**:
- `merge` preserva la storia esatta, più sicuro
- `rebase` produce una storia lineare più pulita, ma riscrive i commit

Regola pratica: **non fare rebase su branch condivisi con altri**. Riscrivere commit già pushati rompe i repository degli altri.

## I Conflitti

Un **conflitto** avviene quando due branch hanno modificato la stessa riga dello stesso file in modi diversi. Git non sa quale versione tenere — devi decidere tu.

```
<<<<<<< HEAD
def calcola_prezzo(importo):
    return importo * 1.22  # IVA 22%
=======
def calcola_prezzo(importo, sconto=0):
    return importo * 1.22 - sconto
>>>>>>> feature-sconto
```

I marcatori significano:
- `<<<<<<< HEAD` — inizio della versione del branch corrente (main)
- `=======` — separatore
- `>>>>>>> feature-sconto` — inizio della versione dell'altro branch

Per risolvere il conflitto:
1. Edita il file manualmente: tieni quello che vuoi, rimuovi i marcatori
2. `git add nomefile.py`
3. `git commit`

```python
# Versione risolta (combinando le due)
def calcola_prezzo(importo, sconto=0):
    return importo * 1.22 - sconto
```

## Strategie di Branching

Nel lavoro professionale, i team usano convenzioni sui nomi e sui flussi:

**Feature branches**: un branch per ogni funzionalità
```bash
git checkout -b feature/user-authentication
git checkout -b feature/payment-integration
git checkout -b bugfix/login-redirect
```

**Git Flow**: modello strutturato con branch `main`, `develop`, `feature/*`, `release/*`, `hotfix/*`. Usato in team grandi con rilasci pianificati.

**Trunk-based development**: tutti lavorano su `main` con feature flag. Usato in team che deployano frequentemente (più volte al giorno).

La scelta del modello dipende dalla dimensione del team e dalla frequenza di deploy.

---

## Esercizi Pratici

> Tre esercizi a difficoltà crescente. Prova a risolverli da solo prima di aprire la soluzione.

### Esercizio 1 — Crea e Merga un Branch 🟢 Base

In un repository di test: crea un branch `feature/saluto`, aggiungi un file `saluto.py` con una funzione `saluta(nome)`, committa, torna su `main`, fai il merge. Verifica che il file sia ora visibile su `main`.

<details>
<summary>💡 Mostra soluzione</summary>

```bash
git checkout -b feature/saluto

cat > saluto.py << 'EOF'
def saluta(nome):
    return f"Ciao, {nome}!"
EOF

git add saluto.py
git commit -m "Aggiungi funzione saluto"

git checkout main
git merge feature/saluto
# Fast-forward (nessun merge commit perché main non ha avuto commit nel frattempo)

ls  # saluto.py è ora visibile su main
git log --oneline --graph
```

Il merge "fast-forward" avviene quando `main` non ha avuto nuovi commit mentre lavoravi sul branch: Git sposta semplicemente il puntatore di `main` in avanti.

</details>

---

### Esercizio 2 — Risolvi un Conflitto 🟡 Intermedio

Crea un repository con `config.py` che contiene `DEBUG = False`. Crea due branch: su `branch-a` cambia in `DEBUG = True`, su `branch-b` aggiungi `LOG_LEVEL = "INFO"` sulla riga sotto. Merga `branch-a` in main, poi merga `branch-b`. Risolvi il conflitto che si genera.

<details>
<summary>💡 Mostra soluzione</summary>

```bash
echo "DEBUG = False" > config.py
git add config.py && git commit -m "Config iniziale"

# Branch A
git checkout -b branch-a
sed -i 's/DEBUG = False/DEBUG = True/' config.py
git add config.py && git commit -m "Abilita debug"

# Branch B (da main)
git checkout main
git checkout -b branch-b
echo 'LOG_LEVEL = "INFO"' >> config.py
git add config.py && git commit -m "Aggiungi log level"

# Merge branch-a in main (ok, fast-forward)
git checkout main
git merge branch-a

# Merge branch-b → CONFLITTO
git merge branch-b
# CONFLICT (content): Merge conflict in config.py
```

Il conflitto nasce perché entrambi i branch hanno modificato `config.py`. Edita il file:

```python
# Versione risolta: mantieni entrambe le modifiche
DEBUG = True
LOG_LEVEL = "INFO"
```

```bash
git add config.py
git commit -m "Merge branch-b: mantieni debug e log level"
```

</details>

---

### Esercizio 3 — Strategia di Branching 🔴 Avanzato

Il tuo team ha: 2 sviluppatori che lavorano su feature diverse, 1 bug critico in produzione da fixare immediatamente, un deploy pianificato tra 3 giorni. Progetta la strategia di branching: quali branch creare, come nomininarli, in che ordine fare i merge, come gestire il hotfix senza portare in produzione le feature incomplete.

<details>
<summary>💡 Mostra soluzione</summary>

**Branch structure**:
```
main (produzione)
├── hotfix/login-crash          ← fix urgente, va su main subito
├── develop                     ← integrazione feature pre-release
│   ├── feature/user-dashboard  ← sviluppatore 1
│   └── feature/export-csv      ← sviluppatore 2
└── release/1.2.0               ← creato 1 giorno prima del deploy
```

**Ordine delle operazioni**:

1. **Hotfix immediato**:
```bash
git checkout -b hotfix/login-crash main  # parte da main (produzione)
# fix del bug
git checkout main && git merge hotfix/login-crash  # → in produzione
git checkout develop && git merge hotfix/login-crash  # porta il fix anche su develop
git tag v1.1.1  # tag della versione hotfix
```

2. **Feature in parallelo**:
Ogni sviluppatore lavora sul suo branch da `develop`. Merga in `develop` quando la feature è completa e testata.

3. **Pre-release**:
```bash
git checkout -b release/1.2.0 develop
# Solo bugfix sul release branch, nessuna nuova feature
```

4. **Deploy**:
```bash
git checkout main && git merge release/1.2.0
git tag v1.2.0
```

La chiave: il hotfix parte da `main` (non da `develop`) per non portare in produzione feature incomplete.

</details>

---

## Connessioni

- **Lezione precedente**: [Version Control e Git](02-01-version-control-git)
- **Lezione successiva**: [GitHub e Lavoro Collaborativo](02-03-github-collaborazione)
- **Capitolo 8**: [Workflow Multi-Agente](../capitolo-08-workflow-multi-agente/08-01-progettare-workflow) — i pattern di branching ispirano i pattern di workflow multi-agente
