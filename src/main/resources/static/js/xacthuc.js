/**
 * Auth + helper API cho frontend static.
 * Luu session tam bang localStorage, chuan hoa role ve customer/doctor/admin.
 */
const STORAGE_KEY = "booking_currentUser";
const PROFILE_REQUIRED_KEY = "booking_profileRequired";
const ACCESS_DENIED_MESSAGE = "Bạn không có quyền truy cập !";

function normalizeRole(role) {
    var v = (role || "").toLowerCase();
    if (v === "patient") return "customer";
    return v;
}

// Global loader helpers
function ensureGlobalLoader() {
    if (typeof document === 'undefined') return null;
    var existing = document.getElementById('global-loader');
    if (existing) return existing;
    var root = document.createElement('div');
    root.id = 'global-loader';
    root.className = 'global-loader';
    root.innerHTML = '<div class="loader-box"><div class="spinner" aria-hidden="true"></div><div class="loader-label">Đang xử lý...</div></div>';
    document.body.appendChild(root);
    return root;
}

function showGlobalLoader(message) {
    var root = ensureGlobalLoader();
    if (!root) return;
    try {
        var label = root.querySelector('.loader-label');
        if (label && message) label.textContent = message;
    } catch (e) {}
    root.classList.add('is-visible');
}

function hideGlobalLoader() {
    var root = typeof document !== 'undefined' ? document.getElementById('global-loader') : null;
    if (!root) return;
    root.classList.remove('is-visible');
}

function navigateWithLoading(url) {
    showGlobalLoader();
    window.location.href = url;
}

function clearSessionData() {
    try { localStorage.removeItem(STORAGE_KEY); } catch(e){}
    try { localStorage.removeItem('doctor_portal_doctorId'); } catch(e){}
    try { localStorage.removeItem(PROFILE_REQUIRED_KEY); } catch(e){}
}

async function apiJson(url, options) {
    var opts = options || {};
    showGlobalLoader();
    try {
        var res = await fetch(url, opts);
        var data = null;
        try { data = await res.json(); } catch (e) { data = null; }
        if (!res.ok) {
            var msg = (data && (data.message || data.error)) ? (data.message || data.error) : 'Yêu cầu thất bại';
            var err = new Error(msg);
            err.response = res;
            err.data = data;
            throw err;
        }
        return data;
    } finally {
        hideGlobalLoader();
    }
}

function getCurrentUser() {
    var data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    try {
        var parsed = JSON.parse(data);
        parsed.role = normalizeRole(parsed.role);
        if (!parsed.name || !String(parsed.name).trim()) {
            parsed.name = parsed.fullname || parsed.username || parsed.email || "";
        }
        return parsed;
    } catch (e) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
    }
}

