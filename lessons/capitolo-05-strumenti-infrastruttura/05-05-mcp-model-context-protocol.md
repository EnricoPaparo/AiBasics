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

Nella lezione precedente abbiamo costruito, con codice scritto interamente a mano, un meccanismo di Function Calling: abbiamo definito uno strumento, scritto la funzione che lo esegue, e gestito noi stessi il ciclo di richiesta e risposta. Questo approccio funziona perfettamente per un singolo strumento, in un singolo progetto. Ma cosa succede quando il numero di strumenti cresce, quando più progetti diversi hanno bisogno degli stessi strumenti, o quando vuoi che il tuo agente possa usare strumenti costruiti da soggetti terzi?

Questa lezione introduce **MCP** — Model Context Protocol — un protocollo standardizzato, sviluppato da Anthropic e reso pubblico come standard aperto, che risolve esattamente questo problema di scala e interoperabilità.

---

## Obiettivi di Apprendimento

Al termine di questa lezione sarai in grado di:

- Spiegare il problema di interoperabilità che MCP risolve
- Descrivere l'architettura Host-Client-Server di MCP
- Distinguere concettualmente MCP dal Function Calling implementato a mano
- Riconoscere quando adottare MCP offre un vantaggio concreto

---

## 1. Il problema che MCP risolve: l'integrazione "a fiocco di neve"

Prima di MCP, ogni volta che uno sviluppatore voleva collegare un modello AI a una risorsa esterna doveva scrivere un'integrazione **su misura**. Questo genera il "problema a fiocco di neve": ogni integrazione è leggermente diversa dalle altre, costruita ad-hoc, non riutilizzabile, e non interoperabile.

```
SENZA UNO STANDARD (situazione "a fiocco di neve")

Progetto A (usa Claude)        Progetto B (usa un altro LLM)
   ├── integrazione custom          ├── integrazione DIVERSA
   │   con Google Drive             │   con Google Drive (scritta da zero)
   └── integrazione custom          └── integrazione DIVERSA
       con Slack (scritta da zero)      con Slack (scritta da zero)

CON MCP (interoperabilità standardizzata)

     SERVIZIO MCP per Google Drive (scritto UNA VOLTA)
                      │
         ┌────────────┼────────────┐
         ▼            ▼            ▼
   Progetto A    Progetto B    Progetto C
   tutti usano lo stesso servizio MCP
```

---

## 2. L'architettura MCP: Host, Client, Server

MCP definisce tre ruoli distinti:

- **Host**: l'applicazione complessiva con cui l'utente interagisce — può essere un prodotto come Claude Code, o un sistema che tu stesso costruisci
- **MCP Client**: il componente, integrato nell'host, responsabile di comunicare secondo le regole del protocollo MCP con uno o più server
- **MCP Server**: un servizio indipendente, che espone funzionalità specifiche seguendo lo standard MCP, pronto per essere usato da qualsiasi host compatibile

---

## 3. MCP vs Function Calling "fatto in casa": cosa cambia esattamente

MCP non sostituisce il principio del Function Calling — il modello "richiede" l'uso di uno strumento, qualcosa esegue quella richiesta, il risultato torna al modello. Questo principio di fondo resta identico.

Quello che MCP aggiunge è uno **strato di standardizzazione** su come questa connessione viene stabilita e descritta:

| | Function Calling Custom | MCP |
|--|---|---|
| Schema dello strumento | Definito a mano nel tuo codice | Esposto automaticamente dal server MCP |
| Esecuzione | Funzione scritta nel tuo progetto | Gestita dal server MCP (scritto una volta) |
| Riutilizzo | Solo nel tuo progetto | Da qualsiasi host compatibile con MCP |

---

## 4. Quando MCP offre un vantaggio concreto

Non ogni progetto ha bisogno di MCP. MCP diventa concretamente vantaggioso quando:

- Vuoi **riutilizzare** lo stesso strumento in più progetti, senza ricostruire l'integrazione ogni volta
- Vuoi **usare strumenti costruiti da terzi** (es. un server MCP ufficiale per Slack, GitHub, o Google Drive)
- Stai costruendo un sistema che deve rimanere **interoperabile** con modelli o applicazioni diverse
- Vuoi **separare** la responsabilità di "chi mantiene la connessione" da "chi la usa"

---

## Esempio Pratico: Riconoscere uno Scenario "da MCP"

**Scenario A:** Stai costruendo un piccolo script personale che, una volta al giorno, controlla il meteo e ti invia un riepilogo.

→ Un'integrazione custom è sufficiente: la complessità aggiuntiva di MCP non porterebbe vantaggi proporzionati.

