---
id: "01-02"
titolo: "Siti Web Statici: HTML, CSS e il concetto di documento"
sottotitolo: "Il caso più semplice di interazione web — il grado zero da cui partire"
capitolo: 1
capitolo_titolo: "Il Web come lo Conosciamo"
lezione: 2
durata_stimata: "40 minuti"
difficolta: "base"
prerequisiti: ["01-01"]
concetti_chiave:
  - HTML
  - CSS
  - documento
  - sito statico
  - markup
  - DOM
  - separazione contenuto-presentazione
obiettivi:
  - "Spiegare cosa significa 'statico' in opposizione a 'dinamico'"
  - "Descrivere la differenza di responsabilità tra HTML e CSS"
  - "Riconoscere quando un sito è statico osservandone il comportamento"
  - "Capire perché la separazione contenuto/presentazione è una scelta progettuale, non un dettaglio tecnico"
stato: "pubblicata"
versione: "1.0"
---

# Siti Web Statici: HTML, CSS e il concetto di documento

## Introduzione

Nella lezione precedente abbiamo visto che un server, quando riceve una richiesta HTTP, risponde con un contenuto. Ma non abbiamo ancora guardato dentro quel contenuto. Cosa contiene esattamente la risposta che il browser interpreta e trasforma in una pagina visibile?

Iniziamo dal caso più semplice possibile: il sito statico. È il "grado zero" del Web — zero logica, zero calcoli, zero dati che cambiano da una richiesta all'altra. Capire bene questo caso semplice è quello che ci permette, nella prossima lezione, di apprezzare con precisione cosa aggiunge un sito dinamico. Senza questo confronto, "dinamico" resta una parola vuota.

---

## Obiettivi di Apprendimento

Al termine di questa lezione sarai in grado di:

- Spiegare cosa significa "statico" in opposizione a "dinamico"
- Descrivere la differenza di responsabilità tra HTML e CSS
- Riconoscere quando un sito è statico semplicemente osservandone il comportamento
- Capire perché separare contenuto e presentazione è una scelta progettuale fondamentale

---

## 1. Cosa significa "statico"

Un sito è **statico** quando il file che il server invia al browser è sempre identico, indipendentemente da chi lo richiede, quando lo richiede, o quante volte è già stato richiesto.

Il server, in questo caso, svolge un ruolo estremamente semplice: ha dei file salvati su disco (file `.html`, `.css`, immagini) e quando arriva una richiesta per uno di questi file, lo legge e lo restituisce *tale e quale*. Non c'è elaborazione, non c'è logica condizionale, non c'è interazione con un database.

> **Analogia concreta:** un sito statico è come una fotocopiatrice. Chiedi una copia del documento X, ricevi sempre lo stesso documento X, identico per chiunque lo chieda. Un sito dinamico, che vedremo nella prossima lezione, è più simile a un impiegato che, prima di darti un documento, controlla chi sei e personalizza la risposta.

Questo non significa che un sito statico sia "primitivo" o "di scarsa qualità". Moltissimi siti professionali — pagine aziendali, portfolio, documentazione tecnica, blog con strumenti moderni come Jekyll o Hugo — sono statici per scelta, perché offrono velocità, sicurezza e semplicità che un sito dinamico non può garantire altrettanto facilmente.

---

## 2. HTML: la struttura del documento

**HTML** (HyperText Markup Language) non è un linguaggio di programmazione: è un linguaggio di **markup**, cioè di marcatura. Il suo compito è descrivere la *struttura* di un documento: cosa è un titolo, cosa è un paragrafo, cosa è un'immagine, cosa è un link.

```html
<!DOCTYPE html>
<html>
  <head>
    <title>La mia pagina</title>
  </head>
  <body>
    <h1>Benvenuto</h1>
    <p>Questo è un paragrafo di testo.</p>
    <a href="https://anthropic.com">Visita Anthropic</a>
  </body>
</html>
```

Ogni elemento è racchiuso tra **tag**: `<h1>` apre un titolo di primo livello, `</h1>` lo chiude. Il browser legge questo testo e sa, per convenzione, che tutto quello che sta tra `<h1>` e `</h1>` deve essere mostrato come titolo principale.

Il punto cruciale da capire è questo: **HTML descrive cosa è una cosa, non come deve apparire**. Un `<h1>` è semanticamente "il titolo più importante della pagina" — il fatto che venga mostrato grande e in grassetto è solo lo stile predefinito del browser, non una caratteristica intrinseca del tag.

### Il DOM: come il browser rappresenta l'HTML internamente

Quando il browser riceve l'HTML, non lo tiene come semplice testo: lo trasforma in una struttura ad albero chiamata **DOM** (Document Object Model). Ogni tag diventa un "nodo" dell'albero, con genitori e figli.

```
html
 └── body
      ├── h1 ("Benvenuto")
      ├── p ("Questo è un paragrafo...")
      └── a (href="...", "Visita Anthropic")
```