function setCurrentUser(user) {
    var normalized = Object.assign({}, user, { role: normalizeRole(user.role) });
    if (!normalized.name || !String(normalized.name).trim()) {
        normalized.name = normalized.fullname || normalized.username || normalized.email || "";
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
}

function markProfileSetupRequired(account) {
    if (!account) return;
    var payload = {
        account: String(account).trim().toLowerCase(),
        required: true,
    };
    localStorage.setItem(PROFILE_REQUIRED_KEY, JSON.stringify(payload));
}

function clearProfileSetupRequirement(account) {
    var current = localStorage.getItem(PROFILE_REQUIRED_KEY);
    if (!current) return;

    if (!account) {
        localStorage.removeItem(PROFILE_REQUIRED_KEY);
        return;
    }

    try {
        var parsed = JSON.parse(current);
        var target = String(account).trim().toLowerCase();
        if (!parsed.account || parsed.account === target) {
            localStorage.removeItem(PROFILE_REQUIRED_KEY);
        }
    } catch (e) {
        localStorage.removeItem(PROFILE_REQUIRED_KEY);
    }
}

function isProfileSetupRequiredForCurrentUser() {
    var user = getCurrentUser();
    if (!user) return false;

    var raw = localStorage.getItem(PROFILE_REQUIRED_KEY);
    if (!raw) return false;
    try {
        var parsed = JSON.parse(raw);
        if (!parsed.required) return false;
        var currentAccount = String(user.username || user.email || "").trim().toLowerCase();
        if (!currentAccount) return false;
        return parsed.account === currentAccount;
    } catch (e) {
        localStorage.removeItem(PROFILE_REQUIRED_KEY);
        return false;
    }
}

async function logout() {
    var pathname = window.location.pathname;
    var onCustomerPage = pathname.indexOf("/customer/") === 0;
    var onAdminPage = pathname.indexOf("/admin/") === 0;
    var onDoctorPage = pathname.indexOf("/doctor/") === 0;
    
    var shouldConfirm = onCustomerPage || onAdminPage || onDoctorPage;
    if (shouldConfirm && !(await uiConfirm("Bạn có chắc muốn đăng xuất ?", "Xác nhận"))) {
        return;
    }
    clearSessionData();
    window.location.href = "/customer/trangchu.html";
}

function requireAuth(allowedRoles) {
    var user = getCurrentUser();
    if (!user) {
        window.location.href = "/admin/dangnhap.html";
        return null;
    }
    if (allowedRoles && allowedRoles.length) {
        var normalizedAllowed = allowedRoles.map(normalizeRole);
        if (!normalizedAllowed.includes(user.role)) {
            uiAlert(ACCESS_DENIED_MESSAGE, "Từ chối truy cập");
            redirectByRole(user.role);
            return null;
        }
    }
    return user;
}

function isCustomerPublicPage(pathname) {
    var publicPages = {
        "/customer/trangchu.html": true,
        "/customer/khoa.html": true,
        "/customer/tintuc-camnang.html": true,
        "/customer/bacsi.html": true,
    };
    return !!publicPages[pathname];
}

function getRequiredRoleForPath(pathname) {
    if (!pathname) return null;

    if (pathname.indexOf("/admin/") === 0) {
        var adminPublic = {
            "/admin/dangnhap.html": true,
            "/admin/dangky.html": true,
            "/admin/dangky-nhanvien.html": true,
        };
        return adminPublic[pathname] ? null : "admin";
    }

    if (pathname.indexOf("/doctor/") === 0) {
        return "doctor";
    }

    if (pathname.indexOf("/customer/") === 0) {
        return isCustomerPublicPage(pathname) ? null : "customer";
    }

    return null;
}

function syncCurrentUserRole(user) {
    if (!user || !user.username) {
        return Promise.resolve(user);
    }
    return apiJson("/api/auth/me?username=" + encodeURIComponent(user.username))
        .then(function (res) {
            if (!res || !res.success) {
                return user;
            }
            var serverRole = normalizeRole(res.role);
            var localRole = normalizeRole(user.role);
            if (serverRole !== localRole) {
                user.role = serverRole;
                setCurrentUser(user);
            }
            return user;
        })
        .catch(function () {
            return user;
        });
}

function enforceRoleAccessForCurrentPath() {
    if (typeof window === "undefined") return Promise.resolve();
    var pathname = window.location.pathname || "";
    var requiredRole = getRequiredRoleForPath(pathname);
    if (!requiredRole) return Promise.resolve();

    var user = getCurrentUser();
    if (!user) {
        window.location.href = "/admin/dangnhap.html";
        return Promise.resolve();
    }

    return syncCurrentUserRole(user).then(function (syncedUser) {
        var role = normalizeRole((syncedUser && syncedUser.role) || "");
        if (role !== requiredRole) {
            uiAlert(ACCESS_DENIED_MESSAGE, "Từ chối truy cập");
            redirectByRole(role);
            return;
        }

        var pathname = window.location.pathname || "";
        if (role === "customer" && isProfileSetupRequiredForCurrentUser() && pathname !== "/customer/hoso.html") {
            window.location.href = "/customer/hoso.html?setup=1";
        }
    });
}

function redirectByRole(role) {
    var v = normalizeRole(role);
    var base = {
        admin: "/admin/trangquantri.html",
        doctor: "/doctor/lichkham.html",
        customer: "/customer/trangchu.html",
    };
    window.location.href = base[v] || "/admin/dangnhap.html";
}

function getRoleLabel(role) {
    var labels = {
        admin: "Quản trị viên",
        doctor: "Bác sĩ",
        customer: "Khách hàng",
    };
    return labels[normalizeRole(role)] || role;
}

function clearSessionData() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("doctor_portal_doctorId");
    localStorage.removeItem(PROFILE_REQUIRED_KEY);
}

