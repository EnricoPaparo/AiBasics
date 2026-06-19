---
id: "04-05"
titolo: "MCP — Model Context Protocol: lo standard per connettere agenti a risorse esterne"
sottotitolo: "Dal Function Calling 'fatto in casa' a un protocollo universale e interoperabile"
capitolo: 4
capitolo_titolo: "Strumenti e Infrastruttura per Sistemi AI"
lezione: 5
durata_stimata: "60 minuti"
difficolta: "intermedio"
prerequisiti: ["04-04"]
concetti_chiave:
  - MCP
  - Model Context Protocol
  - host
  - client
  - server MCP
  - interoperabilità
obiettivi:
  - "Spiegare il problema di interoperabilità che MCP risolve"
  - "Descrivere l'architettura Host-Client-Server di MCP"
  - "Distinguere MCP dal Function Calling custom visto nella lezione precedente"
  - "Riconoscere quando MCP offre un vantaggio concreto rispetto a un'integrazione su misura"
stato: "pubblicata"
versione: "1.0"
---

# MCP — Model Context Protocol: lo standard per connettere agenti a risorse esterne

## Introduzione

Nella lezione precedente abbiamo costruito, con codice scritto interamente a mano, un meccanismo di Function Calling: abbiamo definito uno strumento, scritto la funzione che lo esegue, e gestito noi stessi il ciclo di richiesta e risposta. Questo approccio funziona perfettamente per un singolo strumento, in un singolo progetto. Ma cosa succede quando il numero di strumenti cresce, quando più progetti diversi hanno bisogno degli stessi strumenti, o quando vuoi che il tuo agente possa usare strumenti costruiti da soggetti terzi, mai incontrati prima?

Questa lezione introduce **MCP** — Model Context Protocol — un protocollo standardizzato, sviluppato da Anthropic e reso pubblico come standard apert, che risolve esattamente questo problema di scala e interoperabilità. Non è un concetto che sostituisce il Function Calling visto nella lezione precedente: ne è, piuttosto, una **formalizzazione standardizzata**, che permette agli stessi principi di base di funzionare in modo coerente e riutilizzabile su scala molto più ampia.

---

## Obiettivi di Apprendimento

Al termine di questa lezione sarai in grado di:

- Spiegare il problema di interoperabilità che MCP risolve, collegandolo ai limiti del Function Calling custom
- Descrivere l'architettura Host-Client-Server di MCP
- Distinguere concettualmente MCP dal Function Calling implementato a mano nella lezione precedente
- Riconoscere quando adottare MCP offre un vantaggio concreto rispetto a un'integrazione costruita su misura

---

## 1. Il problema che MCP risolve: l'integrazione "a fiocco di neve"

Prima di MCP, ogni volta che uno sviluppatore voleva collegare un modello AI a una risorsa esterna — un database, un servizio di calendario, un sistema di file, una piattaforma come Slack o GitHub — doveva tipicamente scrivere un'integrazione **su misura**, esattamente come abbiamo fatto nella Lezione 4.4 con lo strumento meteo. Questo approccio funziona, ma genera un problema noto informalmente come "il problema a fiocco di neve" (snowflake problem): ogni integrazione è leggermente diversa dalle altre, costruita ad-hoc, non riutilizzabile, e non interoperabile con sistemi diversi da quello per cui è stata scritta.

```
SENZA UNO STANDARD (situazione "a fiocco di neve")

Progetto A (usa Claude)        Progetto B (usa un altro LLM)
   │                                │
   ├── integrazione custom          ├── integrazione DIVERSA
   │   con Google Drive             │   con Google Drive
   │   (scritta da zero)            │   (scritta da zero, NON
   │                                │   riutilizzabile da A)
   ├── integrazione custom          │
   │   con Slack                   ├── integrazione DIVERSA
   │   (scritta da zero)            │   con Slack
   │                                │   (scritta da zero)
```

Ogni nuova combinazione di "modello AI" e "risorsa esterna" richiedeva un nuovo lavoro di integrazione, senza alcuna possibilità di riutilizzo tra progetti diversi, anche quando la risorsa esterna (es. Google Drive) era esattamente la stessa.

MCP risolve questo problema introducendo un **protocollo comune**: se un servizio (es. Google Drive) espone le proprie funzionalità seguendo lo standard MCP una sola volta, **qualsiasi** applicazione AI compatibile con MCP può usarle, senza bisogno di una nuova integrazione su misura per ciascuna combinazione.