**Scenario B:** Stai costruendo un sistema aziendale in cui diversi agenti, su modelli diversi, devono tutti accedere a Google Drive, al calendario aziendale, e al sistema di ticketing — e questi strumenti potrebbero essere usati anche da altri team in futuro.

→ MCP offre un vantaggio concreto: evita di reimplementare la stessa integrazione molte volte e garantisce interoperabilità futura.

---

## Riepilogo

- **MCP** risolve il problema dell'integrazione "a fiocco di neve": ogni connessione costruita da zero, non riutilizzabile, non interoperabile.
- L'architettura MCP definisce tre ruoli: **Host**, **MCP Client**, **MCP Server**.
- MCP **standardizza** il modo in cui gli strumenti vengono descritti ed esposti, rendendoli riutilizzabili da qualsiasi host compatibile.
- MCP offre un vantaggio concreto quando serve riutilizzo tra progetti, integrazione con strumenti di terzi, o interoperabilità a lungo termine.

---

## Domande di Verifica

1. Spiega perché il problema "a fiocco di neve" diventa via via più costoso quanti più progetti e risorse esterne sono coinvolte. Cosa succederebbe con 10 progetti e 10 risorse esterne diverse, senza un protocollo standardizzato?

2. In che modo l'architettura Host/Client/Server di MCP applica un principio di separazione delle responsabilità simile a quello frontend/backend visto nella Lezione 1.4?

3. Riprendi lo Scenario A dell'esempio pratico (lo script meteo personale). Cosa dovrebbe cambiare nello scenario perché l'adozione di MCP diventi improvvisamente vantaggiosa?

---

## Esercizi Pratici

> Tre esercizi a difficoltà crescente. Prova a risolverli da solo prima di aprire il suggerimento.

### Esercizio 1 — Cosa aggiunge MCP 🟢 Base

MCP non sostituisce il principio del Function Calling. Cosa aggiunge, esattamente, rispetto a un'integrazione custom scritta a mano?

<details>
<summary>💡 Mostra suggerimento</summary>

Pensa in termini di tre dimensioni:
1. **Schema dello strumento**: chi lo definisce e dove vive?
2. **Esecuzione**: dove vive il codice che esegue l'azione?
3. **Riutilizzo**: quanti progetti possono usare questa integrazione senza riscriverla?

Il principio di fondo (modello richiede → qualcosa esegue → risultato torna al modello) non cambia. Ciò che cambia è il **grado di standardizzazione e riutilizzabilità**.

</details>

### Esercizio 2 — Custom o MCP? 🟡 Intermedio

Per ciascuno scegli se basta un'integrazione custom o conviene MCP: (a) uno script personale che ogni mattina controlla il meteo; (b) un sistema aziendale dove più agenti, su modelli diversi, devono accedere a Google Drive, calendario e ticketing, anche per altri team in futuro.

<details>
<summary>💡 Mostra suggerimento</summary>

**Criteri da valutare per ogni scenario:**
- Quanti progetti usano questo strumento?
- Lo strumento è mantenuto da te o da terzi?
- Il sistema deve rimanere interoperabile in futuro?
- Quanti sviluppatori/team sono coinvolti?

**Regola generale:** MCP brilla quando c'è **riutilizzo, terze parti, o interoperabilità a lungo termine**. Per casi isolati e semplici, l'integrazione diretta è più rapida.

</details>

### Esercizio 3 — Il costo del "fiocco di neve" 🔴 Avanzato

Senza uno standard, ogni combinazione di progetto × risorsa richiede un'integrazione dedicata. Quante integrazioni servono con 10 progetti e 10 risorse esterne? Come cambia con MCP? E che principio di separazione delle responsabilità introduce l'architettura Host/Client/Server?

<details>
<summary>💡 Mostra suggerimento</summary>

**Senza standard:** calcola il numero massimo di combinazioni progetto × risorsa. Ogni combinazione è un'integrazione indipendente.

**Con MCP:** ogni risorsa espone un solo server MCP. Ogni progetto ha un client che li usa tutti. Come cambia l'ordine di grandezza da N×M a N+M?

**Separazione delle responsabilità:** chi mantiene la connessione alla risorsa (server MCP) è separato da chi la usa per un compito specifico (host). Quali vantaggi porta questa separazione in termini di manutenzione, aggiornamenti e sicurezza?

</details>

---

## Connessioni

**Viene da:** Lezione 4.4 (Tool Use e Function Calling) — MCP standardizza esattamente il meccanismo costruito a mano in quella lezione.

**Porta a:** Lezione 4.6 (Memory) — anche la gestione della memoria può beneficiare di pattern standardizzati di accesso a risorse esterne.

**Ritroverai questi concetti in:** Lezione 6.2 (L'Agent Package) — la cartella `tools/` di un agente professionale può fare riferimento sia a strumenti custom sia a server MCP esterni.