function createDialogField(labelText, inputId, type, placeholder) {
    var group = document.createElement("div");
    group.className = "form-group";

    var label = document.createElement("label");
    label.setAttribute("for", inputId);
    label.textContent = labelText;

    var input = document.createElement("input");
    input.type = type || "text";
    input.id = inputId;
    input.placeholder = placeholder || "";

    group.appendChild(label);
    group.appendChild(input);
    return { group: group, input: input };
}

function ensureChangePasswordDialog() {
    if (typeof document === "undefined") return null;

    var existing = document.getElementById("change-password-dialog");
    if (existing) return existing;

    var root = document.createElement("div");
    root.id = "change-password-dialog";
    root.className = "app-dialog-root";
    root.innerHTML = ''
        + '<div class="app-dialog-backdrop" data-dialog-close="true"></div>'
        + '<div class="app-dialog" role="dialog" aria-modal="true" aria-labelledby="change-password-title">'
        + '  <div class="app-dialog-header">'
        + '    <div class="app-dialog-title" id="change-password-title">Đổi mật khẩu</div>'
        + '    <button type="button" class="app-dialog-close" data-dialog-close aria-label="Đóng">&times;</button>'
        + '  </div>'
        + '  <form id="change-password-form">'
        + '    <div class="app-dialog-body">'
        + '      <p class="change-password-hint">Mật khẩu mới phải có ít nhất 8 ký tự, gồm chữ và số.</p>'
        + '      <div class="change-password-fields" id="change-password-fields"></div>'
        + '      <div class="change-password-status" id="change-password-status" aria-live="polite"></div>'
        + '    </div>'
        + '    <div class="app-dialog-actions">'
        + '      <button type="button" class="btn btn-outline" data-dialog-close>Hủy</button>'
        + '      <button type="submit" class="btn btn-primary" id="change-password-submit">Lưu mật khẩu mới</button>'
        + '    </div>'
        + '  </form>'
        + '</div>';

    var fieldsHost = root.querySelector("#change-password-fields");
    fieldsHost.appendChild(createDialogField("Mật khẩu hiện tại *", "change-password-current", "password", "Nhập mật khẩu hiện tại").group);
    fieldsHost.appendChild(createDialogField("Mật khẩu mới *", "change-password-new", "password", "Nhập mật khẩu mới").group);
    fieldsHost.appendChild(createDialogField("Xác nhận mật khẩu mới *", "change-password-confirm", "password", "Nhập lại mật khẩu mới").group);

    document.body.appendChild(root);
    return root;
}

