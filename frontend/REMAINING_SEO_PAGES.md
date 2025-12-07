# Remaining Pages for SEO Implementation

This document lists pages that can benefit from SEO implementation. Add the SEO component to these pages as needed.

## Student Portal Pages

### Already Implemented ✅
- Dashboard
- My FYP Group
- Assigned Tasks
- Project Milestones

### To Implement (Optional)

#### Supervisors List
**File**: `frontend/src/pages/students/SupervisorsList.jsx`
```jsx
<SEO 
  title="Browse Supervisors | FYP Buddy - Find Your Mentor"
  description="Browse available supervisors for your Final Year Project. View supervisor profiles, expertise areas, and send supervision requests."
  keywords="FYP supervisors, project mentors, supervisor list, thesis advisor, academic supervisor"
/>
```

#### Chatbot
**File**: `frontend/src/pages/students/Chabot.jsx`
```jsx
<SEO 
  title="AI Chatbot | FYP Buddy - Get Instant Help"
  description="Get instant help with your FYP questions using our AI-powered chatbot. Ask about project guidelines, deadlines, and best practices."
  keywords="FYP chatbot, AI assistant, project help, instant support, academic chatbot"
/>
```

#### Team Chat
**File**: `frontend/src/pages/students/TeamChat.jsx`
```jsx
<SEO 
  title="Team Chat | FYP Buddy - Collaborate with Your Group"
  description="Chat with your FYP team members in real-time. Share ideas, discuss progress, and collaborate effectively on your project."
  keywords="team chat, group communication, project collaboration, real-time messaging, team messaging"
/>
```

#### My Grades
**File**: `frontend/src/pages/students/MyGrades.jsx`
```jsx
<SEO 
  title="My Grades | FYP Buddy - Track Your Performance"
  description="View your FYP grades and performance feedback. Track your progress and see detailed evaluations from your supervisor."
  keywords="FYP grades, project evaluation, performance tracking, academic grades, thesis marks"
/>
```

#### Student Thesis
**File**: `frontend/src/pages/students/StudentThesis.jsx`
```jsx
<SEO 
  title="My Thesis | FYP Buddy - Manage Your Document"
  description="Manage your thesis document. Upload drafts, track revisions, and submit your final thesis for evaluation."
  keywords="thesis management, thesis document, thesis submission, final thesis, thesis drafts"
/>
```

## Supervisor Portal Pages

### Already Implemented ✅
- Dashboard

### To Implement (Optional)

#### Supervision Requests
**File**: `frontend/src/pages/supervisor/SupervisionRequests.jsx`
```jsx
<SEO 
  title="Supervision Requests | FYP Buddy - Review Student Requests"
  description="Review and manage student supervision requests. Accept or decline requests to supervise Final Year Projects."
  keywords="supervision requests, student requests, FYP supervision, project mentoring, supervisor portal"
/>
```

#### My Groups
**File**: `frontend/src/pages/supervisor/MyGroups.jsx`
```jsx
<SEO 
  title="My Groups | FYP Buddy - Manage Student Teams"
  description="View and manage all student groups under your supervision. Monitor progress, communicate with teams, and provide guidance."
  keywords="supervised groups, student teams, project groups, supervisor management, team oversight"
/>
```

#### Task Management
**File**: `frontend/src/pages/supervisor/ManageTasks.jsx`
```jsx
<SEO 
  title="Task Management | FYP Buddy - Assign Student Tasks"
  description="Create and manage tasks for your supervised groups. Set deadlines, track submissions, and provide feedback."
  keywords="task management, assign tasks, student tasks, project assignments, task tracking"
/>
```

#### Grading
**File**: `frontend/src/pages/supervisor/Grading.jsx`
```jsx
<SEO 
  title="Grading | FYP Buddy - Evaluate Student Work"
  description="Grade student submissions and provide feedback. Evaluate project milestones, tasks, and final deliverables."
  keywords="student grading, project evaluation, grade submissions, academic assessment, thesis grading"
/>
```

