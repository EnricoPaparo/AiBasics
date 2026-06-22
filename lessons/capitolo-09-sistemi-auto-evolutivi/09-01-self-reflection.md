---
id: "09-01"
titolo: "Self-Reflection e Self-Critique: l'agente che valuta sé stesso"
sottotitolo: "L'ultima frontiera del corso: un sistema che non solo agisce, ma riflette sul proprio agire"
capitolo: 9
capitolo_titolo: "Sistemi Auto-Evolutivi"
lezione: 1
durata_stimata: "65 minuti"
difficolta: "avanzato"
prerequisiti: ["08-05"]
concetti_chiave:
  - reflexion
  - self-critique
  - act-reflect-revise
  - echo chamber
  - bias di conferma
obiettivi:
  - "Distinguere self-critique da Critic-Agent con precisione"
  - "Implementare il ciclo act-reflect-revise per un agente"
  - "Riconoscere i rischi specifici della self-reflection: echo chamber e bias di conferma"
  - "Decidere quando la self-reflection è appropriata e quando serve un revisore esterno"
stato: "pubblicata"
versione: "1.0"
---
# Self-Reflection e Self-Critique: l'agente che valuta sé stesso

In questo capitolo — l'ultimo del corso — affrontiamo la frontiera più avanzata dei sistemi agentici: quelli che non si limitano ad agire, ma riflettono sul proprio operato, imparano dai propri errori e si auto-migliorano nel tempo. È qui che convergono tutti i concetti del corso, in sistemi che ambiscono a essere non solo funzionali, ma genuinamente adattativi.

## Introduzione

Apriamo l'ultimo capitolo del corso con un concetto che, a prima vista, potrebbe sembrare già coperto: nella Lezione 8.3 abbiamo costruito il pattern Critic-Agent, dove un agente indipendente valuta l'output di un altro. La **self-reflection** è diversa, e la differenza è precisamente il punto di questa lezione: qui, è lo **stesso agente** che, dopo aver completato un'azione, si ferma a valutare criticamente il proprio operato, prima di procedere o di considerare il compito concluso.

Questa distinzione, che potrebbe apparire sottile, ha implicazioni profonde sia sui vantaggi che sui rischi del pattern — ed è precisamente per questo che, nella Lezione 8.3, avevamo dichiarato esplicitamente di rimandare questa discussione a un trattamento più rigoroso qui, nel capitolo dedicato all'auto-miglioramento.

---

## Obiettivi di Apprendimento

Al termine di questa lezione sarai in grado di:

- Distinguere con precisione self-critique da Critic-Agent (Lezione 8.3)
- Implementare il ciclo act-reflect-revise per un agente che lavora autonomamente
- Riconoscere i rischi specifici della self-reflection: echo chamber e bias di conferma
- Decidere, con criteri espliciti, quando la self-reflection è appropriata e quando è necessario un revisore esterno

---

## 1. Self-Critique vs Critic-Agent: la differenza che conta

```
CRITIC-AGENT (Lezione 8.3)             SELF-CRITIQUE (questa lezione)

Un AGENTE DIVERSO valuta               LO STESSO AGENTE valuta
                                         il proprio output

Il valutatore ha un prompt e           Il valutatore E il produttore
un "punto di vista" indipendente        condividono lo stesso
dal produttore                          "punto di vista" di partenza

Costo: richiede di mantenere           Costo: più economico (nessun
e coordinare un secondo agente          secondo agente da mantenere),
nel sistema                             ma...

Vantaggio: meno soggetto a              Rischio: più soggetto a bias
bias di conferma                        di conferma (Sezione 4)
```

Il pattern **Reflexion**, che dà il nome a questa tecnica nella letteratura sull'AI, applica esattamente questo principio: un agente che, dopo aver prodotto un output o completato un'azione, genera esplicitamente una valutazione critica della propria stessa performance, e usa questa valutazione per decidere se rivedere il proprio lavoro prima di considerarlo concluso.

---

## 2. Il ciclo Act → Reflect → Revise → Re-evaluate

```
                    [ACT]
              L'agente esegue
              un'azione o produce
              un output (Capitolo 6)
                      │
                      ▼
                  [REFLECT]
          L'agente stesso genera una
          valutazione critica esplicita
          del proprio output appena
          prodotto
                      │
              ┌───────┴───────┐
              ▼                ▼
        Valutazione        Valutazione
        POSITIVA           NEGATIVA
              │                │
              ▼                ▼
        [Procedi]         [REVISE]
                          L'agente produce
                          una versione
                          corretta
                                │
                                ▼
                        [RE-EVALUATE]
                        Si valuta di nuovo,
                        tornando al punto
                        decisionale
```

