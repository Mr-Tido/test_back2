import { Navigate,Outlet} from "react-router-dom"
export default function PortectedRoute({isAuth}){
    if(!isAuth){
        return <Navigate to={'/'} replace/>
    }
    return <Outlet/>
}