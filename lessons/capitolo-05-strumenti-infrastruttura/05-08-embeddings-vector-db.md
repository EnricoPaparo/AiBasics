---
titolo: "Embeddings e Vector Database"
durata_stimata: "25 min"
difficolta: "Intermedio"
---
# Embeddings e Vector Database

> **📌 Ricordi?** In [Lezione 03-04] abbiamo visto che le parole possono essere rappresentate come vettori nello spazio matematico: "gatto" e "cane" sono punti vicini, "gatto" e "automobile" sono lontani. Quella intuizione — la distanza geometrica come misura del significato condiviso — era l'intuizione fondamentale degli embedding. Questa lezione costruisce direttamente su quella premessa: ora vediamo come quegli stessi vettori si generano in pratica, dove si archiviano, e come si usano per trovare documenti rilevanti senza confrontare nemmeno una parola alla volta.

Il RAG (che hai visto nella lezione precedente) usa la ricerca semantica per trovare i documenti giusti. Ma come funziona questa ricerca? Non confronta testi parola per parola — usa gli **embeddings** e i **vector database**. Capire questi strumenti ti permette di costruire RAG che funzionano davvero.

## Cosa Sono gli Embeddings

Un **embedding** è una rappresentazione numerica del significato di un testo. Concramente: una lista di numeri (un vettore) che cattura il concetto espresso da una parola, frase o documento.

```python
# Esempio (numeri semplificati per chiarezza)
"cane"     → [0.82, 0.14, 0.67, 0.03, ...]  # 1536 numeri
"gatto"    → [0.79, 0.17, 0.61, 0.05, ...]  # simile a "cane"!
"automobile" → [0.12, 0.91, 0.03, 0.78, ...] # molto diverso
```

La proprietà fondamentale: **testi con significato simile producono vettori vicini nello spazio matematico**. Questa "vicinanza" si misura con la **cosine similarity**.

```
cos(θ) = (A · B) / (|A| × |B|)

cane vs gatto:      0.87  (molto simile)
cane vs automobile: 0.12  (poco correlati)
auto vs veicolo:    0.94  (quasi sinonimi)
```

Non hai bisogno di capire la matematica vettoriale — quello che conta è l'intuizione: il modello di embedding ha "imparato" il significato delle parole leggendo enormi quantità di testo.

## Come si Generano gli Embeddings

Usi un modello specifico per gli embeddings (diverso dal modello di generazione testo). Anthropic non offre embeddings propri — si usano tipicamente Voyage AI (raccomandato), OpenAI text-embedding, Cohere, o Sentence Transformers (open source).

| Modello | Dimensioni | Costo | Ideale per |
|---------|-----------|-------|-----------|
| `voyage-3` | 1024 | ~$0.12/1M token | Uso generale con Claude |
| `text-embedding-3-small` | 1536 | $0.02/1M token | Budget ridotto |
| `text-embedding-3-large` | 3072 | $0.13/1M token | Massima qualità |
| `nomic-embed-text` | 768 | Gratuito (locale) | Privacy, offline |

**Regola**: usa lo stesso modello per indicizzare e per le query. Modelli diversi producono spazi vettoriali incompatibili.

## Vector Database: Dove Salvare gli Embeddings

Un database vettoriale è ottimizzato per cercare i vettori più vicini a quello della tua query. È fondamentalmente diverso da un database SQL: non cerchi per chiave o filtro esatto, cerchi per **similarità semantica**.

### Architettura di un Sistema RAG con Vector DB

```
FASE DI INDICIZZAZIONE (una volta)
─────────────────────────────────
Documenti → Chunking → Embedding → Vector DB

FASE DI QUERY (ad ogni richiesta)
──────────────────────────────────
Domanda utente → Embedding → Ricerca top-K → Contesto → LLM → Risposta
```

**Chroma** — ideale per iniziare, tutto locale:

```python
import chromadb

client = chromadb.Client()
collection = client.create_collection("documenti")

# Indicizzare
collection.add(
    documents=["Il gatto dorme sul tetto", "Il cane corre nel parco"],
    ids=["doc1", "doc2"]
)

# Cercare
risultati = collection.query(
    query_texts=["animale domestico che riposa"],
    n_results=2
)
print(risultati["documents"])
```