Implementiamo questo ciclo in codice, estendendo direttamente il loop agentivo della Lezione 6.1.

```python
import anthropic
import json

def esegui_agente_con_self_reflection(obiettivo: str,
                                         max_cicli_revisione: int = 3) -> str:
    """
    Estende il loop agentivo della Lezione 6.1 con un ciclo
    di self-reflection PRIMA di restituire l'output finale.
    """
    client = anthropic.Anthropic()

    # FASE ACT: produzione iniziale (riusa il pattern di base)
    output_corrente = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=800,
        messages=[{"role": "user", "content": obiettivo}]
    ).content[0].text

    for ciclo in range(max_cicli_revisione):
        # FASE REFLECT: l'agente valuta il proprio stesso output
        riflessione = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=300,
            system="Valuta CRITICAMENTE la risposta che hai appena "
                   "prodotto. Rispondi in JSON: "
                   '{"problemi_rilevati": [...], "qualita": "buona"|"da_migliorare"}',
            messages=[
                {"role": "user", "content": obiettivo},
                {"role": "assistant", "content": output_corrente},
                {"role": "user", "content": "Valuta criticamente la "
                                              "risposta sopra."}
            ]
        ).content[0].text

        valutazione = json.loads(riflessione)

        if valutazione["qualita"] == "buona":
            return output_corrente  # nessuna revisione necessaria

        # FASE REVISE: produce una versione corretta
        output_corrente = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=800,
            messages=[
                {"role": "user", "content": obiettivo},
                {"role": "assistant", "content": output_corrente},
                {"role": "user", "content": f"Correggi questi problemi: "
                                              f"{valutazione['problemi_rilevati']}"}
            ]
        ).content[0].text
        # Il ciclo for ripete: RE-EVALUATE alla prossima iterazione

    return output_corrente  # limite di sicurezza raggiunto
    # (esattamente il principio di max_iterazioni, Lezione 6.1)
```

Nota il parametro `max_cicli_revisione`: esattamente come il `max_iterazioni` della Lezione 6.1, è un meccanismo di sicurezza necessario, perché un ciclo di self-reflection, senza limite, potrebbe in teoria continuare a "trovare problemi" indefinitamente, senza mai convergere a un output considerato sufficientemente buono.

---

## 3. Online vs Offline: due momenti diversi per riflettere

```
SELF-CRITIQUE ONLINE (durante il task)

Avviene DURANTE l'esecuzione di un
compito, prima di considerarlo concluso
— esattamente il ciclo della Sezione 2

Adatto per: correggere errori PRIMA
che l'output raggiunga l'utente o il
passo successivo del workflow


SELF-CRITIQUE OFFLINE (dopo il task)

Avviene DOPO che un'esecuzione è
già stata completata e conclusa,
analizzando retrospettivamente cosa
ha funzionato e cosa no

Adatto per: alimentare un processo di
apprendimento dall'esperienza passata
— un'anteprima diretta del riassorbimento
della conoscenza che vedremo nella
Lezione 9.3
```

La distinzione conta perché le due modalità servono scopi diversi: la self-critique online migliora **questo specifico output**, prima che venga consegnato; la self-critique offline migliora **il sistema nel tempo**, fornendo materiale per un processo di apprendimento che va oltre la singola esecuzione.

---

## 4. I rischi: echo chamber e bias di conferma

Avevamo accennato, nella Lezione 8.3, al motivo per cui un Critic-Agent indipendente è spesso preferibile a un'auto-valutazione: il rischio di **bias di conferma**. Approfondiamo ora questo rischio con la precisione che merita.

```
RISCHIO: ECHO CHAMBER

Se l'agente che produce e l'agente che valuta condividono
lo stesso "punto di vista" (stesso modello sottostante,
stesse limitazioni strutturali viste nella Lezione 4.5),
un errore SISTEMATICO del produttore può non essere
rilevato dalla riflessione, perché la riflessione stessa
condivide la stessa cecità

Esempio concreto: se il modello ha una lacuna di
conoscenza su un argomento specifico (knowledge cutoff,
Lezione 4.5), sia la risposta originale SIA la sua
auto-valutazione potrebbero condividere la stessa
lacuna, producendo una falsa sensazione di "qualità
confermata"


RISCHIO: BIAS DI CONFERMA

La riflessione può tendere a generare giustificazioni
PLAUSIBILI per l'output già prodotto, invece di una
valutazione genuinamente indipendente — un fenomeno
collegato direttamente al "ragionamento circolare"
già discusso nella Lezione 6.2 a proposito di ReAct
```

