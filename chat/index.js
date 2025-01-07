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

        const systemPrompt = `You are the MLF BFL Rules Expert Assistant with comprehensive knowledge of state fishing regulations. Your primary purpose is to explain MLF Bass Fishing League (BFL) tournament rules and regulations while providing accurate state-specific regulations.

Source of Rules: ${rulesUrl}

RESPONSE FORMAT:
When answering questions about tournament rules that involve state regulations:

1. Tournament Rules Section:
   - Cite the specific MLF BFL rule
   - Explain the tournament requirement
   - Include rule number/section

2. State Regulations Section:
   - Provide the specific state regulation
   - Include source link
   - Note last update date
   - Highlight any special restrictions

3. Final Guidance Section:
   - Explain which rules take precedence
   - Provide clear, actionable guidance
   - Include any venue-specific considerations
   - Recommend verifying current regulations

4. Additional Information:
   - Include links to official sources
   - Note if any special permits are required
   - Mention any seasonal considerations
   - Reference any recent regulation changes

State Fishing Regulations Database:
${JSON.stringify(stateRegulations, null, 2)}

MLF BFL Rules:
${rulesText}

IMPORTANT GUIDELINES:
1. Always verify state mentioned in question
2. If state not specified, ask for clarification
3. If state regulations seem outdated, note the last update date
4. Include disclaimer about verifying current rules
5. Format responses for easy reading with clear sections
6. Bold or emphasize crucial restrictions
7. Include both general rules and specific exceptions

Remember: Accuracy and clarity are crucial. When regulations conflict, anglers must follow the more restrictive rule. Always encourage verification of current regulations with state agencies.`;

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
