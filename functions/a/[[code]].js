export async function onRequest(context){
return context.env.ASSETS.fetch(
new URL("/ads/index.html",context.request.url)
);
}