### Scegliere il Vector DB Giusto

```
Sto prototipando / voglio qualcosa di semplice?
  → Chroma (tutto locale, zero configurazione)

Ho già Postgres in produzione?
  → pgvector (nessun servizio aggiuntivo)

Scalabilità cloud-managed, uso in produzione?
  → Pinecone o Weaviate

Devo rispettare GDPR / tenere i dati in locale?
  → Chroma o Weaviate self-hosted
```

## Il Chunking: Come Dividere i Documenti

Gli LLM hanno un context window limitato, quindi non puoi passare documenti interi. Devi dividerli in **chunk** (pezzi). Il chunking è spesso il componente che più impatta la qualità del RAG.

**Regole pratiche per il chunking**:
- **Rispetta i confini semantici** (paragrafi > frasi > parole)
- **Overlap del 10-20%** per non perdere contesto ai bordi
- **Chunk da 256 a 1024 token** — troppo piccoli perdono contesto, troppo grandi diluiscono la ricerca
- **Includi metadati** (fonte, pagina, sezione) per permettere citazioni accurate

## Ricerca Ibrida: Semantica + Keyword

La ricerca solo vettoriale non è sempre la migliore. Un approccio **hybrid** combina ricerca semantica (dense retrieval) con match esatti di keyword (BM25/TF-IDF). È particolarmente utile quando i documenti contengono codice, nomi propri, o terminologia tecnica specifica.

---

## Esercizi Pratici

> Tre esercizi a difficoltà crescente. Prova a risolverli da solo prima di aprire il suggerimento.

### Esercizio 1 — Il Tuo Primo Indice Vettoriale 🟢 Base

Installa Chroma e crea un indice con 5 frasi di argomenti diversi (es. cucina, sport, tecnologia). Poi fai 3 query semantiche e verifica che i risultati siano sensati. Usa gli embedding automatici di Chroma (senza configurare un modello esterno).

<details>
<summary>💡 Mostra suggerimento</summary>

**Struttura da seguire:**
1. `pip install chromadb` e crea un `Client()` con una collection
2. Aggiungi 5 documenti su argomenti diversi con id univoci (`"d1"`, `"d2"`, ecc.)
3. Usa `collection.query(query_texts=[...], n_results=2)` con query semanticamente simili agli argomenti
4. Verifica che la cucina trovi documenti sulla cucina, la tecnologia trovi quelli tech, ecc.

**Pseudocodice:**
```
collection = crea_collection("test")
collection.add(documenti=[...5 frasi...], ids=[...5 id...])
r = collection.query(query_texts=["ricette cucina italiana"], n_results=2)
stampa i risultati e verifica la coerenza
```

</details>

---

### Esercizio 2 — RAG Minimale con Chroma 🟡 Intermedio

Costruisci un sistema RAG completo: indicizza 10 paragrafi di testo su un argomento a scelta, poi implementa una funzione `rispondi(domanda)` che recupera i 3 chunk più rilevanti e li passa a Claude per generare una risposta contestualizzata. La risposta deve citare da quale chunk viene l'informazione.

<details>
<summary>💡 Mostra suggerimento</summary>

**Struttura della funzione `rispondi(domanda)`:**
1. Chiama `collection.query(query_texts=[domanda], n_results=3)` per recuperare i chunk
2. Costruisci una stringa `contesto` unendo i 3 chunk con i loro id (es. `[doc0]: testo...`)
3. Chiama Claude con un prompt che include il contesto e chiede di citare i riferimenti nel formato `[docX]`
4. Restituisci la risposta

**Prompt suggerito per Claude:**
```
Rispondi alla domanda usando SOLO le informazioni fornite.
Cita i riferimenti nel formato [docX].
Contesto: {contesto}
Domanda: {domanda}
```

</details>

---

### Esercizio 3 — Analisi della Qualità del Chunking 🔴 Avanzato

