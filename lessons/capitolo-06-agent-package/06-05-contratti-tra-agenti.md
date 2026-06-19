---
id: "06-05"
titolo: "Contratti tra Agenti: schemi di input/output e validazione"
sottotitolo: "Risolvere finalmente, in modo rigoroso, il problema di coerenza identificato nel Capitolo 5"
capitolo: 6
capitolo_titolo: "L'Agent Package: Struttura, Contratti e Artefatti"
lezione: 5
durata_stimata: "65 minuti"
difficolta: "avanzato"
prerequisiti: ["06-03", "04-02"]
concetti_chiave:
  - contratto
  - JSON Schema
  - validazione automatica
  - violazione di contratto
  - escalation
obiettivi:
  - "Spiegare cosa è un contratto in un sistema distribuito e perché serve"
  - "Definire contratti di input/output con Pydantic per un agente reale"
  - "Implementare validazione automatica con gestione esplicita delle violazioni"
  - "Progettare una strategia di escalation per le violazioni di contratto"
stato: "pubblicata"
versione: "1.0"
---

# Contratti tra Agenti: schemi di input/output e validazione

## Introduzione

Nella Lezione 5.4 abbiamo identificato un problema concreto: agenti diversi, scritti in momenti diversi, possono usare terminologie diverse per concetti che dovrebbero essere identici (`importo_totale` contro `valore_vendite`), causando incoerenze silenziose nella pipeline. Avevamo promesso, in quella lezione, che la soluzione sarebbe arrivata sotto forma di **contratti formali**. Questa lezione tiene quella promessa.

Un contratto, nel senso che useremo qui, non è un documento legale: è una **dichiarazione tecnica precisa e verificabile automaticamente** di cosa un agente si aspetta di ricevere e cosa garantisce di restituire. È, concettualmente, l'estensione naturale di tutto ciò che abbiamo già costruito — gli output strutturati della Lezione 4.2, lo schema referenziato nell'Agent Card della Lezione 6.3 — qui formalizzato come componente esplicito e centrale dell'architettura di un sistema multi-agente.

---

## Obiettivi di Apprendimento

Al termine di questa lezione sarai in grado di:

- Spiegare cosa è un contratto in un sistema distribuito e perché diventa indispensabile quando crescono il numero di agenti
- Definire contratti di input e output con Pydantic per un agente reale, riutilizzando le competenze della Lezione 4.2
- Implementare validazione automatica con gestione esplicita delle violazioni
- Progettare una strategia di escalation per i casi in cui un contratto viene violato

---

## 1. Cosa è un contratto, e perché diventa indispensabile a una certa scala