Questa rappresentazione ad albero è ciò che permette al browser di applicare stili, gestire interazioni, e modificare la pagina dinamicamente via JavaScript. È un concetto che ritroveremo quando parleremo di Web Application nella Lezione 1.4: lì il DOM non sarà più statico ma verrà manipolato attivamente da codice.

---

## 3. CSS: la presentazione separata dal contenuto

Se HTML dice "questo è un titolo", il **CSS** (Cascading Style Sheets) dice "i titoli devono essere blu, in un certo font, con un certo spazio sopra e sotto".

```css
h1 {
  color: #1a1a2e;
  font-family: "Georgia", serif;
  font-size: 2.5rem;
  margin-bottom: 1rem;
}
```

Questa regola dice al browser: "ogni elemento `h1` nella pagina deve essere visualizzato con questo colore, questo font, questa dimensione". Non importa quanti `<h1>` ci siano nella pagina: tutti seguiranno questa regola, a meno di eccezioni specifiche.

### Perché separare contenuto e presentazione è una scelta, non un dettaglio

Immagina di non avere questa separazione: ogni tag HTML dovrebbe portare con sé anche le istruzioni di stile.

```html
<!-- Senza separazione: caotico e da rifare ovunque -->
<h1 style="color: blue; font-size: 32px;">Titolo 1</h1>
<h1 style="color: blue; font-size: 32px;">Titolo 2</h1>
<h1 style="color: blue; font-size: 32px;">Titolo 3</h1>
```

Se un giorno decidi che i titoli devono essere rossi invece che blu, devi modificare ogni singolo tag nella pagina — e nel sito, se questa struttura si ripete su cento pagine.

Con CSS separato, la modifica avviene in un solo posto:

```css
h1 {
  color: red; /* una sola modifica, propagata ovunque */
}
```

Questo principio — **separare cosa una cosa è da come appare** — è uno dei concetti di design più ricorrenti nell'informatica. Lo ritroveremo in forma diversa quando parleremo di separare la logica di un agente AI (cosa fa) dal prompt che lo istruisce (come si comporta): stessa idea, contesto diverso.

---

## 4. Vantaggi e limiti dei siti statici

### Vantaggi

- **Velocità:** non c'è elaborazione lato server, quindi la risposta è quasi immediata
- **Sicurezza:** senza database e senza logica server-side complessa, la superficie di attacco è minima
- **Costo e semplicità di hosting:** un sito statico può essere ospitato gratuitamente o quasi su servizi come GitHub Pages, Netlify, Vercel
- **Affidabilità:** meno componenti significa meno cose che possono rompersi

### Limiti

- **Nessuna personalizzazione per utente:** tutti vedono lo stesso contenuto
- **Nessuna interazione con dati che cambiano:** non puoi mostrare "il tuo carrello", "i tuoi messaggi", "il meteo di oggi" perché tutto è fissato al momento della creazione del file
- **Aggiornamenti manuali o tramite rigenerazione:** ogni cambiamento richiede di modificare il file e "ripubblicarlo"

Questo secondo limite è esattamente il problema che il sito dinamico risolve, e che vedremo nella prossima lezione.

---

## Esempio Pratico: Riconoscere un Sito Statico

Non sempre è facile distinguere a colpo d'occhio se un sito è statico o dinamico, ma alcuni segnali aiutano:

1. **L'URL non cambia con parametri di dati personali.** Un sito statico raramente ha URL come `sito.com/utente/12345/ordini`. Quel tipo di URL implica quasi sempre un database dietro.

2. **Apri gli strumenti sviluppatore (F12) → Network → ricarica la pagina.** Se vedi una sola richiesta HTML che contiene già tutto il contenuto finale, è probabile che sia statico. Se vedi molte richieste successive che caricano dati (spesso in formato JSON), c'è qualcosa di dinamico in corso.

3. **Visualizza il codice sorgente** (clic destro → "Visualizza sorgente pagina", non gli strumenti sviluppatore). Se il testo che vedi a schermo è già tutto presente lì, il sito è (almeno in parte) statico nella consegna.

Prova questo confronto: visita una pagina di documentazione tecnica semplice (spesso statica) e poi la tua casella di posta Gmail (fortemente dinamica e interattiva). La differenza nel comportamento — e nelle richieste di rete che genera — è evidente.

---

## Riepilogo

- Un sito **statico** restituisce sempre lo stesso file, indipendentemente da chi lo richiede: nessuna elaborazione lato server.
- **HTML** descrive la struttura semantica di un documento (cosa è un titolo, un paragrafo, un link), non il suo aspetto. Il browser trasforma l'HTML in una struttura ad albero chiamata **DOM**.
- **CSS** descrive la presentazione: colori, font, spaziature. È separato dall'HTML per permettere modifiche centralizzate e mantenibili.
- I siti statici offrono velocità, sicurezza e semplicità, ma non possono personalizzare il contenuto per utente né mostrare dati che cambiano nel tempo.

