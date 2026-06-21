---
id: "07-07"
titolo: "Skills e Skill Library: competenze riutilizzabili tra agenti"
sottotitolo: "L'ultimo mattone del package: come centralizzare la conoscenza condivisa tra molti agenti"
capitolo: 7
capitolo_titolo: "L'Agent Package"
lezione: 7
durata_stimata: "65 minuti"
difficolta: "avanzato"
prerequisiti: ["07-04"]
concetti_chiave:
  - skill
  - skill library
  - skill injection
  - tool vs skill
  - governance delle skill
obiettivi:
  - "Distinguere con precisione una skill da uno strumento (tool)"
  - "Costruire una skill riutilizzabile in formato standard"
  - "Implementare un meccanismo di skill injection in un agent package"
  - "Progettare la governance di una skill library condivisa"
stato: "pubblicata"
versione: "1.0"
---
# Skills e Skill Library: competenze riutilizzabili tra agenti

## Introduzione

Chiudiamo il Capitolo 7 — il nucleo ingegneristico professionale di questo corso — con un concetto che completa l'agent package costruito nella Lezione 7.2: le **skill**. Avevamo lasciato questa cartella, `skills/`, solo accennata in quella lezione. È il momento di trattarla con la stessa profondità riservata a prompt, contratti, e handoff.

Una skill risolve un problema specifico, diverso da quelli già affrontati: cosa fare quando una **competenza specifica** — non uno strumento eseguibile, non un singolo prompt — deve essere condivisa tra **molti agenti diversi**, e mantenuta aggiornata in un unico posto, invece di essere duplicata (e quindi, inevitabilmente, fatta divergere nel tempo) in ciascun agente che ne ha bisogno.

---

## Obiettivi di Apprendimento

Al termine di questa lezione sarai in grado di:

- Distinguere con precisione una skill da uno strumento (tool), due concetti spesso confusi
- Costruire una skill riutilizzabile in un formato standard, coerente con tutto il resto dell'agent package
- Implementare un meccanismo di skill injection che inserisce dinamicamente una skill nel prompt di un agente
- Progettare la governance di una skill library condivisa tra molti agenti

---

## 1. Tool vs Skill: una distinzione che va fissata con precisione

Il termine "skill" viene a volte usato in modo intercambiabile con "tool" (Lezione 5.4), ma descrive un concetto fondamentalmente diverso.

```
TOOL (Lezione 5.4)                     SKILL

È CODICE eseguibile                    È CONOSCENZA/ISTRUZIONE
                                         strutturata

Il modello lo "richiede", il           Il modello la "usa" come
programma lo ESEGUE                     parte del proprio contesto
                                         di ragionamento

Esempio: una funzione che              Esempio: un documento che
interroga un database                  spiega "come si calcola
                                        correttamente la crescita
                                        percentuale anno su anno,
                                        gestendo i casi limite
                                        come valori a zero"

Restituisce un RISULTATO                Arricchisce il PROMPT con
concreto (dati, conferma                conoscenza procedurale o
di un'azione)                           di dominio
```

> **Un'analogia per fissare la distinzione:** un tool è come usare una calcolatrice — esegue un'operazione e restituisce un numero. Una skill è come avere studiato un metodo specifico per risolvere un certo tipo di problema — non esegue nulla direttamente, ma cambia *come* affronti il problema, perché ora possiedi una procedura o una conoscenza che prima non avevi.

---

## 2. Perché serve una Skill Library

Immagina che, nel tuo sistema, sia l'Agente Analista Vendite (Lezione 6.3) sia un nuovo Agente Previsioni Finanziarie debbano entrambi calcolare correttamente variazioni percentuali anno su anno, gestendo correttamente i casi limite (ad esempio, cosa succede se il valore dell'anno precedente era zero — un'operazione che produrrebbe una divisione per zero).

Senza una skill condivisa, questa logica dovrebbe essere **scritta due volte**, in due prompt diversi, da persone potenzialmente diverse, in momenti diversi. Il rischio concreto: una delle due versioni viene successivamente corretta per un bug scoperto in produzione, mentre l'altra resta con il problema originale — le due versioni **divergono silenziosamente**, esattamente il tipo di incoerenza che abbiamo combattuto, sotto altre forme, in tutto questo capitolo.

```
SENZA SKILL LIBRARY

Agente A: istruzioni su calcolo            Agente B: istruzioni su
percentuali scritte nel SUO                calcolo percentuali scritte
prompt specifico                           nel SUO prompt specifico
(duplicate, possono divergere)             (duplicate, possono divergere)


CON SKILL LIBRARY

              skill: "calcolo_variazioni_percentuali.md"
              (UN SOLO documento, fonte di verità unica)
                         │              │
                         ▼              ▼
                  Agente A          Agente B
            (la "carica" a runtime, (la "carica" a runtime,
             stessa logica sempre)   stessa logica sempre)
```

