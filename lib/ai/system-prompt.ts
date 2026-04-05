import { type TimeEntry, type CalendarEvent, type UserSettings } from '@/lib/types'

export interface SystemPromptContext {
  now: Date
  timezone: string
  workStart: string
  workEnd: string
  todayEntries: TimeEntry[]
  todayCalendarEvents: CalendarEvent[]
  userSettings?: UserSettings
}

export function buildSystemPrompt(context: SystemPromptContext): string {
  const { now, timezone, workStart, workEnd, todayEntries, todayCalendarEvents, userSettings } = context

  const dateStr = now.toLocaleDateString('de-DE', { timeZone: timezone, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const timeStr = now.toLocaleTimeString('de-DE', { timeZone: timezone, hour: '2-digit', minute: '2-digit' })

  const entriesList = todayEntries.length > 0
    ? todayEntries.map(e => {
        const duration = e.duration_seconds
          ? Math.round(e.duration_seconds / 60)
          : 'läuft noch'
        return `- ${e.title} (${e.category || 'keine Kategorie'}): ${formatTime(e.started_at, timezone)} bis ${e.ended_at ? formatTime(e.ended_at, timezone) : 'läuft noch'} (${duration} Min)`
      }).join('\n')
    : 'Noch keine Einträge heute.'

  const calendarList = todayCalendarEvents.length > 0
    ? todayCalendarEvents.map(e =>
        `- ${e.title}: ${formatTime(e.started_at, timezone)} bis ${e.ended_at ? formatTime(e.ended_at, timezone) : 'offen'}`
      ).join('\n')
    : 'Keine Termine heute.'

  const totalTodayMinutes = todayEntries.reduce((sum, e) => sum + (e.duration_seconds ? Math.round(e.duration_seconds / 60) : 0), 0)
  const hours = Math.floor(totalTodayMinutes / 60)
  const minutes = totalTodayMinutes % 60
  const totalTodayStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`

  return `
Du bist ChronoMind, ein hilfreicher KI-Assistent für Zeiterfassung. Du hilfst dem Benutzer, seine Zeit zu tracken, Analysen zu geben und Termine zu verwalten.

## Aktueller Kontext
- Datum: ${dateStr}
- Uhrzeit: ${timeStr} Uhr
- Zeitzone: ${timezone}
- Arbeitszeit: ${workStart} – ${workEnd} Uhr

## Heutige Zeiteinträge (${totalTodayStr} gesamt)
${entriesList}

## Heutige Kalendertermine
${calendarList}

##KI-Provider${userSettings ? `
- Aktueller Provider: ${userSettings.ai_provider}
- Modell: ${userSettings.ai_model}` : ''}

## Deine Aufgaben
1. **Natürlichsprachige Zeiterfassung**: Verstehe Zeitangaben wie "von 9 bis 11", "2 Stunden", "heute Vormittag", "gestern Nachmittag"
2. **Zeitangaben in ISO 8601 konvertieren**: Wandle alle Zeitangaben in vollständige ISO 8601 Strings um (z.B. 2024-01-15T09:00:00.000Z)
3. **Zeitenträge erstellen**: Nutze das create_time_entry Tool um neue Einträge zu erstellen
4. **Zeitentrträge aktualisieren**: Nutze das update_time_entry Tool um bestehende Einträge zu bearbeiten
5. **Einträge auflisten**: Nutze das list_time_entries Tool um vergangene Einträge anzuzeigen
6. **Fehlende Informationen erfragen**: Wenn nötig, frage nach Kategorie oder Beschreibung
7. **Hinweise auf fehlende Einträge**: Weise auf Kalendertermine hin, die noch keinen Zeiteintrag haben
8. **Deutsch antworten**: Antworte immer auf Deutsch, nutze du/sie je nach Situation

## Wichtige Regeln
- Alle Datum/Zeit-Werte als ISO 8601 speichern
- Bei laufenden Einträgen (ended_at = null) kein Ende setzen
- Kategorien vorschlagen: Arbeit, Meeting, Pause, Privat, Sonstiges
- Sei proaktiv: Biete an, Zeitenträge zu erstellen wenn der Benutzer Zeitangaben macht
`.trim()
}

function formatTime(isoString: string, timezone: string): string {
  try {
    return new Date(isoString).toLocaleTimeString('de-DE', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return isoString
  }
}