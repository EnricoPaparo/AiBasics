---
id: "06-06"
titolo: "Gli Handoff: come un agente passa il controllo a un altro"
sottotitolo: "Il momento esatto in cui la responsabilità si trasferisce — e cosa deve viaggiare con essa"
capitolo: 6
capitolo_titolo: "L'Agent Package: Struttura, Contratti e Artefatti"
lezione: 6
durata_stimata: "70 minuti"
difficolta: "avanzato"
prerequisiti: ["06-05"]
concetti_chiave:
  - handoff
  - trasferimento di contesto
  - handoff sincrono
  - handoff asincrono
  - documento di handoff
obiettivi:
  - "Distinguere un handoff da una semplice chiamata di funzione"
  - "Costruire un documento di handoff completo in formato .md con frontmatter"
  - "Implementare un handoff sincrono e discuterne le alternative asincrone"
  - "Progettare un handoff reale tra un Requirement Analyst e un Architect Agent"
stato: "pubblicata"
versione: "1.0"
---

# Gli Handoff: come un agente passa il controllo a un altro

## Introduzione

Negli esempi del Capitolo 5 e nelle lezioni precedenti di questo capitolo, gli agenti si "chiamavano" a vicenda in un modo molto diretto: l'orchestratore della Lezione 5.3 chiamava una funzione Python, aspettava il risultato, e procedeva. Questo pattern, chiamato tecnicamente **chiamata sincrona**, funziona bene per pipeline semplici, ma non descrive con precisione cosa accade in sistemi più sofisticati, dove un agente non si limita a "restituire un valore" al chiamante: **trasferisce un intero contesto di lavoro**, con la responsabilità di completarlo, a un altro agente.

Questo trasferimento formale — contesto, stato, e responsabilità — si chiama **handoff**. È uno dei concetti più importanti di questo capitolo, perché è precisamente il meccanismo che useremo per costruire pipeline complesse dove ogni agente lavora su un documento di lavoro condiviso e via via più ricco, invece di limitarsi a restituire un singolo valore numerico o una breve stringa di testo.

---

## Obiettivi di Apprendimento

Al termine di questa lezione sarai in grado di:

- Distinguere con precisione un handoff da una semplice chiamata di funzione
- Costruire un documento di handoff completo in formato Markdown con frontmatter
- Implementare un handoff sincrono in codice, e discutere le alternative asincrone
- Progettare un handoff realistico tra un Requirement Analyst Agent e un Architect Agent

---

## 1. Chiamata di funzione vs Handoff: la differenza che conta

```
CHIAMATA DI FUNZIONE (Lezione 5.3)

agente_B_risultato = agente_B(input_da_agente_A)

→ Agente A passa UN VALORE, aspetta la risposta,
  e RIPRENDE il controllo dopo aver ricevuto il risultato
→ Agente A resta "responsabile" del processo complessivo


HANDOFF

documento_handoff = costruisci_handoff(lavoro_svolto_da_A, contesto)
trasferisci_a(documento_handoff, destinatario="agente_B")

→ Agente A passa un DOCUMENTO COMPLETO di lavoro
  e la RESPONSABILITÀ di continuare il processo
→ Agente A TERMINA il proprio coinvolgimento — non
  aspetta una risposta da restituire a sua volta
→ Agente B diventa il nuovo responsabile, con tutto
  il contesto necessario per procedere autonomamente
```

La differenza non è solo tecnica: è concettuale. In una chiamata di funzione, l'agente chiamante mantiene la responsabilità finale e usa l'altro agente come uno strumento (esattamente come il Function Calling della Lezione 4.4). In un handoff, la responsabilità stessa **si trasferisce**: l'agente che riceve l'handoff diventa il nuovo "proprietario" del processo, con piena autonomia su come procedere da quel punto in avanti.

> **Perché questa distinzione conta nel caso reale che hai in mente:** un Requirement Analyst Agent che analizza una cartella di documenti misti, e produce un handoff per un Architect Agent, non sta "chiedendo all'Architect di fare un calcolo e tornare con un risultato" — sta **trasferendo l'intero progetto**, con tutto il contesto raccolto, perché l'Architect lo porti avanti autonomamente nella fase successiva. Questo è precisamente il tipo di relazione che un handoff formalizza, e che una semplice chiamata di funzione non rappresenterebbe correttamente.

---

## 2. Cosa contiene un documento di handoff

Un documento di handoff ben progettato contiene quattro categorie di informazione, costruite sulle competenze già acquisite in questo capitolo:

