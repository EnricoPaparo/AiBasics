---
titolo: "Etica e Responsabilità nell'AI"
durata_stimata: "25 min"
difficolta: "Intermedio"
---

# Etica e Responsabilità nell'AI

Costruire un sistema AI che funziona tecnicamente è necessario ma non sufficiente. Come professionista, sei responsabile non solo del codice che scrivi, ma delle conseguenze che produce nel mondo reale.

## Perché l'Etica È Parte del Mestiere

Negli ultimi anni, i sistemi AI hanno preso decisioni su chi riceve un prestito, chi viene assunto, chi viene sorvegliato, chi riceve cure mediche prioritarie. Questi sistemi sono stati costruiti da sviluppatori — persone come quelle che leggono questo corso.

L'argomento "è solo tecnologia, la responsabilità è di chi la usa" non regge. Chi progetta uno strumento ha responsabilità su come è progettato, su quali bias amplifica, su cosa rende possibile e cosa preclude.

Questo non significa che tu debba risolvere tutti i problemi etici del mondo. Significa che devi **chiederti le domande giuste** prima di deployare.

## Bias e Fairness

Un sistema AI impara dai dati. Se i dati storici riflettono discriminazioni passate, il modello le riproduce — e spesso le amplifica.

**Esempio reale**: un sistema di screening CV usato da una grande azienda tecnologica ha imparato a penalizzare i curriculum che contenevano la parola "femminile" (es. "squadra femminile di calcio"). Il modello aveva imparato da 10 anni di assunzioni in cui gli uomini erano stati selezionati più spesso.

**Tipi di bias comuni**:
- **Representation bias**: alcuni gruppi sono sottorappresentati nei dati di training
- **Historical bias**: i dati riflettono ingiustizie storiche che non vogliamo perpetuare
- **Measurement bias**: il modo in cui raccogliamo i dati favorisce certi gruppi
- **Aggregation bias**: un modello addestrato su tutti non funziona bene su nessuno in particolare

**Cosa fare come sviluppatore**:
- Analizza i dati di training: chi è rappresentato? Chi manca?
- Testa le performance del sistema disaggregate per gruppi demografici
- Usa metriche di fairness (parità demografica, equalized odds)
- Documenta i limiti noti del sistema

## Trasparenza e Spiegabilità

Un sistema che prende decisioni impattanti sulle persone dovrebbe essere in grado di spiegare perché le ha prese.

Questo è difficile con gli LLM — non puoi aprire il modello e vedere il ragionamento. Ma puoi progettare il sistema per essere trasparente:

```python
def make_decision(applicant_data):
    # Invece di restituire solo la decisione...
    response = llm.generate(f"""
Analizza questa candidatura e decidi se procedere.
Devi fornire:
1. La decisione (procedi / non procedere)
2. I 3 fattori principali che hanno influenzato la decisione
3. Le informazioni che sarebbero utili per rivalutare

Candidatura: {applicant_data}
""")
    return {
        "decision": parse_decision(response),
        "reasoning": parse_reasoning(response),  # spiegabile all'utente
        "appeal_path": "contatta appeals@company.com"  # percorso di appello
    }
```

**Principi di trasparenza**:
- L'utente dovrebbe sapere che sta interagendo con un sistema AI
- Decisioni automatizzate ad alto impatto devono essere spiegabili e appellabili
- Documenta cosa il sistema fa e cosa non fa

## Privacy e Dati Personali

Quando costruisci sistemi AI che elaborano dati degli utenti, entrano in gioco regole legali stringenti.

**GDPR (Unione Europea)** — se i tuoi utenti sono europei, si applica:
- **Minimizzazione dei dati**: raccogli solo quello che serve davvero
- **Finalità**: i dati raccolti per uno scopo non possono essere usati per un altro
- **Consenso**: l'utente deve acconsentire esplicitamente
- **Diritto all'oblio**: l'utente può chiedere la cancellazione dei suoi dati
- **Portabilità**: l'utente può esportare i suoi dati

**Implicazioni pratiche**:

```python
# NON fare: inviare dati personali al LLM senza anonimizzazione
response = llm.generate(f"Analizza questo cliente: {customer.full_name}, {customer.email}, {customer.medical_history}")

# FARE: anonimizzare prima di inviare
anonymized = anonymize(customer_data)  # sostituisce PII con placeholder
response = llm.generate(f"Analizza questo cliente: {anonymized}")
# ricorda che i dati del prompt vengono inviati al provider LLM!
```

**Attenzione**: quando usi un'API LLM esterna (Anthropic, OpenAI, etc.), i dati che invii nel prompt vengono elaborati sui loro server. Leggi i termini di servizio del provider riguardo alla data retention e all'uso dei dati.

## L'EU AI Act

Dal 2024, l'Unione Europea ha una legge sull'AI che classifica i sistemi AI per livello di rischio:

