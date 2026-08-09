(function(){

"use strict";

let navbarLoaded = false;

window.c2pInit = function(){

    if(navbarLoaded){
        return;
    }

    const sidebar = document.querySelector(".c2p-sidebar");
    const overlay = document.querySelector(".c2p-overlay");
    const menuBtn = document.querySelector(".c2p-menu-btn");
    const search = document.querySelector("#menuSearch");
    const logout = document.querySelector(".c2p-logout");
    const themeBtn = document.querySelector("#themeToggle");

    if(!sidebar){

        console.log("SIDEBAR NOT FOUND");

        return;

    }

    navbarLoaded = true;


    /* =====================================================
       SIDEBAR
    ===================================================== */

    function openSidebar(){

        sidebar.classList.add("active");

        if(overlay){
            overlay.classList.add("active");
        }

    }


    function closeSidebar(){

        sidebar.classList.remove("active");

        if(overlay){
            overlay.classList.remove("active");
        }

    }


    menuBtn?.addEventListener(
        "click",
        openSidebar
    );


    overlay?.addEventListener(
        "click",
        closeSidebar
    );


    sidebar
        .querySelectorAll("a")
        .forEach(function(a){

            a.addEventListener(
                "click",
                closeSidebar
            );

        });



    /* =====================================================
       SEARCH
    ===================================================== */

    if(search){

        search.addEventListener(
            "input",
            function(){

                const key =
                    search.value
                        .toLowerCase()
                        .trim();


                sidebar
                    .querySelectorAll("a")
                    .forEach(function(item){

                        const text =
                            item.innerText
                                .toLowerCase();


                        item.style.display =
                            text.includes(key)
                            ? "flex"
                            : "none";

                    });

            }
        );

    }



    /* =====================================================
       DARK / LIGHT MODE
    ===================================================== */

    function applyTheme(theme){

        const icon =
            themeBtn?.querySelector("i");


        if(theme === "dark"){

            document.documentElement
                .classList
                .add("dark");


            if(icon){

                icon.classList
                    .remove("fa-moon");

                icon.classList
                    .add("fa-sun");

            }

        }else{

            document.documentElement
                .classList
                .remove("dark");


            if(icon){

                icon.classList
                    .remove("fa-sun");

                icon.classList
                    .add("fa-moon");

            }

        }

    }



    const savedTheme =
        localStorage.getItem("theme");


    if(savedTheme){

        applyTheme(savedTheme);

    }else{

        const prefersDark =
            window.matchMedia(
                "(prefers-color-scheme: dark)"
            ).matches;


        applyTheme(
            prefersDark
                ? "dark"
                : "light"
        );

    }



    /* =====================================================
       THEME BUTTON
    ===================================================== */

    themeBtn?.addEventListener(
        "click",
        function(){

            const isDark =
                document.documentElement
                    .classList
                    .contains("dark");


            const newTheme =
                isDark
                    ? "light"
                    : "dark";


            localStorage.setItem(
                "theme",
                newTheme
            );


            applyTheme(newTheme);

        }
    );



    /* =====================================================
       CREATE MENU
    ===================================================== */

    const createBtn =
        document.getElementById(
            "createBtn"
        );


    const createMenu =
        document.getElementById(
            "createMenu"
        );


    if(createBtn && createMenu){

        createBtn.addEventListener(
            "click",
            function(e){

                e.stopPropagation();

                createMenu.classList
                    .toggle("active");

                createBtn.classList
                    .toggle("active");

            }
        );


        document.addEventListener(
            "click",
            function(e){

                if(
                    !createMenu.contains(e.target) &&
                    !createBtn.contains(e.target)
                ){

                    createMenu.classList
                        .remove("active");

                    createBtn.classList
                        .remove("active");

                }

            }
        );

    }



    /* =====================================================
       LOGOUT
    ===================================================== */

    logout?.addEventListener(
        "click",
        async function(){

            try{

                if(
                    window.database &&
                    typeof database.logout ===
                    "function"
                ){

                    await database.logout();

                }

            }catch(error){

                console.warn(
                    "Logout error:",
                    error
                );

            }


            localStorage.clear();

            sessionStorage.clear();


            window.location.replace(
                "index.html"
            );

        }
    );



    /* =====================================================
       LANGUAGE
       PENTING:
       Navbar dimuat DINAMIS, jadi bahasa harus
       diterapkan SETELAH navbar masuk DOM.
    ===================================================== */

    if(
        window.c2pLanguage &&
        typeof window.c2pLanguage.refreshLanguage ===
        "function"
    ){

        window.c2pLanguage.refreshLanguage();

        console.log(
            "NAVBAR LANGUAGE READY:",
            window.c2pLanguage.getLanguage()
        );

    }else{

        console.warn(
            "LANGUAGE.JS BELUM DIMUAT"
        );

    }



    console.log(
        "NAVBAR READY 🚀"
    );

};

})();
