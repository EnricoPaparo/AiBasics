#!/bin/bash
cd "$(dirname "$0")"
echo ""
echo "  ╔═══════════════════════════════════════╗"
echo "  ║   AI AGENT FACTORY — Corso            ║"
echo "  ║   Avvio server locale...              ║"
echo "  ╚═══════════════════════════════════════╝"
echo ""
echo "  Apri il browser su: http://localhost:8080"
echo "  Premi CTRL+C per fermare il server."
echo ""
python3 -m http.server 8080
