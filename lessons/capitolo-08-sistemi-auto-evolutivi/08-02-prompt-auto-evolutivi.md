---
id: "08-02"
titolo: "Prompt Auto-Evolutivi: come i prompt migliorano nel tempo"
sottotitolo: "Dal correggere un output al correggere ciò che genera TUTTI gli output futuri"
capitolo: 8
capitolo_titolo: "Sistemi Agentici che si Auto-Migliorano"
lezione: 2
durata_stimata: "70 minuti"
difficolta: "avanzato"
prerequisiti: ["08-01", "06-04"]
concetti_chiave:
  - Automatic Prompt Optimization
  - APO
  - DSPy
  - prompt drift
  - over-optimization
obiettivi:
  - "Spiegare la differenza tra correggere un output e correggere un prompt"
  - "Implementare un ciclo base di Automatic Prompt Optimization"
  - "Descrivere perché il versionamento è un prerequisito tecnico, non opzionale"
  - "Riconoscere i segnali di prompt drift e over-optimization"
stato: "pubblicata"
versione: "1.0"
---

# Prompt Auto-Evolutivi: come i prompt migliorano nel tempo

## Introduzione

Nella lezione precedente abbiamo costruito un agente capace di correggere il proprio output, una singola volta, all'interno di una singola esecuzione. Questa lezione fa un salto concettuale significativo: cosa succederebbe se, invece di correggere **un output**, un sistema potesse correggere **il prompt stesso** che genera tutti gli output futuri di un agente?

Questo è il problema dei **prompt auto-evolutivi**: un prompt scritto oggi, per quanto ben progettato secondo i principi della Lezione 6.4, diventa progressivamente subottimale man mano che il sistema incontra casi nuovi, edge case non previsti, o semplicemente perché esistono formulazioni migliori che nessuno ha ancora scoperto. La domanda che affrontiamo qui è: **chi aggiorna il prompt, e come, in modo sistematico invece di affidarsi a revisioni manuali occasionali?**

---

## Obiettivi di Apprendimento

Al termine di questa lezione sarai in grado di:

- Spiegare con precisione la differenza tra correggere un output (Lezione 8.1) e correggere un prompt
- Implementare un ciclo base di Automatic Prompt Optimization (APO)
- Descrivere perché il versionamento dei prompt (Lezione 6.4) è un prerequisito tecnico indispensabile, non semplicemente una buona pratica
- Riconoscere i segnali di prompt drift e di over-optimization, e le strategie per prevenirli

---

## 1. Il problema: un prompt scritto oggi è subottimale domani

Riprendiamo il prompt dell'Agente Analista Vendite, costruito con cura nella Lezione 6.4. Quel prompt è stato scritto sulla base della comprensione e dei casi noti **al momento della sua scrittura**. Ma il sistema, una volta in produzione, incontrerà:

```
- Casi limite non previsti durante la progettazione iniziale
  (es. dati con valori negativi mai considerati)

- Pattern di errore RICORRENTI, rilevabili solo osservando
  molte esecuzioni nel tempo (esattamente i log strutturati
  della Lezione 5.5, e le metriche della Lezione 7.5)

- Formulazioni alternative del prompt che, empiricamente,
  producono risultati migliori — ma che nessun umano ha
  ancora provato o scoperto
```

Senza un meccanismo sistematico, l'aggiornamento del prompt dipende interamente dalla disponibilità e dall'attenzione di un umano che nota il problema, lo diagnostica, e propone una correzione — un processo lento, discontinuo, e che non scala bene quando il sistema cresce in complessità (Lezione 5.4) e in numero di agenti da mantenere.

---

## 2. Automatic Prompt Optimization (APO): il ciclo di base

L'idea centrale di APO applica, al prompt stesso, lo stesso principio di "produci, valuta, correggi" già visto nella Lezione 8.1 — ma con un modello che **agisce sul prompt di un altro agente**, invece che sul proprio output.

```
                  [ESEGUI]
        L'agente, con il prompt ATTUALE,
        elabora un campione di casi di test
        (Lezione 7.5)
                      │
                      ▼
                  [VALUTA]
        Le risposte vengono valutate secondo
        le metriche già costruite (Lezione 7.5),
        identificando DEBOLEZZE specifiche
                      │
                      ▼
              [PROPONI VARIANTE]
        Un modello (diverso ruolo, "optimizer")
        propone una VARIANTE del prompt,
        mirata a correggere le debolezze
        identificate
                      │
                      ▼
                  [TESTA]
        La VARIANTE viene eseguita sugli
        stessi casi di test (regression
        testing, Lezione 7.5)
                      │
              ┌───────┴───────┐
              ▼                ▼
        MIGLIORE             PEGGIORE o
        della versione        EQUIVALENTE
        attuale                  │
              │                  ▼
              ▼            [SCARTA la variante,
      [ADOTTA la variante   mantieni il prompt
       come nuova versione   attuale]
       ufficiale, Lezione
       6.4]
```

---

## 3. Implementazione pratica: un ciclo base di APO

