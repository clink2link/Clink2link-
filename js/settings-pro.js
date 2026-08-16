"use strict";

document.addEventListener("DOMContentLoaded", async () => {
    const db = window.database;

    // =========================================================
    // DATABASE CHECK
    // =========================================================
    if (!db) {
        if (window.C2P?.toast) {
            C2P.toast("Database is unavailable", "error");
        }
        return;
    }

    // =========================================================
    // AUTH CHECK
    // =========================================================
    let user;

    try {
        user = await db.getUser();
    } catch (error) {
        console.error("Failed to get user:", error);

        if (window.C2P?.toast) {
            C2P.toast("Unable to load your account", "error");
        }

        return;
    }

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    // =========================================================
    // THEME
    // =========================================================
    const themeToggle = document.getElementById("settingsThemeToggle") || document.getElementById("themeToggle");

    const savedTheme =
        localStorage.getItem("theme") ||
        document.documentElement.dataset.theme ||
        "light";

    if (themeToggle) {
        themeToggle.checked = savedTheme === "dark";

        themeToggle.addEventListener("change", () => {
            const theme = themeToggle.checked ? "dark" : "light";

            try {
                if (window.C2P?.setTheme) {
                    C2P.setTheme(theme);
                } else {
                    document.documentElement.dataset.theme = theme;
                    document.documentElement.classList.toggle(
                        "dark",
                        theme === "dark"
                    );
                    localStorage.setItem("theme", theme);
                }
            } catch (error) {
                console.error("Theme error:", error);
            }
        });
    }

    // =========================================================
    // LANGUAGE
    // =========================================================
    document.querySelectorAll("[data-lang]").forEach((button) => {
        button.addEventListener("click", () => {
            const language = button.dataset.lang;

            if (!language) return;

            try {
                if (window.C2P?.setLanguage) {
                    C2P.setLanguage(language);
                } else {
                    localStorage.setItem("language", language);
                    document.documentElement.lang = language;
                }

                document
                    .querySelectorAll("[data-lang]")
                    .forEach((item) => {
                        item.classList.toggle(
                            "active",
                            item.dataset.lang === language
                        );
                    });

                if (window.C2P?.toast) {
                    C2P.toast(
                        language === "id"
                            ? "Bahasa Indonesia aktif"
                            : "English is active",
                        "success"
                    );
                }
            } catch (error) {
                console.error("Language error:", error);
            }
        });
    });

    // =========================================================
    // PASSWORD CHANGE
    // =========================================================
    const passwordForm = document.getElementById("passwordForm");

    if (passwordForm) {
        passwordForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const newPassword =
                document.getElementById("newPassword")?.value || "";

            const confirmPassword =
                document.getElementById("confirmPassword")?.value || "";

            if (newPassword.length < 8) {
                C2P.toast(
                    "Password must be at least 8 characters",
                    "error"
                );
                return;
            }

            if (newPassword !== confirmPassword) {
                C2P.toast(
                    "Passwords do not match",
                    "error"
                );
                return;
            }

            const submitButton = passwordForm.querySelector(
                'button[type="submit"]'
            );

            const originalText = submitButton?.textContent;

            try {
                if (submitButton) {
                    submitButton.disabled = true;
                    submitButton.textContent = "Updating...";
                }

                const { error } =
                    await db.supabase.auth.updateUser({
                        password: newPassword
                    });

                if (error) {
                    throw error;
                }

                passwordForm.reset();

                C2P.toast(
                    "Password changed successfully",
                    "success"
                );

            } catch (error) {
                console.error("Password update error:", error);

                C2P.toast(
                    error?.message ||
                    "Unable to change password",
                    "error"
                );

            } finally {
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent =
                        originalText || "Change Password";
                }
            }
        });
    }

    // =========================================================
    // ADD ACCOUNT
    // =========================================================
    const addAccountButton =
        document.getElementById("addAccountBtn");

    if (addAccountButton) {
        addAccountButton.addEventListener("click", async () => {
            try {
                await db.logout();
                window.location.href = "login.html?mode=add";
            } catch (error) {
                console.error("Add account error:", error);
                C2P.toast(
                    "Unable to add another account",
                    "error"
                );
            }
        });
    }

    // =========================================================
    // SWITCH ACCOUNT
    // =========================================================
    const switchAccountButton =
        document.getElementById("switchAccountBtn");

    if (switchAccountButton) {
        switchAccountButton.addEventListener("click", async () => {
            try {
                await db.logout();
                window.location.href = "login.html?mode=switch";
            } catch (error) {
                console.error("Switch account error:", error);
                C2P.toast(
                    "Unable to switch account",
                    "error"
                );
            }
        });
    }

    // =========================================================
    // LOGOUT
    // =========================================================
    const logoutButton =
        document.getElementById("logoutBtn");

    if (logoutButton) {
        logoutButton.addEventListener("click", async () => {
            try {
                logoutButton.disabled = true;

                await db.logout();

                window.location.href = "login.html";
            } catch (error) {
                console.error("Logout error:", error);

                logoutButton.disabled = false;

                C2P.toast(
                    "Unable to logout",
                    "error"
                );
            }
        });
    }

    // =========================================================
    // DELETE ACCOUNT
    // =========================================================
    const deleteAccountButton =
        document.getElementById("deleteAccountBtn");

    if (deleteAccountButton) {
        deleteAccountButton.addEventListener(
            "click",
            async () => {

                const confirmed = window.confirm(
                    "Delete this account permanently?\n\n" +
                    "This action cannot be undone."
                );

                if (!confirmed) return;

                try {
                    deleteAccountButton.disabled = true;

                    const {
                        data: sessionData,
                        error: sessionError
                    } = await db.supabase.auth.getSession();

                    if (sessionError) {
                        throw sessionError;
                    }

                    const session =
                        sessionData?.session;

                    if (!session?.access_token) {
                        C2P.toast(
                            "Session expired. Please login again.",
                            "error"
                        );

                        window.location.href =
                            "login.html";

                        return;
                    }

                    const response = await fetch(
                        "/api/delete-account",
                        {
                            method: "POST",
                            headers: {
                                "Authorization":
                                    `Bearer ${session.access_token}`,
                                "Content-Type":
                                    "application/json"
                            }
                        }
                    );

                    const data =
                        await response
                            .json()
                            .catch(() => ({}));

                    if (!response.ok || !data.success) {
                        throw new Error(
                            data.error ||
                            "Unable to delete account"
                        );
                    }

                    await db.supabase.auth.signOut();

                    window.location.href =
                        "index.html";

                } catch (error) {
                    console.error(
                        "Delete account error:",
                        error
                    );

                    deleteAccountButton.disabled =
                        false;

                    C2P.toast(
                        error?.message ||
                        "Unable to delete account",
                        "error"
                    );
                }
            }
        );
    }

    // =========================================================
    // FLOATING LANGUAGE + THEME CONTROL
    // =========================================================
    initFloatingControls();

    // =========================================================
    // LANGUAGE STATE
    // =========================================================
    const currentLanguage =
        localStorage.getItem("language") || "en";

    document
        .querySelectorAll("[data-lang]")
        .forEach((button) => {
            button.classList.toggle(
                "active",
                button.dataset.lang === currentLanguage
            );
        });
});


