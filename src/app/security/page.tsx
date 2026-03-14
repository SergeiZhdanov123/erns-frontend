import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function SecurityPage() {
    return (
        <main className="min-h-screen bg-background">
            <Navbar />
            <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-28 sm:pt-32 pb-16 sm:pb-20">
                <h1 className="text-3xl sm:text-4xl font-bold text-text-main mb-2">Security</h1>
                <p className="text-text-muted text-sm mb-10">How we protect your data and our infrastructure.</p>

                <div className="prose prose-invert prose-sm max-w-none space-y-8 text-text-muted leading-relaxed">
                    <section>
                        <h2 className="text-xl font-semibold text-text-main mb-3">Infrastructure Security</h2>
                        <p>Erns is hosted on secure cloud infrastructure. All data is encrypted in transit using TLS and at rest using AES-256 encryption.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-text-main mb-3">Authentication & Access</h2>
                        <p>We use Clerk for authentication with support for multi-factor authentication (MFA) and session management. API keys are hashed and never stored in plaintext.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-text-main mb-3">Data Protection</h2>
                        <p>Your financial data and personal information are stored in encrypted databases with access controls. We do not sell or share your personal data with third parties.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-text-main mb-3">Vulnerability Reporting</h2>
                        <p>We appreciate responsible vulnerability disclosure. If you discover a security issue, please report it to <span className="text-primary">security@tychefinancials.com</span>.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-text-main mb-3">Questions</h2>
                        <p>For security-related inquiries, contact <span className="text-primary">security@tychefinancials.com</span>.</p>
                    </section>
                </div>
            </div>
            <Footer />
        </main>
    );
}
