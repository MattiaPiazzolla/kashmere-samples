export default function PrivacyPage() {
    return (
        <main className="min-h-screen px-6 py-24 max-w-3xl mx-auto">
            <h1 className="text-4xl font-black tracking-tight mb-2">Privacy Policy</h1>
            <p className="text-neutral-500 text-sm mb-12">Last updated: 2025</p>

            <div className="space-y-10 text-neutral-300 leading-relaxed">

                <section>
                    <h2 className="text-xl font-bold text-white mb-3">1. Information We Collect</h2>
                    <p>
                        We collect information you provide directly — such as your name, email address, and payment details when you make a purchase or create an account. We also collect basic usage data to improve the platform.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-white mb-3">2. How We Use Your Information</h2>
                    <p>
                        Your information is used to process purchases, deliver digital files, send purchase confirmations, and provide customer support. We do not sell your personal data to third parties.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-white mb-3">3. Payment Processing</h2>
                    <p>
                        Payments are processed securely by Stripe and PayPal. KashmereSamples does not store your full payment card details. Please review the privacy policies of Stripe and PayPal for details on how they handle your payment information.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-white mb-3">4. Cookies</h2>
                    <p>
                        We use essential cookies to manage authentication sessions. We do not use tracking or advertising cookies.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-white mb-3">5. Data Retention</h2>
                    <p>
                        We retain your account and purchase data for as long as your account is active or as required to fulfill legal obligations. You may request deletion of your account and associated data by contacting us.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-white mb-3">6. Your Rights</h2>
                    <p>
                        Depending on your location, you may have rights to access, correct, or delete your personal data. To exercise these rights, please contact us directly.
                    </p>
                </section>

                <section className="border-t border-neutral-800 pt-8">
                    <p className="text-neutral-500 text-sm">
                        For privacy-related questions, please contact us directly.
                    </p>
                </section>

            </div>
        </main>
    )
}