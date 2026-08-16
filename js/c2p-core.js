
"use strict";
window.C2P = window.C2P || {};
(function(){
 const dict={
  "Dashboard":"Dashboard","Home":"Home","Login":"Login","Register":"Register","Sign Up":"Sign Up",
  "Logout":"Logout","Settings":"Settings","Profile":"Profile","Notifications":"Notifications","Referral":"Referral",
  "History":"History","Activity":"Activity","Withdraw":"Withdraw","Payment Settings":"Payment Settings",
  "Premium":"Premium","My Links":"My Links","Create Link":"Create Link","Sell Link":"Sell Link",
  "Get Started":"Get Started","Learn More":"Learn More","Features":"Features","Pricing":"Pricing",
  "Earnings":"Earnings","Balance":"Balance","Total Views":"Total Views","Total Clicks":"Total Clicks",
  "Today's Earnings":"Today's Earnings","Monthly Earnings":"Monthly Earnings","Total Earnings":"Total Earnings",
  "Ads":"Ads","Sell":"Sell","Users":"Users","Admin Panel":"Admin Panel","Recent Activity":"Recent Activity",
  "No notifications yet.":"No notifications yet.","No referrals yet":"No referrals yet",
  "Copy":"Copy","Save":"Save","Cancel":"Cancel","Delete":"Delete","Confirm":"Confirm","Back":"Back",
  "Change Password":"Change Password","Language":"Language","Theme":"Theme","Dark Mode":"Dark Mode",
  "Light Mode":"Light Mode","English":"English","Indonesian":"Indonesian","Account":"Account",
  "Add Account":"Add Account","Switch Account":"Switch Account","Delete Account":"Delete Account",
  "Upgrade Premium":"Upgrade Premium","Premium Active":"Premium Active","Free Plan":"Free Plan",
  "Create":"Create","Search":"Search","Status":"Status","Pending":"Pending","Success":"Success","Failed":"Failed",
  "Active":"Active","Inactive":"Inactive","Price":"Price","Views":"Views","Clicks":"Clicks",
  "Welcome back":"Welcome back","Create your account":"Create your account","Email":"Email","Username":"Username",
  "Password":"Password","Forgot password?":"Forgot password?","Verify your email":"Verify your email",
  "Reset Password":"Reset Password","Save Changes":"Save Changes","Delete Account":"Delete Account",
  "No data available":"No data available","Loading...":"Loading...","Please wait...":"Please wait...",
  "Referral Link":"Referral Link","Total Referrals":"Total Referrals","Referral Bonus":"Referral Bonus",
  "Transactions":"Transactions","Wallet":"Wallet","Payment":"Payment","Withdrawals":"Withdrawals",
  "Manage your account":"Manage your account","Security":"Security","Preferences":"Preferences",
  "Account Management":"Account Management","Appearance":"Appearance","Choose language":"Choose language",
  "Monthly":"Monthly","per month":"per month","50% discount":"50% discount",
  "Ad-free Ads Links":"Ad-free Ads Links","Premium benefits":"Premium benefits",
  "Processing...":"Processing...","Payment successful":"Payment successful","Payment pending":"Payment pending"
 };
 const id={
  "Dashboard":"Dasbor","Home":"Beranda","Login":"Masuk","Register":"Daftar","Sign Up":"Daftar","Logout":"Keluar",
  "Settings":"Pengaturan","Profile":"Profil","Notifications":"Notifikasi","Referral":"Referral","History":"Riwayat",
  "Activity":"Aktivitas","Withdraw":"Penarikan","Payment Settings":"Pengaturan Pembayaran","Premium":"Premium",
  "My Links":"Link Saya","Create Link":"Buat Link","Sell Link":"Sell Link","Get Started":"Mulai Sekarang",
  "Learn More":"Pelajari Selengkapnya","Features":"Fitur","Pricing":"Harga","Earnings":"Penghasilan","Balance":"Saldo",
  "Total Views":"Total View","Total Clicks":"Total Klik","Today's Earnings":"Penghasilan Hari Ini",
  "Monthly Earnings":"Penghasilan Bulanan","Total Earnings":"Total Penghasilan","Ads":"Iklan","Sell":"Jual",
  "Users":"Pengguna","Admin Panel":"Panel Admin","Recent Activity":"Aktivitas Terbaru","No notifications yet.":"Belum ada notifikasi.",
  "No referrals yet":"Belum ada referral","Copy":"Salin","Save":"Simpan","Cancel":"Batal","Delete":"Hapus","Confirm":"Konfirmasi",
  "Back":"Kembali","Change Password":"Ganti Password","Language":"Bahasa","Theme":"Tema","Dark Mode":"Mode Gelap",
  "Light Mode":"Mode Terang","English":"Inggris","Indonesian":"Indonesia","Account":"Akun","Add Account":"Tambah Akun",
  "Switch Account":"Ganti Akun","Delete Account":"Hapus Akun","Upgrade Premium":"Upgrade Premium","Premium Active":"Premium Aktif",
  "Free Plan":"Paket Gratis","Create":"Buat","Search":"Cari","Status":"Status","Pending":"Menunggu","Success":"Berhasil",
  "Failed":"Gagal","Active":"Aktif","Inactive":"Tidak Aktif","Price":"Harga","Views":"View","Clicks":"Klik",
  "Welcome back":"Selamat datang kembali","Create your account":"Buat akun kamu","Email":"Email","Username":"Username",
  "Password":"Password","Forgot password?":"Lupa password?","Verify your email":"Verifikasi email kamu",
  "Reset Password":"Reset Password","Save Changes":"Simpan Perubahan","No data available":"Tidak ada data",
  "Loading...":"Memuat...","Please wait...":"Mohon tunggu...","Referral Link":"Link Referral","Total Referrals":"Total Referral",
  "Referral Bonus":"Bonus Referral","Transactions":"Transaksi","Wallet":"Dompet","Payment":"Pembayaran","Withdrawals":"Penarikan",
  "Manage your account":"Kelola akun kamu","Security":"Keamanan","Preferences":"Preferensi","Account Management":"Manajemen Akun",
  "Appearance":"Tampilan","Choose language":"Pilih bahasa","Monthly":"Bulanan","per month":"per bulan","50% discount":"Diskon 50%",
  "Ad-free Ads Links":"Link Ads tanpa iklan","Premium benefits":"Keuntungan Premium","Processing...":"Memproses...",
  "Payment successful":"Pembayaran berhasil","Payment pending":"Pembayaran menunggu"
 };
 const id2en={};
 Object.keys(id).forEach(k=>{id2en[id[k]]=k});
 Object.assign(id2en,{
   "Berhasil":"Success","Peringatan":"Warning","Tutup":"Close","Gagal":"Failed","Memuat...":"Loading...",
   "Mohon tunggu...":"Please wait...","Tidak ada data":"No data available","Belum ada notifikasi":"No notifications yet.",
   "Belum ada referral":"No referrals yet","Salin":"Copy","Simpan":"Save","Batal":"Cancel","Hapus":"Delete",
   "Konfirmasi":"Confirm","Kembali":"Back","Ganti Password":"Change Password","Bahasa":"Language","Mode Gelap":"Dark Mode",
   "Mode Terang":"Light Mode","Indonesia":"Indonesian","Akun":"Account","Tambah Akun":"Add Account","Ganti Akun":"Switch Account",
   "Hapus Akun":"Delete Account","Pengaturan":"Settings","Profil":"Profile","Notifikasi":"Notifications","Riwayat":"History",
   "Aktivitas":"Activity","Penarikan":"Withdraw","Penghasilan":"Earnings","Saldo":"Balance","Pengguna":"Users",
   "Transaksi":"Transactions","Pembayaran":"Payment","Dompet":"Wallet","Jual":"Sell","Iklan":"Ads","Buat Link":"Create Link"
 });
 function lang(){return localStorage.getItem("language")||"en";}
 function applyTheme(){
   const t=localStorage.getItem("theme")||"light";
   document.documentElement.classList.toggle("dark",t==="dark");
   document.body?.classList.toggle("dark",t==="dark");
 }
 const wordID={
   "you":"Anda","your":"Anda","please":"silakan","yet":"masih",
   "and":"dan","with":"dengan","that":"yang","for":"untuk","users":"pengguna","user":"pengguna","account":"akun","accounts":"akun","payment":"pembayaran","payments":"pembayaran","balance":"saldo","earnings":"pendapatan","earning":"pendapatan","withdraw":"penarikan","withdrawal":"penarikan","settings":"pengaturan","profile":"profil","history":"riwayat","activity":"aktivitas","support":"bantuan","language":"bahasa","click":"klik","views":"tampilan","view":"tampilan","price":"harga","buyer":"pembeli","seller":"penjual","secure":"aman","fast":"cepat","easy":"mudah","features":"fitur","active":"aktif","expired":"kedaluwarsa","pending":"menunggu","success":"berhasil","failed":"gagal","please":"silakan","enter":"masukkan","create":"buat","manage":"kelola","save":"simpan","delete":"hapus","change":"ubah","password":"kata sandi","premium":"premium","ads":"iklan","sell":"jual","link":"link","links":"link","current":"saat ini","total":"total","monthly":"bulanan","daily":"harian","available":"tersedia","not":"tidak","already":"sudah","new":"baru","old":"lama"
 };
 const wordEN=Object.fromEntries(Object.entries(wordID).map(([k,v])=>[v,k]));
 function normalizeWords(text,target){
   let out=text;
   const map=target==="id"?wordID:wordEN;
   for(const [a,b] of Object.entries(map)) out=out.replace(new RegExp("\\b"+a.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"\\b","gi"),m=>{const x=m[0]===m[0].toUpperCase()?b[0].toUpperCase()+b.slice(1):b;return x;});
   return out;
 }
 function tr(text,target){
   const s=(text||"").trim();
   if(!s)return text;
   let exact=target==="id"?(id[s]||s):(dict[s]||id2en[s]||s);
   if(exact!==s)return exact;
   return normalizeWords(s,target);
 }
 function translate(){
   const target=lang();
   document.documentElement.lang=target;
   document.title=tr(document.title,target);
   const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
   const nodes=[]; let n; while(n=walker.nextNode()) nodes.push(n);
   nodes.forEach(node=>{
     if(!node.nodeValue.trim() || node.parentElement.closest("script,style,code,pre")) return;
     const raw=node.nodeValue.trim(), translated=tr(raw,target);
     if(translated!==raw){
       const lead=node.nodeValue.match(/^\s*/)?.[0]||"", tail=node.nodeValue.match(/\s*$/)?.[0]||"";
       node.nodeValue=lead+translated+tail;
     }
   });
   document.querySelectorAll("[placeholder]").forEach(e=>e.placeholder=tr(e.placeholder,target));
   document.querySelectorAll("[aria-label]").forEach(e=>e.setAttribute("aria-label",tr(e.getAttribute("aria-label"),target)));
   document.querySelectorAll("[data-i18n]").forEach(e=>e.textContent=tr(e.dataset.i18n,target));
 }
 function setLanguage(l){
   localStorage.setItem("language",l); translate();
   window.dispatchEvent(new CustomEvent("c2p:language",{detail:{language:l}}));
 }
 function setTheme(t){
   localStorage.setItem("theme",t); applyTheme();
   window.dispatchEvent(new CustomEvent("c2p:theme",{detail:{theme:t}}));
 }
 function toast(message,type="info"){
   const old=document.querySelector(".c2p-toast"); if(old)old.remove();
   const el=document.createElement("div"); el.className="c2p-toast";
   el.textContent=message; el.dataset.type=type; document.body.appendChild(el);
   requestAnimationFrame(()=>el.classList.add("show")); setTimeout(()=>{el.classList.remove("show");setTimeout(()=>el.remove(),220)},2600);
 }
 function modal(title,body,actions){
   const wrap=document.createElement("div"); wrap.className="c2p-modal";
   wrap.innerHTML=`<div><h2>${title}</h2><div>${body}</div><div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px">${actions||""}</div></div>`;
   document.body.appendChild(wrap); return wrap;
 }
 window.C2P={...window.C2P,lang,tr,translate,setLanguage,applyTheme,setTheme,toast,modal};
 function mountControls(){}
 document.addEventListener("DOMContentLoaded",()=>{applyTheme();setTimeout(translate,20)});
 window.addEventListener("storage",e=>{if(e.key==="language"||e.key==="theme"){applyTheme();translate()}});
})();
