const { Anthropic } = require('@anthropic-ai/sdk');
const { rulesUrl, rulesText } = require('../rules/bfl-rules.js');

module.exports = async function (context, req) {
    context.log('Function starting...');
    
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
        if (!process.env.ANTHROPIC_API_KEY) {
            throw new Error('API key not configured');
        }

        const anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
        });

        const { message } = req.body;
        context.log('Received message:', message);
        
        if (!message) {
            context.res = {
                status: 400,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "POST, OPTIONS",
                    "Content-Type": "application/json"
                },
                body: { error: "No message provided" }
            };
            return;
        }

        const systemPrompt = `You are a comprehensive fishing regulations expert, specializing in both MLF tournament rules and state-specific fishing regulations. Your knowledge base includes:

1. MLF Bass Fishing League (BFL) Rules
- Tournament regulations
- Equipment restrictions
- Competition guidelines
- Registration requirements
- All MLF BFL Rules

2. State Fishing Regulations (50 states + DC)
- General fishing rules
- Species-specific regulations
- License requirements
- Special venue restrictions
- Seasonal limitations

RESPONSE GUIDELINES:

For Tournament-Specific Questions:
1. Start with the relevant MLF BFL rule
2. Add applicable state regulation if location is mentioned
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
        
        // Updated API call format
        const response = await anthropic.messages.create({
            model: "claude-3-haiku-20240307",
            max_tokens: 1024,
            system: systemPrompt,
            messages: [
                { 
                    role: 'user',
                    content: message 
                }
            ]
        });

        context.res = {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS"
            },
            body: { response: response.content[0].text }
        };
    } catch (error) {
        context.log.error('Error details:', error);
        
        context.res = {
            status: 500,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS"
            },
            body: { 
                error: "Internal server error",
                details: error.message,
                stack: error.stack
            }
        };
    }
};
