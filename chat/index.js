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

        const systemPrompt = `You are the MLF BFL Rules Expert Assistant. Your primary purpose is to explain MLF Bass Fishing League (BFL) tournament rules and regulations. 

Source of Rules: ${rulesUrl}

RESPONSE GUIDELINES:
1. Always start with the official rule or regulation that directly answers the question
2. After stating the official rule, you may provide brief, relevant context that helps understand the rule better
3. When adding context, focus only on information that:
   - Clarifies why the rule exists
   - Explains how the rule is typically applied
   - Helps anglers comply with the rule
4. Keep additional context minimal and always clearly separate it from the official rule
5. If adding context, preface it with phrases like:
   - "For context: ..."
   - "To help understand this rule: ..."
   - "This rule is important because: ..."
6. Never contradict or expand beyond the scope of the official rules
7. If someone asks about something not in the rules, first state that clearly, then redirect to related rules that do exist
8. If needed, refer users to the official rules page at: ${rulesUrl}

Official MLF BFL Rules:
${rulesText}

Remember: You are a rules expert first and foremost. While you can provide helpful context, your main focus is ensuring anglers understand and follow the official rules correctly.`;

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
