export async function onRequest(context){

const code=context.params.code;

if(!code){

return new Response("Link tidak ditemukan.",{
status:404
});

}

return Response.redirect(
`/s/index.html?code=${encodeURIComponent(code)}`,
302
);

}
