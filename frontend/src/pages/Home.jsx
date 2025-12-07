import React from 'react'
import Navbar from '../components/Navbar'
import HeroSection from '../components/Hero'
import Features from '@/components/Features'
import PortalsSection from '@/components/PortalsSection'
import AboutSnippet from '@/components/AboutSnippet'
import FooterSection from '@/components/Footer'
import SEO from '@/components/SEO'

const Home = () => {
  return (
    <>
    <SEO 
      title="FYP Buddy | Your Final Year Project Management Partner"
      description="FYP Buddy is a comprehensive Final Year Project management system that connects students, supervisors, and coordinators. Manage tasks, track milestones, collaborate with teams, and streamline your FYP journey."
      keywords="FYP management, Final Year Project, project management system, student portal, thesis management, supervisor collaboration, academic project tracking, FYP Buddy"
    />
    <Navbar />
    <HeroSection />
    <Features />
    <PortalsSection/>
    <AboutSnippet/>
    <FooterSection/>
    </>

  )
}

export default Home