```
CON MCP (interoperabilità standardizzata)

         SERVIZIO MCP per Google Drive
         (scritto UNA VOLTA, secondo lo standard)
                      │
         ┌────────────┼────────────┐
         ▼            ▼            ▼
   Progetto A    Progetto B    Progetto C
   (Claude)      (altro LLM)   (altro sistema)
   tutti possono usare lo stesso servizio MCP,
   senza integrazioni custom separate
```

> **Perché questo è esattamente lo stesso principio delle API REST viste nella Lezione 1.5:** ricorda l'analogia del menù di ristorante. Un'API standardizzata permette a chiunque di "ordinare dal menù" senza conoscere i dettagli interni della cucina. MCP applica esattamente questo stesso principio, specificamente al contesto della connessione tra modelli AI e strumenti/risorse esterne.

---

## 2. L'architettura MCP: Host, Client, Server

MCP definisce tre ruoli distinti, ed è importante non confondere la terminologia con quella già vista nella Lezione 1.1 (dove "client" e "server" avevano un significato più generico):

```
┌─────────────────────────────────────────────────────────┐
│                         HOST                                │
│   (l'applicazione che il modello sta usando, es.            │
│    Claude.ai, Claude Code, o un'applicazione                │
│    che stai costruendo tu)                                   │
│                                                                │
│   ┌─────────────────────────────────────────┐              │
│   │                MCP CLIENT                   │              │
│   │   (il componente, dentro l'host, che        │              │
│   │    parla il protocollo MCP)                  │              │
│   └─────────────────────────────────────────┘              │
└───────────────────────┬───────────────────────────────────┘
                          │  protocollo MCP
                          ▼
              ┌───────────────────────────┐
              │       MCP SERVER             │
              │  (espone una risorsa o uno    │
              │   strumento specifico, es.    │
              │   "Google Drive", "GitHub",   │
              │   un database aziendale)      │
              └───────────────────────────┘
```

- **Host**: l'applicazione complessiva con cui l'utente (o lo sviluppatore) interagisce — può essere un prodotto come Claude Code, o un sistema che tu stesso costruisci
- **MCP Client**: il componente, integrato nell'host, responsabile di comunicare secondo le regole del protocollo MCP con uno o più server
- **MCP Server**: un servizio indipendente, che espone funzionalità specifiche (strumenti, dati, risorse) seguendo lo standard MCP, pronto per essere usato da qualsiasi host compatibile

Questa architettura a tre livelli è concettualmente affine alla separazione frontend/backend vista nella Lezione 1.4 — ogni componente ha una responsabilità chiara e isolata, e la comunicazione avviene attraverso un'interfaccia standardizzata (qui, il protocollo MCP, invece delle API REST generiche viste in precedenza).

---

## 3. MCP vs Function Calling "fatto in casa": cosa cambia esattamente

È importante essere precisi su questo punto, perché è facile generare confusione: **MCP non sostituisce il principio del Function Calling** visto nella Lezione 4.4 — il modello "richiede" l'uso di uno strumento, qualcosa esegue quella richiesta, il risultato torna al modello. Questo principio di fondo resta identico.

Quello che MCP aggiunge è uno **strato di standardizzazione** su come questa connessione viene stabilita e descritta:

```
FUNCTION CALLING CUSTOM (Lezione 4.4)        MCP

- Tu definisci lo schema dello strumento      - Lo schema è esposto
  direttamente nel tuo codice                   automaticamente dal
                                                  server MCP, secondo
                                                  un formato standard
- Tu scrivi la funzione che esegue            - Il server MCP, scritto
  l'azione, specifica per il tuo progetto        una volta da chiunque,
                                                  gestisce l'esecuzione
- Riutilizzabile solo all'interno              - Riutilizzabile da
  del tuo stesso progetto                        QUALSIASI host
                                                  compatibile con MCP
```

In altre parole: il meccanismo concettuale di fondo (modello-richiede, qualcosa-esegue, risultato-torna-al-modello) è lo stesso identico principio della Lezione 4.4. MCP è, essenzialmente, **un modo standardizzato di esporre e descrivere** quegli strumenti, così che non debbano essere ricostruiti da zero per ogni nuovo progetto o ogni nuovo modello.

---

## 4. Quando MCP offre un vantaggio concreto

Non ogni progetto ha bisogno di MCP. Per un singolo strumento, usato in un solo progetto, scritto e controllato interamente da te, l'approccio diretto della Lezione 4.4 resta perfettamente valido, semplice, e spesso più rapido da implementare. MCP diventa concretamente vantaggioso quando:

