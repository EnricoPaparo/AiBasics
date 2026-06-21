---
titolo: "Il Context Window"
durata_stimata: "20 min"
difficolta: "Intermedio"
---

# Il Context Window

Hai mai notato che un modello AI, dopo una lunga conversazione, sembra "dimenticare" quello che hai detto all'inizio? Non è un bug — è il context window che si è riempito.

## Cos'è il Context Window

Il **context window** (finestra di contesto) è la quantità massima di testo che un modello LLM può "tenere in testa" in un dato momento. Tutto quello che il modello "vede" durante una singola elaborazione — il tuo messaggio, la cronologia della chat, il system prompt, i documenti allegati, le risposte precedenti — deve rientrare in questa finestra.

Quando si supera il limite, il modello non può accedere a ciò che sta fuori dalla finestra. Il passato recente rimane visibile, il passato lontano scompare.

## L'Unità di Misura: I Token

Il context window non si misura in caratteri o parole, ma in **token**.

Un token è un'unità di testo — tipicamente una parola breve, parte di una parola lunga, o un simbolo di punteggiatura. La regola empirica per l'italiano è circa **0,6–0,8 parole per token** (l'inglese è più efficiente: ~0,75 parole/token).

```
"Intelligenza artificiale" → ~4 token
"AI" → 1 token
"``` python" → 2-3 token
```

Questo ha una conseguenza pratica: **il codice e i linguaggi tecnici consumano più token** del testo narrativo.

## Le Dimensioni Reali

I modelli moderni hanno context window molto più grandi di quelli della generazione precedente:

| Modello | Context Window |
|---------|----------------|
| GPT-3.5 (2022) | 4.096 token |
| GPT-4 (2023) | 8.192 – 32.768 token |
| Claude 3 Opus | 200.000 token |
| Claude 3.5 Sonnet | 200.000 token |
| Gemini 1.5 Pro | 1.000.000 token |

200.000 token corrispondono a circa **150.000 parole** — un romanzo intero. Sembra tantissimo. Eppure gli sviluppatori di agenti AI ci si scontrano ogni giorno.

## Perché si Riempie Prima del Previsto

In una conversazione semplice, 200k token bastano e avanzano. Ma in un sistema agente, il contesto si riempie rapidamente perché contiene molte cose contemporaneamente:

- **System prompt** — le istruzioni base dell'agente (può essere lungo migliaia di token)
- **Cronologia della conversazione** — ogni turno si accumula
- **Tool calls e risposte** — ogni chiamata a uno strumento porta i suoi dati
- **Documenti allegati** — un PDF tecnico può valere 10.000–50.000 token
- **Output intermedi** — i ragionamenti, le bozze, i risultati parziali

Un agente che lavora su un progetto reale può consumare decine di migliaia di token in pochi minuti di esecuzione.

## La Differenza tra Input e Output

Il context window misura **l'input** — ciò che il modello riceve. Ma i modelli hanno anche un limite separato sull'**output**: quanti token possono generare in una singola risposta.

Tipicamente, il limite di output è molto più basso del context (es. 4.096 o 8.192 token di output su un context da 200k). Questo significa che puoi dare al modello un romanzo, ma non puoi chiedergli di riscriverlo in un'unica risposta.

## Cosa Succede Quando si Riempie

Ci sono due comportamenti possibili:

1. **Hard cutoff**: il modello vede solo gli ultimi N token e ignora tutto il resto. Il passato viene troncato. Il modello risponde come se quella parte della conversazione non fosse mai esistita.

2. **Errore API**: la chiamata viene rifiutata con un errore `context_length_exceeded`. Lo sviluppatore deve gestirlo esplicitamente.

Entrambi i casi sono problematici: nel primo, il modello "dimentica"; nel secondo, il sistema si blocca.

## Perché è Fondamentale Capirlo

Il context window non è solo un limite tecnico — è un **vincolo architetturale** che plasma il design di ogni sistema AI:

- Influenza come si scrivono i **system prompt** (devono essere efficienti)
- Determina quanto **contesto storico** un agente può usare
- Condiziona le scelte su **come e quando comprimere** le informazioni
- Impatta direttamente i **costi** (i provider addebitano per ogni token in input)

Nella lezione successiva vedremo le strategie concrete per gestire questo limite.

---

## Esercizi Pratici

> Tre esercizi a difficoltà crescente. Prova a risolverli da solo prima di aprire la soluzione.

### Esercizio 1 — Calcola il Contesto 🟢 Base

Stai costruendo un chatbot con questo system prompt (200 parole ≈ 270 token), e ogni turno utente-assistente è mediamente 150 token. Hai un context window di 4.096 token. Quanti turni di conversazione puoi gestire prima di dover troncare?

<details>
<summary>💡 Mostra soluzione</summary>

Token disponibili per la conversazione: `4.096 - 270 = 3.826 token`

Token per turno: `150 token`

Turni massimi: `3.826 / 150 ≈ 25 turni`

Nella pratica si usa una soglia di sicurezza (es. 80% del limite), quindi circa **20 turni** prima di dover applicare una strategia di compressione.

</details>

---

### Esercizio 2 — Analizza il Consumo 🟡 Intermedio

Un agente deve analizzare un repository GitHub. Ha: system prompt (500 token), 10 file di codice (in media 800 token ciascuno), 3 tool calls con risposta (200 token ciascuna). Il modello ha 8.192 token di context. L'agente riesce a completare il task in una singola chiamata? Cosa cambia se il context fosse 32.768?

<details>
<summary>💡 Mostra soluzione</summary>

Calcolo:
- System prompt: 500
- File di codice: 10 × 800 = 8.000
- Tool calls: 3 × 200 = 600
- **Totale: 9.100 token**

Con context da 8.192: **NO**, supera di 900 token. L'agente dovrebbe caricare i file in batch o comprimere il system prompt.

Con context da 32.768: **SÌ**, abbondantemente. Ci sarebbe spazio per circa 3x il materiale attuale.

Questo illustra perché la scelta del modello (e del suo context size) è una decisione architettuale, non solo di qualità.

</details>

---

### Esercizio 3 — Progetta una Strategia 🔴 Avanzato

Stai costruendo un agente di customer support che deve: (1) ricordare tutte le interazioni passate con il cliente, (2) consultare un manuale prodotto da 500 pagine, (3) rispondere in tempo reale. Il context window è 200.000 token. Il manuale completo vale ~400.000 token. Proponi un'architettura che permetta all'agente di funzionare nonostante i limiti.

<details>
<summary>💡 Mostra soluzione</summary>

Non puoi caricare il manuale intero — serve un'architettura ibrida:

**1. RAG per il manuale**: indicizza il manuale in un vector store. L'agente recupera solo le sezioni rilevanti per la domanda attuale (tipicamente 2.000–5.000 token invece di 400.000).

**2. Summarization per lo storico**: invece di mantenere tutta la cronologia, mantieni un "riassunto rolling" delle interazioni passate aggiornato ad ogni sessione. Lo storico recente (ultima sessione) rimane verbatim; le sessioni precedenti vengono compresse.

**3. Priorità nel context**: system prompt (1.000 token) → riassunto cliente (500 token) → sezioni manuale rilevanti (3.000 token) → conversazione corrente (variabile).

Questo pattern — **RAG + summarization + context budget** — è la soluzione standard al problema del context in produzione.

</details>

---

## Connessioni

- **Lezione precedente**: [Limiti e Allucinazioni](03-05-limiti-allucinazioni) — il context window è un limite diverso dalle allucinazioni, ma altrettanto importante
- **Lezione successiva**: [Gestire il Contesto](03-07-gestire-il-contesto) — le strategie concrete per non restare senza spazio
- **Capitolo 4**: [RAG: Memoria Esterna](../capitolo-04-strumenti-infrastruttura/04-03-rag) — RAG è la principale strategia per superare i limiti del context
- **Capitolo 4**: [Memory nei Sistemi AI](../capitolo-04-strumenti-infrastruttura/04-06-memory) — come i sistemi AI gestiscono memoria a breve e lungo termine
