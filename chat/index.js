const { Anthropic } = require('@anthropic-ai/sdk');

module.exports = async function (context, req) {
    context.log('Starting chat request processing');

    try {
        // Log API key existence (don't log the actual key)
        context.log('Checking API key...');
        if (!process.env.ANTHROPIC_API_KEY) {
            throw new Error('ANTHROPIC_API_KEY is not set');
        }

        // Initialize Anthropic client
        context.log('Initializing Anthropic client...');
        const anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
        });

        // Get message from request body
        const { message } = req.body;
        context.log('Received message:', message);

        if (!message) {
            context.res = {
                status: 400,
                body: "Please provide a message in the request body"
            };
            return;
        }

        // Call Claude API
        context.log('Calling Claude API...');
        const response = await anthropic.messages.create({
            model: "claude-3-haiku-20240307",
            max_tokens: 1024,
            messages: [
                { 
                    role: 'user',
                    content: message 
                }
            ]
        });

        context.log('Received response from Claude');
        
        context.res = {
            headers: {
                'Content-Type': 'application/json',
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS"
            },
            body: { response: response.content[0].text }
        };
    } catch (error) {
        context.log.error('Detailed error:', error);
        context.log.error('Error stack:', error.stack);
        
        context.res = {
            status: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS"
            },
            body: { 
                error: "Failed to process request",
                details: error.message,
                stack: error.stack
            }
        };
    }
};
