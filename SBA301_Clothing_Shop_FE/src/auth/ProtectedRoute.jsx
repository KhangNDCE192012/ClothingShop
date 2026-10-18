import {Navigate, useLocation} from "react-router-dom";
import useAuth from "./useAuth";

export default function ProtectedRoute({children, allowedRoles = []}) {
    const {user} = useAuth();
    const location = useLocation();

    if (!user) {
        return <Navigate to="/login" replace state={{from: location.pathname}} />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    return children;
}
