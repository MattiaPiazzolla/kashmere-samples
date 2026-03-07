import AuthForm from '@/components/auth/AuthForm'

export default function SignUpPage({
    searchParams,
}: {
    searchParams: { error?: string }
}) {
    return <AuthForm mode="signup" error={searchParams.error} />
}