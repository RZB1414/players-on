export default {
    fetch(request, env, ctx) {
        return new Response("Players On API running (JS)", {
            headers: { "content-type": "text/plain" }
        });
    }
};
