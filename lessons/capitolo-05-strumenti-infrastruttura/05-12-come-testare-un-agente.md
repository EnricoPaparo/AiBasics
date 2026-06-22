---
titolo: "Come testare un agente AI: il metodo minimo che funziona"
difficolta: "Intermedio"
capitolo: 5
capitolo_titolo: "Strumenti e Infrastruttura per Sistemi AI"
lezione: 12
durata_stimata: "40 minuti"
prerequisiti: ["06-01"]
concetti_chiave:
  - test cases
  - input/output attesi
  - exact match
  - fuzzy match
  - LLM-as-judge
  - regression testing
obiettivi:
  - "Scrivere casi di test prima di scrivere il codice dell'agente"
  - "Implementare una funzione di test minima ma funzionante"
  - "Distinguere i tre livelli di verifica: exact match, fuzzy match, LLM-as-judge"
stato: "pubblicata"
versione: "1.0"
---
# Come testare un agente AI: il metodo minimo che funziona

## Perché testare prima di costruire di più

Quando si costruisce un agente AI, è facile cadere in una trappola: aggiungere funzionalità su funzionalità senza mai fermarsi a verificare se quelle già presenti funzionano davvero. Il risultato è un sistema complesso che sembra funzionare nelle demo, ma che produce output inaffidabili nel momento in cui cambia il contesto.

Il testing non è una fase separata che arriva "alla fine". È una pratica che si integra nel processo di sviluppo fin dall'inizio — e che, paradossalmente, rende lo sviluppo più veloce, non più lento. Ogni bug scoperto tardi (in produzione, davanti a un utente reale) costa molto più di un bug scoperto subito, con un test automatico che impiega tre secondi a girare.

In questa lezione imparerai il metodo più semplice e direttamente applicabile: scrivere una lista di casi di test prima ancora di scrivere il codice, ed eseguirli automaticamente con una funzione minimale. Le tecniche avanzate — LLM-as-judge approfondito, CI/CD per agenti, test di regressione su larga scala — arriveranno nella lezione 08-06. Qui costruiamo le fondamenta.

---

## Il metodo più semplice: lista input→output attesi

### Scrivi i casi di test prima del codice

Prima di scrivere una singola riga di logica per il tuo agente, apri un foglio di carta (o un file di testo) e scrivi 5-8 casi concreti: "se l'utente dice questo, mi aspetto che l'agente risponda quello."

Questo esercizio ha un valore che va oltre il testing tecnico: ti costringe a precisare esattamente cosa vuoi che il tuo agente faccia, e ti aiuta a scoprire ambiguità nel requisito prima che diventino bug nel codice.

**Quanti casi?** Cinque è il minimo per avere una copertura ragionevole dei casi tipici. Cinque casi coprono i percorsi principali (happy path, input vuoto, input ambiguo, errore atteso, edge case); sotto i cinque rischi di non trovare bug ovvi. Aumenta in proporzione alla complessità del dominio. Otto è un buon punto di partenza per includere anche casi limite (input vuoto, richiesta ambigua, caso estremo). Non servono cento casi per cominciare — quelli si aggiungono man mano che scopri problemi reali.

### Struttura di un caso di test

Ogni caso di test ha quattro elementi:

| Input | Output atteso | Output ottenuto | Pass/Fail |
|-------|---------------|-----------------|-----------|
| "Qual è la capitale della Francia?" | Deve contenere "Parigi" | "La capitale della Francia è Parigi." | ✅ Pass |
| "Dimmi una barzelletta" | Risposta rifiutata (fuori scope) | "Posso aiutarti solo con domande geografiche." | ✅ Pass |
| "" | Messaggio di errore chiaro | "Puoi ripetere la domanda?" | ✅ Pass |
| "qual è la capitale della germania" | Deve contenere "Berlino" | "Berlino è la capitale della Germania." | ✅ Pass |
| "Scrivi il mio compito di storia" | Risposta rifiutata (fuori scope) | "Sono un assistente geografico, non posso..." | ✅ Pass |

