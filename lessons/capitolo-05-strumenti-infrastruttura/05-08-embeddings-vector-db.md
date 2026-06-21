---
titolo: "Embeddings e Vector Database"
durata_stimata: "25 min"
difficolta: "Intermedio"
---

# Embeddings e Vector Database

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

Usi un modello specifico per gli embeddings (diverso dal modello di generazione testo):

```python
from anthropic import Anthropic

# Anthropic non offre embeddings propri — si usa tipicamente:
# - OpenAI text-embedding-3-small / text-embedding-3-large
# - Voyage AI (raccomandato da Anthropic per uso con Claude)
# - Cohere embed-v3
# - Sentence Transformers (open source, locale)

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

### Modelli di Embedding Principali

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

### I Principali Vector Database

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
-- Estensione vettoriale per Postgres
CREATE EXTENSION vector;

CREATE TABLE documenti (
    id SERIAL PRIMARY KEY,
    contenuto TEXT,
    embedding vector(1536)
);

-- Ricerca per similarità coseno
SELECT contenuto, 1 - (embedding <=> '[0.1, 0.2, ...]'::vector) AS similarita
FROM documenti
ORDER BY embedding <=> '[0.1, 0.2, ...]'::vector
LIMIT 5;
```

**Weaviate** — open source con funzionalità avanzate (hybrid search, multi-tenancy).

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

Gli LLM hanno un context window limitato (vedi Cap 4), quindi non puoi passare documenti interi. Devi dividerli in **chunk** (pezzi).

Il chunking è spesso il componente che più impatta la qualità del RAG:

```python
# Chunking semplice per lunghezza (non ideale)
def chunk_semplice(testo, dimensione=500):
    return [testo[i:i+dimensione] for i in range(0, len(testo), dimensione)]

# Chunking con overlap (meglio: mantiene contesto ai bordi)
def chunk_con_overlap(testo, dimensione=500, overlap=100):
    chunks = []
    inizio = 0
    while inizio < len(testo):
        fine = inizio + dimensione
        chunks.append(testo[inizio:fine])
        inizio += dimensione - overlap
    return chunks
```

**Strategie più sofisticate:**

```python
from langchain.text_splitter import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    separators=["\n\n", "\n", ". ", " ", ""]  # rispetta paragrafi e frasi
)
chunks = splitter.split_text(documento)
```

**Regole pratiche per il chunking**:
- **Rispetta i confini semantici** (paragrafi > frasi > parole)
- **Overlap del 10-20%** per non perdere contesto ai bordi
- **Chunk da 256 a 1024 token** — troppo piccoli perdono contesto, troppo grandi diluiscono la ricerca
- **Includi metadati** (fonte, pagina, sezione) per permettere citazioni accurate

## Ricerca Ibrida: Semantica + Keyword

La ricerca solo vettoriale non è sempre la migliore. Un approccio **hybrid** combina:

- **Dense retrieval** (vettori): cattura il significato semantico
- **Sparse retrieval** (BM25/TF-IDF): cattura match esatti di keyword

```python
# Esempio con Weaviate (hybrid search integrato)
risultati = client.query.get("Documento", ["contenuto"]) \
    .with_hybrid(query="API REST autenticazione JWT", alpha=0.5) \
    .with_limit(5) \
    .do()
# alpha=0 → solo keyword, alpha=1 → solo semantica, 0.5 → bilanciato
```

La ricerca ibrida è particolarmente utile quando i documenti contengono codice, nomi propri, o terminologia tecnica specifica.

---

## Esercizi Pratici

> Tre esercizi a difficoltà crescente. Prova a risolverli da solo prima di aprire la soluzione.

### Esercizio 1 — Il Tuo Primo Indice Vettoriale 🟢 Base

Installa Chroma e crea un indice con 5 frasi di argomenti diversi (es. cucina, sport, tecnologia). Poi fai 3 query semantiche e verifica che i risultati siano sensati. Usa gli embedding automatici di Chroma (senza configurare un modello esterno).

