(async()=>{

const shortCode=new URLSearchParams(location.search).get("code");

if(!shortCode){

document.body.innerHTML="<h2>Link tidak ditemukan.</h2>";

return;

}

const link=await database.getLinkByCode(shortCode);

if(!link){

document.body.innerHTML="<h2>404 - Link tidak ditemukan.</h2>";

return;

}

if(link.status!=="active"){

document.body.innerHTML="<h2>Link sudah tidak aktif.</h2>";

return;

}

// Simpan data link
sessionStorage.setItem("link_id",link.id);
sessionStorage.setItem("short_code",link.short_code);

// Pilih alur berdasarkan type
if(link.type==="ads"){

location.replace(`task1.html?id=${link.id}`);

return;

}

if(link.type==="sell"){

location.replace(`sell.html?id=${link.id}`);

return;

}

// Default
document.body.innerHTML="<h2>Tipe link tidak dikenali.</h2>";

})();