```
1. OUTPUT DELL'AGENTE CORRENTE
   Il lavoro effettivamente prodotto, validato contro
   il contratto dichiarato (Lezione 6.5)

2. CONTESTO RILEVANTE
   Informazioni di sfondo necessarie per chi riceve
   l'handoff, che potrebbero non essere ovvie dal solo
   output (es. vincoli scoperti durante l'analisi,
   decisioni prese e perché)

3. ISTRUZIONI PER IL SUCCESSIVO
   Cosa ci si aspetta che il destinatario faccia con
   questo materiale — non sempre ovvio dal solo output

4. METADATI
   Tracciabilità: chi ha prodotto questo handoff, quando,
   con quale versione dell'agente (riprendendo il
   frontmatter della Lezione 6.1)
```

---

## 3. Implementazione pratica: un documento di handoff completo

Costruiamo un esempio concreto e realistico — l'handoff dal Requirement Analyst Agent verso un Architect Agent, riprendendo esplicitamente il caso d'uso che hai in mente per il tuo progetto.

```markdown
---
tipo: "handoff"
da_agente: "requirement-analyst-agent"
a_agente: "architect-agent"
versione_schema: "1.0"
timestamp: "2026-06-19T14:30:00Z"
id_progetto: "progetto-cliente-X-2026"
stato_handoff: "completo"
---

# Handoff: Requirement Analyst → Architect

## 1. Output Prodotto

### Requisiti Identificati

- **Funzionali:** Il sistema deve permettere upload di
  cartelle con file misti (PDF, immagini, audio) e
  produrre un'analisi strutturata automaticamente
- **Non Funzionali:** Tempo di elaborazione massimo
  accettabile: 5 minuti per cartella di dimensione media
  (~50 file)

### Vincoli Tecnici Rilevati

- Il cliente richiede che il sistema funzioni anche
  offline per i file PDF (vincolo scoperto durante
  l'analisi dei documenti forniti, non esplicitato
  inizialmente nella richiesta originale)

## 2. Contesto Rilevante

Durante l'analisi della cartella fornita dal cliente,
sono stati trovati 3 documenti contraddittori riguardo
al formato di output desiderato (due richiedono PDF,
uno richiede solo Markdown). Questo è stato segnalato
come AMBIGUITÀ DA RISOLVERE, non come decisione presa
autonomamente.

## 3. Istruzioni per l'Architect Agent

- Progettare l'architettura assumendo la necessità di
  generare ENTRAMBI i formati di output (PDF e Markdown),
  data l'ambiguità non risolta nel punto 2
- Dare priorità architetturale al vincolo di funzionamento
  offline per i PDF

## 4. Artefatti Allegati

- `requisiti_completi.json` (conforme allo schema
  `RequisitiOutput`, Lezione 6.5)
- `documenti_originali_analizzati.pdf` (per riferimento)
```

