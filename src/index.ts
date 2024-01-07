import { Router } from 'itty-router';
import { Ai } from '@cloudflare/ai';
import { createCors } from 'itty-cors'

const { preflight, corsify } = createCors()

const router = Router();

router.all('*', preflight);

router.post('/chat', async (request, env) => {
	const { messages } = await request.json();

	// validate body
	if (!messages)
		return new Response('Messages are required', { status: 400 });
	if (!Array.isArray(messages))
		return new Response('Messages must be an array', { status: 400 });

	for (const message of messages) {
		if (Object.keys(message).length !== 2)
			return new Response('Message must have only two keys, "role" and "content"', { status: 400 });
		if (message.role !== 'assistant' && message.role !== 'user' && message.role !== 'system')
			return new Response('Message role must be "assistant", "system" or "user"', { status: 400 });
		if (typeof message.content !== 'string')
			return new Response('Message content is required and must be a string', { status: 400 });
	}

	const ai = new Ai(env.AI);

	const response = await ai.run('@cf/meta/llama-2-7b-chat-int8', { messages });

	return Response.json(response);
});

router.post('/image', async (request, env) => {
	const { prompt } = await request.json();

	if (!prompt && typeof prompt !== 'string')
		return new Response('Prompt is required and must be a string');
	if (prompt.length < 1)
		return new Response('Prompt is required and must be a string');

	const ai = new Ai(env.AI);
	const response = await ai.run(
		'@cf/stabilityai/stable-diffusion-xl-base-1.0',
		{ prompt }
	);

	return new Response(response, {
		headers: {
			'content-type': 'image/png'
		}
	});
});

// 404 for everything else
router.all('*', () => new Response('Not Found.', { status: 404 }));

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		return router.handle(request, env).then(corsify);
	}
}