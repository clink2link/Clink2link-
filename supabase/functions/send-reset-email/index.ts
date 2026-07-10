import { serve } from "https://deno.land/std/http/server.ts";


serve(async (req)=>{


const {
email,
token
}=await req.json();



const resetLink =
`https://click2pay.my.id/reset-password.html?token=${token}`;


await fetch(
"https://api.resend.com/emails",
{

method:"POST",

headers:{

"Authorization":
`Bearer ${Deno.env.get("RESEND_KEY")}`,

"Content-Type":
"application/json"

},


body:JSON.stringify({

from:
"Click2Pay <noreply@click2pay.my.id>",


to:[
email
],


subject:
"Reset Password Click2Pay",


html:
`

<h2>Reset Password Click2Pay</h2>

<p>Klik tombol berikut:</p>

<a href="${resetLink}">
Reset Password
</a>

<p>
Link berlaku 1 jam.
</p>

`

})

});


return new Response(
"Email sent"
);


});
