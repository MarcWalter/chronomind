import 'server-only'
import { StreamingTextResponse, convertToCoreMessage, generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createMistral } from '@ai-sdk/mistral'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/lib/db_types'

import { auth } from '@/auth'
import { nanoid } from '@/lib/utils'
import { buildSystemPrompt } from '@/lib/ai/system-prompt'
import { createTimeEntryTool } from '@/lib/ai/tools/create-time-entry'
import { listTimeEntriesTool } from '@/lib/ai/tools/list-time-entries'
import { updateTimeEntryTool } from '@/lib/ai/tools/update-time-entry'
import { createClient } from '@supabase/supabase-js'
import { type UserSettings, type TimeEntry, type CalendarEvent } from '@/lib/types'

export const runtime = 'edge'

// Provider erstellen
function getAIProvider(userSettings: UserSettings | null) {
  if (userSettings?.ai_provider === 'routerlab') {
    return createOpenAI({
      baseURL: userSettings.routerlab_base_url || process.env.ROUTERLAB_BASE_URL,
      apiKey: userSettings.ai_api_key_routerlab || process.env.ROUTERLAB_API_KEY
    })
  }
  // Default: Mistral
  return createMistral({
    apiKey: userSettings?.ai_api_key_mistral || process.env.MISTRAL_API_KEY
  })
}

function getModel(userSettings: UserSettings | null): string {
  return userSettings?.ai_model || 'mistral-large-latest'
}

// Heutige Einträge laden
async function getTodayEntries(supabase: any, userId: string): Promise<TimeEntry[]> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const { data } = await supabase
    .from('time_entries')
    .select('*')
    .eq('user_id', userId)
    .gte('started_at', today.toISOString())
    .lt('started_at', tomorrow.toISOString())
    .order('started_at', { ascending: false })

  return data || []
}

// User Settings laden
async function getUserSettings(supabase: any, userId: string): Promise<UserSettings | null> {
  const { data } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single()

  return data
}

export async function POST(req: Request) {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookieStore
  })
  const json = await req.json()
  const { messages } = json

  const session = await auth({ cookieStore })

  if (!session?.user) {
    return new Response('Unauthorized', {
      status: 401
    })
  }

  const userId = session.user.id

  // Settings und Einträge laden für den System Prompt
  const userSettings = await getUserSettings(supabase, userId)
  const todayEntries = await getTodayEntries(supabase, userId)

  // System Prompt bauen
  const systemPrompt = buildSystemPrompt({
    now: new Date(),
    timezone: userSettings?.timezone || 'Europe/Berlin',
    workStart: userSettings?.work_day_start || '08:00',
    workEnd: userSettings?.work_day_end || '18:00',
    todayEntries,
    todayCalendarEvents: [], // TODO: Kalender-Integration
    userSettings
  })

  // AI Provider und Model
  const provider = getAIProvider(userSettings)
  const model = getModel(userSettings)

  // Chat-Verlauf für Tools vorbereiten
  const coreMessages = convertToCoreMessage(messages)

  // Text generieren mit Tools
  const result = await generateText({
    model: provider(model),
    system: systemPrompt,
    messages: coreMessages,
    tools: {
      create_time_entry: createTimeEntryTool,
      list_time_entries: listTimeEntriesTool,
      update_time_entry: updateTimeEntryTool
    },
    maxSteps: 5
  })

  // Chat in DB speichern
  const id = json.id ?? nanoid()
  const title = messages[0]?.content?.substring(0, 100) || 'Neuer Chat'
  const createdAt = Date.now()
  const path = `/chat/${id}`

  const payload = {
    id,
    title,
    userId,
    createdAt,
    path,
    messages: [
      ...messages,
      {
        content: result.text,
        role: 'assistant'
      }
    ]
  }

  await supabase.from('chats').upsert({ id, payload }).throwOnError()

  // Stream response
  const { text, finishReason, steps } = result

  // Bei tool calls die Ergebnisse einbeziehen
  let responseContent = text

  if (steps && steps.length > 0) {
    const toolCalls = steps.flatMap((step: any) => step.toolCalls || [])
    if (toolCalls.length > 0) {
      // Tool-Ergebnisse wurden bereits in den Text einbezogen
      // Wir geben den finalen Text zurück
    }
  }

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()
      controller.enqueue(encoder.encode(responseContent))
      controller.close()
    }
  })

  return new StreamingTextResponse(stream)
}