// =============================================================
// FLOATING CONTROLS
// =============================================================

function initFloatingControls() {

    let control = document.getElementById(
        "c2pFloatingControls"
    );

    // Jika HTML belum punya control,
    // buat otomatis melalui JS.
    if (!control) {

        control = document.createElement("div");

        control.id = "c2pFloatingControls";

        control.innerHTML = `
            <div class="c2p-drag-handle" title="Drag">
                ⋮⋮
            </div>

            <div class="c2p-lang-switch">
                <button
                    type="button"
                    data-floating-lang="en"
                    aria-label="English"
                >
                    EN
                </button>

                <button
                    type="button"
                    data-floating-lang="id"
                    aria-label="Bahasa Indonesia"
                >
                    ID
                </button>
            </div>

            <button
                type="button"
                id="floatingThemeButton"
                class="c2p-theme-button"
                aria-label="Toggle dark mode"
            >
                ◐
            </button>
        `;

        document.body.appendChild(control);
    }

    // =========================================================
    // POSITION
    // =========================================================

    const savedPosition =
        localStorage.getItem(
            "c2p-floating-position"
        );

    if (savedPosition) {

        try {

            const position =
                JSON.parse(savedPosition);

            if (
                typeof position.x === "number" &&
                typeof position.y === "number"
            ) {
                control.style.left =
                    `${position.x}px`;

                control.style.top =
                    `${position.y}px`;

                control.style.right =
                    "auto";

                control.style.bottom =
                    "auto";
            }

        } catch (error) {
            console.warn(
                "Invalid floating position",
                error
            );
        }
    }

    // =========================================================
    // LANGUAGE BUTTONS
    // =========================================================

    control
        .querySelectorAll(
            "[data-floating-lang]"
        )
        .forEach((button) => {

            button.addEventListener(
                "click",
                () => {

                    const language =
                        button.dataset.floatingLang;

                    if (!language) return;

                    if (window.C2P?.setLanguage) {
                        C2P.setLanguage(language);
                    } else {
                        localStorage.setItem(
                            "language",
                            language
                        );

                        document.documentElement.lang =
                            language;
                    }

                    control
                        .querySelectorAll(
                            "[data-floating-lang]"
                        )
                        .forEach((item) => {

                            item.classList.toggle(
                                "active",
                                item.dataset
                                    .floatingLang ===
                                    language
                            );
                        });
                }
            );
        });

    // =========================================================
    // THEME BUTTON
    // =========================================================

    const themeButton =
        document.getElementById(
            "floatingThemeButton"
        );

    if (themeButton) {

        updateFloatingThemeIcon(
            themeButton
        );

        themeButton.addEventListener(
            "click",
            () => {

                const current =
                    localStorage.getItem(
                        "theme"
                    ) || "light";

                const next =
                    current === "dark"
                        ? "light"
                        : "dark";

                if (window.C2P?.setTheme) {
                    C2P.setTheme(next);
                } else {

                    document.documentElement
                        .classList.toggle(
                            "dark",
                            next === "dark"
                        );

                    document.documentElement
                        .dataset.theme = next;

                    localStorage.setItem(
                        "theme",
                        next
                    );
                }

                updateFloatingThemeIcon(
                    themeButton
                );
            }
        );
    }

    // =========================================================
    // DRAG / MOVE
    // =========================================================

    const handle =
        control.querySelector(
            ".c2p-drag-handle"
        );

    if (!handle) return;

    let dragging = false;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;

    const startDrag = (event) => {

        dragging = true;

        control.classList.add(
            "dragging"
        );

        const point =
            event.touches
                ? event.touches[0]
                : event;

        const rect =
            control.getBoundingClientRect();

        startX = point.clientX;
        startY = point.clientY;

        startLeft = rect.left;
        startTop = rect.top;

        event.preventDefault();
    };

    const moveDrag = (event) => {

        if (!dragging) return;

        const point =
            event.touches
                ? event.touches[0]
                : event;

        let x =
            startLeft +
            (point.clientX - startX);

        let y =
            startTop +
            (point.clientY - startY);

        const maxX =
            window.innerWidth -
            control.offsetWidth;

        const maxY =
            window.innerHeight -
            control.offsetHeight;

        x = Math.max(
            0,
            Math.min(x, maxX)
        );

        y = Math.max(
            0,
            Math.min(y, maxY)
        );

        control.style.left =
            `${x}px`;

        control.style.top =
            `${y}px`;

        control.style.right =
            "auto";

        control.style.bottom =
            "auto";

        event.preventDefault();
    };

    const stopDrag = () => {

        if (!dragging) return;

        dragging = false;

        control.classList.remove(
            "dragging"
        );

        const rect =
            control.getBoundingClientRect();

        localStorage.setItem(
            "c2p-floating-position",
            JSON.stringify({
                x: rect.left,
                y: rect.top
            })
        );
    };

    handle.addEventListener(
        "mousedown",
        startDrag
    );

    document.addEventListener(
        "mousemove",
        moveDrag
    );

    document.addEventListener(
        "mouseup",
        stopDrag
    );

    handle.addEventListener(
        "touchstart",
        startDrag,
        { passive: false }
    );

    document.addEventListener(
        "touchmove",
        moveDrag,
        { passive: false }
    );

    document.addEventListener(
        "touchend",
        stopDrag
    );
}


// =============================================================
// FLOATING THEME ICON
// =============================================================

function updateFloatingThemeIcon(button) {

    if (!button) return;

    const theme =
        localStorage.getItem("theme") ||
        "light";

    button.textContent =
        theme === "dark"
            ? "☀"
            : "◐";
}