<details>
<summary>💡 Mostra soluzione</summary>

```bash
pip install chromadb
```

```python
import chromadb

client = chromadb.Client()
collection = client.create_collection(
    "test",
    # Chroma usa un modello di embedding locale di default
)

collection.add(
    documents=[
        "La pasta al pomodoro è un piatto tipico italiano",
        "Il calcio è lo sport più popolare al mondo",
        "Python è il linguaggio preferito per il machine learning",
        "La pizza napoletana ha la certificazione UNESCO",
        "Le reti neurali si ispirano al cervello umano"
    ],
    ids=["d1", "d2", "d3", "d4", "d5"]
)

# Query 1: dovrebbe trovare d1 e d4
r1 = collection.query(query_texts=["ricette della cucina italiana"], n_results=2)
print("Cucina:", r1["documents"])

# Query 2: dovrebbe trovare d3 e d5
r2 = collection.query(query_texts=["intelligenza artificiale e programmazione"], n_results=2)
print("Tech:", r2["documents"])

# Query 3: dovrebbe trovare d2
r3 = collection.query(query_texts=["partita di football"], n_results=1)
print("Sport:", r3["documents"])
```

</details>

---

### Esercizio 2 — RAG Minimale con Chroma 🟡 Intermedio

Costruisci un sistema RAG completo: indicizza 10 paragrafi di testo su un argomento a scelta, poi implementa una funzione `rispondi(domanda)` che recupera i 3 chunk più rilevanti e li passa a Claude per generare una risposta contestualizzata. La risposta deve citare da quale chunk viene l'informazione.

<details>
<summary>💡 Mostra soluzione</summary>

```python
import chromadb
import anthropic

# Setup
chroma = chromadb.Client()
collection = chroma.create_collection("knowledge_base")
claude = anthropic.Anthropic()

# Indicizzazione
documenti = [
    "Il fotovoltaico converte la luce solare in elettricità tramite celle solari.",
    "Un pannello solare standard ha un'efficienza tra il 15% e il 22%.",
    "L'energia eolica sfrutta la forza del vento attraverso turbine.",
    "Le batterie al litio sono attualmente la tecnologia dominante per lo stoccaggio.",
    "La rete elettrica deve bilanciare produzione e consumo in tempo reale.",
    "Le comunità energetiche permettono la condivisione di energia rinnovabile.",
    "Il costo del fotovoltaico è sceso del 90% negli ultimi 10 anni.",
    "L'idrogeno verde viene prodotto tramite elettrolisi con energia rinnovabile.",
    "Gli smart meter misurano i consumi in tempo reale e comunicano con la rete.",
    "Il capacity factor eolico offshore è circa il 40-45%.",
]

collection.add(
    documents=documenti,
    ids=[f"doc{i}" for i in range(len(documenti))]
)

def rispondi(domanda: str) -> str:
    # Recupera i chunk più rilevanti
    risultati = collection.query(query_texts=[domanda], n_results=3)
    chunks = risultati["documents"][0]
    ids = risultati["ids"][0]
    
    # Costruisci il contesto con riferimenti
    contesto = "\n".join([f"[{id}]: {chunk}" for id, chunk in zip(ids, chunks)])
    
    risposta = claude.messages.create(
        model="claude-opus-4-8",
        max_tokens=500,
        messages=[{
            "role": "user",
            "content": f"""Rispondi alla domanda usando SOLO le informazioni fornite. 
Cita i riferimenti nel formato [docX].

Contesto:
{contesto}

Domanda: {domanda}"""
        }]
    )
    return risposta.content[0].text

print(rispondi("Come si immagazzina l'energia rinnovabile?"))
```

</details>

---

### Esercizio 3 — Analisi della Qualità del Chunking 🔴 Avanzato

