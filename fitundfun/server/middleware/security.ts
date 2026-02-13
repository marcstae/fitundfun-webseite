/**
 * Security Headers Middleware
 * 
 * Adds important security headers to all responses
 */
export default defineEventHandler((event) => {
  // Skip for non-HTML responses (API routes, assets, etc.)
  const path = event.path || ''
  
  // Content Security Policy
  // Allows self-hosted resources and external fonts/images
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Nuxt requires unsafe-inline/eval in dev
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' http://localhost:* ws://localhost:*", // For dev & API
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ')
  
  setResponseHeaders(event, {
    // Prevent XSS attacks
    'X-Content-Type-Options': 'nosniff',
    
    // Prevent clickjacking
    'X-Frame-Options': 'DENY',
    
    // Enable browser XSS filter
    'X-XSS-Protection': '1; mode=block',
    
    // Control referrer information
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Content Security Policy
    'Content-Security-Policy': csp,
    
    // Permissions Policy (formerly Feature-Policy)
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  })
})
