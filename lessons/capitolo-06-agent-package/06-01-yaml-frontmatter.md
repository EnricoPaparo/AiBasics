---
id: "06-01"
titolo: "YAML e Frontmatter: il linguaggio dei metadati strutturati"
sottotitolo: "Il primo mattone dell'ingegneria professionale degli agenti: come strutturare un documento misto"
capitolo: 6
capitolo_titolo: "L'Agent Package: Struttura, Contratti e Artefatti"
lezione: 1
durata_stimata: "55 minuti"
difficolta: "avanzato"
prerequisiti: ["05-05", "01-05"]
concetti_chiave:
  - YAML
  - frontmatter
  - metadati machine-readable
  - parsing
  - convenzioni di naming
obiettivi:
  - "Scrivere YAML sintatticamente corretto per casi d'uso reali"
  - "Spiegare perché il frontmatter è lo standard per gli artefatti agentivi"
  - "Implementare un parser di frontmatter funzionante"
  - "Progettare convenzioni di naming coerenti per un sistema multi-agente"
stato: "pubblicata"
versione: "1.0"
---

# YAML e Frontmatter: il linguaggio dei metadati strutturati

## Introduzione

Con questa lezione entriamo nel Capitolo 6, il nucleo ingegneristico professionale di tutto il corso. Fino ad ora abbiamo costruito agenti come **codice**: funzioni Python, system prompt scritti come stringhe, strumenti definiti inline. Questo approccio funziona per esempi didattici e prototipi, ma non scala a un sistema reale, mantenuto da un team, che deve evolvere nel tempo senza che ogni modifica richieda di toccare il codice sorgente.

La soluzione a questo problema passa attraverso un concetto che abbiamo già incontrato più volte nel corso, ma mai analizzato in profondità: il **frontmatter** — un blocco YAML che precede un documento Markdown, e che useremo, da questa lezione in avanti, come formato standard per ogni artefatto di un sistema agentivo: agenti, prompt, contratti, handoff, skill. Non è un caso che tu stia leggendo, in questo momento, un file che usa esattamente questa struttura: ogni lezione di questo corso è già un esempio vivente di ciò che stiamo per studiare.

---

## Obiettivi di Apprendimento

Al termine di questa lezione sarai in grado di:

- Scrivere YAML sintatticamente corretto per casi d'uso reali, non solo riconoscerlo
- Spiegare con precisione perché il frontmatter è diventato lo standard per gli artefatti dei sistemi agentivi
- Implementare un parser di frontmatter funzionante in Python
- Progettare convenzioni di naming coerenti per i metadati di un intero sistema multi-agente

---

## 1. YAML, ripreso e approfondito

Avevamo introdotto YAML nella Lezione 1.5, contrapposto a JSON: stessa informazione, sintassi diversa, pensata per essere scritta e letta comodamente da un essere umano. Approfondiamo ora la sintassi con precisione sufficiente a scriverla correttamente, non solo a riconoscerla.

```yaml
# Valori scalari semplici
nome: Agente Analista
versione: 1.2
attivo: true
soglia_confidenza: 0.85

# Liste
strumenti:
  - cerca_database
  - genera_report
  - invia_notifica

# Oggetti annidati (indentazione = struttura, NON tab, solo spazi)
autore:
  nome: Mario Rossi
  team: Data Engineering

# Stringhe multilinea (usando il simbolo pipe)
descrizione: |
  Questo agente analizza i dati di vendita
  e genera report settimanali automaticamente.
  Supporta confronti anno su anno.

# Stringhe che necessitano di quote (per caratteri speciali)
titolo: "Report: Analisi Q3 — vs Q2"
```

Alcune regole sintattiche che causano errori frequenti, e che vale la pena fissare con precisione:

- **L'indentazione è strutturale**, esattamente come in Python: due elementi allo stesso livello di indentazione appartengono allo stesso oggetto
- **Mai usare tab per l'indentazione**, solo spazi — molti parser YAML falliscono silenziosamente o producono errori criptici se trovano un tab
- **I due punti dopo una chiave richiedono uno spazio successivo** (`chiave: valore`, non `chiave:valore`)
- **Le stringhe non necessitano quasi mai di virgolette**, a meno che contengano caratteri speciali come `:`, `#`, o iniziino con caratteri che YAML potrebbe interpretare diversamente (es. un numero che deve restare testo)

---

## 2. Perché il frontmatter è lo standard per gli artefatti agentivi

Il **frontmatter** è un blocco YAML, delimitato da tre trattini (`---`) prima e dopo, posto all'inizio di un file Markdown. La struttura risolve un problema preciso: un documento che deve essere **sia leggibile da un umano sia interpretabile automaticamente da un programma**.

```
---
[METADATI in YAML: machine-readable]
---

[CONTENUTO in Markdown: human-readable]
```

Pensa a un singolo file che descrive un agente del tuo sistema. Da un lato, vuoi che un umano possa aprirlo e capire immediatamente di cosa si tratta, leggendo prosa normale. Dall'altro, vuoi che un programma — ad esempio, il tuo orchestratore (Lezione 5.3), o uno script che genera automaticamente un catalogo di tutti gli agenti disponibili — possa estrarre informazioni precise senza dover "interpretare" un testo discorsivo.

