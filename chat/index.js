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

        let systemPrompt = `You are the MLF BFL Rules Expert Assistant. Your primary purpose is to explain MLF Bass Fishing League (BFL) tournament rules and regulations.`;

        if (state) {
            systemPrompt += ` You also provide information about fishing regulations for ${state}.`;
        }

        systemPrompt += `\n\nWhen answering:
1. Be clear and specific
2. Cite sources when possible
3. If discussing state regulations, mention that anglers should verify current rules
4. Focus on tournament rules and any relevant state regulations
5. Keep responses concise but complete`;

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