Aggiornare la skill in un unico punto **propaga automaticamente** la correzione a tutti gli agenti che la usano, alla prossima esecuzione — senza dover ricordare di modificare manualmente ogni singolo prompt che conteneva quella stessa logica duplicata.

---

## 3. Struttura di una skill

```markdown
---
id: "calcolo-variazioni-percentuali"
versione: "1.1"
tipo: "skill"
dominio: "analisi-finanziaria"
owner: "team-data-engineering"
ultima_modifica: "2026-04-02"
---

# Skill: Calcolo di Variazioni Percentuali

## Quando usare questa skill

Usa questa procedura ogni volta che devi calcolare una
variazione percentuale tra due periodi (es. anno su anno,
trimestre su trimestre).

## Procedura

1. Variazione % = ((valore_attuale - valore_precedente) /
   valore_precedente) × 100

2. CASO LIMITE: se valore_precedente è 0, NON calcolare
   una percentuale (divisione per zero). Dichiara invece:
   "variazione non calcolabile: assenza di dato base"

3. Arrotonda sempre a una cifra decimale

## Esempio

valore_attuale = 1200, valore_precedente = 1100
→ ((1200 - 1100) / 1100) × 100 = 9.1%

valore_attuale = 500, valore_precedente = 0
→ "variazione non calcolabile: assenza di dato base"
```

Nota che questo documento è scritto seguendo esattamente le stesse convenzioni di frontmatter della Lezione 7.1, e una struttura per sezioni simile a quella dei prompt professionali della Lezione 7.4 — non è un caso: una skill è, concettualmente, un **frammento di prompt riutilizzabile**, con la propria identità, versione, e ciclo di vita.

---

## 4. Implementazione pratica: skill injection

Vediamo come un agente "carica" dinamicamente una skill, inserendola nel proprio contesto al momento dell'esecuzione — un meccanismo chiamato **skill injection**.

```python
def carica_skill(id_skill: str, cartella_skill_library: str) -> str:
    """
    Carica il contenuto di una skill dalla libreria condivisa,
    riusando il parser di frontmatter della Lezione 7.1.
    """
    percorso = os.path.join(cartella_skill_library, f"{id_skill}.md")
    _, contenuto = estrai_frontmatter(percorso)
    return contenuto


def costruisci_system_prompt_con_skills(prompt_base: str,
                                          skills_richieste: list[str],
                                          cartella_skill_library: str) -> str:
    """
    Inietta una o più skill nel prompt di sistema di un agente,
    estendendo le sue competenze senza duplicare la logica.
    """
    sezioni_skill = []
    for id_skill in skills_richieste:
        contenuto_skill = carica_skill(id_skill, cartella_skill_library)
        sezioni_skill.append(f"## Competenza: {id_skill}\n{contenuto_skill}")

    blocco_skills = "\n\n".join(sezioni_skill)

    return f"{prompt_base}\n\n# Competenze Disponibili\n\n{blocco_skills}"


# Utilizzo: l'Agente Analista Vendite E l'Agente Previsioni
# Finanziarie possono entrambi caricare la STESSA skill

prompt_analista = costruisci_system_prompt_con_skills(
    prompt_base="Sei un analista di dati di vendita...",
    skills_richieste=["calcolo-variazioni-percentuali"],
    cartella_skill_library="skill_library_condivisa/"
)

prompt_previsioni = costruisci_system_prompt_con_skills(
    prompt_base="Sei un analista di previsioni finanziarie...",
    skills_richieste=["calcolo-variazioni-percentuali"],
    cartella_skill_library="skill_library_condivisa/"
)
```

Entrambi i prompt risultanti includono **esattamente la stessa procedura**, caricata dinamicamente dalla stessa fonte unica. Se la skill viene successivamente aggiornata — ad esempio, per gestire un nuovo caso limite scoperto in produzione — entrambi gli agenti beneficeranno automaticamente della correzione alla loro prossima esecuzione, senza che nessuno debba ricordarsi di propagare manualmente la modifica.

---

## 5. Governance di una Skill Library condivisa

Quando una skill library serve molti agenti, possibilmente mantenuti da team diversi, emerge una domanda organizzativa, non solo tecnica: **chi può modificare una skill condivisa**, e con quale processo?