> **Perché questo non significa che la self-reflection sia inutile:** questi rischi non eliminano il valore della tecnica — la riducono a un livello di affidabilità diverso da quello di un Critic-Agent indipendente. La self-reflection rimane efficace per correggere errori **locali e specifici** (un calcolo sbagliato, un dettaglio del formato dimenticato), molto meno efficace per rilevare errori sistematici o lacune di fondo che il modello condivide con sé stesso in ogni sua "versione" all'interno della stessa esecuzione.

---

## 5. Quando scegliere self-reflection, quando un revisore esterno

```
USA SELF-REFLECTION (più economica) QUANDO:

- Il rischio è principalmente di errori LOCALI e
  specifici (dimenticanze, dettagli di formato)
- Il costo di un secondo agente indipendente non è
  giustificato dalla criticità del compito
- Serve un primo livello di filtro economico prima
  di un eventuale escalation più costosa


USA CRITIC-AGENT INDIPENDENTE (Lezione 8.3) QUANDO:

- Il compito è ad alto impatto, dove un errore
  sistematico non rilevato avrebbe conseguenze serie
- Si sospetta che il produttore possa avere lacune
  di conoscenza specifiche (Lezione 4.5) che un
  secondo punto di vista, magari con accesso a
  fonti esterne diverse (RAG, Lezione 5.3), potrebbe
  rilevare meglio
- Serve massima indipendenza di giudizio, accettando
  il costo aggiuntivo
```

In molti sistemi professionali maturi, questi due pattern **coesistono in strati successivi**: la self-reflection come primo filtro economico (questa lezione), seguita da un Critic-Agent indipendente per i casi che superano una certa soglia di criticità (Lezione 8.3), seguito a sua volta da Human-in-the-Loop per i casi più ambigui (Lezione 8.4) — una gerarchia di costi crescenti e affidabilità crescente, applicata in sequenza.

---

## Esempio Pratico: Riconoscere un Caso di Echo Chamber

Immagina che l'agente Analista Vendite (Lezione 6.3), eseguendo self-reflection sul proprio output, riceva questa riflessione: *"La mia analisi sembra corretta e ben strutturata, nessun problema rilevato."*

Ma l'agente, nel produrre l'analisi originale, aveva interpretato erroneamente una colonna di dati (scambiando "vendite nette" con "vendite lorde" — un errore di interpretazione, non di calcolo). La self-reflection, basandosi sullo stesso modello e sulla stessa (errata) interpretazione iniziale, **non rileva il problema**, perché valuta la coerenza interna della propria risposta, non la sua corrispondenza con la realtà dei dati originali — un caso da manuale di echo chamber, dove solo un Critic-Agent con accesso indipendente ai dati grezzi, o una revisione umana, avrebbe potuto rilevare la discrepanza.

---

## Riepilogo

