---
id: "07-04"
titolo: "I Prompt come Artefatti: struttura, template, istanze e versionamento"
sottotitolo: "Il prompt non è una stringa: è il codice sorgente del comportamento di un agente"
capitolo: 7
capitolo_titolo: "L'Agent Package"
lezione: 4
durata_stimata: "70 minuti"
difficolta: "avanzato"
prerequisiti: ["07-02"]
concetti_chiave:
  - prompt template
  - prompt instance
  - versionamento prompt
  - prompt stabile
  - prompt dinamico
obiettivi:
  - "Distinguere prompt template da prompt instance con precisione"
  - "Versionare un prompt in git seguendo pratiche da codice sorgente"
  - "Implementare un sistema di compilazione di template a runtime"
  - "Separare correttamente prompt stabili da prompt costruiti dinamicamente"
stato: "pubblicata"
versione: "1.0"
---
# I Prompt come Artefatti: struttura, template, istanze e versionamento

## Introduzione

Nella Lezione 7.2 abbiamo visto la cartella `prompts/` come componente dell'agent package, e abbiamo accennato che separare il prompt dal codice permette di modificarlo senza rischiare di introdurre bug nella logica di esecuzione. Questa lezione approfondisce con grande precisione **perché** e **come** un prompt deve essere trattato esattamente come codice sorgente: versionato, testato, sottoposto a revisione prima di un deploy, e mai modificato "al volo" senza disciplina.

Questo cambio di prospettiva — dal prompt come "testo che funziona" al prompt come "artefatto di ingegneria" — è probabilmente la transizione mentale più importante per chiunque costruisca sistemi agentivi professionali. Un'organizzazione che tratta i propri prompt con la stessa disciplina con cui tratta il proprio codice costruisce sistemi affidabili nel tempo; un'organizzazione che li tratta come testo informale, modificabile da chiunque senza processo, costruisce sistemi che degradano silenziosamente.

---

## Obiettivi di Apprendimento

Al termine di questa lezione sarai in grado di:

- Distinguere con precisione un prompt template da un prompt instance
- Versionare un prompt in git seguendo pratiche equivalenti a quelle del codice sorgente
- Implementare un sistema che compila un template in un'istanza concreta a runtime
- Separare correttamente prompt stabili (raramente modificati) da prompt costruiti dinamicamente

---

## 1. Anatomia di un prompt professionale

Riprendiamo e formalizziamo, con maggiore rigore di quanto fatto nella Lezione 4.4, la struttura di un prompt ben progettato. Un prompt professionale, in un agent package, tipicamente contiene sezioni distinte e riconoscibili:

```markdown
---
tipo: "system_prompt"
agente: "agente-analista-vendite"
versione: "2.1.0"
autore: "team-data-engineering"
ultima_revisione: "2026-05-10"
---

## Ruolo

Sei un analista di dati specializzato in vendite, parte di
un sistema più ampio che assiste il team commerciale.

## Contesto

Riceverai dati di vendita già estratti e strutturati. Il tuo
compito è identificare pattern, NON formattare nuovamente
i dati grezzi che ricevi.

## Istruzioni

1. Analizza SOLO i numeri forniti, senza presumere dati non presenti
2. Esprimi sempre le variazioni in percentuale, mai solo in valore assoluto
3. Se i dati sono insufficienti per una conclusione solida, dichiaralo esplicitamente

## Vincoli

- Non fornire raccomandazioni di business strategiche
- Non usare linguaggio vago ("buono", "discreto"): solo numeri precisi
- Lunghezza massima della risposta: 200 parole

## Formato di Output

Rispondi sempre con la struttura:
TREND: [crescita/calo/stabile]
VARIAZIONE: [percentuale]
CONFIDENZA: [alta/media/bassa]
NOTE: [eventuali limitazioni dei dati]

## Esempi

Input: "Vendite Q3 2026: 1.2M€. Vendite Q3 2025: 1.1M€."
Output:
TREND: crescita
VARIAZIONE: +9.1%
CONFIDENZA: alta
NOTE: nessuna
```