```
PRINCIPI DI GOVERNANCE CONSIGLIATI

1. Ogni skill ha un OWNER dichiarato (visto nel frontmatter
   della Sezione 3) — responsabile della sua correttezza

2. Le modifiche passano attraverso REVISIONE (pull request,
   Lezione 7.4), specialmente se la skill è usata da agenti
   di più team diversi

3. Le modifiche sono VERSIONATE (Lezione 7.1, e formalizzate
   nella Lezione 9.4): un cambiamento che altera il
   comportamento atteso della skill richiede un nuovo
   numero di versione, non una modifica silenziosa

4. Gli agenti che usano una skill DICHIARANO quale versione
   si aspettano (esattamente come un contratto, Lezione 7.5),
   permettendo di rilevare automaticamente se un agente sta
   usando una versione obsoleta o se una nuova versione
   della skill introduce un cambiamento che richiede verifica
```

Questi principi anticipano direttamente la trattazione completa della governance degli artefatti agentivi che affronteremo nella Lezione 9.4 — qui applicata specificamente al caso delle skill condivise, che per la loro natura di "conoscenza centralizzata usata da molti" sono particolarmente sensibili a una governance disciplinata.

---

## Esempio Pratico: Riconoscere Quando una Logica Merita di Diventare una Skill

Applica questo criterio: **una logica merita di diventare una skill condivisa quando viene usata, o probabilmente verrà usata, da più di un agente, e quando la sua correttezza richiede mantenimento nel tempo** (non è una semplice istruzione statica che non cambierà mai).

1. "Rispondi sempre in italiano formale" — **non una skill**: è una preferenza di comportamento specifica di un singolo agente, non una competenza procedurale condivisibile
2. "Come interpretare correttamente le date in formato italiano vs americano, evitando ambiguità tra giorno/mese" — **buona candidata a skill**: è una procedura specifica, riutilizzabile da qualsiasi agente che debba elaborare date, e potrebbe richiedere aggiornamenti se si scoprono nuovi casi limite
3. "Il nome del cliente per questa specifica richiesta è Mario Rossi" — **non una skill, né un prompt stabile**: è un dato specifico della singola esecuzione (un task prompt dinamico, Lezione 7.4), non una competenza riutilizzabile

---

## Riepilogo

- Una **skill** è conoscenza o istruzione procedurale strutturata che arricchisce il contesto di ragionamento di un agente, distinta da un **tool** (Lezione 5.4), che è codice eseguibile che produce un risultato concreto.
- Una **skill library** centralizza competenze condivise tra più agenti, evitando la duplicazione (e la conseguente divergenza nel tempo) della stessa logica in prompt separati.
- Una skill si struttura come documento `.md` con frontmatter (Lezione 7.1), seguendo le stesse convenzioni degli altri artefatti dell'agent package.
- La **skill injection** inserisce dinamicamente il contenuto di una skill nel prompt di sistema di un agente a runtime, permettendo a più agenti di condividere esattamente la stessa logica senza duplicarla nel codice.
- La **governance** di una skill library condivisa richiede owner dichiarati, processo di revisione, versionamento esplicito, e dichiarazione delle versioni attese da parte di chi consuma la skill.

---

## Domande di Verifica

1. Riprendi la skill "calcolo-variazioni-percentuali" della Sezione 3. Se questa logica fosse implementata come un **tool** (una funzione Python che esegue il calcolo) invece che come una skill, quali vantaggi e quali svantaggi avrebbe questa scelta alternativa? (Suggerimento: pensa a precisione del calcolo vs flessibilità di adattare la spiegazione del caso limite al contesto specifico.)

2. Spiega perché, senza un meccanismo di versionamento dichiarato per le skill (Sezione 5), un aggiornamento a una skill condivisa potrebbe causare un comportamento inatteso in un agente che, di fatto, era stato progettato e testato assumendo una versione precedente della stessa skill.

3. Applicando il criterio dell'esempio pratico finale, valuta se questa istruzione meriterebbe di diventare una skill condivisa: "Come anonimizzare correttamente dati sensibili (nomi, indirizzi email) prima di includerli in un log o in un report, rispettando le normative sulla privacy."

---

## Esercizi Pratici

> Tre esercizi a difficoltà crescente. Prova a risolverli da solo prima di aprire la soluzione.

### Esercizio 1 — Tool o skill? 🟢 Base

Spiega la differenza tra un **tool** e una **skill**. Classifica: (a) una funzione che interroga un database, (b) un documento che spiega come calcolare correttamente la crescita percentuale gestendo i casi limite.

<details>
<summary>💡 Mostra soluzione</summary>

