// app/auth/signin/page.tsx
import AuthForm from '@/components/auth/AuthForm'

export default function SignInPage({
    searchParams,
}: {
    searchParams: { error?: string }
}) {
    return <AuthForm mode="signin" error={searchParams.error} />
}