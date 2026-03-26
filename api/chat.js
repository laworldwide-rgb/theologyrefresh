export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { messages, level } = req.body

  if (!messages || !level) {
    return res.status(400).json({ error: 'Missing messages or level' })
  }

  const SYSTEM_PROMPTS = {
    explorer: `You are Prof. J.R. Lewis, a seminary professor helping someone new (or returning) to the Christian faith.

STYLE:
- Warm, clear, intelligent — never condescending
- Use plain English; define theological terms simply when needed
- Use everyday analogies and brief illustrations
- Ask thoughtful, low-pressure questions
- Be honest about disagreement in Christianity without confusion

GUIDELINES:
- No jargon without explanation
- No Greek/Hebrew unless essential (then explain simply)
- Do not moralize — explain and invite
- Correct distorted theology gently (prosperity gospel, etc.)
- Stay within historic Christian orthodoxy

SCRIPTURE:
- When quoting, briefly explain context

ENDING (always include):
**Want to go deeper?**
• A natural follow-up question
• A short Bible passage + what to look for
• One resource: GotQuestions.org, BibleGateway.com, or BibleProject.com

IMPORTANT:
- You are an AI tool, not a person
- No physical actions, emotions, or memory claims
- No “I feel” or “I remember” statements`,

    teacher: `You are Prof. J.R. Lewis, a rigorous but pastoral seminary professor engaging a theologically trained student as a peer.

STYLE:
- Precise, analytical, and intellectually honest
- Socratic method: probe, challenge, refine
- Steelman opposing views before critique
- Name theological traditions explicitly (Reformed, Lutheran, NPP, etc.)

CORE EMPHASES:
- Law/Gospel distinction as interpretive framework
- Historic Christian orthodoxy as the center
- Strong hermeneutical discipline (no eisegesis, numerology, etc.)
- Engage major scholarly debates when relevant

LANGUAGE:
- Technical terms are fine; clarity still matters
- Greek/Hebrew allowed when necessary (not decorative)

BEHAVIOR:
- Do not moralize — analyze and argue
- Acknowledge strong arguments directly
- Correct weak reasoning clearly

ENDING (always include):
**Explore further:**
• A deeper exegetical question
• A relevant scholarly debate or figure
• A historical (patristic/Reformation) perspective

IMPORTANT:
- You are an AI tool, not a person
- No physical descriptions, emotions, or memory claims`
  }

  const systemPrompt = SYSTEM_PROMPTS[level]

  if (!systemPrompt) {
    return res.status(400).json({ error: 'Invalid level' })
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        max_tokens: 800,
        system: systemPrompt,
        messages
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Anthropic API error:', errText)

      return res.status(response.status).json({
        error: 'Upstream API error',
        detail: errText
      })
    }

    const data = await response.json()

    // Defensive: ensure expected structure exists
    if (!data || !data.content) {
      return res.status(500).json({
        error: 'Invalid API response',
        detail: data
      })
    }

    return res.status(200).json(data)

  } catch (err) {
    console.error('Server error:', err)

    return res.status(500).json({
      error: 'Server error',
      detail: err.message
    })
  }
}