---

## Domande di Verifica

1. Un sito mostra la data odierna in fondo alla pagina, aggiornata automaticamente ogni giorno senza che nessuno modifichi manualmente il file. È necessariamente un sito dinamico? Pensa a come potrebbe essere realizzato anche in un contesto statico (suggerimento: chi calcola la data — il server o il browser?).

2. Perché pensi che la documentazione tecnica di molti progetti software (inclusi framework di intelligenza artificiale) sia quasi sempre un sito statico, anche quando l'azienda dietro ha le risorse per costruire qualcosa di più complesso?

3. Se dovessi spiegare la differenza tra HTML e CSS a qualcuno usando l'analogia di una casa, cosa rappresenterebbe l'uno e cosa l'altro?

---

## Esercizi Pratici

> Tre esercizi a difficoltà crescente. Prova a risolverli da solo prima di aprire la soluzione.

### Esercizio 1 — HTML o CSS? 🟢 Base

Per ciascuna responsabilità, indica se è compito di **HTML** (struttura) o **CSS** (presentazione): (a) definire che un testo è un titolo, (b) rendere quel titolo blu, (c) creare un elenco puntato, (d) mettere l'elenco su due colonne, (e) inserire un link.

<details>
<summary>💡 Mostra soluzione</summary>

- **(a) titolo** → HTML (`<h1>`): definisce *cosa è* l'elemento.
- **(b) blu** → CSS: definisce *come appare*.
- **(c) elenco puntato** → HTML (`<ul><li>`): è struttura del contenuto.
- **(d) due colonne** → CSS: è disposizione visiva.
- **(e) link** → HTML (`<a href>`): è un elemento strutturale del documento.

Principio: **HTML dice cosa è una cosa, CSS dice come appare.** È la separazione contenuto/presentazione vista nella Sezione 3.

</details>

### Esercizio 2 — Statico o dinamico? 🟡 Intermedio

Per ognuno, decidi se può essere un sito **statico** o richiede logica **dinamica**, e spiega perché: (a) il menù di una pizzeria, (b) il profilo personale di un utente loggato, (c) la documentazione di una libreria software, (d) il carrello di un e-commerce.

<details>
<summary>💡 Mostra soluzione</summary>

- **(a) menù pizzeria** → **statico**: stesso contenuto per tutti, cambia raramente. Un file HTML servito così com'è basta.
- **(b) profilo utente** → **dinamico**: il contenuto dipende da *chi* sta guardando. Il server deve costruire la pagina su misura.
- **(c) documentazione** → **statico** (tipicamente): stessa per tutti. Come ricorda la lezione, molti siti di docs sono statici apposta per velocità e sicurezza.
- **(d) carrello** → **dinamico**: cambia in tempo reale in base alle azioni dell'utente e allo stock.

Regola: se il contenuto è **uguale per tutti e cambia di rado**, statico basta. Se dipende dall'utente o dal momento, serve dinamico.

</details>

### Esercizio 3 — Perché un chatbot non può essere statico 🔴 Avanzato

Un sito statico consegna sempre lo stesso file. Spiega, usando questa proprietà, perché un'interfaccia di chat con un LLM **non può** essere un sito puramente statico. Quale parte *potrebbe* comunque essere statica e quale no?

<details>
<summary>💡 Mostra soluzione</summary>

Un sito statico serve un file **fisso**: la risposta è decisa prima ancora che l'utente arrivi. Una chat con un LLM produce invece una risposta **diversa per ogni messaggio**, generata al momento — l'opposto di "fisso".

Distinzione precisa:
- **Può essere statico:** il *guscio* dell'interfaccia (HTML/CSS/JS della pagina: campo di input, layout, stile). Questi file non cambiano. Infatti **questo stesso corso è un sito statico** ospitato su GitHub Pages.
- **Non può essere statico:** le *risposte* del modello. Il JavaScript della pagina (statica) chiama a runtime un'API (dinamica) che genera la risposta.

Conclusione: il confine non è "tutto statico o tutto dinamico". L'interfaccia è statica, la generazione del contenuto è un servizio dinamico chiamato via API — anticipazione diretta delle Lezioni 1.4 e 1.5.

</details>

---

## Connessioni

**Viene da:** Lezione 1.1 — qui vediamo concretamente cosa contiene il "corpo" della risposta HTTP che avevamo solo menzionato.

**Porta a:** Lezione 1.3 (Siti Web Dinamici) — vedremo cosa cambia quando il server inizia a costruire l'HTML al volo invece di leggerlo da un file fisso.

**Ritroverai questi concetti in:** Lezione 6.5 (I File .md come Artefatti Operativi) — la stessa idea di "documento strutturato" alla base di HTML ritorna quando parleremo di Markdown con frontmatter come formato per gli artefatti dei workflow agentivi.