- Vuoi **riutilizzare** lo stesso strumento (o la stessa connessione a una risorsa) in più progetti diversi, senza ricostruire l'integrazione ogni volta
- Vuoi **usare strumenti costruiti da terzi** (ad esempio, un server MCP ufficiale per Slack, GitHub, o Google Drive, già pronto e mantenuto da altri), senza dover scrivere tu stesso il codice di integrazione
- Stai costruendo un sistema che deve rimanere **interoperabile** con modelli o applicazioni diverse da quella che usi oggi, senza dover riscrivere le integrazioni se in futuro cambi provider o aggiungi nuovi host
- Vuoi **separare nettamente** la responsabilità di "chi mantiene la connessione a una risorsa esterna" (il server MCP) da "chi usa quella connessione per un compito specifico" (l'host)

> **Perché questo conta enormemente per il Capitolo 6 e 7:** quando costruiremo agenti professionali strutturati come "package" (Lezione 6.2), e poi sistemi multi-agente complessi (Capitolo 7), la possibilità di collegare un agente a strumenti standardizzati e riutilizzabili tramite MCP, invece di reimplementare ogni integrazione da zero per ogni agente del sistema, diventa un vantaggio architetturale significativo — esattamente il tipo di principio di "non duplicare ciò che può essere centralizzato e riutilizzato" che ritroveremo parlando di skill library nella Lezione 6.7.

---

## Esempio Pratico: Riconoscere uno Scenario "da MCP"

Prova a valutare questi due scenari, distinguendo quando un'integrazione custom (Lezione 4.4) è sufficiente, e quando MCP offrirebbe un vantaggio concreto:

**Scenario A:** Stai costruendo un piccolo script personale che, una volta al giorno, controlla il meteo e ti invia un riepilogo. Lo strumento meteo è usato solo da questo script, scritto e mantenuto solo da te.

→ *Valutazione:* Un'integrazione custom come quella vista nella Lezione 4.4 è probabilmente sufficiente: la complessità aggiuntiva di MCP non porterebbe vantaggi proporzionati per un caso d'uso così contenuto e isolato.

**Scenario B:** Stai costruendo un sistema aziendale in cui diversi agenti, potenzialmente basati su modelli diversi, devono tutti poter accedere ai file su Google Drive, al calendario aziendale, e al sistema di ticketing del servizio clienti — e questi stessi strumenti potrebbero in futuro essere usati anche da altri team, con altri sistemi.

→ *Valutazione:* Questo è precisamente lo scenario in cui MCP offre un vantaggio concreto: usare server MCP esistenti (o costruirne uno condiviso) per queste risorse evita di reimplementare la stessa integrazione molte volte, e garantisce interoperabilità futura.

---

## Riepilogo

- **MCP** (Model Context Protocol) è un protocollo standardizzato, sviluppato da Anthropic, che risolve il problema dell'integrazione "a fiocco di neve": ogni connessione tra modello AI e risorsa esterna costruita da zero, non riutilizzabile, non interoperabile.
- L'architettura MCP definisce tre ruoli: **Host** (l'applicazione che usa il modello), **MCP Client** (il componente che parla il protocollo), **MCP Server** (il servizio che espone una risorsa o strumento specifico).
- MCP non sostituisce il principio di fondo del Function Calling (Lezione 4.4): **standardizza** il modo in cui gli strumenti vengono descritti ed esposti, rendendoli riutilizzabili da qualsiasi host compatibile.
- MCP offre un vantaggio concreto quando serve riutilizzo tra progetti, integrazione con strumenti di terzi già pronti, o interoperabilità a lungo termine — non è necessario per ogni singolo caso d'uso semplice e isolato.

---

## Domande di Verifica

1. Spiega, con parole tue, perché il problema "a fiocco di neve" diventa via via più costoso quanti più progetti diversi e quante più risorse esterne sono coinvolte. Cosa succederebbe, in termini di lavoro di sviluppo, con 10 progetti e 10 risorse esterne diverse, senza un protocollo standardizzato?

2. Nella Lezione 1.4 abbiamo visto la separazione frontend/backend. In che modo l'architettura Host/Client/Server di MCP applica un principio di separazione delle responsabilità concettualmente simile?

