import React from 'react'
import { createBrowserRouter, RouterProvider, Outlet, useLocation } from 'react-router-dom'
import { SocketProvider } from './contexts/SocketContext'
import GlobalCallHandler from './components/GlobalCallHandler'
import Navbar from './components/Navbar'
import FooterSection from './components/Footer'
import Home from './pages/Home'
import AboutUs from './pages/AboutUs'
import ContactUs from './pages/ContactUs'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsAndConditions from './pages/TermsAndConditions'
// Admin
import AdminDashboard from './pages/admin/Dashboard'
import UserManagement from './pages/admin/UserManagement'
// Student
import StudentDashboard from './pages/students/Dashboard'
import MyGroupPage from './pages/students/MyGroup'
import SupervisorsList from './pages/students/SupervisorsList'
import Chabot from './pages/students/Chabot'
import TeamChat from './pages/students/TeamChat'
import AssignedTasks from './pages/students/AssignedTasks'
import MyGrades from './pages/students/MyGrades'
import StudentMilestones from './pages/students/StudentMilestones'
import StudentThesis from './pages/students/StudentThesis'
// Supervisor
import SupervisorDashboard from './pages/supervisor/Dashboard'
import Supervisionrequests from './pages/supervisor/SupervisionRequests'
import MyGroups from './pages/supervisor/MyGroups'
import TaskManagement from './pages/supervisor/ManageTasks'
import SupervisorGrading from './pages/supervisor/Grading'
import SupervisorTeamChat from './pages/supervisor/TeamChat'
// Coordinator
import CoordinatorDashboard from './pages/coordinator/Dashboard'
import CoordinatorMilestones from './pages/coordinator/Milestones'
import CoordinatorGrading from './pages/coordinator/Grading'
import CoordinatorDocumentManagement from './pages/coordinator/DocumentManagement'
import CoordinatorSampleDocuments from './pages/coordinator/SampleDocuments'
import CoordinatorAnnouncements from './pages/coordinator/Announcements'
// Common
import ProfilePage from './components/Profile'
import RestrictedRoutes from './components/RestrictedRoutes'
import UnauthorizedPage from './components/Unauthorized'

// Layout wrapper that includes GlobalCallHandler
const LayoutWithCallHandler = ({ children }) => {
  return (
    <>
      <GlobalCallHandler />
      {children}
    </>
  )
}

// Router definition
const router = createBrowserRouter([
  { path: "/", element: <LayoutWithCallHandler><Home /></LayoutWithCallHandler> },
  { path: "/about-us", element: <LayoutWithCallHandler><Navbar /><AboutUs /><FooterSection /></LayoutWithCallHandler> },
  { path: "/contact-us", element: <LayoutWithCallHandler><Navbar /><ContactUs /><FooterSection /></LayoutWithCallHandler> },
  { path: "/privacy-policy", element: <LayoutWithCallHandler><Navbar /><PrivacyPolicy /><FooterSection /></LayoutWithCallHandler> },
  { path: "/terms-and-conditions", element: <LayoutWithCallHandler><Navbar /><TermsAndConditions /><FooterSection /></LayoutWithCallHandler> },

  // Admin Routes
  {
    path: "/admin",
    element: <LayoutWithCallHandler><RestrictedRoutes rolesAllowed={['admin']}><Navbar /><Outlet /><FooterSection /></RestrictedRoutes></LayoutWithCallHandler>,
    children: [
      { path: "dashboard", element: <AdminDashboard /> },
      { path: "users", element: <UserManagement /> },
      { path: "profile", element: <ProfilePage /> }
    ]
  },

  // Student Routes
  {
    path: "/student",
    element: <LayoutWithCallHandler><RestrictedRoutes rolesAllowed={['student']}><Navbar /><Outlet /><FooterSection /></RestrictedRoutes></LayoutWithCallHandler>,
    children: [
      { path: "dashboard", element: <StudentDashboard /> },
      { path: "dashboard/supervisors", element: <SupervisorsList /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "fyp-group", element: <MyGroupPage /> },
      { path: "chatbot", element: <Chabot /> },
      { path: "assigned-tasks", element: <AssignedTasks /> },
      { path: "milestones", element: <StudentMilestones /> },
      { path: "my-grades", element: <MyGrades /> },
      { path: "team-chat", element: <TeamChat /> },
      { path: "thesis", element: <StudentThesis /> }
    ]
  },

  // Supervisor Routes
  {
    path: "/supervisor",
    element: <LayoutWithCallHandler><RestrictedRoutes rolesAllowed={['supervisor']}><Navbar /><Outlet /><FooterSection /></RestrictedRoutes></LayoutWithCallHandler>,
    children: [
      { path: "dashboard", element: <SupervisorDashboard /> },
      { path: "dashboard/supervision-requests", element: <Supervisionrequests /> },
      { path: "my-groups", element: <MyGroups /> },
      { path: "manage-tasks", element: <TaskManagement /> },
      { path: "grading", element: <SupervisorGrading /> },
      { path: "team-chat", element: <SupervisorTeamChat /> },
      { path: "profile", element: <ProfilePage /> }
    ]
  },

  // Coordinator Routes
  {
    path: "/coordinator",
    element: <LayoutWithCallHandler><RestrictedRoutes rolesAllowed={['coordinator']}><Navbar /><Outlet /><FooterSection /></RestrictedRoutes></LayoutWithCallHandler>,
    children: [
      { path: "dashboard", element: <CoordinatorDashboard /> },
      { path: "milestones", element: <CoordinatorMilestones /> },
      { path: "grading", element: <CoordinatorGrading /> },
      { path: "sample-documents", element: <CoordinatorSampleDocuments /> },
      { path: "documents", element: <CoordinatorDocumentManagement /> },
      { path: "announcements", element: <CoordinatorAnnouncements /> },
      { path: "profile", element: <ProfilePage /> }
    ]
  },

  { path: "/unauthorized", element: <LayoutWithCallHandler><UnauthorizedPage /></LayoutWithCallHandler> }
])

const App = () => (
  <SocketProvider>
    <RouterProvider router={router} />
  </SocketProvider>
)

export default App
