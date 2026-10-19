---
name: run-plan
description: Orchestrator für autonome Plan-Läufe. Arbeitet eine Checkbox-Plan-Datei (z. B. docs/plans/overhaul.md) Task für Task mit je einem plan-worker-Subagenten (Sonnet) ab, prüft selbst nach, hakt ab, protokolliert. Nutzen, wenn der Nutzer einen Plan „laufen lassen“ / „abarbeiten“ will.
---

# Plan-Lauf (Orchestrator)

Argument: Pfad zur Plan-Datei (Standard `docs/plans/overhaul.md`). Du bist der einzige Orchestrator. Du schreibst selbst keinen Feature-Code; das tun Worker. Du sparst Tokens: kurze Prompts, kurze Antworten, nichts doppelt lesen.

## Grundsätze

- **Genau ein Worker gleichzeitig**, immer `subagent_type: "plan-worker"`, im Vordergrund (`run_in_background: false`). Keine anderen Agenten-Typen, keine Explore-/Review-Agenten, keine Workflows, kein `/loop`.
- **Der Plan ist der Zustand.** Nach einer Kontext-Kompaktierung liest du nur: Abschnitt „Status protocol“, die Checkbox-Zeilen (`grep -n '^- \[' <plan>`) und die letzten 5 Log-Zeilen. Nie den ganzen Plan in den Kontext laden, außer beim allerersten Start.
- **Nicht nachfragen.** Der Mensch schläft. Entscheidungen, die der Plan offen lässt: konservativ entscheiden und im Log begründen, oder den Task blockieren.
- Außenwirkung nur, wo der Plan sie erlaubt (P8.2: Push von `overhaul` + Staging-Deploy). Nie `main`/`shop` pushen, nie `deploy-server.yml`, nie `--no-verify`, nie bare `git stash`.

## Ablauf je Task

1. Nächsten Task bestimmen: erste Zeile `- [ ]`, deren `deps` alle `[x]` sind. Ist eine Dep `[!]`, Task als `- [!]` markieren (Log: `dep <ID> blocked`) und weiter.
2. `git status --porcelain` muss leer sein (sonst Reste auf `failed/<letzter-Task>` parken, siehe 6). `PRE=$(git rev-parse HEAD)` merken.
3. Worker starten (Prompt genau so knapp):
   `Task <ID> aus <plan>. Lies dort nur „Global rules“ und den Abschnitt von <ID>. Arbeite ihn ab, prüfe mit dem genannten verify-Modus, committe, berichte in ≤10 Zeilen.`
4. Bericht prüfen, dann selbst nachprüfen:
   - `git log --oneline $PRE..HEAD` (genau ein neuer Commit erwartet) und `git diff --stat $PRE..HEAD` (passt der Umfang zum Task? fremde Dateien?).
   - `scripts/verify.sh <modus aus dem Task>` (`quick`, `visual`, `backend`, `all`; bei `—` nur `quick`). Nur die PASS/FAIL-Zeilen lesen.
5. Grün → in der Plan-Datei `- [ ]` → `- [x]` und Kurz-SHA anhängen, Log-Zeile `YYYY-MM-DD HH:MM <ID> DONE <sha> — <≤12 Wörter>` anhängen, Follow-ups/Manuelles aus dem Bericht unter „Manual follow-ups“ eintragen. Plan-Datei mit `git add <plan> && git commit --amend --no-edit` in den Task-Commit aufnehmen.
6. Rot → **einmal** nachbessern lassen: `SendMessage` an denselben Worker mit den FAIL-Zeilen (max. 20 Zeilen). Danach erneut Schritt 4. Immer noch rot oder Worker meldet BLOCKED:
   - Arbeit parken: `git switch -c failed/<ID>` → `git add -A` → `git commit -m "wip(<ID>): failed attempt"` (falls etwas zu committen ist) → `git switch overhaul` → `git reset --hard $PRE` nur, wenn der Worker auf `overhaul` committet hatte (sein Commit ist dann über `failed/<ID>` noch erreichbar; vorher `git branch -f failed/<ID> <worker-sha>` falls nötig).
   - Plan: `- [!]`, Log mit Grund (≤20 Wörter) und Branch-Name. Commit `chore(plan): <ID> blocked`.
7. Weiter mit dem nächsten Task. Nach jeder abgeschlossenen Phase (P1, P2, …) eine Zeile Zwischenstand ausgeben (erledigt/blockiert/offen), sonst keine Prosa.

## Visual-Tasks

- Re-Baselining (`scripts/verify.sh baseline`) nur, wenn der Task es ausdrücklich erlaubt, und nur durch den Worker. Du prüfst danach, dass die im Bericht genannten Keys zum erlaubten Umfang passen; sonst wie Rot behandeln.
- Flaky-Verdacht (Diff auf einer Seite, die der Task nicht berührt): einmal `scripts/verify.sh visual` wiederholen. Bleibt es, wie Rot behandeln.

## Grenzen

- Usage-Limit: einfach weiterarbeiten lassen; Claude Code wartet und setzt automatisch fort. Nach der Fortsetzung mit Schritt 1 neu einsteigen (Plan ist der Zustand).
- Ein Task, der nach Bericht und Diff offensichtlich den Plan falsch verstanden hat (falsche Dateien, Logik geändert, wo nur Markup erlaubt war): wie Rot behandeln, nicht „retten“.
- Fertig, wenn keine `- [ ]` mehr übrig sind (alles `[x]` oder `[!]`). Dann P8.3 ist erledigt oder blockiert; letzte Ausgabe: Zusammenfassung in ≤15 Zeilen inkl. Pfad zum Report.