La colonna "Output ottenuto" si compila solo dopo aver eseguito il test. La colonna "Pass/Fail" è il verdetto: il risultato soddisfa il criterio definito in "Output atteso"?

Nota che "Output atteso" non è necessariamente la risposta parola per parola: di solito è un **criterio** ("deve contenere X", "deve rifiutare Y", "deve rispondere in meno di 100 parole").

---

## Implementazione pratica

La funzione seguente prende una lista di casi di test e una funzione che rappresenta il tuo agente, li esegue tutti, e restituisce un conteggio di quanti sono passati.

```python
def run_tests(test_cases, agent_fn):
    """
    Esegue una lista di casi di test su un agente.

    test_cases: lista di dizionari con chiavi 'input', 'check_fn', 'descrizione'
    agent_fn:   funzione che prende una stringa e restituisce una stringa
    """
    passati = 0
    totale = len(test_cases)

    for caso in test_cases:
        output = agent_fn(caso["input"])
        successo = caso["check_fn"](output)
        stato = "✅ PASS" if successo else "❌ FAIL"
        print(f"{stato} | {caso['descrizione']}")
        if not successo:
            print(f"       Input:    {caso['input']!r}")
            print(f"       Output:   {output!r}")
        if successo:
            passati += 1

    print(f"\nRisultato: {passati}/{totale} test superati")
    return passati == totale


# Esempio di utilizzo
casi = [
    {
        "input": "Qual è la capitale della Francia?",
        "check_fn": lambda out: "parigi" in out.lower(),
        "descrizione": "Risponde correttamente sulla capitale della Francia"
    },
    {
        "input": "",
        "check_fn": lambda out: len(out) > 0,
        "descrizione": "Non crasha su input vuoto"
    },
    {
        "input": "Dimmi una barzelletta",
        "check_fn": lambda out: "non posso" in out.lower() or "non rientra" in out.lower(),
        "descrizione": "Rifiuta richieste fuori scope"
    },
]

# run_tests(casi, il_mio_agente)
```

> ✅ **Output atteso**: se il codice gira correttamente con l'esempio sopra (supponendo che `il_mio_agente` sia un agente geografico funzionante), vedrai qualcosa simile a:
> ```
> ✅ PASS | Risponde correttamente sulla capitale della Francia
> ✅ PASS | Non crasha su input vuoto
> ❌ FAIL | Rifiuta richieste fuori scope
>        Input:    'Dimmi una barzelletta'
>        Output:   'Eccone una! Perché i programmatori confondono Halloween con Natale?...'
>
> Risultato: 2/3 test superati
> ```
> Se vedi un errore come `TypeError: 'NoneType' object is not callable`, controlla che `agent_fn` sia effettivamente una funzione e non `None` — l'agente va passato come argomento a `run_tests`, non chiamato: scrivi `run_tests(casi, il_mio_agente)` e non `run_tests(casi, il_mio_agente())`.

Questa implementazione è deliberatamente minimale. Non ha dipendenze esterne, non richiede framework di testing, non produce report HTML. Fa una cosa sola, bene: esegue i casi e dice cosa ha fallito.

---

## Quando un test "passa"

Il criterio di successo di un test dipende da cosa stai misurando. Esistono tre livelli di verifica, con complessità e affidabilità crescenti:

**Exact match:** l'output deve essere esattamente una stringa predefinita. È il metodo più semplice e deterministico, ma funziona solo per agenti che producono output rigidamente strutturati (es. un classificatore che risponde sempre "positivo" o "negativo"). Per agenti conversazionali, è quasi sempre troppo fragile.

**Fuzzy match:** invece di confrontare carattere per carattere, si verifica che l'output soddisfi un criterio più flessibile — contiene una certa parola chiave, è di una certa lunghezza, inizia in un certo modo, corrisponde a un'espressione regolare. È il metodo che abbiamo usato nell'implementazione pratica sopra (`"parigi" in out.lower()`). È il miglior punto di partenza per la maggior parte degli agenti.

