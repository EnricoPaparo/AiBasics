---
id: "02-02"
titolo: "Machine Learning: come una macchina impara dai dati"
sottotitolo: "Il meccanismo concreto dietro la parola 'apprendimento': dati, pattern, previsione"
capitolo: 2
capitolo_titolo: "L'Intelligenza Artificiale: Cosa È Davvero"
lezione: 2
durata_stimata: "60 minuti"
difficolta: "base"
prerequisiti: ["02-01"]
concetti_chiave:
  - machine learning
  - apprendimento supervisionato
  - apprendimento non supervisionato
  - apprendimento per rinforzo
  - modello
  - training
  - validation
  - test
  - overfitting
  - underfitting
obiettivi:
  - "Spiegare il paradigma dati → pattern → previsione con parole proprie"
  - "Distinguere apprendimento supervisionato, non supervisionato e per rinforzo"
  - "Descrivere un modello come funzione matematica ottimizzata, senza misticismo"
  - "Riconoscere e spiegare overfitting e underfitting con esempi concreti"
stato: "pubblicata"
versione: "1.0"
---

# Machine Learning: come una macchina impara dai dati

## Introduzione

Nella lezione precedente abbiamo introdotto il Machine Learning come l'approccio che "impara dai dati invece di seguire regole scritte a mano", usando l'analogia del riconoscere un frutto maturo. È un'ottima intuizione di partenza, ma resta vaga: cosa significa esattamente "imparare", quando il soggetto che imparare non ha un cervello biologico ma solo numeri e operazioni matematiche?

Questa lezione rende quell'intuizione concreta e precisa. Non serviranno formule complesse — l'obiettivo non è che tu sappia implementare un algoritmo di Machine Learning, ma che tu capisca con chiarezza cosa succede "sotto il cofano" quando un sistema viene addestrato. Questa comprensione è il prerequisito diretto per capire, nella Lezione 2.3, come funzionano le reti neurali, e in ultima analisi per capire perché i modelli linguistici a volte sbagliano in modi specifici e prevedibili.

---

## Obiettivi di Apprendimento

Al termine di questa lezione sarai in grado di:

- Spiegare il paradigma "dati → pattern → previsione" con parole proprie
- Distinguere apprendimento supervisionato, non supervisionato e per rinforzo
- Descrivere un modello come funzione matematica ottimizzata, senza misticismo
- Riconoscere e spiegare i concetti di overfitting e underfitting con esempi concreti

---

## 1. Il paradigma dell'apprendimento: dati → pattern → previsione

Il Machine Learning si fonda su uno schema concettuale ricorrente, applicabile a problemi molto diversi tra loro:

```
DATI                    PATTERN                  PREVISIONE
(esempi passati)    →   (regolarità scoperte)  →  (su casi nuovi)

Migliaia di email      Il sistema scopre che      Una nuova email con
etichettate come        certe parole/combinazioni  quelle caratteristiche
"spam" o "non spam"     ricorrono nello spam       viene classificata
                                                     come probabile spam
```

Il punto fondamentale è questo: nessuno ha detto esplicitamente al sistema "se contiene la parola X, è spam". Il sistema ha **osservato** migliaia di esempi già classificati da umani, e ha **dedotto statisticamente** quali caratteristiche tendono ad associarsi a quale categoria.

Questo significa anche che il sistema non "capisce" cosa sia lo spam nel senso in cui lo capisci tu (un tentativo di truffa, una comunicazione indesiderata): ha trovato correlazioni statistiche tra caratteristiche del testo e l'etichetta che gli è stata fornita. Questa distinzione — *correlazione statistica scoperta* vs *comprensione semantica* — è una delle idee più importanti di questo intero capitolo, e tornerà con forza quando parleremo delle allucinazioni degli LLM nella Lezione 3.5.

---

## 2. Le tre grandi famiglie di apprendimento

Non tutto il Machine Learning funziona allo stesso modo. Esistono tre paradigmi principali, distinti dal tipo di dati disponibili e dal tipo di feedback che il sistema riceve durante l'addestramento.

### 2.1 Apprendimento Supervisionato

Il sistema riceve esempi **già etichettati** con la risposta corretta. È come uno studente che si esercita con un libro di esercizi che ha anche le soluzioni in fondo: per ogni domanda, sa qual è la risposta giusta, e può correggersi.

```
INPUT                          OUTPUT CORRETTO (etichetta)
Foto di un gatto         →     "gatto"
Foto di un cane           →     "cane"
Email con certo testo     →     "spam"
Email con altro testo     →     "non spam"
```

Il sistema impara, esempio dopo esempio, ad associare input a output corretti. È il paradigma più comune e più facile da capire, ed è anche la base concettuale dell'addestramento iniziale dei modelli linguistici (lo vedremo nella Lezione 3.2 parlando di fine-tuning supervisionato).

### 2.2 Apprendimento Non Supervisionato

Il sistema riceve dati **senza etichette**, e il suo compito è trovare strutture, raggruppamenti o pattern nascosti, senza che nessuno gli dica cosa cercare esattamente.

