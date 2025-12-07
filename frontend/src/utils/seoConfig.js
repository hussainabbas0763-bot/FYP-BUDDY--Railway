// SEO Configuration for FYP Buddy
export const seoConfig = {
  defaultTitle: 'FYP Buddy | Your Final Year Project Management Partner',
  defaultDescription: 'FYP Buddy - A comprehensive Final Year Project management system for students, supervisors, and coordinators.',
  defaultKeywords: 'FYP, Final Year Project, project management, thesis, student portal, supervisor, coordinator',
  siteUrl: typeof window !== 'undefined' ? window.location.origin : '',
  
  pages: {
    home: {
      title: 'FYP Buddy | Your Final Year Project Management Partner',
      description: 'FYP Buddy is a comprehensive Final Year Project management system that connects students, supervisors, and coordinators. Manage tasks, track milestones, collaborate with teams, and streamline your FYP journey.',
      keywords: 'FYP management, Final Year Project, project management system, student portal, thesis management, supervisor collaboration, academic project tracking'
    },
    about: {
      title: 'About Us | FYP Buddy - Your Project Management Solution',
      description: 'Learn about FYP Buddy, an intelligent collaborative platform designed to simplify the Final Year Project journey for students, supervisors, and coordinators.',
      keywords: 'about FYP Buddy, project management platform, academic collaboration, FYP solution'
    },
    contact: {
      title: 'Contact Us | FYP Buddy - Get in Touch',
      description: 'Have questions about FYP Buddy? Contact our team for support, inquiries, or feedback.',
      keywords: 'contact FYP Buddy, support, help, inquiries, FYP assistance'
    },
    student: {
      dashboard: {
        title: 'Student Dashboard | FYP Buddy - Manage Your Project',
        description: 'Access your student dashboard. View your FYP group, track tasks, check milestones, and manage your final year project.',
        keywords: 'student dashboard, FYP management, project tasks, thesis tracking, student portal'
      },
      myGroup: {
        title: 'My FYP Group | FYP Buddy - Team Collaboration',
        description: 'View and manage your FYP group. Collaborate with team members, track group progress, and communicate effectively.',
        keywords: 'FYP group, team collaboration, group management, student team'
      },
      tasks: {
        title: 'Assigned Tasks | FYP Buddy - Track Your Work',
        description: 'View and manage your assigned tasks. Track deadlines, submit work, and stay organized with your FYP responsibilities.',
        keywords: 'assigned tasks, task management, project deadlines, student tasks'
      },
      milestones: {
        title: 'Project Milestones | FYP Buddy - Track Progress',
        description: 'Monitor your FYP milestones and track project progress. Stay on schedule with important deadlines and deliverables.',
        keywords: 'project milestones, progress tracking, FYP deadlines, thesis milestones'
      }
    },
    supervisor: {
      dashboard: {
        title: 'Supervisor Dashboard | FYP Buddy - Manage Student Projects',
        description: 'Supervisor dashboard for managing student groups, reviewing requests, assigning tasks, and monitoring project progress.',
        keywords: 'supervisor dashboard, FYP supervision, student management, project grading'
      }
    },
    coordinator: {
      dashboard: {
        title: 'Coordinator Dashboard | FYP Buddy - Oversee All Projects',
        description: 'Coordinator dashboard for managing milestones, overseeing grading, handling documents, and coordinating FYP activities.',
        keywords: 'coordinator dashboard, FYP coordination, project oversight, milestone management'
      }
    },
    admin: {
      dashboard: {
        title: 'Admin Dashboard | FYP Buddy - System Management',
        description: 'Admin dashboard for managing users, overseeing system operations, and maintaining the FYP platform.',
        keywords: 'admin dashboard, user management, system administration, FYP admin'
      }
    }
  }
}

export default seoConfig
