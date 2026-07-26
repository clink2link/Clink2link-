export async function onRequest(context){
return context.env.ASSETS.fetch(
new URL("/buy/index.html",context.request.url)
);
}
