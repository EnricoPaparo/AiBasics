---
titolo: "Vibe Coding"
durata_stimata: "20 min"
difficolta: "Intermedio"
---

# Vibe Coding

Nel 2025, Andrej Karpathy (ex Tesla, ex OpenAI) ha coniato il termine "vibe coding" per descrivere un modo di programmare in cui dai istruzioni in linguaggio naturale a un AI e accetti il codice che genera, senza necessariamente capire ogni riga. Il termine ha catturato qualcosa di reale che stava già succedendo.

## Cos'è il Vibe Coding

Il vibe coding è programmazione guidata dall'intenzione più che dalla comprensione. Invece di sapere come scrivere un algoritmo, descrivi cosa vuoi ottenere. L'AI genera il codice, tu lo esegui, osservi il risultato, descrivi le correzioni.

```
Tu: "crea una funzione che legge un CSV e calcola la media per ogni colonna"
AI: [genera 30 righe di Python]
Tu: [le copia nel progetto, esegue]
Tu: "ora escludi le colonne con valori nulli"
AI: [modifica la funzione]
```

Non è nuovo. La programmazione assistita da AI esiste da anni (GitHub Copilot, 2021). Quello che è cambiato è la **scala**: oggi si possono costruire applicazioni complete in questo modo, non solo snippet.

## Quando Funziona

Il vibe coding è genuinamente efficace in contesti precisi:

**Prototipazione rapida** — vuoi vedere se un'idea funziona prima di investire tempo. Un'app funzionante in 30 minuti invece di 3 giorni.

**Task ripetitivi e ben definiti** — script di elaborazione dati, automazioni, trasformazioni di formati. Problemi con input/output chiari.

**Tecnologie sconosciute** — devi fare una cosa sola in React ma non conosci React. Il vibe coding ti permette di farlo senza imparare l'intero framework.

**Scaffolding e boilerplate** — la struttura iniziale di un progetto, i file di configurazione, i test di esempio. Parti noiosamente standard.

## Quando Fallisce (e Perché)

Qui sta il rischio che molti sottovalutano.

**Non puoi debuggare codice che non capisci.** Quando qualcosa va storto in produzione alle 2 di notte, non c'è AI che ti aiuterà se non hai la base per capire cosa sta succedendo. Il vibe coding funziona nel loop felice; il debug reale richiede comprensione.

**Le vulnerabilità di sicurezza passano invisibili.** Un LLM genera codice statisticamente plausibile — il codice più comune che ha visto nel training. Il codice comune include pattern insicuri comuni: SQL injection, XSS, credenziali hardcoded, validazione insufficiente degli input. Se non sai riconoscerli, non li vedi.

```python
# Questo codice sembra ragionevole, ha un problema classico
def get_user(user_id):
    query = f"SELECT * FROM users WHERE id = {user_id}"  # SQL injection!
    return db.execute(query)
```

**La manutenzione diventa impossibile.** Codice che non hai scritto e non capisci si accumula. Aggiungere feature, fare refactoring, adattare a nuovi requisiti diventa più difficile di riscrivere da zero.

**Le dipendenze si moltiplicano senza controllo.** Un LLM sceglie librerie in base a quello che ha visto nel training. Potresti ritrovarti con 20 dipendenze, alcune deprecate, alcune con vulnerabilità note, per fare cose che la standard library già gestisce.

## Il Paradosso della Competenza

C'è un paradosso sottile: **il vibe coding è più utile a chi già sa programmare**.

Uno sviluppatore esperto usa il vibe coding per accelerare task che conosce già, verificando il codice generato con occhio critico. Uno studente che usa il vibe coding senza basi rischia di costruire una base fragile — sa far funzionare le cose ma non capisce perché funzionano, e soprattutto non capisce perché smettono di funzionare.

Questo non significa che i principianti non debbano usarlo. Significa che va usato consapevolmente, come strumento di apprendimento oltre che di produzione.

## Vibe Coding Responsabile

**Leggi il codice che copi.** Anche se non capisci ogni riga, devi capire la struttura: cosa fa questa funzione? Da dove legge i dati? Dove li scrive?

**Esegui i test.** Se l'AI genera codice senza test, chiedigli di generare anche i test. Poi guardali — ti insegnano cosa il codice dovrebbe fare.

**Tieni le dipendenze al minimo.** Quando l'AI propone una libreria sconosciuta, chiediti: serve davvero? Puoi farlo con quello che hai già?

**Capire prima di deployare.** Prima di portare il codice in produzione, dedica tempo a capirlo. Traccia il flusso dati. Individua i punti di fallimento. Valida gli input.

**Usa l'AI per imparare, non solo per produrre.** "Spiegami perché hai fatto questa scelta" è una delle domande più utili che puoi fare all'AI mentre vibe-codi.

## Il Nuovo Stack Mentale

Il vibe coding non elimina la necessità di capire la programmazione — sposta il livello dove quella comprensione è necessaria.

Prima: dovevi sapere *come* scrivere un algoritmo di ordinamento.
Adesso: devi sapere *quando* usarlo, *quali trade-off* comporta, *come verificare* che quello generato sia corretto.

La comprensione che serve è cambiata, non è sparita. I professionisti che eccellono nell'era del vibe coding sono quelli che combinano la velocità dell'AI con la comprensione critica dell'umano.

