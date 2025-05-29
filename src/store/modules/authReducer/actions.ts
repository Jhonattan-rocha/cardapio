import * as types from '../types'

export function Loguot(){
    return {
        type: types.LOGOUT,
    };
}

export function LoginFALURE(payload: types.FauleProps){
    return  {
        type: types.LOGIN_FALURE,
        payload: payload,
    };
}

export function LoginSuccess(payload: types.LoggedPayloadProps){
    return  {
        type: types.LOGIN_SUCCESS,
        payload: payload,
    };
}