Prendi un testo lungo (es. un articolo Wikipedia) e indicizzalo in tre modi diversi: (a) chunk fissi da 200 caratteri senza overlap, (b) chunk da 500 con 100 di overlap, (c) chunk per paragrafo. Per ciascuno, fai le stesse 5 domande e confronta la qualità dei risultati recuperati. Scrivi le conclusioni su quando ogni strategia è appropriata.

<details>
<summary>💡 Mostra soluzione</summary>

```python
import chromadb
import requests

# Scarica un articolo (esempio semplificato con testo hardcoded)
testo = """
L'intelligenza artificiale (IA) è un campo dell'informatica che si occupa 
di creare sistemi in grado di eseguire compiti che richiedono intelligenza umana.

La storia dell'IA inizia negli anni '50 con Alan Turing, che propose il famoso 
"Test di Turing" per valutare se una macchina possa esibire un comportamento 
intelligente indistinguibile da quello umano.

Il machine learning è una branca dell'IA che permette ai sistemi di apprendere 
automaticamente dall'esperienza senza essere esplicitamente programmati.

Le reti neurali profonde (deep learning) hanno rivoluzionato il campo dal 2012, 
raggiungendo performance sovrumane in molti compiti come il riconoscimento delle immagini.

I Large Language Model come GPT e Claude sono addestrati su enormi quantità di testo 
e possono generare, riassumere e ragionare sul linguaggio naturale.
"""

domande = [
    "Chi ha inventato il test di Turing?",
    "Cos'è il machine learning?",
    "Quando è iniziato il deep learning?",
    "Cosa sono i Large Language Model?",
    "Qual è la differenza tra IA e machine learning?"
]

def valuta_chunking(nome, chunks):
    client = chromadb.Client()
    try:
        client.delete_collection(nome)
    except:
        pass
    col = client.create_collection(nome)
    col.add(documents=chunks, ids=[f"c{i}" for i in range(len(chunks))])
    
    print(f"\n=== {nome} ({len(chunks)} chunks) ===")
    for q in domande:
        r = col.query(query_texts=[q], n_results=1)
        chunk_trovato = r["documents"][0][0][:80] + "..."
        print(f"Q: {q[:50]}")
        print(f"A: {chunk_trovato}\n")

# Strategia A: chunk fissi
chunks_a = [testo[i:i+200] for i in range(0, len(testo), 200)]

# Strategia B: chunk con overlap
chunks_b = []
i = 0
while i < len(testo):
    chunks_b.append(testo[i:i+500])
    i += 400  # 100 di overlap

# Strategia C: per paragrafo
chunks_c = [p.strip() for p in testo.split("\n\n") if p.strip()]

valuta_chunking("fissi_200", chunks_a)
valuta_chunking("overlap_500_100", chunks_b)
valuta_chunking("per_paragrafo", chunks_c)

print("""
CONCLUSIONI:
- Chunk fissi piccoli: veloci ma perdono contesto, sbagliano spesso domande che richiedono più frasi
- Chunk con overlap: buon bilanciamento, l'overlap aiuta a recuperare informazioni ai confini
- Per paragrafo: spesso il migliore se il testo è ben strutturato, perché ogni chunk è un'unità semantica
- Regola d'oro: la granularità del chunk deve corrispondere alla granularità delle domande attese
""")
```

</details>

---

## Connessioni

- **Lezione precedente**: [RAG: Memoria Esterna](05-03-rag) — il RAG usa gli embeddings per trovare i chunk rilevanti
- **Lezione successiva**: [Struttura di un Progetto Python Reale](05-09-struttura-progetto-python) — come organizzare il codice che usa embeddings e vector DB
- **Capitolo 4**: [Il Context Window](../capitolo-04-llm/04-06-context-window) — i chunk devono stare nel context window del modello
- **Capitolo 6**: [L'Orchestratore](../capitolo-06-agenti-architettura/06-03-orchestratore) — gli agenti usano RAG come tool per recuperare memoria esterna
