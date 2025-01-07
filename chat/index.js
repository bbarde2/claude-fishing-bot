const { Anthropic } = require('@anthropic-ai/sdk');

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

        const { message, state } = req.body;
        context.log('Received message:', message, 'State:', state);
        
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

        let systemPrompt = `You are an expert on both MLF Bass Fishing League (BFL) tournament rules and state fishing regulations. Follow these guidelines:

1. For tournament questions:
   - Cite specific MLF BFL rules
   - Explain requirements clearly
   - Note any regional variations

2. For state-specific questions:
   - Reference current state regulations
   - Note license requirements
   - Mention any special restrictions

3. When rules overlap:
   - Explain both tournament and state requirements
   - Clarify which rules take precedence
   - Recommend following the more restrictive rule

4. Always:
   - Be concise but thorough
   - Use simple, clear language
   - Cite sources when possible
   - Recommend verifying current rules

Remember: Tournament rules and state regulations can both apply. When in doubt, anglers should follow the more restrictive rules and verify current regulations.`;

        if (state) {
            systemPrompt += `\n\nThe user is asking about regulations in ${state}. Include relevant information about ${state}'s fishing regulations in your response.`;
        }

        const response = await anthropic.messages.create({
            model: "claude-3-5-sonnet-20241022",
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