```markdown
---
id: "agente-analista-vendite"
versione: "1.2.0"
modello: "claude-sonnet-4-6"
strumenti: ["query_database", "calcola_statistiche"]
owner: "team-data-engineering"
stato: "produzione"
---

# Agente Analista Vendite

Questo agente analizza i dati di vendita trimestrali,
identifica trend significativi, e prepara un riassunto
strutturato per il team commerciale.

## Comportamento atteso

L'agente non genera mai raccomandazioni di business
dirette: si limita a riportare dati e tendenze
osservate, lasciando l'interpretazione strategica
al team umano.
```

Un programma può leggere `versione`, `strumenti`, `stato` con un parsing immediato e affidabile (esattamente come nella Lezione 4.2, parsing di output strutturati). Un umano può leggere la sezione "Comportamento atteso" e capire immediatamente il contesto, senza dover decifrare una struttura puramente tecnica. **Nessuna delle due esigenze viene sacrificata per l'altra.**

> **Perché questo non è un dettaglio estetico:** ricorda dalla Lezione 5.4 il problema della coerenza terminologica tra agenti. Se ogni agente del sistema dichiara i propri metadati (versione, strumenti, owner, stato) in un formato standardizzato e prevedibile, diventa possibile costruire strumenti automatici che verificano la coerenza dell'intero sistema — ad esempio, uno script che controlla se tutti gli agenti dichiarati "in produzione" hanno effettivamente una sezione di test associata. Senza una struttura standard, questo tipo di verifica automatica sarebbe impossibile.

---

## 3. Implementazione pratica: un parser di frontmatter

Vediamo come si estrae programmaticamente il frontmatter da un file, separandolo dal contenuto Markdown — un'operazione che useremo costantemente da qui in avanti, ogni volta che un agente o un orchestratore deve "leggere" un artefatto del sistema.

```python
import yaml
import re

def estrai_frontmatter(percorso_file: str) -> tuple[dict, str]:
    """
    Legge un file Markdown con frontmatter YAML,
    restituendo (metadati, contenuto_markdown).
    """
    with open(percorso_file, "r", encoding="utf-8") as f:
        testo_completo = f.read()

    # Il frontmatter è delimitato da --- all'inizio del file
    pattern = r"^---\s*\n(.*?)\n---\s*\n(.*)$"
    corrispondenza = re.match(pattern, testo_completo, re.DOTALL)

    if not corrispondenza:
        raise ValueError(
            f"Il file {percorso_file} non contiene un "
            f"frontmatter YAML valido."
        )

    blocco_yaml, contenuto_markdown = corrispondenza.groups()
    metadati = yaml.safe_load(blocco_yaml)

    return metadati, contenuto_markdown.strip()


# Utilizzo:
metadati, contenuto = estrai_frontmatter("agenti/analista-vendite.md")

print(f"Versione: {metadati['versione']}")
print(f"Strumenti: {metadati['strumenti']}")
print(f"Stato: {metadati['stato']}")

if metadati["stato"] == "produzione" and not metadati.get("strumenti"):
    raise ValueError("Un agente in produzione deve dichiarare strumenti!")
```

Nota l'uso di `yaml.safe_load` invece di `yaml.load`: questa è una scelta di sicurezza deliberata. `yaml.load` senza restrizioni può, in alcune circostanze, eseguire codice arbitrario se il file YAML contiene costrutti malevoli — un rischio reale se il sistema dovesse mai elaborare frontmatter provenienti da fonti non completamente fidate. `safe_load` si limita a interpretare strutture dati semplici (stringhe, numeri, liste, oggetti), eliminando questo rischio.

---

## 4. Convenzioni di naming per un sistema coerente

Quando un intero sistema multi-agente (Lezione 5.4) adotta il frontmatter come standard, diventa essenziale stabilire **convenzioni condivise** su quali campi usare e con quali nomi — esattamente il problema di coerenza terminologica identificato nella Lezione 5.4, qui risolto a livello di metadati invece che di contenuto dei messaggi.

```yaml
# CONVENZIONE CONSIGLIATA per un sistema di agenti

---
id: "identificativo-univoco-kebab-case"    # sempre minuscolo, trattini
versione: "1.0.0"                           # semantic versioning (Lezione 8.4)
tipo: "agente" | "skill" | "schema" | "handoff"  # categoria dell'artefatto
modello: "claude-sonnet-4-6"                 # solo se rilevante
strumenti: []                                # sempre una lista, anche se vuota
prerequisiti: []                             # dipendenze da altri artefatti
owner: "nome-team-o-persona"
stato: "bozza" | "revisione" | "produzione"  # ciclo di vita (Lezione 8.4)
data_modifica: "2026-06-19"
---
```

