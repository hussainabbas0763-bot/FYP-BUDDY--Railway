import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'

const RestrictedRoutes = ({ rolesAllowed, children }) => {
  const { user } = useSelector(state => state.auth) || {}

  if (!user) {
    return <Navigate to="/" replace />
  }

  if (!rolesAllowed.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children ? <>{children}</> : <Outlet />
}

export default RestrictedRoutes