---

## Esercizi Pratici

> Tre esercizi a difficoltà crescente. Prova a risolverli da solo prima di aprire la soluzione.

### Esercizio 1 — Analisi Critica del Codice 🟢 Base

Un AI ha generato questa funzione per autenticare gli utenti. Individua almeno 2 problemi di sicurezza o qualità:

```python
def login(username, password):
    query = f"SELECT * FROM users WHERE username='{username}' AND password='{password}'"
    user = db.execute(query).fetchone()
    if user:
        return {"token": "abc123", "user": user}
    return None
```

<details>
<summary>💡 Mostra soluzione</summary>

**Problema 1 — SQL Injection**: la query usa f-string con input utente diretto. Un attaccante può inserire `' OR '1'='1` come username e bypassare il login completamente.

**Problema 2 — Password in chiaro**: il confronto della password avviene direttamente nel DB. Le password dovrebbero essere hashate (bcrypt, argon2) e il confronto fatto in Python, non in SQL.

**Problema 3 — Token hardcoded**: `"abc123"` è un token fisso. Ogni utente otterrebbe lo stesso token, rendendo l'autenticazione inutile.

**Problema 4 — Leak di dati**: `"user": user` restituisce l'intera riga del database, inclusa la password. Mai restituire al client più di quello che serve.

La versione corretta userebbe query parametrizzate, bcrypt, JWT con chiave segreta, e restituirebbe solo i campi necessari.

</details>

---

### Esercizio 2 — Usa l'AI per Imparare 🟡 Intermedio

Chiedi a un LLM di generare una funzione Python che implementa il Levenshtein distance (distanza di modifica tra due stringhe). Poi: (a) fai spiegare all'AI come funziona l'algoritmo, (b) traccia manualmente il calcolo per "gatto" e "gato", (c) scrivi 3 test case. L'obiettivo non è avere il codice — è capire cosa fa.

<details>
<summary>💡 Mostra soluzione</summary>

**Levenshtein distance**: numero minimo di operazioni (inserimento, cancellazione, sostituzione) per trasformare una stringa nell'altra.

**Traccia manuale "gatto" → "gato"** (distanza = 1, una cancellazione della 't' doppia):

```
     ""  g  a  t  o
""  [ 0  1  2  3  4]
g   [ 1  0  1  2  3]
a   [ 2  1  0  1  2]
t   [ 3  2  1  0  1]
t   [ 4  3  2  1  1]  ← una 't' in più: costo 1
o   [ 5  4  3  2  1]  ← distanza finale = 1
```

**3 test case**:
```python
assert levenshtein("", "") == 0        # stringhe vuote
assert levenshtein("gatto", "gato") == 1   # una cancellazione
assert levenshtein("abc", "xyz") == 3  # tre sostituzioni
```

Il punto dell'esercizio: hai usato l'AI per generare il codice, ma ora *capisci* cosa fa. Questo è vibe coding responsabile.

</details>

---

### Esercizio 3 — Audit di un Progetto Vibe-Coded 🔴 Avanzato

Immagina di aver costruito un'API REST in vibe coding per gestire un blog. Ha endpoint per creare, leggere, modificare ed eliminare post. Progetta un checklist di audit pre-deploy di almeno 10 punti, organizzata per categoria (sicurezza, qualità, operazioni). Per ogni punto, spiega cosa verificare e come.

<details>
<summary>💡 Mostra soluzione</summary>

**SICUREZZA**
1. **Input validation**: ogni parametro in input viene validato? Lunghezze massime, caratteri permessi, tipi di dato.
2. **SQL/NoSQL injection**: le query usano parametri bind, non string interpolation?
3. **Autenticazione**: gli endpoint che modificano dati richiedono autenticazione? Il token viene verificato su ogni richiesta?
4. **Autorizzazione**: un utente può modificare solo i propri post, non quelli degli altri?
5. **Segreti nel codice**: nessuna API key, password o chiave hardcodata nel codice. Usa variabili d'ambiente.

**QUALITÀ**
6. **Error handling**: se il database è down, l'API risponde con un messaggio utile (500) o crasha con uno stack trace interno?
7. **Logging**: ogni errore viene loggato con contesto sufficiente per debuggarlo in produzione?
8. **Test**: esiste una suite di test? Copre almeno i happy path e i casi di errore principali?
9. **Dipendenze**: le librerie usate sono aggiornate? Hanno vulnerabilità note? (`pip audit` o `npm audit`)

**OPERAZIONI**
10. **Rate limiting**: l'API è protetta da abusi (troppe richieste in poco tempo)?
11. **Gestione dei segreti**: le credenziali sono in un file `.env` non committato? Il `.gitignore` è configurato?
12. **Documentazione minima**: un README che spiega come avviare il progetto e i principali endpoint.

</details>

---

## Connessioni

- **Capitolo 5**: [L'API degli LLM](05-01-api-llm) — gli strumenti che rendono possibile il vibe coding
- **Capitolo 6**: [Sicurezza e Prompt Injection](../capitolo-06-agenti-architettura/06-07-sicurezza-prompt-injection) — le vulnerabilità che il vibe coding può introdurre
- **Capitolo 8**: [Deployment e Ambienti](../capitolo-08-workflow-multi-agente/08-07-deployment) — prima di deployare codice vibe-coded, audit obbligatorio
