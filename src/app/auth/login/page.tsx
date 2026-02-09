'use client'

import { useState, useEffect, ChangeEvent, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'

interface FormData {
  email: string
  password: string
}

interface FormErrors {
  email?: string
  password?: string
  general?: string
}

export default function LoginPage() {
  const [formData, setFormData] = useState<FormData>({ email: '', password: '' })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isAnimated, setIsAnimated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimated(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = (): FormErrors => {
    const errs: FormErrors = {}
    if (!formData.email) errs.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errs.email = 'Email is invalid'
    if (!formData.password) errs.password = 'Password is required'
    else if (formData.password.length < 6) errs.password = 'Password must be at least 6 characters'
    return errs
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const errs = validateForm()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    // Demo shortcut: if demo email used, bypass backend and redirect (accept any password)
    if (formData.email === 'demo@example.com') {
      setIsLoading(true)
      try {
        const demoUser = { id: 'demo-user', name: 'Demo User', email: 'demo@example.com' }
        const demoToken = 'demo-token'
        localStorage.setItem('authToken', demoToken)
        localStorage.setItem('user', JSON.stringify(demoUser))
        router.push('/dashboard')
        return
      } finally {
        setIsLoading(false)
      }
    }

    setIsLoading(true)
    try {
      // Import the API service dynamically to avoid SSR issues
      const { authAPI } = await import('@/services/api')
      const response = await authAPI.login(formData.email, formData.password)
      
      if (response.success) {
        localStorage.setItem('authToken', response.token)
        localStorage.setItem('user', JSON.stringify(response.user))
        router.push('/dashboard')
      } else {
        setErrors({ general: response.message || 'Login failed. Please try again.' })
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      console.error('Login error:', error)
      setErrors({ general: err.response?.data?.message || 'Login failed. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoLogin = () => {
    const demoUser = { id: 'demo-user', name: 'Demo User', email: 'demo@example.com' }
    localStorage.setItem('authToken', 'demo-token')
    localStorage.setItem('user', JSON.stringify(demoUser))
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-blue-500 rounded-full opacity-10 animate-pulse"></div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-500 rounded-full opacity-10 animate-pulse animation-delay-2000"></div>
      </div>

      {/* Left Panel */}
      <div
        className={`flex-1 flex items-center justify-center transition-all duration-1000 ease-out overflow-hidden ${
          isAnimated ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'
        }`}
      >
        <div className="max-w-md p-8 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Welcome Back</h2>
          <p className="text-gray-200">Sign in to continue to your dashboard</p>
          <div className="mt-8 p-6 bg-white/10 rounded-xl shadow-lg">
            <span className="text-6xl font-bold">🌟</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div
        className={`flex-1 flex items-center justify-center transition-all duration-1000 ease-out ${
          isAnimated ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'
        }`}
      >
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-10 border border-white/20 w-full max-w-md mx-4">
          <div className="text-center mb-6">
            <Link href="/" className="text-blue-600 hover:text-blue-700 transition-colors text-sm mb-2 inline-block">
              ← Back to Home
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Sign In</h1>
            <p className="text-gray-600">Access your dashboard</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className={`w-full px-4 py-3 border rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className={`w-full px-4 py-3 border rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.password ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password}</p>}
            </div>

            {errors.general && <p className="text-red-600 text-sm">{errors.general}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>

            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 transition-all"
            >
              🚀 Try Demo Account
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">Or continue with</span>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={() => signIn('google')}
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                <svg className="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 0C4.477 0 0 4.477 0 10c0 4.418 2.865 8.166 6.839 9.49.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.03-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.378.203 2.398.1 2.65.64.7 1.028 1.595 1.028 2.688 0 3.848-2.338 4.695-4.566 4.943.359.308.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.001 10.001 0 0020 10c0-5.523-4.477-10-10-10z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="ml-2">Sign in with Google</span>
              </button>
            </div>
          </form>

          <div className="text-center mt-6">
            <p className="text-gray-600">
              Don&apos;t have an account?{' '}
              <Link href="/auth/register" className="text-blue-600 hover:underline">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