function openChangePasswordDialog() {
    var user = getCurrentUser();
    if (!user || !user.username) {
        window.location.href = "/admin/dangnhap.html";
        return Promise.resolve(false);
    }

    var root = ensureChangePasswordDialog();
    if (!root) return Promise.resolve(false);

    var form = root.querySelector("#change-password-form");
    var currentInput = root.querySelector("#change-password-current");
    var newInput = root.querySelector("#change-password-new");
    var confirmInput = root.querySelector("#change-password-confirm");
    var statusEl = root.querySelector("#change-password-status");
    var submitBtn = root.querySelector("#change-password-submit");
    var closeTargets = root.querySelectorAll("[data-dialog-close]");
    var previousFocus = document.activeElement;

    function setStatus(message, isError) {
        statusEl.textContent = message || "";
        statusEl.className = isError ? "change-password-status is-error" : "change-password-status";
    }

    function closeDialog() {
        root.classList.remove("is-visible");
        document.documentElement.classList.remove("app-dialog-open");
        root.removeEventListener("click", onRootClick);
        document.removeEventListener("keydown", onKeyDown);
        form.removeEventListener("submit", onSubmit);
        Array.prototype.forEach.call(closeTargets, function (node) {
            node.removeEventListener("click", onClose);
        });
        if (previousFocus && typeof previousFocus.focus === "function") {
            previousFocus.focus();
        }
    }

    function onClose() {
        closeDialog();
    }

    function onRootClick(event) {
        if (event.target && event.target.hasAttribute("data-dialog-close")) {
            closeDialog();
        }
    }

    function onKeyDown(event) {
        if (event.key === "Escape") {
            closeDialog();
        }
    }

    async function onSubmit(event) {
        event.preventDefault();
        setStatus("", false);

        var currentPassword = currentInput.value;
        var newPassword = newInput.value;
        var confirmPassword = confirmInput.value;

        if (!currentPassword) {
            setStatus("Vui lòng nhập mật khẩu hiện tại.", true);
            currentInput.focus();
            return;
        }
        if (!newPassword || newPassword.length < 8) {
            setStatus("Mật khẩu mới phải có ít nhất 8 ký tự.", true);
            newInput.focus();
            return;
        }
        if (!/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
            setStatus("Mật khẩu mới phải chứa ít nhất 1 chữ cái và 1 chữ số.", true);
            newInput.focus();
            return;
        }
        if (newPassword === currentPassword) {
            setStatus("Mật khẩu mới phải khác mật khẩu hiện tại.", true);
            newInput.focus();
            return;
        }
        if (newPassword !== confirmPassword) {
            setStatus("Xác nhận mật khẩu mới không khớp.", true);
            confirmInput.focus();
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = "Đang lưu...";
        try {
            var res = await apiJson("/api/auth/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: user.username,
                    currentPassword: currentPassword,
                    newPassword: newPassword,
                }),
            });

            if (!res || !res.success) {
                throw new Error((res && res.message) || "Đổi mật khẩu thất bại");
            }

            closeDialog();
            await uiAlert("Đã đổi mật khẩu thành công. Vui lòng đăng nhập lại.", "Thông báo");
            clearSessionData();
            window.location.href = "/admin/dangnhap.html";
        } catch (err) {
            setStatus(err.message || "Đổi mật khẩu thất bại", true);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = "Lưu mật khẩu mới";
        }
    }

    root.classList.add("is-visible");
    document.documentElement.classList.add("app-dialog-open");
    Array.prototype.forEach.call(closeTargets, function (node) {
        node.addEventListener("click", onClose);
    });
    root.addEventListener("click", onRootClick);
    document.addEventListener("keydown", onKeyDown);
    form.addEventListener("submit", onSubmit);
    setStatus("", false);
    window.requestAnimationFrame(function () {
        currentInput.focus();
    });

    return Promise.resolve(true);
}

function buildCustomerAccountDropdown(user) {
    var wrap = document.createElement("div");
    wrap.className = "account-dropdown";

    var button = document.createElement("button");
    button.type = "button";
    button.className = "account-toggle";
    button.setAttribute("aria-expanded", "false");
    button.innerHTML =
        '<span class="account-name">' +
        (user.name || user.email || "Tài khoản") +
        '</span><span class="account-caret" aria-hidden="true"></span>';

    var panel = document.createElement("div");
    panel.className = "account-panel";

    var links = [
        { href: "/customer/hoso.html", label: "Thông tin cá nhân" },
        { href: "/customer/lichcuatoi.html", label: "Lịch khám" },
        { href: "/customer/ketluan.html", label: "Kết luận" },
        { href: "/customer/tintuc-camnang.html", label: "Tin tức & cẩm nang" },
    ];

    links.forEach(function (item) {
        var a = document.createElement("a");
        a.className = "account-menu-link";
        a.href = item.href;
        a.textContent = item.label;
        panel.appendChild(a);
    });

    var changePasswordBtn = document.createElement("button");
    changePasswordBtn.type = "button";
    changePasswordBtn.className = "account-menu-action";
    changePasswordBtn.textContent = "Đổi mật khẩu";
    changePasswordBtn.addEventListener("click", function () {
        wrap.classList.remove("is-open");
        button.setAttribute("aria-expanded", "false");
        openChangePasswordDialog();
    });
    panel.appendChild(changePasswordBtn);

    var logoutBtn = document.createElement("button");
    logoutBtn.type = "button";
    logoutBtn.className = "account-menu-action logout";
    logoutBtn.textContent = "Đăng xuất";
    logoutBtn.addEventListener("click", function () {
        logout();
    });
    panel.appendChild(logoutBtn);

    button.addEventListener("click", function (e) {
        e.stopPropagation();
        var opened = wrap.classList.toggle("is-open");
        button.setAttribute("aria-expanded", opened ? "true" : "false");
    });

    document.addEventListener("click", function (e) {
        if (!wrap.contains(e.target)) {
            wrap.classList.remove("is-open");
            button.setAttribute("aria-expanded", "false");
        }
    });

    wrap.appendChild(button);
    wrap.appendChild(panel);
    return wrap;
}