```
INPUT (senza etichette)
Migliaia di clienti di un negozio, con dati su
cosa comprano, quanto spendono, quando visitano

           ↓ (il sistema scopre da solo...)

OUTPUT: gruppi naturali di clienti simili tra loro
("acquirenti occasionali", "clienti fedeli ad alta spesa", ecc.)
— categorie che nessun umano aveva definito in anticipo
```

> **Analogia concreta:** è come dare a qualcuno una scatola di Lego mischiati di mille set diversi, senza istruzioni, e chiedergli di raggrupparli in modo sensato. Non c'è una "risposta corretta" predefinita — la persona troverà criteri di raggruppamento (per colore, per forma, per dimensione) basandosi sulle regolarità che osserva.

### 2.3 Apprendimento per Rinforzo

Il sistema non riceve esempi etichettati né dati grezzi da raggruppare: interagisce con un **ambiente**, compie **azioni**, e riceve un segnale di **ricompensa o penalità** in base al risultato. Impara, per tentativi ed errori, quali azioni massimizzano la ricompensa nel tempo.

```
        ┌─────────────────────────────┐
        │           AMBIENTE            │
        └─────────────────────────────┘
              │                    ▲
        azione│                    │ricompensa/penalità
              ▼                    │
        ┌─────────────────────────────┐
        │            AGENTE              │
        │   (sta imparando a comportarsi) │
        └─────────────────────────────┘
```

Questo è il paradigma con cui si addestrano sistemi che giocano a scacchi o ai videogiochi a livello sovrumano: il sistema gioca milioni di partite, riceve "vittoria" o "sconfitta" come segnale, e affina progressivamente la propria strategia. È anche, sorprendentemente, un ingrediente cruciale nella costruzione degli assistenti AI moderni: la tecnica RLHF che vedremo nella Lezione 3.2 (Reinforcement Learning from Human Feedback) usa esattamente questo principio, con la valutazione umana nel ruolo di "ricompensa".

> Nota terminologica importante: la parola "agente" qui, nel contesto dell'apprendimento per rinforzo, ha un significato tecnico specifico (l'entità che agisce nell'ambiente) leggermente diverso, ma concettualmente affine, a "agente AI" nel senso che useremo dal Capitolo 5 in poi (un sistema che persegue un obiettivo attraverso azioni). Non è una coincidenza terminologica: l'idea di un sistema che agisce, osserva il risultato, e si adatta è il filo conduttore di entrambi i concetti.

---

## 3. Cos'è un modello: una funzione matematica ottimizzata

Useremo la parola "modello" costantemente da qui in avanti. È importante demistificarla subito.

Un **modello**, in Machine Learning, è semplicemente una **funzione matematica** — un meccanismo che trasforma un input in un output — i cui **parametri interni** (i numeri che determinano esattamente come avviene questa trasformazione) sono stati aggiustati durante il processo di addestramento, invece di essere scritti a mano da un programmatore.

```
INPUT  →  [ FUNZIONE CON PARAMETRI REGOLABILI ]  →  OUTPUT

Prima dell'addestramento: i parametri sono casuali,
l'output è essenzialmente spazzatura

Durante l'addestramento: i parametri vengono aggiustati
ripetutamente per ridurre la differenza tra l'output prodotto
e l'output desiderato (nell'apprendimento supervisionato)

Dopo l'addestramento: i parametri sono "stabili", il modello
produce output utili su input mai visti prima
```

Quando, nel Capitolo 3, sentirai parlare di modelli con "miliardi di parametri", ora sai esattamente cosa significa: un numero enorme di questi valori numerici regolabili, tutti aggiustati durante un processo di addestramento su quantità di dati altrettanto enormi.

---

## 4. Il ciclo di vita di un modello: training, validation, test

Un modello non viene addestrato e poi semplicemente "usato": esiste un protocollo rigoroso per verificare che funzioni davvero bene, non solo sui dati che ha già visto. I dati disponibili vengono tipicamente divisi in tre insiemi distinti:

- **Training set** (insieme di addestramento): i dati su cui il modello effettivamente si allena, aggiustando i propri parametri
- **Validation set** (insieme di validazione): dati mai usati per l'addestramento, usati per controllare periodicamente come sta andando l'apprendimento e per scegliere tra diverse configurazioni del modello
- **Test set** (insieme di test): dati completamente nuovi, usati solo alla fine, per misurare onestamente quanto bene il modello generalizza a situazioni che non ha mai incontrato in nessuna fase precedente

Questa separazione rigorosa serve a evitare un'illusione pericolosa: un modello può sembrare eccellente se lo valutiamo sugli stessi dati con cui si è allenato (avrebbe "memorizzato" le risposte), ma fallire completamente su dati nuovi. Il vero obiettivo del Machine Learning non è mai "essere bravo sui dati di addestramento": è **generalizzare**, cioè essere bravo su casi nuovi, mai visti.

---

## 5. Overfitting e Underfitting

Questi due concetti descrivono i due modi opposti in cui un modello può fallire nel proprio compito.

