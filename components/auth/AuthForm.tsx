// components/auth/AuthForm.tsx
'use client'

import { useState, useTransition } from 'react'
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '@/app/(auth)/auth/actions'

type AuthFormProps = {
    mode: 'signin' | 'signup'
    error?: string
}

export default function AuthForm({ mode: initialMode, error: initialError }: AuthFormProps) {
    const [mode, setMode] = useState(initialMode)
    const [error, setError] = useState(initialError)
    const [isPending, startTransition] = useTransition()
    const isSignIn = mode === 'signin'

    const switchMode = (next: 'signin' | 'signup') => {
        setError(undefined)
        setMode(next)
    }

    return (
        <div className="w-full min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-neutral-950">

            {/* LOGO */}
            <a
                href="/"
                className="text-white font-black text-xl tracking-tight mb-8 hover:opacity-60 transition-opacity"
            >
                KASHMERE
            </a>

            {/* CARD */}
            <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl">

                {/* TAB SWITCHER */}
                <div className="flex p-1.5 gap-1 bg-neutral-950 rounded-t-2xl">
                    <button
                        onClick={() => switchMode('signin')}
                        className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all duration-200 ${isSignIn
                            ? 'bg-neutral-800 text-white'
                            : 'text-neutral-500 hover:text-neutral-300'
                            }`}
                    >
                        Sign In
                    </button>
                    <button
                        onClick={() => switchMode('signup')}
                        className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all duration-200 ${!isSignIn
                            ? 'bg-neutral-800 text-white'
                            : 'text-neutral-500 hover:text-neutral-300'
                            }`}
                    >
                        Sign Up
                    </button>
                </div>

                {/* DIVIDER */}
                <div className="h-px bg-neutral-800" />

                {/* BODY */}
                <div className="px-6 py-7 space-y-5">

                    {/* HEADING */}
                    <div>
                        <h1 className="text-lg font-black tracking-tight text-white">
                            {isSignIn ? 'Welcome back.' : 'Create your account.'}
                        </h1>
                        <p className="text-neutral-500 text-sm mt-1">
                            {isSignIn
                                ? 'Access your library and downloads.'
                                : 'Save favorites and track your orders.'}
                        </p>
                    </div>

                    {/* ERROR */}
                    {error && (
                        <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3.5 py-3 rounded-xl">
                            <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* GOOGLE */}
                    <form action={signInWithGoogle}>
                        <button
                            type="submit"
                            className="w-full flex items-center justify-center gap-2.5 bg-white text-black text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-neutral-100 active:scale-[0.98] transition-all"
                        >
                            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84z" />
                            </svg>
                            Continue with Google
                        </button>
                    </form>

                    {/* DIVIDER */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-neutral-800" />
                        <span className="text-neutral-600 text-xs">or email</span>
                        <div className="flex-1 h-px bg-neutral-800" />
                    </div>

                    {/* EMAIL FORM */}
                    <form
                        action={isSignIn ? signInWithEmail : signUpWithEmail}
                        className="space-y-3"
                        onSubmit={() => startTransition(() => { })}
                    >
                        {!isSignIn && (
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider" htmlFor="full_name">
                                    Full Name
                                </label>
                                <input
                                    id="full_name"
                                    name="full_name"
                                    type="text"
                                    required
                                    autoComplete="name"
                                    placeholder="Your name"
                                    className="w-full bg-neutral-950 border border-neutral-700 text-white text-sm px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-white focus:ring-1 focus:ring-white/10 placeholder:text-neutral-600 transition-all"
                                />
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider" htmlFor="email">
                                Email
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                autoComplete="email"
                                placeholder="you@example.com"
                                className="w-full bg-neutral-950 border border-neutral-700 text-white text-sm px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-white focus:ring-1 focus:ring-white/10 placeholder:text-neutral-600 transition-all"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider" htmlFor="password">
                                    Password
                                </label>
                                {isSignIn && (
                                    <a href="/auth/forgot-password" className="text-xs text-neutral-600 hover:text-white transition-colors">
                                        Forgot?
                                    </a>
                                )}
                            </div>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                autoComplete={isSignIn ? 'current-password' : 'new-password'}
                                placeholder={isSignIn ? '••••••••' : 'Min. 8 characters'}
                                minLength={8}
                                className="w-full bg-neutral-950 border border-neutral-700 text-white text-sm px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-white focus:ring-1 focus:ring-white/10 placeholder:text-neutral-600 transition-all"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full flex items-center justify-center gap-2 bg-white text-black text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-neutral-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {isPending ? (
                                <>
                                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                    </svg>
                                    {isSignIn ? 'Signing in...' : 'Creating account...'}
                                </>
                            ) : (
                                isSignIn ? 'Sign In' : 'Create Account'
                            )}
                        </button>
                    </form>

                    {/* TERMS */}
                    {!isSignIn && (
                        <p className="text-neutral-600 text-xs text-center leading-relaxed">
                            By signing up you agree to our{' '}
                            <a href="/terms" className="text-neutral-500 hover:text-white underline underline-offset-2 transition-colors">Terms</a>
                            {' '}and{' '}
                            <a href="/privacy" className="text-neutral-500 hover:text-white underline underline-offset-2 transition-colors">Privacy Policy</a>.
                        </p>
                    )}

                </div>
            </div>

            {/* BACK TO STORE */}
            <p className="text-neutral-600 text-xs mt-5">
                <a href="/" className="hover:text-neutral-400 transition-colors underline underline-offset-2">
                    ← Back to store
                </a>
            </p>

        </div>
    )
}