function setupHeaderAccountDropdown() {
    if (typeof document === "undefined") return;
    if (document.querySelector(".account-dropdown")) return;

    var user = getCurrentUser();
    if (!user || normalizeRole(user.role) !== "customer") return;

    var customerActions = document.querySelector(".customer-header .header-actions");
    var landingActions = document.querySelector(".landing-header .header-actions");
    var customerNav = document.querySelector(".customer-header nav");
    var host = customerActions || landingActions || customerNav;
    if (!host) return;

    var staleSelectors = [
        "#header-auth-link",
        "#user-name",
        "button[onclick*='logout']",
        "a[onclick*='logout']",
    ];

    var headerRoot = host.closest(".customer-header, .landing-header") || host;

    staleSelectors.forEach(function (selector) {
        var nodes = headerRoot.querySelectorAll(selector);
        Array.prototype.forEach.call(nodes, function (node) {
            node.classList.add("hide-on-auth");
            node.setAttribute("aria-hidden", "true");
        });
    });

    host.appendChild(buildCustomerAccountDropdown(user));
}

function setupFloatingContactRail() {
    if (typeof document === "undefined") return;
    var pathname = window.location.pathname || "";
    if (pathname.indexOf("/customer/") !== 0) return;
    if (document.getElementById("floating-contact-rail")) return;

    var rail = document.createElement("div");
    rail.id = "floating-contact-rail";
    rail.className = "floating-contact-rail";
    rail.setAttribute("aria-label", "Thông tin liên hệ nhanh");

    rail.innerHTML = ""
        + '<a class="floating-contact-item phone" href="tel:0985081624" aria-label="Gọi hotline 0985081624">'
        + '<span class="floating-contact-icon"><img src="/images/phone.png" alt="Phone"></span>'
        + '<span class="floating-contact-text">0985081624</span>'
        + '</a>'
        + '<a class="floating-contact-item facebook" href="https://www.facebook.com/thang.lee.948011/" target="_blank" rel="noopener" aria-label="Liên hệ Facebook">'
        + '<span class="floating-contact-icon"><img src="/images/fb.png" alt="Facebook"></span>'
        + '<span class="floating-contact-text">Facebook</span>'
        + '</a>'
        + '<a class="floating-contact-item zalo" href="https://zalo.me/0985081624" target="_blank" rel="noopener" aria-label="Liên hệ Zalo">'
        + '<span class="floating-contact-icon"><img src="/images/zalo.png" alt="Zalo"></span>'
        + '<span class="floating-contact-text">Zalo</span>'
        + '</a>'
        + '<a class="floating-contact-item messenger" href="https://m.me/ttcare.vn" target="_blank" rel="noopener" aria-label="Liên hệ Messenger">'
        + '<span class="floating-contact-icon"><img src="/images/mess.jpg" alt="Messenger"></span>'
        + '<span class="floating-contact-text">Mess</span>'
        + '</a>';

    document.body.appendChild(rail);
}

function authRegister(username, password, role, extra) {
    var payload = Object.assign({
        username: username,
        password: password,
        role: normalizeRole(role),
    }, extra || {});

    return apiJson("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
}

function authLogin(username, password) {
    return apiJson("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username, password: password }),
    });
}

