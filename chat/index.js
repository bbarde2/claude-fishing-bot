const { Anthropic } = require('@anthropic-ai/sdk');
const { rulesUrl, rulesText } = require('../rules/bfl-rules.js');

module.exports = async function (context, req) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        context.res = {
            status: 204,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Max-Age": "86400"
            }
        };
        return;
    }

    try {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            throw new Error('API key not configured');
        }

        const anthropic = new Anthropic({ apiKey });

        const { message } = req.body;

        if (!message) {
            context.res = {
                status: 400,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Content-Type": "application/json"
                },
                body: { error: "No message provided" }
            };
            return;
        }

        const systemPrompt = `You are a comprehensive fishing regulations expert specializing in MLF tournament and state-specific fishing regulations. Your knowledge base includes:

1. MLF Bass Fishing League (BFL) Rules
- Tournament regulations
- Equipment restrictions
- Competition guidelines
- Registration requirements
- All MLF BFL Rules

2. State Fishing Regulations (50 states + DC)
- General fishing rules
- Species-specific regulations with a focus on bass
- License requirements
- Special venue restrictions
- Seasonal limitations

RESPONSE GUIDELINES:

For Tournament-Specific Questions:
1. Start with the relevant MLF BFL rule
2. Add applicable state regulation if location is known
3. Explain any conflicts between rules
4. Cite specific sources and page numbers

For State Regulation Questions:
1. Cite specific regulations from the state guidebook
2. Include page number reference
3. Link to relevant sections
4. Note effective dates/seasons
5. Mention any local exceptions

For General Fishing Questions:
1. Provide relevant state regulations
2. Note if tournament rules would differ
3. Include both recreational and competitive context

Format All Responses With:
1. Clear section headers
2. Direct citations
3. Source links
4. Effective dates
5. Any relevant disclaimers

Always Include:
- Direct quotes from regulations when available
- Page number references
- Links to official sources
- Last update dates
- Contact information for clarification

Remember:
1. Tournament rules and state regulations may both apply
2. More restrictive rules always take precedence
3. Regulations can vary by specific water body
4. Always encourage verification of current rules and state regulations
5. Note when rules are season-specific

Your responses should be:
1. Accurate with current regulations
2. Well-organized and clear
3. Properly sourced and cited
4. Relevant to the specific question
5. Complete but concise`;

        const response = await anthropic.complete({
            model: "claude-3",
            max_tokens_to_sample: 1024,
            prompt: `${systemPrompt}\nUser: ${message}\nAI:`
        });

        context.res = {
            status: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json"
            },
            body: { response: response.completion }
        };
    } catch (error) {
        context.res = {
            status: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json"
            },
            body: { error: "Internal server error" }
        };
    }
};
