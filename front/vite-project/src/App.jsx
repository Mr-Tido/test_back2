import { useState } from "react"
import {BrowserRouter, Route, Routes,Navigate} from "react-router-dom"
import  ProtectedRoute  from "./ProtectedRoute/ProtectedRoute"
import Page2 from "./page 2 /page2.jsx"
import Page1 from "./Page1/Page1.jsx"
export default function App() {
  const [token, setToken]= useState(localStorage.getItem('token'))
  const isAuth = !!token
  return (
     <BrowserRouter>
            <Routes>
                <Route index element={<Page1/>} />
                  
                  <Route element = {<ProtectedRoute isAuth={isAuth}/>}>
                    <Route path="/Page2" element = {<Page2/>}/>
                  </Route>
                  
                   <Route path='*' element = {<Navigate to = '/' replace/>}/>
            </Routes>
      </BrowserRouter>
  )
}



