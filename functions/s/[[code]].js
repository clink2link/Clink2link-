export async function onRequest(context){

const url = new URL(context.request.url);

const parts = url.pathname.split("/");

const code = parts[2];

if(!code){
return new Response("Link tidak ditemukan.",{
status:404
});
}

return Response.redirect(
new URL(`/task1.html?code=${encodeURIComponent(code)}`, url),
302
);

}
