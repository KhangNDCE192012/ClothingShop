import {useMemo, useState} from "react";
import * as authService from "../services/AuthService";
import AuthContext from "./authContextStore";

export function AuthProvider({children}) {
    const [session, setSession] = useState(() => authService.getSession());

    const value = useMemo(() => ({
        session,
        user: session?.user || null,
        token: session?.token || null,
        async login(username, password) {
            const nextSession = await authService.login(username, password);
            setSession(nextSession);
            return nextSession;
        },
        logout() {
            authService.logout();
            setSession(null);
        },
    }), [session]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