- La **self-reflection** (o self-critique) si distingue dal Critic-Agent (Lezione 8.3) per il fatto che lo stesso agente, non uno indipendente, valuta il proprio output.
- Il ciclo **act → reflect → revise → re-evaluate**, implementato estendendo il loop agentivo base (Lezione 6.1), permette a un agente di correggere autonomamente errori locali prima di considerare il compito concluso.
- La self-critique può essere **online** (durante il task, per migliorare l'output corrente) o **offline** (dopo il task, per alimentare apprendimento futuro — anteprima della Lezione 9.3).
- I rischi principali sono l'**echo chamber** (un errore sistematico condiviso da produttore e valutatore non viene rilevato) e il **bias di conferma** (la riflessione giustifica invece di valutare genuinamente).
- I sistemi maturi spesso combinano self-reflection (filtro economico iniziale), Critic-Agent indipendente (per casi più critici), e Human-in-the-Loop (per casi ambigui), in una gerarchia di costi e affidabilità crescenti.

---

## Domande di Verifica

1. Spiega perché il rischio di echo chamber descritto nell'esempio pratico (interpretazione errata di una colonna di dati) sarebbe probabilmente rilevato da un Critic-Agent indipendente con accesso ai dati grezzi originali, ma non dalla self-reflection.

2. Nel codice della Sezione 2, cosa garantisce che il ciclo non continui indefinitamente se il modello, per qualche motivo, non è mai pienamente "satisfatto" della propria risposta?

3. Descrivi uno scenario in cui userestituiresti self-critique offline (non online) come strumento preferito, motivando la scelta in base allo scopo specifico di quella modalità.

---

## Esercizi Pratici

> Tre esercizi a difficoltà crescente. Prova a risolverli da solo prima di aprire la soluzione.

### Esercizio 1 — Self-critique o Critic-Agent? 🟢 Base

Qual è la differenza tra self-critique e Critic-Agent (Lezione 8.3)? Indica un vantaggio e uno svantaggio della self-critique.

<details>
<summary>💡 Mostra soluzione</summary>

- **Critic-Agent:** un agente **diverso e indipendente** valuta l'output, con un proprio punto di vista.
- **Self-critique:** lo **stesso agente** valuta il proprio output.

**Vantaggio della self-critique:** più **economica** (nessun secondo agente da mantenere e coordinare); buon primo filtro.

**Svantaggio:** più soggetta a **bias di conferma / echo chamber** — produttore e valutatore condividono lo stesso punto di vista e le stesse lacune, quindi un errore sistematico può sfuggire.

</details>

### Esercizio 2 — Perché l'echo chamber 🟡 Intermedio

L'agente interpreta male una colonna ("vendite nette" vs "vendite lorde"), poi la self-reflection dice "tutto corretto". Perché non rileva l'errore? Cosa l'avrebbe rilevato?

<details>
<summary>💡 Mostra soluzione</summary>

La self-reflection valuta la **coerenza interna** della propria risposta, **basandosi sulla stessa (errata) interpretazione iniziale**. Poiché produttore e valutatore sono lo stesso modello con la stessa premessa sbagliata, la riflessione "conferma" l'errore invece di rilevarlo — un **echo chamber**: condividono la stessa cecità.

Cosa l'avrebbe rilevato: un **Critic-Agent indipendente con accesso ai dati grezzi originali** (che potrebbe accorgersi della discrepanza tra interpretazione e realtà), o una **revisione umana**. La self-reflection è efficace per errori *locali* (un calcolo, un formato), non per errori *sistematici* di interpretazione condivisi col valutatore.

</details>

### Esercizio 3 — Quale livello scegliere 🔴 Avanzato

(a) Quando preferisci self-reflection e quando un revisore esterno? (b) Come si combinano spesso nei sistemi maturi? (c) Cosa impedisce al ciclo di self-reflection di non convergere mai?

<details>
<summary>💡 Mostra soluzione</summary>

**(a)** **Self-reflection** quando il rischio è di errori **locali/specifici**, il compito non è ad alto impatto, e serve un filtro economico. **Critic-Agent indipendente** quando il compito è **ad alto impatto**, si sospettano lacune sistematiche, o serve massima indipendenza di giudizio (accettando il costo).

**(b)** In **strati successivi** a costo/affidabilità crescenti: self-reflection (filtro economico) → Critic-Agent indipendente (casi più critici) → Human-in-the-Loop (casi ambigui). Ogni livello filtra ciò che il precedente non risolve.

**(c)** Un **limite di cicli** (`max_cicli_revisione`), lo stesso principio del `max_iterazioni` (Lezione 6.1). Senza, l'agente potrebbe continuare a "trovare problemi" indefinitamente senza mai considerare l'output abbastanza buono. La soglia garantisce terminazione.

</details>

---

## Connessioni

**Viene da:** Lezione 8.3 (Il Layer di Review) — questa lezione approfondisce la distinzione, lì solo accennata, tra valutazione indipendente e auto-valutazione. Lezione 6.2 (ReAct) — il rischio di ragionamento circolare trova qui una manifestazione specifica e più rischiosa.

**Porta a:** Lezione 9.2 (Prompt Auto-Evolutivi) — il principio di un agente che valuta e corregge il proprio comportamento si estenderà, in quella lezione, dalla correzione di un singolo output alla modifica del prompt stesso che genera tutti gli output futuri.

**Ritroverai questi concetti in:** Lezione 9.3 (Riassorbimento della Conoscenza) — la self-critique offline qui introdotta è il meccanismo elementare su cui si fonda un sistema che accumula esperienza nel tempo.