Prendi un testo lungo (es. un articolo Wikipedia) e indicizzalo in tre modi diversi: (a) chunk fissi da 200 caratteri senza overlap, (b) chunk da 500 con 100 di overlap, (c) chunk per paragrafo. Per ciascuno, fai le stesse 5 domande e confronta la qualità dei risultati recuperati. Scrivi le conclusioni su quando ogni strategia è appropriata.

<details>
<summary>💡 Mostra suggerimento</summary>

**Tre funzioni di chunking da implementare:**
- Strategia A: `[testo[i:i+200] for i in range(0, len(testo), 200)]`
- Strategia B: loop con avanzamento di `dimensione - overlap` ad ogni step
- Strategia C: `[p.strip() for p in testo.split("\n\n") if p.strip()]`

**Per ogni strategia:**
1. Crea una collection Chroma separata con un nome diverso
2. Indicizza i chunk risultanti
3. Esegui le stesse 5 domande su tutte e 3 le collection
4. Confronta quale chunk viene recuperato e quanto è rilevante

**Conclusione attesa:** la strategia per paragrafo è spesso la migliore su testi ben strutturati; l'overlap aiuta ai bordi; i chunk fissi piccoli perdono contesto.

</details>

---

<details>
<summary>⚙️ Approfondimento Avanzato</summary>

### Generare Embeddings con Voyage AI

```python
import voyageai

client = voyageai.Client(api_key="...")

# Genera embedding per un testo
result = client.embed(
    ["Il cane abbaiò nel giardino"],
    model="voyage-3",
    input_type="document"  # o "query" per le domande
)
vettore = result.embeddings[0]  # lista di 1024 numeri
print(len(vettore))  # 1024
```

### Altri Vector Database

**Pinecone** — servizio cloud managed, scala in produzione:
```python
from pinecone import Pinecone

pc = Pinecone(api_key="...")
index = pc.Index("mio-indice")

# Upsert (inserisci o aggiorna)
index.upsert(vectors=[
    {"id": "doc1", "values": [0.1, 0.2, ...], "metadata": {"fonte": "manuale.pdf"}},
])

# Ricerca
risultati = index.query(vector=[0.1, 0.15, ...], top_k=5, include_metadata=True)
```

**pgvector** — se hai già PostgreSQL, aggiungi ricerca vettoriale:
```sql
CREATE EXTENSION vector;

CREATE TABLE documenti (
    id SERIAL PRIMARY KEY,
    contenuto TEXT,
    embedding vector(1536)
);

SELECT contenuto, 1 - (embedding <=> '[0.1, 0.2, ...]'::vector) AS similarita
FROM documenti
ORDER BY embedding <=> '[0.1, 0.2, ...]'::vector
LIMIT 5;
```

### Chunking con Overlap (Codice)

```python
def chunk_con_overlap(testo, dimensione=500, overlap=100):
    chunks = []
    inizio = 0
    while inizio < len(testo):
        fine = inizio + dimensione
        chunks.append(testo[inizio:fine])
        inizio += dimensione - overlap
    return chunks
```

### Ricerca Ibrida con Weaviate

```python
# Esempio con Weaviate (hybrid search integrato)
risultati = client.query.get("Documento", ["contenuto"]) \
    .with_hybrid(query="API REST autenticazione JWT", alpha=0.5) \
    .with_limit(5) \
    .do()
# alpha=0 → solo keyword, alpha=1 → solo semantica, 0.5 → bilanciato
```

</details>

---

## Connessioni

- **Lezione precedente**: [RAG: Memoria Esterna](05-03-rag) — il RAG usa gli embeddings per trovare i chunk rilevanti
- **Lezione successiva**: [Struttura di un Progetto Python Reale](05-09-struttura-progetto-python) — come organizzare il codice che usa embeddings e vector DB
- **Capitolo 4**: [Il Context Window](../capitolo-04-llm/04-06-context-window) — i chunk devono stare nel context window del modello
- **Capitolo 6**: [L'Orchestratore](../capitolo-06-agenti-architettura/06-03-orchestratore) — gli agenti usano RAG come tool per recuperare memoria esterna