### Overfitting (sovra-adattamento)

Il modello impara i dati di addestramento **troppo bene** — al punto da memorizzarne anche il rumore casuale e le peculiarità irrilevanti, perdendo la capacità di generalizzare.

> **Analogia concreta:** uno studente che, preparandosi per un esame, memorizza parola per parola le risposte di un set specifico di esercizi svolti in classe, senza capire il principio sottostante. Risponderà perfettamente se l'esame contiene esattamente quegli esercizi, ma fallirà miseramente davanti a un esercizio leggermente diverso che richiede lo stesso principio applicato in un contesto nuovo.

### Underfitting (sotto-adattamento)

Il modello è **troppo semplice** per cogliere i pattern reali presenti nei dati, e quindi va male sia sui dati di addestramento sia su quelli nuovi.

> **Analogia concreta:** lo stesso studente che, invece di studiare il programma, ha imparato solo una regola generica e vaga ("in matematica, di solito bisogna sommare i numeri"). Andrà male su tutto, perché non ha colto nessuna struttura specifica utile.

```
       UNDERFITTING          GIUSTO EQUILIBRIO         OVERFITTING

  Errore  alto su tutto    Errore basso ovunque    Errore quasi nullo
  sui dati di training      (training e test)        su training,
  E sui dati di test                                 alto su test
```

Trovare il giusto equilibrio tra questi due estremi è uno dei compiti centrali di chi addestra modelli di Machine Learning — e, come vedremo, è una delle ragioni per cui addestrare un Large Language Model allo stato dell'arte richiede risorse computazionali e competenze estremamente specializzate.

---

## Esempio Pratico: Classificare un Problema secondo il Paradigma Giusto

Prova a determinare quale dei tre paradigmi di apprendimento (supervisionato, non supervisionato, per rinforzo) sarebbe più adatto per ciascuno di questi scenari, e perché:

1. Un sistema che deve prevedere il prezzo di una casa in base a metratura, posizione e numero di stanze, avendo a disposizione migliaia di vendite passate con il prezzo finale noto
2. Un sistema che deve scoprire segmenti naturali di pazienti in un grande archivio di dati medici anonimizzati, senza alcuna categoria predefinita
3. Un sistema che deve imparare a far muovere un robot in modo da camminare senza cadere, attraverso migliaia di tentativi in un ambiente simulato

(Suggerimento: il primo caso ha un output numerico noto per ogni esempio passato; il secondo non ha etichette di alcun tipo; il terzo non ha "esempi" nel senso classico, ma un ambiente con cui interagire e un segnale di successo/fallimento.)

---

## Riepilogo

- Il Machine Learning segue il paradigma **dati → pattern → previsione**: il sistema scopre correlazioni statistiche nei dati, non comprende il significato nel senso umano.
- Le tre grandi famiglie sono l'**apprendimento supervisionato** (con etichette corrette), il **non supervisionato** (senza etichette, si cercano strutture nascoste), e il **per rinforzo** (apprendimento per tentativi, errori e ricompense).
- Un **modello** è una funzione matematica con parametri regolabili, aggiustati durante l'addestramento invece di essere scritti a mano.
- Il ciclo di vita rigoroso **training/validation/test** serve a garantire che il modello **generalizzi**, non che memorizzi semplicemente i dati visti.
- **Overfitting** (troppo specifico, non generalizza) e **underfitting** (troppo generico, non cattura i pattern reali) sono i due modi opposti in cui un modello può fallire.

---

## Domande di Verifica

1. Perché un modello con un punteggio perfetto sui dati di addestramento non è necessariamente un buon modello? Cosa dovresti controllare prima di trarre conclusioni?

2. Riprendi l'analogia dello studente che memorizza le risposte (overfitting). Cosa dovrebbe fare, concretamente, per evitare questo problema e imparare davvero il principio sottostante? Come si traduce questa intuizione in una possibile strategia per chi addestra un modello?

3. Nella Lezione 2.1 abbiamo detto che il Machine Learning "scopre pattern" invece di seguire regole scritte. Alla luce di questa lezione, in che modo l'apprendimento supervisionato è comunque guidato dall'uomo, anche se non tramite regole esplicite?

---

## Connessioni

**Viene da:** Lezione 2.1 — qui rendiamo concreto il meccanismo di "apprendimento dai dati" solo accennato in precedenza.

**Porta a:** Lezione 2.3 (Reti Neurali e Deep Learning) — vedremo la struttura specifica di funzione matematica (la rete neurale) che rende possibile l'apprendimento su problemi estremamente complessi come il linguaggio.

**Ritroverai questi concetti in:** Lezione 3.2 (Training, Fine-tuning e RLHF) — il pre-training di un LLM è essenzialmente apprendimento supervisionato su scala massiccia, e RLHF è una forma diretta di apprendimento per rinforzo. Lezione 3.5 (Limiti degli LLM) — la distinzione tra "correlazione statistica scoperta" e "comprensione semantica" introdotta qui sarà la chiave per capire perché i modelli linguistici allucinano.