function ensureAppDialogRoot() {
    if (typeof document === "undefined") return null;

    var existing = document.getElementById("app-dialog-root");
    if (existing) return existing;

    var root = document.createElement("div");
    root.id = "app-dialog-root";
    root.className = "app-dialog-root";
    root.innerHTML =
        '<div class="app-dialog-backdrop" data-dialog-close></div>' +
        '<div class="app-dialog" role="dialog" aria-modal="true" aria-labelledby="app-dialog-title" aria-describedby="app-dialog-message">' +
            '<div class="app-dialog-header">' +
                '<div class="app-dialog-title" id="app-dialog-title">Thông báo</div>' +
                '<button type="button" class="app-dialog-close" data-dialog-close aria-label="Đóng">×</button>' +
            '</div>' +
            '<div class="app-dialog-body" id="app-dialog-message"></div>' +
            '<div class="app-dialog-actions">' +
                '<button type="button" class="btn btn-outline app-dialog-cancel" hidden>Hủy</button>' +
                '<button type="button" class="btn btn-primary app-dialog-confirm">OK</button>' +
            '</div>' +
        '</div>';

    document.body.appendChild(root);
    return root;
}

function showAppDialog(options) {
    if (typeof document === "undefined") {
        return Promise.resolve(true);
    }

    var root = ensureAppDialogRoot();
    if (!root) return Promise.resolve(true);

    var titleEl = root.querySelector("#app-dialog-title");
    var messageEl = root.querySelector("#app-dialog-message");
    var confirmBtn = root.querySelector(".app-dialog-confirm");
    var cancelBtn = root.querySelector(".app-dialog-cancel");
    var closeTargets = root.querySelectorAll("[data-dialog-close]");
    var previousFocus = document.activeElement;
    var opts = options || {};

    titleEl.textContent = opts.title || "Thông báo";
    messageEl.textContent = opts.message || "";
    confirmBtn.textContent = opts.confirmText || "OK";

    if (opts.showCancel) {
        cancelBtn.hidden = false;
        cancelBtn.textContent = opts.cancelText || "Hủy";
    } else {
        cancelBtn.hidden = true;
    }

    root.classList.add("is-visible");
    document.documentElement.classList.add("app-dialog-open");

    return new Promise(function (resolve) {
        function cleanup(result) {
            root.classList.remove("is-visible");
            document.documentElement.classList.remove("app-dialog-open");
            root.removeEventListener("click", onRootClick);
            document.removeEventListener("keydown", onKeyDown);
            confirmBtn.removeEventListener("click", onConfirm);
            cancelBtn.removeEventListener("click", onCancel);
            Array.prototype.forEach.call(closeTargets, function (node) {
                node.removeEventListener("click", onCancel);
            });
            if (previousFocus && typeof previousFocus.focus === "function") {
                previousFocus.focus();
            }
            resolve(result);
        }

        function onConfirm() {
            cleanup(true);
        }

        function onCancel() {
            cleanup(false);
        }

        function onRootClick(event) {
            if (event.target && event.target.hasAttribute("data-dialog-close")) {
                onCancel();
            }
        }

        function onKeyDown(event) {
            if (event.key === "Escape") {
                onCancel();
            }
        }

        confirmBtn.addEventListener("click", onConfirm);
        cancelBtn.addEventListener("click", onCancel);
        Array.prototype.forEach.call(closeTargets, function (node) {
            node.addEventListener("click", onCancel);
        });
        root.addEventListener("click", onRootClick);
        document.addEventListener("keydown", onKeyDown);

        window.requestAnimationFrame(function () {
            confirmBtn.focus();
        });
    });
}

function uiAlert(message, title) {
    return showAppDialog({
        title: title || "Thông báo",
        message: String(message || ""),
        confirmText: "Đã hiểu",
        showCancel: false,
    });
}

function uiConfirm(message, title) {
    return showAppDialog({
        title: title || "Xác nhận",
        message: String(message || ""),
        confirmText: "Đồng ý",
        cancelText: "Hủy",
        showCancel: true,
    });
}

function setupAutoHideHeader() {
    var header = document.querySelector(".customer-header") || document.querySelector(".landing-header");
    if (!header) return;

    var lastY = window.scrollY || 0;
    var hidden = false;

    function setHidden(nextHidden) {
        if (hidden === nextHidden) return;
        hidden = nextHidden;
        if (hidden) {
            header.classList.add("header-hidden");
        } else {
            header.classList.remove("header-hidden");
        }
    }

    window.addEventListener("scroll", function () {
        var currentY = window.scrollY || 0;
        var delta = currentY - lastY;

        if (currentY < 80) {
            setHidden(false);
        } else if (delta > 6) {
            setHidden(true);
        } else if (delta < -4) {
            setHidden(false);
        }

        lastY = currentY;
    }, { passive: true });

    document.addEventListener("mousemove", function (e) {
        if (e.clientY <= 70) {
            setHidden(false);
        }
    });
}

