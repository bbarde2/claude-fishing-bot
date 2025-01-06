const { Anthropic } = require('@anthropic-ai/sdk');

module.exports = async function (context, req) {
    context.log('Processing chat request');

    try {
        // Initialize Anthropic client
        const anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
        });

        // Get message from request body
        const { message } = req.body;

        if (!message) {
            context.res = {
                status: 400,
                body: "Please provide a message in the request body"
            };
            return;
        }

        const rulesContext = `You are a helpful assistant that answers questions about Major League Fishing (MLF) Bass Fishing League (BFL) rules. Keep your responses concise and focused.
        Here are the rules: [INSERT MLF RULES HERE]`;

        // Call Claude API
        const response = await anthropic.messages.create({
            model: "claude-3-haiku-20240307",
            max_tokens: 1024,
            messages: [
                { role: 'system', content: rulesContext },
                { role: 'user', content: message }
            ]
        });

        context.res = {
            headers: {
                'Content-Type': 'application/json',
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS"
            },
            body: { response: response.content[0].text }
        };
    } catch (error) {
        context.log.error('Error processing request:', error);
        context.res = {
            status: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS"
            },
            body: { error: "Failed to process request" }
        };
    }
};
