export default function VerifyPage() {
    return (
        <main className="min-h-screen flex items-center justify-center px-6 py-24">
            <div className="w-full max-w-md text-center">
                <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                </div>
                <h1 className="text-3xl font-black tracking-tight mb-3">Check your email</h1>
                <p className="text-neutral-400 text-sm leading-relaxed">
                    We sent you a confirmation link. Click it to activate your account and access your library.
                </p>
                <a href="/auth/signin" className="inline-block mt-8 text-sm text-neutral-500 hover:text-white transition">
                    Back to Sign In
                </a>
            </div>
        </main>
    )
}