```python
import anthropic
import json

def proponi_variante_prompt(prompt_attuale: str,
                              debolezze_rilevate: list[str]) -> str:
    """
    Usa un modello nel ruolo di 'optimizer': non genera
    risposte al compito originale, ma MIGLIORA il prompt
    che istruisce un altro agente a farlo.
    """
    client = anthropic.Anthropic()

    risposta = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=600,
        system="Sei un esperto di prompt engineering. Il tuo "
               "compito è migliorare un prompt esistente per "
               "correggere debolezze specifiche, mantenendo "
               "intatto tutto ciò che già funziona bene.",
        messages=[{
            "role": "user",
            "content": f"PROMPT ATTUALE:\n{prompt_attuale}\n\n"
                       f"DEBOLEZZE RILEVATE (da casi di test "
                       f"falliti, Lezione 7.5):\n"
                       f"{json.dumps(debolezze_rilevate)}\n\n"
                       f"Proponi una versione migliorata del "
                       f"prompt che corregga SPECIFICAMENTE "
                       f"queste debolezze."
        }]
    )
    return risposta.content[0].text


def ciclo_apo(prompt_attuale: str, casi_test: list[dict],
               workflow_compilato) -> dict:
    """
    Implementa il ciclo completo della Sezione 2, riusando
    la test suite della Lezione 7.5 come criterio oggettivo
    di confronto.
    """
    # FASE ESEGUI + VALUTA (riusa esegui_test_suite, Lezione 7.5)
    report_attuale = esegui_test_suite(casi_test, workflow_compilato)

    debolezze = [d["caso"] for d in report_attuale["dettagli"]
                 if not d["successo"]]

    if not debolezze:
        return {"esito": "nessuna_correzione_necessaria"}

    # FASE PROPONI VARIANTE
    nuovo_prompt = proponi_variante_prompt(prompt_attuale, debolezze)

    # FASE TESTA (sostituendo temporaneamente il prompt)
    workflow_con_variante = ricompila_con_nuovo_prompt(nuovo_prompt)
    report_variante = esegui_test_suite(casi_test, workflow_con_variante)

    # CONFRONTO OGGETTIVO
    if report_variante["passati"] > report_attuale["passati"]:
        return {
            "esito": "variante_migliore",
            "nuovo_prompt": nuovo_prompt,
            "miglioramento": report_variante["passati"] - report_attuale["passati"]
        }
    else:
        return {"esito": "variante_scartata", "motivo": "nessun miglioramento misurabile"}
```

Osserva che la decisione di **adottare o scartare** la variante non si basa su un giudizio soggettivo, ma su un **confronto numerico oggettivo** tra il numero di test passati prima e dopo — esattamente il principio di regression testing costruito con cura nella Lezione 7.5. Senza quella disciplina di misurazione, un sistema di APO non avrebbe alcun criterio affidabile per distinguere un miglioramento reale da un cambiamento casuale o, peggio, da un peggioramento mascherato da una formulazione più convincente stilisticamente.

---

## 4. Perché il versionamento è un prerequisito tecnico, non opzionale

Avevamo introdotto il versionamento dei prompt, nella Lezione 6.4, come buona pratica ingegneristica. In un sistema con APO, il versionamento smette di essere "buona pratica" e diventa **condizione tecnica indispensabile** per il funzionamento corretto del sistema:

```
SENZA VERSIONAMENTO RIGOROSO

Una variante viene adottata automaticamente
→ Se in produzione emerge un problema NON
  rilevato dalla test suite (Lezione 7.5 ha
  comunque dei limiti — nessuna suite è
  esaustiva), non c'è modo di sapere CHE
  prompt era in uso quando il problema si
  è verificato, né di tornare alla versione
  precedente con certezza


CON VERSIONAMENTO RIGOROSO

Ogni adozione di una variante crea un
nuovo commit versionato (Lezione 6.4,
Sezione 4) → se emerge un problema,
si può identificare ESATTAMENTE quale
versione era attiva, e fare ROLLBACK
immediato a una versione precedente nota
come funzionante
```

Questo è precisamente il motivo per cui la Lezione 6.4 insisteva sul versionamento con la stessa disciplina del codice sorgente: in un sistema che si auto-modifica, la tracciabilità non è un lusso, è la **rete di sicurezza** senza la quale l'automazione diventerebbe rischiosa fino all'irresponsabilità.

---

## 5. DSPy e framework dedicati

Il ciclo costruito manualmente nella Sezione 3 illustra il principio, ma framework dedicati come **DSPy** offrono implementazioni più sofisticate dello stesso concetto, con tecniche di ottimizzazione più avanzate di un semplice confronto "prova una variante, mantienila se migliore". DSPy, in particolare, tratta i prompt non come stringhe da modificare manualmente, ma come **parametri di un programma** che possono essere ottimizzati sistematicamente, in modo concettualmente simile a come i pesi di una rete neurale (Lezione 2.3) vengono ottimizzati tramite backpropagation — qui, l'"ottimizzazione" avviene a livello di testo del prompt, guidata da un modello, non da un gradiente matematico.