Ogni sezione risponde a una domanda progettuale specifica: **Ruolo** (chi è l'agente), **Contesto** (cosa riceverà e cosa no), **Istruzioni** (come deve comportarsi), **Vincoli** (cosa non deve fare), **Formato di Output** (la struttura attesa, collegandosi direttamente agli output strutturati della Lezione 5.2), **Esempi** (few-shot prompting, Lezione 4.4). Questa struttura sistematica, ripetuta in modo consistente su tutti i prompt del sistema, è ciò che rende un prompt **revisionabile**: un collega può controllare se ciascuna sezione è presente e ben formulata, esattamente come si farebbe con una code review.

---

## 2. Prompt Template vs Prompt Instance

Una distinzione cruciale, spesso confusa, è quella tra **template** (la struttura riutilizzabile, con segnaposto) e **instance** (la versione concreta, compilata con dati reali, effettivamente inviata al modello in una specifica chiamata).

```
PROMPT TEMPLATE (vive in prompts/, versionato in git)

Analizza i dati di vendita per il periodo {{periodo}}.
Confronta con il periodo precedente: {{periodo_confronto}}.
I dati forniti sono: {{dati_grezzi}}


PROMPT INSTANCE (generato a runtime, MAI salvato come file
permanente nell'agent package — esiste solo durante l'esecuzione)

Analizza i dati di vendita per il periodo Q3-2026.
Confronta con il periodo precedente: Q3-2025.
I dati forniti sono: [1.2M€ di vendite, 450 transazioni, ...]
```

Il **template** è ciò che un membro del team scrive, revisiona, e versiona — è statico e stabile. L'**instance** è ciò che viene effettivamente generato e inviato al modello, diverso a ogni esecuzione, perché i segnaposto (`{{periodo}}`, `{{dati_grezzi}}`) vengono sostituiti con i dati reali di quella specifica richiesta.

---

## 3. Implementazione pratica: un sistema di compilazione di template

Vediamo come si implementa questa distinzione in codice, estendendo il sistema di caricamento dell'agent package costruito nella Lezione 7.2.

```python
import re

def compila_template(template: str, variabili: dict) -> str:
    """
    Sostituisce i segnaposto {{nome_variabile}} in un template
    con i valori reali forniti, producendo un'istanza concreta.
    """
    def sostituisci(match):
        nome_variabile = match.group(1).strip()
        if nome_variabile not in variabili:
            raise ValueError(
                f"Variabile '{nome_variabile}' richiesta dal "
                f"template ma non fornita."
            )
        return str(variabili[nome_variabile])

    return re.sub(r"\{\{(\w+)\}\}", sostituisci, template)


def costruisci_prompt_analisi(periodo: str, periodo_confronto: str,
                                dati_grezzi: str) -> str:
    """
    Carica il template dell'agente Analista (Lezione 7.2) e
    lo compila in un'istanza pronta per essere inviata al modello.
    """
    _, template = estrai_frontmatter(
        "agenti/agente-analista-vendite/prompts/task_analisi.md"
    )

    return compila_template(template, {
        "periodo": periodo,
        "periodo_confronto": periodo_confronto,
        "dati_grezzi": dati_grezzi
    })


# Utilizzo:
prompt_pronto = costruisci_prompt_analisi(
    periodo="Q3-2026",
    periodo_confronto="Q3-2025",
    dati_grezzi="1.2M€ di vendite, 450 transazioni"
)
# Solo ORA, con il template compilato, si procede alla
# chiamata API vista nella Lezione 5.1
```

Osserva che la funzione `compila_template` **solleva esplicitamente un errore** se una variabile richiesta dal template non viene fornita, invece di produrre silenziosamente un prompt malformato (con un segnaposto non sostituito inviato per errore al modello). Questo è lo stesso principio di fail-fast e gestione esplicita degli errori visto nella Lezione 5.2 e nella Lezione 6.5: meglio un fallimento immediato e diagnosticabile che un comportamento scorretto silenzioso.

---

## 4. Versionare i prompt come si versiona il codice

Un prompt, salvato come file di testo in un repository git, beneficia esattamente delle stesse pratiche usate per il codice sorgente.

```bash
# Vedere la storia delle modifiche a un prompt specifico
git log --follow prompts/system.md

# Vedere ESATTAMENTE cosa è cambiato tra due versioni
git diff v2.0.0 v2.1.0 -- prompts/system.md

# Proporre una modifica al prompt attraverso un Pull Request,
# permettendo a un collega di rivederla prima del merge
git checkout -b miglioramento-prompt-analista
# ... modifica del file prompts/system.md ...
git commit -m "Chiarire vincolo su linguaggio vago nelle conclusioni"
```

Questa disciplina — ogni modifica a un prompt passa attraverso un commit, con un messaggio che spiega il **perché** della modifica, eventualmente attraverso una revisione di un collega prima del merge — è esattamente ciò che differenzia un sistema agentivo professionale da un sistema fragile, dove "qualcuno ha cambiato qualcosa nel prompt e ora l'agente si comporta diversamente" senza che nessuno sappia esattamente cosa, quando, o perché.

> **Perché questo conta enormemente per il Capitolo 9:** quando, nella Lezione 9.2, parleremo di prompt auto-evolutivi (un sistema che modifica automaticamente i propri prompt per migliorarsi), la tracciabilità garantita dal versionamento qui descritto sarà la condizione **indispensabile** per poter verificare se una modifica automatica ha effettivamente migliorato le prestazioni, e per poter tornare indietro (rollback) se non lo ha fatto.

---

## 5. Prompt stabili vs prompt dinamici: dove tracciare il confine

Riprendendo la distinzione tra `system` e `user` introdotta nella Lezione 4.3, formalizziamo ora il principio architetturale che ne deriva per un agent package:

```
PROMPT STABILE (system prompt, in prompts/system.md)

- Definisce ruolo, vincoli, formato di output
- Cambia RARAMENTE, solo quando si vuole modificare
  il comportamento generale dell'agente
- Versionato con disciplina (Sezione 4)
- Identico per OGNI esecuzione dell'agente


PROMPT DINAMICO (task prompt, costruito a runtime)

- Contiene i dati specifici della richiesta corrente
  (il periodo, i dati grezzi, l'obiettivo dell'utente)
- Cambia AD OGNI esecuzione, per definizione
- Costruito tramite compilazione di template
  (Sezione 3), non scritto a mano ogni volta
- Diverso per ogni singola chiamata
```

Un errore progettuale comune, da evitare con attenzione, è mescolare questi due livelli: inserire dati specifici della richiesta direttamente nel system prompt (rendendolo, di fatto, instabile e difficile da versionare con significato), oppure ripetere a ogni chiamata istruzioni di comportamento generale che dovrebbero invece vivere, una volta per tutte, nel prompt stabile.

---

## Esempio Pratico: Diagnosticare un Prompt Mal Progettato

Osserva questo prompt, e identifica perché mescola in modo problematico le due categorie appena descritte:

```
"Sei un analista di dati. Analizza le vendite di Q3-2026
confrontandole con Q3-2025: 1.2M€ contro 1.1M€. Rispondi
sempre con TREND, VARIAZIONE, CONFIDENZA. Non usare
linguaggio vago."
```

Questo singolo blocco di testo mescola informazioni stabili (il ruolo, il formato di output richiesto, il vincolo sul linguaggio) con dati specifici di questa particolare richiesta (i numeri di Q3-2026 e Q3-2025). Se questo testo venisse versionato come fosse il system prompt dell'agente, ogni nuova richiesta richiederebbe di "modificare" il prompt stabile — rendendo il versionamento (Sezione 4) privo di significato, perché il file cambierebbe costantemente per ragioni non legate a un effettivo miglioramento del comportamento dell'agente, ma solo ai dati della richiesta del momento.

La correzione, applicando i principi di questa lezione, separerebbe questo testo in un system prompt stabile (ruolo, formato, vincoli) e un task prompt dinamico, costruito per compilazione di template, contenente solo i dati specifici (Q3-2026, Q3-2025, i numeri).

---

## Riepilogo

- Un prompt professionale ha una struttura sistematica e revisionabile: **Ruolo**, **Contesto**, **Istruzioni**, **Vincoli**, **Formato di Output**, **Esempi**.
- Il **prompt template** è la struttura riutilizzabile con segnaposto, versionata in git; il **prompt instance** è la versione concreta, compilata con dati reali a runtime, mai salvata come file permanente.
- La compilazione di un template, implementabile con una semplice sostituzione di segnaposto, deve **fallire esplicitamente** se una variabile richiesta non è fornita, evitando prompt malformati silenziosi.
- Versionare i prompt con le stesse pratiche del codice sorgente (commit, diff, pull request) garantisce tracciabilità, revisione, e possibilità di rollback.
- Separare con disciplina **prompt stabili** (system, raramente modificati) da **prompt dinamici** (task, costruiti per ogni esecuzione) è un principio architetturale essenziale, la cui violazione rende il versionamento privo di significato.

---

## Domande di Verifica

1. Spiega perché, se un'organizzazione modificasse il prompt di un agente in produzione senza passare attraverso un commit versionato (ad esempio, editando direttamente un file su un server), diventerebbe enormemente più difficile diagnosticare un eventuale degrado nelle prestazioni dell'agente nei giorni successivi.

2. Nel codice della Sezione 3, cosa succederebbe se `compila_template` non sollevasse un errore esplicito per una variabile mancante, ma sostituisse semplicemente con una stringa vuota? Descrivi un possibile scenario problematico che ne deriverebbe.

3. Riprendi l'esempio pratico della Sezione finale. Riscrivi tu stesso, separandoli correttamente, il system prompt stabile e il template del task prompt dinamico per quel caso.

---

## Esercizi Pratici

> Tre esercizi a difficoltà crescente. Prova a risolverli da solo prima di aprire la soluzione.

### Esercizio 1 — Le sezioni di un prompt professionale 🟢 Base

Elenca le sezioni tipiche di un prompt professionale ben strutturato e, per ciascuna, di' a quale domanda risponde.

<details>
<summary>💡 Mostra soluzione</summary>

- **Ruolo:** chi è l'agente?
- **Contesto:** cosa riceverà e cosa no?
- **Istruzioni:** come deve comportarsi?
- **Vincoli:** cosa NON deve fare?
- **Formato di Output:** quale struttura deve avere la risposta? (collega agli output strutturati, Lezione 5.2)
- **Esempi:** few-shot prompting (Lezione 4.4).

Avere queste sezioni in modo consistente rende il prompt **revisionabile** come si fa con una code review: un collega può controllare se ciascuna è presente e ben formulata.

</details>

### Esercizio 2 — Template vs instance 🟡 Intermedio

(a) Qual è la differenza tra prompt *template* e prompt *instance*? Quale dei due viene versionato in git? (b) Cosa dovrebbe fare `compila_template` se manca una variabile richiesta, e perché?

<details>
<summary>💡 Mostra soluzione</summary>

**(a)** Il **template** è la struttura riutilizzabile con segnaposto (`{{periodo}}`), statica e **versionata in git**. L'**instance** è la versione concreta compilata con i dati reali a runtime, diversa a ogni esecuzione, **mai salvata** come file permanente.

**(b)** Deve **sollevare un errore esplicito** (fail-fast). Se invece sostituisse silenziosamente con stringa vuota, invieresti al modello un prompt malformato (un'istruzione con un buco), ottenendo risposte sbagliate **senza accorgertene**. Meglio un fallimento immediato e diagnosticabile che un comportamento scorretto silenzioso (stesso principio delle Lezioni 5.2 e 5.5).

</details>

### Esercizio 3 — Separa stabile da dinamico 🔴 Avanzato

Questo prompt mescola stabile e dinamico: *"Sei un analista. Analizza Q3-2026 vs Q3-2025: 1.2M€ contro 1.1M€. Rispondi con TREND, VARIAZIONE, CONFIDENZA. Niente linguaggio vago."* Spiega perché è un problema e riscrivilo separando system prompt e task template.

<details>
<summary>💡 Mostra soluzione</summary>

**Perché è un problema:** mescola informazioni **stabili** (ruolo, formato, vincoli) con **dati specifici** della richiesta (i numeri di Q3). Se versionassi questo come system prompt, il file cambierebbe a *ogni richiesta* per ragioni non legate al comportamento → il versionamento perde significato.

**Riscrittura:**

System prompt (stabile, in `prompts/system.md`):
```
Sei un analista di dati di vendita. Analizza solo i numeri forniti.
Rispondi sempre con: TREND (crescita/calo/stabile), VARIAZIONE (%),
CONFIDENZA (alta/media/bassa). Non usare linguaggio vago.
```

Task template (dinamico, compilato a runtime):
```
Analizza il periodo {{periodo}} confrontandolo con {{periodo_confronto}}.
Dati: {{dati_grezzi}}
```

A runtime: `{{periodo}}`=Q3-2026, `{{periodo_confronto}}`=Q3-2025, `{{dati_grezzi}}`="1.2M€ vs 1.1M€". Ora il system prompt resta stabile e versionabile, i dati variano solo nell'istanza.

</details>

---

## Connessioni

**Viene da:** Lezione 4.4 (Il Prompting) e Lezione 4.3 (ruoli system/user) — questa lezione formalizza con rigore professionale concetti introdotti lì in forma base. Lezione 7.2 (L'Agent Package) — approfondisce la cartella `prompts/` introdotta in quella lezione.

**Porta a:** Lezione 7.7 (Skills e Skill Library) — vedremo come alcune istruzioni, troppo specifiche per il system prompt ma troppo generali per un singolo task, trovano una collocazione propria come "skill" riutilizzabili.

**Ritroverai questi concetti in:** Lezione 9.2 (Prompt Auto-Evolutivi) — il versionamento qui descritto come buona pratica diventa, in quella lezione, un prerequisito tecnico indispensabile per un sistema che modifica automaticamente i propri prompt. Lezione 9.4 (Governance) — il ciclo di revisione tramite pull request qui introdotto sarà formalizzato come parte del ciclo di vita completo degli artefatti agentivi.