| Rischio | Esempi | Obblighi |
|---------|--------|-----------|
| **Inaccettabile** | Sorveglianza di massa biometrica, manipolazione subliminale | **Vietato** |
| **Alto** | AI in ambito medico, scolastico, giustizia, occupazione | Audit, trasparenza, human oversight obbligatori |
| **Limitato** | Chatbot, deepfake | Obbligo di disclosure (dichiarare che è AI) |
| **Minimo** | Filtri spam, raccomandazioni | Nessun obbligo specifico |

Se stai costruendo qualcosa che rientra nelle categorie "alto rischio", hai obblighi legali. Non è più solo una questione etica.

## Il Problema dell'Automazione Selettiva

C'è un bias cognitivo pericoloso quando si usano sistemi AI per prendere decisioni: si tende ad accettare le decisioni positive senza verificarle, ma a contestare solo quelle negative. Questo porta a una delega crescente al sistema AI anche in aree dove non dovrebbe avere l'ultima parola.

**Domande da farsi prima di automatizzare una decisione**:
- Cosa succede quando il sistema sbaglia? Chi ne paga le conseguenze?
- La persona interessata può contestare la decisione?
- C'è qualcuno che supervisiona attivamente il sistema?
- Il sistema funziona ugualmente bene per tutti i gruppi demografici?

## Responsabilità Professionale

Come sviluppatore, hai responsabilità specifiche:

**Documenta i limiti**: ogni sistema ha limitazioni. Documentale chiaramente, non nasconderle.

**Non costruire cose che non dovresti**: se ti viene chiesto di costruire un sistema di sorveglianza invasiva o un tool per manipolare le opinioni, puoi rifiutare.

**Segnala i problemi**: se vedi che un sistema che hai costruito sta causando danni, hai la responsabilità di segnalarlo internamente (e, se non viene ascoltato, valutare opzioni più drastiche).

**Aggiorna le tue conoscenze**: l'etica AI è un campo che evolve rapidamente. Il tuo giudizio professionale deve evolversi con esso.

## Un Framework Pratico

Prima di ogni deploy, chiediti:

```
1. CHI è impattato da questo sistema? Anche indirettamente?
2. COSA succede quando sbaglia? Quali sono i casi peggiori?
3. COME vengono trattati i dati degli utenti?
4. PERCHÉ questo sistema è necessario? Esiste un approccio alternativo meno rischioso?
5. CHI ha supervisione umana sul sistema in produzione?
```

Non devi avere risposte perfette. Devi avere risposto alle domande.

---

## Esercizi Pratici

> Tre esercizi a difficoltà crescente. Prova a risolverli da solo prima di aprire la soluzione.

### Esercizio 1 — Classificazione del Rischio 🟢 Base

Classifica questi sistemi AI secondo l'EU AI Act (inaccettabile / alto rischio / rischio limitato / rischio minimo) e giustifica la scelta:

1. Un chatbot per il customer support di un e-commerce
2. Un sistema AI che assiste nella diagnosi medica
3. Un tool che genera immagini realistiche di persone reali senza il loro consenso
4. Un sistema di raccomandazione dei film su Netflix
5. Un sistema AI usato da un tribunale per raccomandare la pena per un reato

<details>
<summary>💡 Mostra soluzione</summary>

1. **Rischio minimo** — customer support e-commerce. Nessun impatto significativo su diritti o sicurezza. Consigliabile comunque dichiarare che è un AI.

2. **Alto rischio** — assistenza diagnostica medica. Impatta direttamente sulla salute delle persone. Richiede audit, validazione clinica, supervisione medica obbligatoria.

3. **Inaccettabile o alto rischio** — dipende dall'uso: se usato per deepfake non consensuali o diffamazione, potenzialmente vietato. Comunque viola privacy e diritto all'immagine, soggetto a regolamentazioni stringenti.