Osserva come questo documento **non è semplicemente un output tecnico**: contiene una sezione di contesto che spiega *perché* certe decisioni non sono state prese autonomamente (l'ambiguità sui formati), e istruzioni esplicite che guidano il destinatario su come gestire quell'ambiguità — invece di lasciare che la scopra da solo, rileggendo l'intera analisi da zero.

---

## 4. Implementazione pratica: handoff sincrono in codice

```python
from datetime import datetime, timezone
import json

class DocumentoHandoff:
    """
    Rappresenta un handoff formale tra due agenti,
    costruito secondo la struttura della Sezione 2.
    """
    def __init__(self, da_agente: str, a_agente: str,
                 output: dict, contesto: str, istruzioni: str):
        self.da_agente = da_agente
        self.a_agente = a_agente
        self.output = output
        self.contesto = contesto
        self.istruzioni = istruzioni
        self.timestamp = datetime.now(timezone.utc).isoformat()

    def to_markdown(self) -> str:
        """Genera il documento .md con frontmatter (Lezione 6.1)."""
        frontmatter = {
            "tipo": "handoff",
            "da_agente": self.da_agente,
            "a_agente": self.a_agente,
            "timestamp": self.timestamp
        }
        corpo = f"""
## Output Prodotto
{json.dumps(self.output, indent=2)}

## Contesto Rilevante
{self.contesto}

## Istruzioni per il Successivo
{self.istruzioni}
"""
        import yaml
        return f"---\n{yaml.dump(frontmatter)}---\n{corpo}"


def esegui_handoff_sincrono(documento: DocumentoHandoff,
                              funzione_agente_destinatario) -> dict:
    """
    Handoff SINCRONO: il chiamante attende che l'agente
    destinatario completi il proprio lavoro, in questa
    stessa esecuzione del programma.
    """
    print(f"[HANDOFF] {documento.da_agente} → {documento.a_agente}")
    return funzione_agente_destinatario(documento)


# Utilizzo:
handoff = DocumentoHandoff(
    da_agente="requirement-analyst-agent",
    a_agente="architect-agent",
    output={"requisiti": ["upload multi-formato", "elaborazione < 5 min"]},
    contesto="Trovata ambiguità sui formati di output richiesti.",
    istruzioni="Progettare assumendo necessità di entrambi i formati."
)

risultato_finale = esegui_handoff_sincrono(handoff, architect_agent)
```

---

## 5. Handoff sincroni vs asincroni: implicazioni di design

Nell'esempio della Sezione 4, l'handoff è **sincrono**: il programma resta in attesa, nella stessa esecuzione, che l'Architect Agent completi il proprio lavoro prima di proseguire. Questo è adatto quando l'intero processo deve completarsi in un'unica sessione, con un utente che attende il risultato finale.

Esiste un'alternativa, l'**handoff asincrono**, dove il documento di handoff viene depositato (ad esempio, in una coda di messaggi o in un database) e l'agente destinatario lo elabora **in un momento successivo, potenzialmente in un processo completamente separato**:

```
HANDOFF SINCRONO                       HANDOFF ASINCRONO

A produce l'handoff                    A produce l'handoff
       │                                       │
       ▼                                       ▼
B lo elabora IMMEDIATAMENTE             L'handoff viene salvato
nella stessa esecuzione                 (es. in una coda)
       │                                       │
       ▼                                       ▼
A riceve il risultato finale            A TERMINA, senza attendere
o conferma di completamento             B elaborerà quando può,
                                          possibilmente molto dopo
```

L'handoff asincrono è particolarmente utile quando il lavoro del destinatario potrebbe richiedere tempo significativo, o quando — come accennato nella Lezione 6.2 a proposito della separazione dei ruoli in un team — il destinatario potrebbe richiedere **revisione umana** prima di procedere (anticipando direttamente il pattern Human-in-the-Loop che formalizzeremo nella Lezione 7.4). Per il tuo caso d'uso specifico — un Requirement Analyst che produce un handoff per un Architect, con un PDF generato per revisione umana — un pattern asincrono, dove l'handoff viene depositato e l'umano lo revisiona prima che l'Architect Agent proceda, è spesso più appropriato di un flusso completamente sincrono e automatico.

---

## Esempio Pratico: Riconoscere Quando Serve un Handoff invece di una Chiamata

Applichiamo la distinzione della Sezione 1 a tre scenari:

1. **"Calcola la somma di questi numeri e dammi il risultato"** → chiamata di funzione (Lezione 4.4): un valore semplice, nessun trasferimento di responsabilità complessiva
2. **"Analizza questi documenti e prepara tutto il necessario perché un altro team possa procedere con la progettazione"** → handoff: un intero contesto di lavoro, con responsabilità che si trasferisce a chi riceve
3. **"Verifica se questo numero è positivo o negativo"** → chiamata di funzione: una domanda puntuale con una risposta puntuale

Il criterio distintivo, in ciascun caso, è la **quantità di contesto e responsabilità** che deve accompagnare il trasferimento: una chiamata di funzione è appropriata per interazioni puntuali; un handoff è appropriato quando l'intero "stato di avanzamento" di un processo complesso deve passare da un agente a un altro, con quest'ultimo che ne assume la piena responsabilità da quel momento in avanti.

---

## Riepilogo

- Un **handoff** trasferisce non solo un valore, ma un intero **contesto di lavoro e la responsabilità di continuarlo**, distinguendosi nettamente da una chiamata di funzione dove il chiamante mantiene la responsabilità finale.
- Un documento di handoff completo contiene **output prodotto** (validato secondo i contratti della Lezione 6.5), **contesto rilevante**, **istruzioni per il successivo**, e **metadati di tracciabilità**.
- Il formato `.md` con frontmatter (Lezione 6.1) è lo standard naturale per un documento di handoff, combinando struttura machine-readable con contenuto human-readable.
- Gli **handoff sincroni** completano il trasferimento nella stessa esecuzione; gli **handoff asincroni** depositano il documento per un'elaborazione successiva, spesso necessaria quando è prevista revisione umana intermedia.

---

## Domande di Verifica

1. Riprendi l'esempio dell'handoff Requirement Analyst → Architect nella Sezione 3. Perché segnalare l'ambiguità sui formati di output come "contesto rilevante", invece di scegliere autonomamente uno dei due formati, è una scelta progettuale più sicura per il sistema complessivo?

2. Spiega perché, nel tuo caso d'uso specifico (analisi di cartelle multimediali con output verso revisione umana), un pattern di handoff asincrono potrebbe essere più appropriato di uno sincrono.

3. Costruisci tu stesso, riprendendo la struttura della Sezione 2, un documento di handoff minimo per un caso diverso: un agente che ha completato la trascrizione di un file audio e deve passare il testo trascritto a un agente che ne produce un riassunto.

---

## Esercizi Pratici

> Tre esercizi a difficoltà crescente. Prova a risolverli da solo prima di aprire la soluzione.

### Esercizio 1 — Chiamata o handoff? 🟢 Base

Qual è la differenza fondamentale tra una chiamata di funzione e un handoff? Chi resta "responsabile" del processo in ciascun caso?

<details>
<summary>💡 Mostra soluzione</summary>

- **Chiamata di funzione:** l'agente A passa *un valore*, attende il risultato, e **riprende il controllo**. A resta responsabile del processo complessivo; usa B come uno strumento.
- **Handoff:** A passa *un documento completo di lavoro* e la **responsabilità di continuare**. A **termina** il proprio coinvolgimento; B diventa il nuovo responsabile, con tutto il contesto per procedere autonomamente.

La differenza non è solo tecnica: nell'handoff si trasferisce la **responsabilità**, non solo un dato.

</details>

### Esercizio 2 — Cosa contiene un handoff 🟡 Intermedio

(a) Classifica come **chiamata** o **handoff**: "calcola la somma di questi numeri" vs "analizza questi documenti e prepara tutto perché un altro team progetti". (b) Quali quattro categorie di informazione contiene un buon documento di handoff?

<details>
<summary>💡 Mostra soluzione</summary>

**(a)**
- "calcola la somma" → **chiamata di funzione**: interazione puntuale, risposta puntuale.
- "analizza e prepara tutto per un altro team" → **handoff**: si trasferisce un intero contesto di lavoro e la responsabilità.

**(b) Le quattro categorie:**
1. **Output prodotto** (validato contro il contratto, Lezione 6.5).
2. **Contesto rilevante** (vincoli scoperti, decisioni prese e perché).
3. **Istruzioni per il successivo** (cosa deve fare il destinatario).
4. **Metadati** di tracciabilità (chi, quando, quale versione).

</details>

### Esercizio 3 — Ambiguità e sincrono vs asincrono 🔴 Avanzato

Nell'handoff Requirement Analyst → Architect: (a) perché segnalare un'ambiguità sui formati come "contesto" invece di deciderla da soli è più sicuro? (b) Per un flusso con revisione umana intermedia, meglio handoff sincrono o asincrono? Perché?

<details>
<summary>💡 Mostra soluzione</summary>

**(a) Segnalare invece di decidere:** l'agente analista **non ha l'autorità/contesto** per risolvere un'ambiguità di business (due documenti chiedono PDF, uno Markdown). Decidere autonomamente significherebbe nascondere un conflitto reale e potenzialmente sbagliare. Segnalarlo come "contesto da risolvere" preserva l'informazione per chi (umano o Architect) ha l'autorità di decidere — è onestà sui limiti applicata all'architettura.

**(b) Sincrono vs asincrono:** con revisione umana intermedia è più appropriato l'**asincrono**. L'handoff viene **depositato** (coda/database), l'umano lo revisiona quando può — anche ore/giorni dopo — e solo poi l'Architect procede. Un flusso sincrono terrebbe il programma bloccato in attesa di un umano per un tempo arbitrario, il che non è praticabile. L'asincrono disaccoppia produzione dell'handoff e sua elaborazione (anticipa il checkpointing della Lezione 7.2 e l'HITL della 7.4).

</details>

---

## Connessioni

**Viene da:** Lezione 6.5 (Contratti tra Agenti) — l'output di un handoff deve rispettare i contratti lì definiti. Lezione 6.1 (YAML e Frontmatter) — il formato esatto del documento di handoff.

**Porta a:** Lezione 6.7 (Skills e Skill Library) — vedremo come anche le competenze condivise, non solo i singoli handoff, possono essere strutturate come documenti riutilizzabili.

**Ritroverai questi concetti in:** Lezione 7.1 (Progettare un Workflow Agentivo) — gli handoff sono gli "archi" del grafo agentivo che progetteremo in quella lezione. Lezione 7.4 (Human-in-the-Loop) — il pattern di handoff asincrono con revisione umana intermedia, qui solo accennato per il tuo caso d'uso, riceverà un trattamento architetturale completo.