**LLM-as-judge:** si usa un secondo modello linguistico per valutare se la risposta del primo modello è corretta, utile, sicura. È il metodo più potente per valutare qualità soggettive (il tono è appropriato? la risposta è completa?), ma richiede costi aggiuntivi e introduce una variabile in più nel sistema. Vedremo come implementarlo in dettaglio nella lezione 08-06.

Per iniziare, il fuzzy match copre la grande maggioranza dei casi utili e non richiede infrastruttura aggiuntiva.

---

## Esercizio pratico

**Compito:** scrivi 5 casi di test per l'agente che hai costruito nel capitolo precedente.

Per ogni caso, specifica:
1. L'input che invierai all'agente
2. Il criterio di successo (cosa deve contenere o non contenere la risposta)
3. Il motivo per cui hai scelto proprio questo caso (cosa stai coprendo?)

**HINT 1 — Come scegliere i casi:** pensa ai casi tipici (cosa farà l'utente più spesso?), ai casi limite (input vuoto, input molto lungo, richiesta ambigua), e ai casi di rifiuto (cosa dovrebbe l'agente *non* fare?).

**HINT 2 — Come scrivere check_fn:** inizia con `lambda out: "parola_chiave" in out.lower()`. Se hai bisogno di verificare più condizioni, usa `and`: `lambda out: "parola1" in out.lower() and len(out) < 500`.

**HINT 3 — Quantità vs qualità:** è meglio avere 5 casi ben pensati che 20 casi tutti uguali che verificano la stessa cosa.

Non c'è una soluzione unica: i tuoi casi di test devono riflettere i requisiti del tuo agente specifico. Confronta i tuoi casi con un compagno e discuti le differenze.

---

<details>
<summary>⚙️ Approfondimento Avanzato</summary>

### Testing con LLM-as-judge

Quando il fuzzy match non è sufficiente — per esempio, stai valutando se una risposta è "utile" o "appropriata nel tono" — puoi usare un secondo modello linguistico come giudice. Il giudice riceve l'input originale, l'output del tuo agente, e una rubrica di valutazione, e restituisce un punteggio o un verdetto binario.

Questa tecnica è potente ma introduce complessità: il giudice può avere bias, può essere influenzato dalla formulazione della rubrica, e aggiunge latenza e costo. La lezione 08-06 copre l'implementazione pratica, le trappole comuni, e come calibrare un giudice LLM in modo affidabile.

### Regression testing automatico

Man mano che il tuo agente evolve (prompt aggiornato, modello cambiato, nuovi strumenti aggiunti), esiste il rischio di introdurre regressioni: funzionalità che prima funzionavano e ora no. Il regression testing consiste nel mantenere una suite di casi di test che viene eseguita automaticamente a ogni modifica, in modo da rilevare immediatamente qualsiasi degradazione.

La funzione `run_tests` di questa lezione è già sufficiente per fare regression testing manuale. Il passo successivo è automatizzarlo.

### CI/CD per agenti

Continuous Integration / Continuous Deployment per agenti AI significa integrare la suite di test nel pipeline di sviluppo: ogni volta che fai una modifica al codice o al prompt, i test girano automaticamente, e la modifica viene bloccata se abbassa il tasso di successo sotto una soglia definita. La lezione 02-04 tratta i fondamenti di CI/CD; l'applicazione specifica agli agenti AI è una specializzazione di quegli stessi principi.

</details>

---

## Connessioni

**Prerequisiti:** lezione 06-01 (Cos'è un agente) — questa lezione assume che tu abbia già un agente funzionante da testare.

**Approfondimento:** lezione 08-06 (Testing e Valutazione degli LLM) — tecniche avanzate di valutazione, LLM-as-judge in dettaglio, metriche di qualità per sistemi conversazionali.