- **Tool:** è **codice eseguibile**. Il modello lo *richiede*, il programma lo *esegue*, restituisce un risultato concreto.
- **Skill:** è **conoscenza/istruzione strutturata**. Il modello la *usa* come parte del proprio ragionamento; arricchisce il prompt, non esegue nulla.

Classificazione:
- **(a) query al database** → **tool** (codice che esegue e restituisce dati).
- **(b) documento sul calcolo percentuale** → **skill** (procedura/conoscenza che guida *come* ragionare).

Analogia: il tool è la calcolatrice; la skill è aver studiato un metodo per risolvere un tipo di problema.

</details>

### Esercizio 2 — Perché una skill library 🟡 Intermedio

(a) Quale problema risolve centralizzare una logica in una skill library invece di duplicarla in due prompt? (b) "Rispondi sempre in italiano formale" è una buona candidata a skill condivisa? Perché?

<details>
<summary>💡 Mostra soluzione</summary>

**(a)** Evita la **duplicazione** e la conseguente **divergenza silenziosa**: se la stessa logica è scritta in due prompt e una viene corretta per un bug mentre l'altra no, le due versioni divergono. Con una skill library c'è **una fonte di verità unica**: aggiornarla propaga la correzione a tutti gli agenti che la caricano.

**(b)** **No.** "Rispondi in italiano formale" è una **preferenza di comportamento** di un singolo agente, non una competenza procedurale condivisibile e mantenibile nel tempo. Sta meglio nel system prompt di quell'agente. Una skill è giustificata quando la logica è **riutilizzata da più agenti** e **richiede mantenimento** (es. "come gestire date ambigue giorno/mese").

</details>

### Esercizio 3 — Skill vs tool e versionamento 🔴 Avanzato

(a) Il calcolo della variazione percentuale: meglio implementarlo come tool o come skill? Vantaggi e svantaggi di ciascuno. (b) Perché senza versionamento dichiarato delle skill un aggiornamento può rompere un agente?

<details>
<summary>💡 Mostra soluzione</summary>

**(a) Tool vs skill per il calcolo percentuale:**
- **Come tool** (funzione Python): garantisce **precisione assoluta** del calcolo (nessun errore aritmetico del modello) e ripetibilità. Svantaggio: meno flessibile nell'adattare la spiegazione/gestione dei casi limite al contesto.
- **Come skill** (procedura nel prompt): flessibile e adattabile (il modello può spiegare il caso "valore precedente = 0" nel contesto), ma il calcolo resta soggetto agli errori di generazione del modello.

Spesso la scelta migliore è **combinare**: un tool per il calcolo esatto + una skill per spiegare come interpretarlo e gestire i casi limite.

**(b) Versionamento:** un agente è progettato e **testato** assumendo un certo comportamento della skill. Se la skill condivisa cambia silenziosamente (es. cambia il modo di gestire un caso limite), l'agente eredita un comportamento diverso da quello con cui è stato validato — possibile regressione inattesa. Dichiarare la versione attesa permette di **rilevare** che un agente sta usando una versione diversa e di verificarne l'impatto prima di adottarla.

</details>

---

## Connessioni

**Viene da:** Lezione 7.4 (I Prompt come Artefatti) — una skill è concettualmente un frammento di prompt riutilizzabile, con la stessa disciplina di versionamento. Lezione 5.4 (Function Calling) — la distinzione tool/skill richiama e completa quella distinzione.

**Porta a:** Capitolo 8 (Workflow Multi-Agente) — un workflow professionale combina agent package completi (Lezione 7.2), ciascuno potenzialmente arricchito da skill condivise, coordinati attraverso handoff (Lezione 7.6) e contratti (Lezione 7.5).

**Ritroverai questi concetti in:** Lezione 9.4 (Governance e Versioning) — i principi di governance qui applicati alle skill saranno generalizzati a tutti gli artefatti di un sistema agentivo maturo.

---

**CHIUSURA DEL CAPITOLO 7.** Con questa lezione si conclude l'intero nucleo ingegneristico professionale del corso: la struttura di file di un agent package (7.2), la sua identità pubblica tramite Agent Card (7.3), i prompt trattati come codice sorgente versionato (7.4), i contratti che garantiscono coerenza tra agenti (7.5), gli handoff che trasferiscono responsabilità con tutto il contesto necessario (7.6), e le skill che centralizzano conoscenza condivisa (7.7) — tutto fondato sul formato YAML/frontmatter introdotto in apertura (7.1). Il Capitolo 8 assembla ora questi agent package in workflow multi-agente completi, implementati con strumenti professionali come LangGraph.
