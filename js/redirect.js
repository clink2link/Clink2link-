(async()=>{

const shortCode=location.pathname.split("/").pop();

if(!shortCode){

document.body.innerHTML="<h2>Link tidak ditemukan.</h2>";

return;

}

const link=await database.getLinkByCode(shortCode);

if(!link){

document.body.innerHTML="<h2>404 - Link tidak ditemukan.</h2>";

return;

}

location.replace(
link.destination_url||link.destination
);

})();
