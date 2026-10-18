const AUTH_API_URL = "http://localhost:8080/api/auth";
const AUTH_STORAGE_KEY = "clothingShopAuth";

async function readError(response, fallbackMessage) {
    try {
        const body = await response.json();
        return body.detail || body.message || fallbackMessage;
    } catch {
        return fallbackMessage;
    }
}

export async function login(username, password) {
    const response = await fetch(`${AUTH_API_URL}/login`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({username, password}),
    });

    if (!response.ok) {
        throw new Error(await readError(response, "Đăng nhập không thành công"));
    }

    const result = await response.json();
    const session = {
        token: result.token,
        tokenType: result.tokenType || "Bearer",
        expiresAt: Date.now() + Number(result.expiresIn || 0) * 1000,
        user: {
            id: result.userId,
            username: result.username,
            fullName: result.fullName,
            role: result.role,
        },
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    return session;
}

export function getSession() {
    try {
        const value = localStorage.getItem(AUTH_STORAGE_KEY);
        if (!value) return null;

        const session = JSON.parse(value);
        if (!session.token || !session.user || session.expiresAt <= Date.now()) {
            logout();
            return null;
        }

        return session;
    } catch {
        logout();
        return null;
    }
}

export function getAccessToken() {
    return getSession()?.token || null;
}

export function logout() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
}
