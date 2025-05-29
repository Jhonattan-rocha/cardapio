export const LOGIN_REQUEST: string = "LOGIN_REQUEST";
export const LOGIN_SUCCESS: string = "LOGIN_SUCCESS";
export const LOGIN_FALURE: string = "LOGIN_FALURE";
export const LOGOUT: string = "LOGOUT";

export interface AuthState {
    isLoggedIn: boolean,
    token: string,
    user: {
        username: string,
        id: number
    }
}

export interface ActionProps {
    type: string;
    payload?: object;
}

export interface FauleProps {
    error: string;
}

export interface SuccessProps {
    message: string;
}

export interface LoggedActionProps extends ActionProps {
    payload?: { token: string, email: string, id: number }
}

export interface LoggedPayloadProps {
    token: string; 
    id: number;
}