Un **contratto**, nel contesto dei sistemi distribuiti (un concetto dell'ingegneria del software applicabile direttamente ai sistemi multi-agente), è la promessa esplicita e verificabile su **cosa entra** e **cosa esce** da un componente, indipendentemente da come quel componente è implementato internamente.

Con un solo agente, o con due agenti scritti dalla stessa persona nello stesso momento (come negli esempi della Lezione 5.3), la coerenza terminologica può essere mantenuta "a memoria", senza formalizzazione esplicita. Ma il problema cresce rapidamente:

```
CON 2 AGENTI:                          CON 10 AGENTI:

1 connessione da mantenere             45 possibili connessioni
coerente a memoria                      (combinazioni di coppie)
                                         — mantenerle coerenti
                                         "a memoria" diventa
                                         praticamente impossibile
```

Questa crescita combinatoria — con N agenti, il numero di possibili interazioni cresce proporzionalmente a N² — è precisamente la ragione tecnica per cui i contratti formali, opzionali e quasi superflui in un sistema con due agenti, diventano **indispensabili** in un sistema con dieci, venti, o cento agenti, come quelli che incontrerai in contesti professionali reali.

---

## 2. Definire un contratto con Pydantic

Riprendiamo direttamente la competenza costruita nella Lezione 4.2, applicandola ora non a un singolo output di un modello, ma al **contratto completo** di un agente all'interno di un agent package.

```python
from pydantic import BaseModel, Field
from typing import Literal

class InputAnalistaVendite(BaseModel):
    """
    Contratto di INPUT per l'Agente Analista Vendite.
    Qualsiasi chiamante deve fornire dati in questo formato esatto.
    """
    periodo: str = Field(description="Formato: 'Q[1-4]-YYYY', es. 'Q3-2026'")
    periodo_confronto: str = Field(description="Stesso formato di periodo")
    valore_vendite: float = Field(gt=0, description="Valore in euro, sempre positivo")
    numero_transazioni: int = Field(gt=0)


class OutputAnalistaVendite(BaseModel):
    """
    Contratto di OUTPUT che l'Agente Analista Vendite GARANTISCE
    di produrre. Qualsiasi agente a valle può fare affidamento
    su questa struttura esatta.
    """
    trend: Literal["crescita", "calo", "stabile"]
    variazione_percentuale: float
    confidenza: Literal["alta", "media", "bassa"]
    note: str = ""
```

Osserva che questi schemi **risolvono esattamente** il problema identificato nella Lezione 5.4: il campo si chiama `valore_vendite`, non `importo_totale` né alcuna altra variante — ed essendo definito in un unico posto, condiviso da chiunque debba interagire con questo agente, non c'è più spazio per ambiguità terminologica tra chi produce questo input e chi consuma quell'output.

> **Perché Literal è una scelta progettuale precisa:** il tipo `Literal["crescita", "calo", "stabile"]` non accetta **nessun altro valore possibile** per il campo `trend`. Questo è più rigoroso di un semplice `str`, perché elimina alla radice il rischio che un agente a valle riceva un valore inatteso come "in aumento" invece di "crescita" — una variante semanticamente equivalente ma testualmente diversa, che causerebbe esattamente il tipo di incoerenza silenziosa che i contratti sono pensati per prevenire.

---

## 3. Validazione automatica con gestione esplicita delle violazioni

Definire lo schema non basta: serve un meccanismo che lo **applichi** effettivamente, a ogni passaggio di dati tra agenti, intercettando le violazioni prima che si propaghino silenziosamente nel sistema.

```python
from pydantic import ValidationError

def valida_input_agente(dati_grezzi: dict, schema: type[BaseModel]) -> BaseModel:
    """
    Valida i dati in ingresso contro il contratto dichiarato.
    Solleva un errore ESPLICITO e dettagliato in caso di violazione,
    invece di lasciare che dati malformati entrino nell'agente.
    """
    try:
        return schema(**dati_grezzi)
    except ValidationError as errore:
        raise ContrattoViolato(
            f"Violazione del contratto di input: {errore}"
        )


class ContrattoViolato(Exception):
    """Eccezione dedicata per violazioni di contratto tra agenti."""
    pass


def esegui_agente_analista_con_contratto(dati_grezzi: dict) -> dict:
    """
    L'agente valida l'input PRIMA di elaborarlo, e valida
    il proprio output PRIMA di restituirlo — un doppio
    controllo ai confini del componente.
    """
    # Validazione dell'INPUT contro il contratto dichiarato
    input_validato = valida_input_agente(dati_grezzi, InputAnalistaVendite)

    # ... qui avverrebbe la chiamata API reale al modello
    # (Lezione 4.1), usando input_validato per costruire il prompt ...
    risultato_grezzo_dal_modello = {
        "trend": "crescita",
        "variazione_percentuale": 9.1,
        "confidenza": "alta",
        "note": ""
    }

    # Validazione dell'OUTPUT contro il contratto dichiarato,
    # PRIMA di restituirlo a chi ha chiamato questo agente
    output_validato = OutputAnalistaVendite(**risultato_grezzo_dal_modello)

    return output_validato.model_dump()
```

Questo doppio controllo — validare sia l'input ricevuto sia l'output prodotto, **ai confini** del componente — è un principio di robustezza analogo a quello visto nella Lezione 5.5: meglio fallire immediatamente, con un errore chiaro e diagnosticabile (`ContrattoViolato`), che lasciare propagare dati incoerenti in profondità nel sistema, dove l'origine del problema diventerebbe sempre più difficile da rintracciare.

---

## 4. Cosa fare quando un contratto viene violato

Una violazione di contratto può avere origini diverse, e la risposta appropriata dipende da quale:

```
CAUSA: Il MODELLO ha prodotto un output che non rispetta
        lo schema dichiarato (es. ha scritto "in crescita"
        invece di "crescita")

  → STRATEGIA: ri-tentare la chiamata con un prompt
    rafforzato (riprendendo il pattern della Lezione 4.2),
    o applicare un mapping di normalizzazione per le
    varianti più comuni


CAUSA: Chi CHIAMA l'agente ha fornito dati che non
        rispettano il contratto di input dichiarato
        (es. un periodo in un formato sbagliato)

  → STRATEGIA: rifiutare esplicitamente la richiesta con
    un messaggio di errore chiaro, che indichi esattamente
    quale campo non rispetta il formato atteso — MAI
    tentare di "indovinare" un'interpretazione alternativa


CAUSA: Il contratto stesso è cambiato (una nuova versione
        dell'agente modifica lo schema) senza che i
        chiamanti ne siano stati informati

  → STRATEGIA: questo è precisamente il problema di
    versionamento discusso nella Lezione 6.3 — la
    soluzione non è tecnica ma di PROCESSO: ogni
    cambiamento di contratto richiede un aggiornamento
    di versione esplicito (Lezione 8.4) e comunicazione
    a chi dipende dall'agente
```

> **Quando l'escalation diventa necessaria:** se le violazioni di un certo tipo si ripetono con frequenza anomala (ad esempio, il modello produce ripetutamente output che violano lo schema, nonostante i tentativi di correzione), questo è un segnale che merita **intervento umano** — non un problema che un sistema automatico dovrebbe continuare a tentare di risolvere autonomamente all'infinito. Anticipiamo qui il principio di escalation che formalizzeremo con rigore nella Lezione 7.4, parlando di Human-in-the-Loop.

---

## Esempio Pratico: Tracciare una Violazione Attraverso il Sistema

Immagina che l'Agente Scrittore (Lezione 5.3), a valle dell'Agente Analista, riceva questo output:

```python
output_ricevuto = {
    "trend": "in aumento",  # NOTA: non è uno dei valori Literal validi!
    "variazione_percentuale": 9.1,
    "confidenza": "alta",
    "note": ""
}

try:
    output_validato = OutputAnalistaVendite(**output_ricevuto)
except ValidationError as e:
    print(f"Contratto violato: {e}")
    # Output: Contratto violato: 1 validation error for
    # OutputAnalistaVendite trend Input should be 'crescita',
    # 'calo' or 'stabile' [type=literal_error, ...]
```

Senza questa validazione esplicita, l'Agente Scrittore avrebbe potuto ricevere "in aumento" e, nel migliore dei casi, gestirlo correttamente per coincidenza (se il suo prompt fosse stato scritto in modo sufficientemente flessibile), o nel peggiore dei casi, fallire silenziosamente o produrre un report incoerente — senza che nessuno, fino a un controllo umano successivo, si rendesse conto di dove fosse nato il problema. La validazione esplicita trasforma un fallimento silenzioso e difficile da diagnosticare in un errore immediato, chiaro, e localizzato esattamente al punto di origine.

---

## Riepilogo

- Un **contratto** è la dichiarazione esplicita e verificabile di cosa un agente si aspetta come input e cosa garantisce come output, indipendentemente dalla sua implementazione interna.
- I contratti diventano **indispensabili**, non opzionali, quando il numero di agenti in un sistema cresce, poiché le possibili interazioni crescono in modo combinatorio.
- **Pydantic**, già introdotto nella Lezione 4.2, si applica direttamente alla definizione di contratti completi per un agent package, con tipi rigorosi come `Literal` per eliminare ambiguità terminologiche.
- La **validazione automatica ai confini** del componente (sia in ingresso sia in uscita) intercetta le violazioni immediatamente, prevenendo la propagazione silenziosa di dati incoerenti.
- Le violazioni di contratto richiedono strategie diverse in base alla causa: rafforzare il prompt, rifiutare input non conformi, o aggiornare formalmente il contratto con relativo versionamento — e, in caso di violazioni ricorrenti, **escalation** verso supervisione umana.

---

## Domande di Verifica

1. Spiega, collegandolo esplicitamente alla crescita combinatoria descritta nella Sezione 1, perché un sistema con due agenti potrebbe "sopravvivere" senza contratti formali, mentre un sistema con dieci agenti praticamente non potrebbe farlo.

2. Nel codice della Sezione 3, perché la validazione dell'output avviene PRIMA che il risultato venga restituito da `esegui_agente_analista_con_contratto`, invece di lasciare che sia l'agente successivo nella pipeline a scoprire eventuali problemi?

3. Un agente riceve ripetutamente, nel corso di una settimana, lo stesso tipo di violazione di contratto da parte di un agente a monte. Quali due possibili cause, descritte nella Sezione 4, dovresti investigare per primo, e con quali evidenze le distingueresti l'una dall'altra?

---

## Esercizi Pratici

> Tre esercizi a difficoltà crescente. Prova a risolverli da solo prima di aprire la soluzione.

### Esercizio 1 — Cos'è un contratto 🟢 Base

(a) Con parole tue, cos'è un contratto tra agenti? (b) Perché usare `Literal["crescita","calo","stabile"]` è più rigoroso di un semplice `str` per il campo `trend`?

<details>
<summary>💡 Mostra soluzione</summary>

**(a)** Un contratto è la **dichiarazione esplicita e verificabile automaticamente** di cosa un agente si aspetta come input e cosa garantisce come output, indipendentemente da come è implementato. È una promessa su "cosa entra e cosa esce".

**(b) `Literal` vs `str`:** `str` accetterebbe *qualsiasi* stringa, incluse varianti come "in aumento" o "positivo". `Literal["crescita","calo","stabile"]` accetta **solo quei tre valori esatti**. Elimina alla radice il rischio che un agente a valle riceva una variante semanticamente equivalente ma testualmente diversa, che causerebbe incoerenze silenziose. Più rigore = meno ambiguità.

</details>

### Esercizio 2 — Validazione ai confini 🟡 Intermedio

(a) Perché l'agente valida il proprio *output* PRIMA di restituirlo, invece di lasciare che sia l'agente successivo a scoprire eventuali problemi? (b) Perché i contratti diventano *indispensabili* con 10 agenti ma sono quasi superflui con 2?

<details>
<summary>💡 Mostra soluzione</summary>

**(a)** Validare l'output ai confini significa **fallire immediatamente, vicino all'origine** del problema. Se invece il dato malformato passasse all'agente successivo, l'errore emergerebbe più a valle, dove è molto più difficile rintracciare *dove* è nato. Validare in uscita localizza il problema al punto esatto in cui si è verificato.

**(b)** Per la **crescita combinatoria**: con N agenti le possibili interazioni a coppie crescono ~ N². Con 2 agenti c'è 1 connessione, mantenibile "a memoria". Con 10 agenti ci sono fino a 45 coppie: impossibile garantire coerenza informale. I contratti formali rendono la coerenza **verificabile automaticamente** invece che sperata.

</details>

### Esercizio 3 — Traccia e gestisci una violazione 🔴 Avanzato

L'agente a valle riceve `{"trend": "in aumento", ...}` ma il contratto ammette solo `crescita/calo/stabile`. (a) Cosa succede alla validazione? (b) Per ogni possibile causa (modello / chiamante / contratto cambiato), quale strategia adotti? (c) Quando scatta l'escalation umana?

<details>
<summary>💡 Mostra soluzione</summary>

**(a)** Pydantic solleva un `ValidationError` su `trend` (literal_error): "in aumento" non è tra i valori ammessi. La violazione è **intercettata subito**, invece di propagarsi.

**(b) Strategie per causa:**
- **Il modello** ha prodotto "in aumento" → ri-tentare con prompt rafforzato, o normalizzare le varianti comuni con un mapping.
- **Il chiamante** ha fornito input non conforme (es. periodo nel formato sbagliato) → **rifiutare** esplicitamente con un errore chiaro sul campo problematico; mai "indovinare".
- **Il contratto è cambiato** (nuova versione dell'agente) senza avviso → problema di **processo/versioning** (Lezioni 6.3/8.4): serve un cambio di versione esplicito e comunicazione ai dipendenti.

**(c) Escalation umana:** quando le violazioni dello stesso tipo si ripetono con frequenza anomala nonostante i tentativi di correzione. Non è qualcosa che un sistema automatico debba continuare a ritentare all'infinito — è un segnale per un intervento umano (anticipa la Lezione 7.4).

</details>

---

## Connessioni

**Viene da:** Lezione 4.2 (Output Strutturati) — i contratti sono l'applicazione diretta di Pydantic a livello di intero agente, non solo di singola chiamata. Lezione 5.4 (Single vs Multi-Agent) — questa lezione risolve formalmente il problema di coerenza terminologica lì identificato.

**Porta a:** Lezione 6.6 (Gli Handoff) — vedremo come i contratti qui definiti diventano parte integrante del documento di handoff che un agente passa al successivo.

**Ritroverai questi concetti in:** Lezione 7.3 (Il Layer di Review) — un agente reviewer può usare esattamente questi stessi contratti come criteri oggettivi di valutazione. Lezione 7.4 (Human-in-the-Loop) — l'escalation per violazioni ricorrenti, qui anticipata, sarà formalizzata come pattern architetturale completo.
