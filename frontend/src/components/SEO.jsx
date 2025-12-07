import React from 'react'
import { Helmet } from 'react-helmet-async'

const SEO = ({ 
  title = 'FYP Buddy | Your Project Partner',
  description = 'FYP Buddy - A comprehensive Final Year Project management system for students, supervisors, and coordinators.',
  keywords = 'FYP, Final Year Project, project management, thesis, student portal, supervisor, coordinator',
  author = 'FYP Buddy',
  ogImage = '/icon.png',
  ogType = 'website'
}) => {
  const siteUrl = window.location.origin
  const currentUrl = window.location.href

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      <meta name="robots" content="index, follow" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={`${siteUrl}${ogImage}`} />
      <meta property="og:site_name" content="FYP Buddy" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={currentUrl} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={`${siteUrl}${ogImage}`} />

      {/* Canonical URL */}
      <link rel="canonical" href={currentUrl} />
    </Helmet>
  )
}

export default SEO