#### Team Chat
**File**: `frontend/src/pages/supervisor/TeamChat.jsx`
```jsx
<SEO 
  title="Team Chat | FYP Buddy - Communicate with Students"
  description="Chat with your supervised student groups. Provide guidance, answer questions, and facilitate team communication."
  keywords="supervisor chat, student communication, team guidance, project discussion, mentor chat"
/>
```

## Coordinator Portal Pages

### Already Implemented ✅
- Dashboard

### To Implement (Optional)

#### Milestones
**File**: `frontend/src/pages/coordinator/Milestones.jsx`
```jsx
<SEO 
  title="Milestones Management | FYP Buddy - Coordinate Project Phases"
  description="Manage FYP milestones and project phases. Set deadlines, track submissions, and coordinate project timelines."
  keywords="milestone management, project phases, FYP coordination, deadline management, project timeline"
/>
```

#### Grading
**File**: `frontend/src/pages/coordinator/Grading.jsx`
```jsx
<SEO 
  title="Grading Overview | FYP Buddy - Monitor All Evaluations"
  description="Overview of all FYP grades and evaluations. Monitor grading progress and ensure fair assessment across all projects."
  keywords="grading overview, evaluation monitoring, FYP grades, academic assessment, coordinator grading"
/>
```

#### Document Management
**File**: `frontend/src/pages/coordinator/DocumentManagement.jsx`
```jsx
<SEO 
  title="Document Management | FYP Buddy - Manage Project Documents"
  description="Manage all FYP documents and submissions. Review, approve, and organize project documentation."
  keywords="document management, project documents, thesis management, document review, file management"
/>
```

#### Sample Documents
**File**: `frontend/src/pages/coordinator/SampleDocuments.jsx`
```jsx
<SEO 
  title="Sample Documents | FYP Buddy - Templates & Examples"
  description="Access sample documents and templates for FYP projects. Provide students with guidelines and examples."
  keywords="sample documents, FYP templates, project examples, document templates, thesis samples"
/>
```

#### Announcements
**File**: `frontend/src/pages/coordinator/Announcements.jsx`
```jsx
<SEO 
  title="Announcements | FYP Buddy - Broadcast Updates"
  description="Create and manage announcements for all FYP participants. Keep students and supervisors informed about important updates."
  keywords="FYP announcements, project updates, coordinator announcements, important notices, system updates"
/>
```

## Admin Portal Pages

### Already Implemented ✅
- Dashboard

### To Implement (Optional)

#### User Management
**File**: `frontend/src/pages/admin/UserManagement.jsx`
```jsx
<SEO 
  title="User Management | FYP Buddy - Manage System Users"
  description="Manage all system users including students, supervisors, and coordinators. Create, update, and delete user accounts."
  keywords="user management, admin panel, user accounts, system administration, user control"
/>
```

## Common Pages

#### Profile Page
**File**: `frontend/src/components/Profile.jsx`
```jsx
<SEO 
  title="My Profile | FYP Buddy - Manage Your Account"
  description="View and update your profile information. Manage your account settings and personal details."
  keywords="user profile, account settings, profile management, personal information, account details"
/>
```

#### Unauthorized Page
**File**: `frontend/src/components/Unauthorized.jsx`
```jsx
<SEO 
  title="Unauthorized Access | FYP Buddy"
  description="You don't have permission to access this page. Please contact your administrator if you believe this is an error."
  keywords="unauthorized, access denied, permission error"
/>
```

## Implementation Instructions

1. Import the SEO component at the top of the file:
   ```jsx
   import SEO from '@/components/SEO'
   ```

2. Add the SEO component inside the return statement (wrap with fragment if needed):
   ```jsx
   return (
     <>
       <SEO 
         title="Your Title"
         description="Your description"
         keywords="your, keywords"
       />
       {/* Rest of your component */}
     </>
   )
   ```

3. Customize the title, description, and keywords based on the page content

## Notes

- Private portal pages (student, supervisor, coordinator, admin) are blocked in robots.txt
- SEO for these pages still helps with:
  - Browser tab titles
  - Bookmarks
  - Social sharing (if users share links)
  - Internal search
  - User experience

---

**Priority**: Implement SEO for public-facing pages first, then portal pages as needed.