Questa convenzione — chiavi sempre in minuscolo, valori di stato vincolati a un insieme fisso di opzioni, versionamento semantico — non è arbitraria: è precisamente il tipo di disciplina che permette a strumenti automatici di validare l'intero sistema (ad esempio, rifiutando un file che dichiara uno `stato` non previsto tra le opzioni valide), e che renderà possibile, nella Lezione 6.5, costruire contratti formali che si basano esattamente su questi stessi principi di struttura prevedibile.

> **Nota di trasparenza pratica:** osserva che il frontmatter di questa stessa lezione, che puoi vedere in cima a questo file, segue esattamente questo tipo di convenzione — `id`, `versione`, `stato`, `prerequisiti`. Il corso che stai studiando è stato costruito, fin dall'inizio, secondo i principi che ti sta insegnando.

---

## Esempio Pratico: Validare un Intero Catalogo di Agenti

Estendiamo il parser della Sezione 3 per costruire uno strumento che verifica automaticamente la coerenza di tutti gli agenti di un sistema, leggendo i loro frontmatter:

```python
import os

def valida_catalogo_agenti(cartella: str) -> list[str]:
    """
    Scansiona tutti i file .md in una cartella e verifica
    che ogni agente dichiarato 'produzione' rispetti
    le convenzioni minime di sistema.
    """
    problemi = []

    for nome_file in os.listdir(cartella):
        if not nome_file.endswith(".md"):
            continue

        percorso = os.path.join(cartella, nome_file)
        metadati, _ = estrai_frontmatter(percorso)

        if metadati.get("stato") == "produzione":
            if not metadati.get("strumenti"):
                problemi.append(f"{nome_file}: produzione senza strumenti dichiarati")
            if not metadati.get("owner"):
                problemi.append(f"{nome_file}: produzione senza owner dichiarato")
            if not metadati.get("versione"):
                problemi.append(f"{nome_file}: produzione senza versione dichiarata")

    return problemi


problemi_trovati = valida_catalogo_agenti("agenti/")
if problemi_trovati:
    print("Problemi di coerenza trovati nel catalogo:")
    for p in problemi_trovati:
        print(f"  - {p}")
else:
    print("Catalogo coerente: nessun problema trovato.")
```

Questo script, per quanto semplice, rappresenta un concetto che diventerà centrale nel resto del capitolo: la possibilità di **validare automaticamente** l'intero sistema, invece di affidarsi alla disciplina manuale di chi scrive ogni singolo agente — un principio di qualità ingegneristica che, nella Lezione 6.5, estenderemo dai semplici metadati ai contratti completi di input e output.

---

## Riepilogo

- **YAML** rappresenta dati strutturati con una sintassi leggibile, basata su indentazione (sempre spazi, mai tab) invece di parentesi.
- Il **frontmatter** — un blocco YAML all'inizio di un file Markdown — risolve il problema di costruire documenti che siano contemporaneamente leggibili da umani e interpretabili automaticamente da programmi.
- Un parser di frontmatter, implementabile con poche righe di Python usando `yaml.safe_load` (per ragioni di sicurezza), estrae metadati e contenuto separatamente, permettendo a un sistema di "leggere" gli artefatti che lo compongono.
- **Convenzioni di naming condivise** per i metadati (chiavi standard, valori vincolati per i campi di stato, versionamento semantico) sono ciò che rende possibile costruire strumenti automatici di validazione su un intero sistema multi-agente.

---

## Domande di Verifica

1. Perché l'uso di `yaml.safe_load` invece di `yaml.load` è una scelta di sicurezza rilevante, e non solo uno stile di codifica preferibile? In quale scenario concreto questa scelta farebbe la differenza?

2. Immagina che due agenti diversi del tuo sistema usino, nei rispettivi frontmatter, rispettivamente i campi `responsabile` e `owner` per indicare la stessa informazione (chi è responsabile dell'agente). Quale problema, già descritto in una lezione precedente, si manifesterebbe quando provi a costruire uno script di validazione automatica come quello della Sezione finale?

3. Il frontmatter di questa stessa lezione include il campo `prerequisiti: ["05-05", "01-05"]`. In che modo un orchestratore (Lezione 5.3) o un sistema di gestione del corso potrebbe usare questa informazione in modo automatico, senza che un umano debba leggerla manualmente?

---

## Connessioni

**Viene da:** Lezione 1.5 (Le API) — qui approfondiamo YAML, introdotto lì in contrapposizione a JSON. Lezione 5.4 (Single vs Multi-Agent) — il problema di coerenza terminologica trova qui una prima soluzione strutturale a livello di metadati.

**Porta a:** Lezione 6.2 (L'Agent Package) — il frontmatter qui padroneggiato è il formato esatto con cui descriveremo ogni file della struttura di un agente professionale.

**Ritroverai questi concetti in:** Lezione 6.3 (Agent Card) — l'Agent Card è, essenzialmente, un frontmatter strutturato secondo uno standard ancora più preciso e completo. Lezione 8.4 (Governance e Versioning) — il campo `stato` e il versionamento semantico qui introdotti diventeranno il fondamento del ciclo di vita formale degli artefatti agentivi.