Per gli scopi di questo corso, è più importante comprendere il **principio** (produci, valuta oggettivamente, proponi variante, confronta, adotta solo se migliore, versiona sempre) che padroneggiare i dettagli implementativi di un framework specifico — il principio si applica identicamente, sia che venga implementato a mano come nella Sezione 3, sia tramite strumenti più sofisticati.

---

## 6. I rischi: Prompt Drift e Over-Optimization

```
PROMPT DRIFT

Una serie di piccole modifiche, ciascuna
apparentemente migliorativa secondo la test
suite del momento, può ACCUMULARSI in una
deriva complessiva che allontana il prompt
dal suo scopo originale — specialmente se
la test suite non viene mai aggiornata per
coprire nuovi casi rilevanti


OVER-OPTIMIZATION

Il prompt viene ottimizzato eccessivamente
sui casi SPECIFICI della test suite attuale,
perdendo la capacità di generalizzare bene
a casi NUOVI e diversi — un parallelo diretto
con l'OVERFITTING visto nella Lezione 2.2,
qui applicato non ai pesi di un modello ma
al testo di un prompt
```

> **La mitigazione più efficace per entrambi i rischi:** mantenere la test suite (Lezione 7.5) in costante crescita ed evoluzione, aggiungendo regolarmente nuovi casi scoperti in produzione, e sottoporre periodicamente le versioni "auto-evolute" del prompt a revisione umana (Lezione 7.4) — non per ogni singola micro-modifica, ma a intervalli regolari, per verificare che la direzione complessiva dell'evoluzione resti coerente con gli obiettivi originali del sistema.

---

## Esempio Pratico: Riconoscere un Caso di Prompt Drift

Immagina che, nel corso di sei mesi, il prompt dell'Agente Analista Vendite sia stato modificato automaticamente dodici volte, ciascuna approvata perché migliorava il punteggio sulla test suite del momento. Un revisore umano, confrontando la versione attuale con quella originale (un confronto reso possibile esattamente dal versionamento rigoroso della Sezione 4), nota che il prompt attuale è diventato estremamente lungo e specifico, con decine di istruzioni su casi limite molto particolari — ma fatica a gestire bene un caso completamente nuovo e ragionevole, mai incontrato nei dodici cicli di ottimizzazione precedenti.

Questo è un caso da manuale di **over-optimization**: il prompt si è specializzato eccessivamente sui casi storicamente osservati, perdendo parte della capacità di generalizzazione che il prompt originale, più semplice, possedeva naturalmente. La mitigazione, in questo scenario, richiederebbe di rivedere l'intera evoluzione, possibilmente tornando a una versione più semplice e ricostruendo l'ottimizzazione con una test suite più diversificata fin dall'inizio.

---

## Riepilogo

- I **prompt auto-evolutivi** estendono il principio di self-correction (Lezione 8.1) dalla correzione di un singolo output alla correzione del prompt stesso che genera tutti gli output futuri.
- Il ciclo di **Automatic Prompt Optimization** (esegui, valuta, proponi variante, testa, adotta solo se oggettivamente migliore) si fonda sulla test suite costruita nella Lezione 7.5 come criterio di confronto imparziale.
- Il **versionamento** dei prompt (Lezione 6.4), in un sistema con APO, smette di essere buona pratica opzionale e diventa prerequisito tecnico indispensabile per la tracciabilità e il rollback.
- **DSPy** e framework simili offrono implementazioni più sofisticate dello stesso principio, trattando i prompt come parametri di un programma da ottimizzare sistematicamente.
- I rischi di **prompt drift** (deriva accumulata) e **over-optimization** (perdita di generalizzazione, un parallelo dell'overfitting della Lezione 2.2) richiedono mitigazione attiva: test suite in costante evoluzione e revisione umana periodica.

---

## Domande di Verifica

1. Spiega perché, nel codice della Sezione 3, la decisione di adottare una variante si basa sul confronto numerico tra `report_variante["passati"]` e `report_attuale["passati"]`, invece che su un giudizio qualitativo generato da un altro modello (es. "questo prompt sembra migliore").

2. Collegandolo esplicitamente alla Lezione 2.2, spiega in che modo l'over-optimization di un prompt è concettualmente analoga all'overfitting di un modello di Machine Learning.

3. Riprendi l'esempio pratico del prompt drift dopo dodici cicli. Quale modifica al PROCESSO di APO (non al prompt stesso) avrebbe potuto prevenire questo problema fin dall'inizio?

---

## Connessioni

**Viene da:** Lezione 8.1 (Self-Reflection) — il principio di auto-correzione si estende qui dal singolo output al prompt. Lezione 6.4 (I Prompt come Artefatti) e Lezione 7.5 (Valutazione dei Workflow) — entrambe sono prerequisiti tecnici dichiarati e indispensabili per questa lezione.

**Porta a:** Lezione 8.3 (Riassorbimento della Conoscenza) — i prompt auto-evolutivi sono una forma specifica del principio più ampio di un sistema che accumula e usa esperienza nel tempo.

**Ritroverai questi concetti in:** Lezione 8.4 (Governance e Versioning) — la disciplina di tracciabilità qui dichiarata indispensabile sarà formalizzata come parte del ciclo di vita completo degli artefatti agentivi.
