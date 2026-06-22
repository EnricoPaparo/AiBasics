# Glossario

> I termini-chiave del corso, spiegati in una riga. Pensato per il **percorso Core**: se incontri una parola che non ti torna, cercala qui. Le definizioni sono volutamente semplici — la versione completa è nella lezione che tratta l'argomento.

---

## A

**AGI (Intelligenza Artificiale Generale)** — un'AI ipotetica capace di fare *qualsiasi* compito intellettuale come un umano. Oggi non esiste: tutti i sistemi reali sono "ristretti".

**Agente AI** — un sistema che riceve un obiettivo e lavora per raggiungerlo da solo, con un ciclo osserva → pensa → agisci. Non è un LLM più potente: è un LLM dentro un'architettura.

**Allucinazione** — quando un'AI inventa un fatto, una fonte o un dato e lo presenta con sicurezza come vero. Non "mente": prevede testo plausibile, non necessariamente corretto.

**API** — il modo in cui due programmi si parlano senza un essere umano in mezzo. È come un menu: chiedi una cosa precisa, ottieni una risposta precisa.

**API key (chiave API)** — una password che identifica chi sta usando un'API. Va tenuta segreta e mai pubblicata online.

## B

**Backend / Frontend** — il *frontend* è ciò che vedi (l'interfaccia); il *backend* è ciò che lavora dietro le quinte (server, logica, database).

**Bias** — un pregiudizio sistematico imparato dai dati di addestramento, che può rendere le risposte di un'AI ingiuste o sbilanciate.

## C

**Chain-of-Thought ("ragiona passo per passo")** — chiedere al modello di esplicitare il ragionamento prima della risposta: spesso migliora la qualità e rende le decisioni controllabili.

**Chiave API** → vedi *API key*.

**Client / Server** — il *client* fa la richiesta (il tuo browser, il tuo programma); il *server* la riceve e risponde. È il pattern di base di tutta la rete.

**Context window (finestra di contesto)** — la quantità massima di testo che un modello può "tenere in mente" in una volta. Quando si riempie, il modello dimentica la parte più vecchia.

## D

**Deep Learning** — machine learning fatto con reti neurali a molti strati. È la tecnica che dal 2012 ha rivoluzionato l'AI.

**DNS** — l'"elenco telefonico" di Internet: traduce un nome leggibile (`google.com`) nell'indirizzo numerico (IP) del server.

## E

**Embedding** — la rappresentazione di una parola o frase come lista di numeri, in modo che significati simili abbiano numeri vicini. È ciò che permette di "cercare per significato".

**Endpoint** — l'indirizzo preciso di un'API a cui mandi la richiesta (es. `.../v1/messages`).

**EU AI Act** — il regolamento europeo che classifica e disciplina i sistemi di AI in base al loro rischio.

## F

**Few-shot** — dare al modello qualche esempio del compito dentro al prompt, così capisce meglio cosa vuoi.

**Fine-tuning** — addestrare ulteriormente un modello già esistente su dati specifici, per specializzarlo su un compito.

**Function calling / Tool use** — dare al modello degli strumenti (funzioni) che può decidere di usare per *fare* cose: cercare, calcolare, scrivere file.

## G

**GDPR** — il regolamento europeo sulla protezione dei dati personali. Riguarda anche cosa scrivi e fai con un'AI.

## H

**HTTP / HTTPS** — il "linguaggio" con cui client e server si scambiano richieste e risposte sul web. La *S* sta per sicuro (cifrato).

## I

**IP (indirizzo)** — il numero che identifica un dispositivo in rete, come un indirizzo civico.

## J

**JSON** — un formato di testo semplice per scambiare dati strutturati tra programmi. È il formato in cui di solito rispondono le API delle AI.

## L

**LLM (Large Language Model)** — un modello linguistico di grandi dimensioni: prevede la parola (token) successiva, una alla volta. Claude, GPT e simili sono LLM.

## M

**Machine Learning** — far imparare a una macchina dai *dati* (esempi) invece di scriverle a mano tutte le regole. È il cuore dell'AI moderna.

**MCP (Model Context Protocol)** — uno standard per collegare in modo uniforme i modelli AI a strumenti e fonti di dati esterne.

**Modello vs Prodotto** — il *modello* è il motore (l'LLM); il *prodotto* (es. ChatGPT) è l'app costruita intorno con interfaccia, memoria e strumenti.

## N

**NLP (Natural Language Processing)** — l'area dell'AI che si occupa di comprendere e generare il linguaggio umano.

## O

**Orchestratore** — il "regista" di un sistema multi-agente: decide chi fa cosa, in che ordine, e mette insieme i risultati.

## P

**Parametri** — i numeri interni di un modello, regolati durante l'addestramento. Si misurano in miliardi: sono ciò che il modello "ha imparato".

**Prompt** — il testo che dai in input al modello: la tua richiesta, le istruzioni, gli esempi.

**Prompting** — l'arte di scrivere prompt efficaci per ottenere risposte migliori.

**Protocollo** — un insieme di regole che due parti accettano per comunicare (es. HTTP).

## R

**RAG (Retrieval-Augmented Generation)** — recuperare i pezzi giusti da documenti *tuoi* e passarli al modello, così risponde su informazioni che non conosceva. Come dargli il libro aperto sulla pagina giusta.

**ReAct** — un pattern in cui l'agente alterna ragionamento e azione a turni (Reason + Act), rendendo le sue decisioni più affidabili e visibili.

**Rete neurale** — un modello ispirato (alla lontana) ai neuroni: strati di unità che, addestrate, imparano a riconoscere pattern.

**RLHF** — addestramento con feedback umano, usato per rendere le risposte di un modello più utili e allineate a ciò che vogliamo.

## S

**Server** → vedi *Client / Server*.

**System prompt** — le istruzioni stabili che definiscono il comportamento e il ruolo del modello, separate dal messaggio dell'utente.

## T

**Temperature** — una manopola che regola quanto le risposte sono "creative" (alta) o prevedibili (bassa).

**Token** — il pezzetto di testo con cui ragiona un LLM (spesso una parola o parte di parola). I costi e i limiti si contano in token.

**Tool use** → vedi *Function calling*.

**Transformer** — l'architettura di rete neurale (2017) alla base degli LLM moderni; la sua forza è il meccanismo di *attention* e la capacità di scalare.

## V

**Vector database** — un archivio specializzato che memorizza embedding e trova rapidamente i contenuti più *simili per significato*. È il motore dietro al RAG.

## Z

**Zero-shot** — chiedere un compito al modello senza dargli alcun esempio, contando solo sulle istruzioni.
