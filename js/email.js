const EMAIL_SERVICE_ID = "Clink2link";
const EMAIL_TEMPLATE_ID = "template_8k3r8zl";
const EMAIL_PUBLIC_KEY = "ibyL8v-c7knw1zRS9";


async function sendResetEmail(
email,
resetLink
){


await emailjs.send(
EMAIL_SERVICE_ID,
EMAIL_TEMPLATE_ID,
{

to_email:email,

reset_link:resetLink,

app_name:"Click2Pay"

},

EMAIL_PUBLIC_KEY

);


}