3. Riprendi lo Scenario A dell'esempio pratico (lo script meteo personale). Cosa dovrebbe cambiare nello scenario perché l'adozione di MCP diventi improvvisamente vantaggiosa, anche per quel caso d'uso inizialmente semplice?

---

## Esercizi Pratici

> Tre esercizi a difficoltà crescente. Prova a risolverli da solo prima di aprire la soluzione.

### Esercizio 1 — Cosa aggiunge MCP 🟢 Base

MCP non sostituisce il principio del Function Calling. Cosa aggiunge, esattamente, rispetto a un'integrazione custom scritta a mano (Lezione 4.4)?

<details>
<summary>💡 Mostra soluzione</summary>

MCP aggiunge uno **strato di standardizzazione**. Il principio di fondo resta identico (il modello richiede → qualcosa esegue → il risultato torna al modello), ma:

- lo **schema dello strumento** è esposto automaticamente dal server MCP in un formato standard, invece di essere scritto a mano nel tuo codice;
- l'**esecuzione** è gestita dal server MCP, scritto una volta e riutilizzabile;
- l'integrazione diventa **riutilizzabile da qualsiasi host compatibile** con MCP, non solo dal tuo singolo progetto.

In breve: MCP è un **modo standard di esporre e descrivere** gli strumenti, così da non doverli ricostruire da zero per ogni progetto o modello.

</details>

### Esercizio 2 — Custom o MCP? 🟡 Intermedio

Per ciascuno scegli se basta un'integrazione custom o conviene MCP: (a) uno script personale che ogni mattina controlla il meteo; (b) un sistema aziendale dove più agenti, su modelli diversi, devono accedere a Google Drive, calendario e ticketing, anche per altri team in futuro.

<details>
<summary>💡 Mostra soluzione</summary>

- **(a) script meteo personale** → **custom basta**: un solo strumento, un solo progetto, mantenuto solo da te. La complessità extra di MCP non sarebbe ripagata.
- **(b) sistema aziendale multi-agente** → **MCP conviene**: serve riutilizzo tra agenti/modelli diversi, integrazione con strumenti potenzialmente di terzi, e interoperabilità futura tra team. Esattamente lo scenario per cui MCP esiste.

Criterio: MCP brilla quando c'è **riutilizzo, terze parti, o interoperabilità a lungo termine**; per casi isolati e semplici l'integrazione diretta è più rapida.

</details>

### Esercizio 3 — Il costo del "fiocco di neve" 🔴 Avanzato

Senza uno standard, ogni combinazione di progetto × risorsa richiede un'integrazione dedicata. Quante integrazioni servono con 10 progetti e 10 risorse esterne? Come cambia con MCP? E che principio di separazione delle responsabilità introduce l'architettura Host/Client/Server?

<details>
<summary>💡 Mostra soluzione</summary>

**Senza standard:** nel caso peggiore servono fino a **10 × 10 = 100 integrazioni** custom (ogni progetto reimplementa la connessione a ogni risorsa). E ogni nuova risorsa o progetto moltiplica il lavoro.

**Con MCP:** ogni risorsa espone **un solo server MCP** (10 server), e ogni progetto ha un MCP client che li usa tutti → l'ordine di grandezza scende da ~N×M a ~N+M. Niente reimplementazioni duplicate.

**Separazione delle responsabilità:** Host/Client/Server separa nettamente *chi usa* uno strumento (l'host, per un compito specifico) da *chi mantiene la connessione* alla risorsa (il server MCP, scritto una volta). È lo stesso principio frontend/backend (Lezione 1.4) e di "non duplicare ciò che può essere centralizzato" che ritroveremo nelle skill library (Lezione 6.7).

</details>

---

## Connessioni

**Viene da:** Lezione 4.4 (Tool Use e Function Calling) — MCP standardizza esattamente il meccanismo costruito a mano in quella lezione, senza cambiarne il principio di fondo.

**Porta a:** Lezione 4.6 (Memory) — vedremo come anche la gestione della memoria può beneficiare di pattern standardizzati di accesso a risorse esterne, un principio simile a quello di MCP.

**Ritroverai questi concetti in:** Lezione 6.2 (L'Agent Package) — la cartella `tools/` di un agente professionale può fare riferimento sia a strumenti custom (Lezione 4.4) sia a server MCP esterni. Lezione 7.1 (Progettare un Workflow Agentivo) — il protocollo A2A (Agent-to-Agent) che vedremo in quella lezione applica un principio di standardizzazione affine a MCP, ma per la comunicazione tra agenti invece che tra agente e risorsa esterna.