function setupFlyInAnimations() {
    var selectors = [
        ".customer-layout .page-title",
        ".customer-layout .card",
        ".customer-layout .dept-card",
        ".customer-layout .doctor-card",
        ".customer-layout .booking-form-wrap",
        ".customer-layout .table-wrap",
        ".customer-layout .form-section",
        ".customer-layout .stat-card",
        ".customer-layout .filter-bar",
        ".landing-page .section",
        ".landing-page .dept-card",
        ".landing-page .doctor-card",
        ".landing-page .hero-inner",
        ".landing-page .hotline-inner",
        ".landing-page .site-footer-main",
        ".landing-page .site-footer-bottom"
    ];

    var all = document.querySelectorAll(selectors.join(","));
    if (!all.length) return;

    var revealQueue = [];
    Array.prototype.forEach.call(all, function (el) {
        if (el.classList.contains("ui-fly-in") || el.dataset.revealBound === "1") return;
        el.dataset.revealBound = "1";
        revealQueue.push(el);
    });

    if (!revealQueue.length) return;

    var reduceMotion = false;
    try {
        reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (e) {
        reduceMotion = false;
    }

    function revealElement(el, order) {
        if (!el || el.classList.contains("ui-fly-in")) return;
        el.style.setProperty("--fly-delay", (order * 0.06).toFixed(2) + "s");
        el.classList.add("ui-fly-in");
    }

    if (reduceMotion || typeof IntersectionObserver === "undefined") {
        Array.prototype.forEach.call(revealQueue, function (el, index) {
            revealElement(el, index);
        });
    } else {
        var revealedCount = 0;
        var io = new IntersectionObserver(function (entries, observer) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                revealElement(entry.target, revealedCount);
                revealedCount += 1;
                observer.unobserve(entry.target);
            });
        }, {
            root: null,
            rootMargin: "0px 0px -10% 0px",
            threshold: 0.12,
        });

        Array.prototype.forEach.call(revealQueue, function (el) {
            io.observe(el);
        });
    }

    var target = document.querySelector(".customer-content") || document.body;
    if (!target || target._uiFlyObserverAttached) return;
    target._uiFlyObserverAttached = true;

    var observer = new MutationObserver(function () {
        setupFlyInAnimations();
    });

    observer.observe(target, { childList: true, subtree: true });
}

function initDynamicCustomerUi() {
    if (typeof window === "undefined") return;
    setupAutoHideHeader();
    setupFlyInAnimations();
    setupFloatingContactRail();
}

function initAdminUiEffects() {
    if (typeof window === "undefined") return;
    var appLayout = document.querySelector(".app-layout");
    if (!appLayout) return;

    requestAnimationFrame(function () {
        appLayout.classList.add("page-ready");
    });

    var targets = appLayout.querySelectorAll(".page-title, .toolbar, .card, .stat-card, .report-card, .table-wrap");
    Array.prototype.forEach.call(targets, function (el, index) {
        if (el.classList.contains("ui-fly-in")) return;
        el.style.setProperty("--admin-delay", (index * 0.05).toFixed(2) + "s");
        el.classList.add("ui-fly-in");
    });

    var sidebarLinks = appLayout.querySelectorAll(".sidebar-nav a");
    Array.prototype.forEach.call(sidebarLinks, function (link) {
        link.addEventListener("click", function () {
            appLayout.classList.remove("page-ready");
        });
    });
}

enforceRoleAccessForCurrentPath();
initDynamicCustomerUi();
initAdminUiEffects();
setupHeaderAccountDropdown();

if (typeof window !== "undefined") {
    window.addEventListener("load", setupHeaderAccountDropdown);
    window.addEventListener("load", setupFloatingContactRail);
    window.uiAlert = uiAlert;
    window.uiConfirm = uiConfirm;
    window.alert = function (message) {
        uiAlert(message, "Thông báo");
    };
}

