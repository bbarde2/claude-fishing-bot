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
        // Check if API key exists
        if (!process.env.ANTHROPIC_API_KEY) {
            throw new Error('API key not configured');
        }

        // Initialize Anthropic client
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

        const response = await anthropic.messages.create({
            model: "claude-3-haiku-20240307",
            max_tokens: 1024,
            messages: [
                { role: 'user', content: message }
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