4. **Rischio minimo** — raccomandazione film. Impatto limitato, nessun diritto fondamentale in gioco. (Ci sono considerazioni sull'echo chamber, ma non rientrano nella classificazione EU AI Act).

5. **Alto rischio** — sistema giudiziario. Impatta direttamente su libertà e diritti fondamentali. Deve essere trasparente, verificabile, e non può essere l'unica base della decisione. Il giudice umano deve mantenere l'autorità finale.

</details>

---

### Esercizio 2 — Audit di Bias 🟡 Intermedio

Hai un sistema AI che valuta i CV per posizioni tecniche. Hai questi dati di performance:

| Gruppo | CV inviati | CV selezionati | Tasso selezione |
|--------|-----------|----------------|-----------------|
| Uomini | 1.000 | 350 | 35% |
| Donne | 400 | 80 | 20% |
| Under 30 | 600 | 180 | 30% |
| Over 50 | 200 | 30 | 15% |

Analizza i dati, identifica dove c'è potenziale bias, e proponi 3 azioni concrete per investigare e mitigare il problema.

<details>
<summary>💡 Mostra soluzione</summary>

**Analisi**: il tasso di selezione varia significativamente tra gruppi. Le donne vengono selezionate al 20% vs 35% degli uomini (ratio 1:1.75). Gli over 50 al 15% vs 30% degli under 30 (ratio 1:2). Questi gap sono segnali di allarme che richiedono investigazione — non provano necessariamente bias, ma vanno spiegati.

**Azione 1 — Analisi delle features**: esamina quali caratteristiche del CV il modello usa maggiormente. Se usa parole come "fresco di laurea", "energico", o nomi di università recenti come proxy, potrebbe discriminare indirettamente per età. Se penalizza gap nel CV (comuni per chi ha fatto maternità/paternità), discrimina indirettamente per genere.

**Azione 2 — Blind review campionata**: prendi 100 CV rifiutati di donne e 100 rifiutati di uomini con qualifiche simili, e falli rivedere da revisori umani senza vedere il genere. Se i revisori umani accetterebbero una percentuale significativamente diversa, il bias è nel modello.

**Azione 3 — Retraining con fairness constraints**: se confermato il bias, riaddestra il modello con tecniche di fairness (es. adversarial debiasing, reweighting dei dati di training). Imposta metriche di fairness come obiettivo esplicito, non solo l'accuratezza media.

</details>

---

### Esercizio 3 — Dilemma Etico Reale 🔴 Avanzato

La tua azienda ti chiede di costruire un sistema AI che monitora le conversazioni dei dipendenti su Slack per rilevare "comportamenti a rischio" (potenziali dimissioni, bassa produttività, disallineamento culturale). Il sistema è tecnicamente fattibile. Analizza la situazione da più angolazioni (legale, etica, pragmatica, aziendale) e scrivi una risposta professionale al management con la tua raccomandazione motivata.

<details>
<summary>💡 Mostra soluzione</summary>

**Analisi legale**: nella maggior parte dei paesi europei, monitorare le comunicazioni private dei dipendenti richiede consenso esplicito e proporzionalità. Il GDPR vieta trattamenti invasivi senza base legale chiara. In molti casi questo sistema sarebbe illegale senza comunicazione trasparente ai dipendenti.

**Analisi etica**: il monitoraggio predittivo di "potenziali dimissioni" trasforma ogni comunicazione privata in dato di sorveglianza. Crea un ambiente di lavoro dove le persone non possono esprimersi liberamente, abbassa la fiducia, e tende a penalizzare le persone più critiche (che sono spesso quelle più valide).

**Analisi pragmatica**: i sistemi di questo tipo producono molti falsi positivi. Un dipendente che cerca lavoro altrove ma poi decide di restare viene flaggato. Uno che discute problemi familiari viene classificato come "a rischio". Le azioni basate su questi dati (es. non promuoverlo) possono portare a cause legali.

**Analisi aziendale**: le aziende con alta retention non sorvegliano i dipendenti — creano condizioni per cui i dipendenti vogliono restare.

**Raccomandazione al management**:

> "Ho analizzato la fattibilità del sistema richiesto. Dal punto di vista tecnico è realizzabile, ma ho seri dubbi sulla sua opportunità.
>
> Dal punto di vista legale, in Europa il monitoraggio delle comunicazioni private dei dipendenti senza consenso esplicito viola il GDPR e le normative sul lavoro. Raccomando una consulenza legale prima di procedere.
>
> Dal punto di vista del rischio aziendale, se il sistema dovesse diventare noto (e questi sistemi di solito lo diventano), il danno alla cultura e alla reputazione supererebbe qualsiasi beneficio.
>
> Propongo invece di investire gli stessi risorse in: survey periodici anonimi sul sentiment dei dipendenti, colloqui 1:1 strutturati, analisi delle cause delle dimissioni passate. Questi approcci sono legali, eticamente solidi, e statisticamente più predittivi della retention."

Questa è la risposta professionale: non un rifiuto secco, ma un'analisi completa con alternativa costruttiva.

</details>

---

## Connessioni

- **Capitolo 5**: [Sicurezza e Prompt Injection](../capitolo-05-agenti-architettura/05-07-sicurezza-prompt-injection) — sicurezza tecnica e sicurezza etica sono complementari
- **Capitolo 7**: [Human-in-the-Loop](../capitolo-07-workflow-multi-agente/07-04-human-in-the-loop) — la supervisione umana come risposta pratica ai rischi etici
- **Capitolo 8**: [Governance e Versioning](08-04-governance-versioning) — come le organizzazioni gestiscono la governance dei sistemi AI
- **Lezione successiva**: [Progetto Finale](08-05-progetto-finale) — applica i principi etici al tuo progetto capstone
