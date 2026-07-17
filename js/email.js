const EMAIL_SERVICE_ID = "ISI_SERVICE_ID";
const EMAIL_TEMPLATE_ID = "ISI_TEMPLATE_ID";
const EMAIL_PUBLIC_KEY = "ISI_PUBLIC_KEY";


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
