export default function LicensingPage() {
    return (
        <main className="min-h-screen px-6 py-24 max-w-3xl mx-auto">
            <h1 className="text-4xl font-black tracking-tight mb-6">Licensing</h1>

            <div className="space-y-12 text-neutral-300 leading-relaxed">

                {/* ROYALTY FREE */}
                <section>
                    <div className="inline-block text-xs font-bold px-3 py-1 rounded-full bg-neutral-800 text-neutral-300 mb-4 uppercase tracking-wider">
                        Royalty Free
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-3">Royalty Free License</h2>
                    <div className="space-y-3">
                        <p>
                            A Royalty Free license grants you the right to use the purchased beat or sample in your own music productions without paying ongoing royalties.
                        </p>
                        <p>
                            Your release may be distributed on all major streaming platforms, sold digitally, and used in non-commercial content — subject to KashmereSamples general terms of use.
                        </p>
                        <p>
                            Royalty Free beats and samples are non-exclusive. The same content may be licensed to other buyers.
                        </p>
                        <p className="text-neutral-500 text-sm">
                            Credit to Kashmere is appreciated but not required under this license.
                        </p>
                    </div>
                </section>

                {/* EXCLUSIVE */}
                <section>
                    <div className="inline-block text-xs font-bold px-3 py-1 rounded-full bg-white text-black mb-4 uppercase tracking-wider">
                        Exclusive
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-3">Exclusive License</h2>
                    <div className="space-y-3">
                        <p>
                            An Exclusive license is a full buyout. Once purchased, the beat or sample is permanently removed from the store and will not be licensed to any other buyer.
                        </p>
                        <p>
                            You receive exclusive rights to use the content in your productions commercially and non-commercially, across all platforms and media.
                        </p>
                        <p>
                            Kashmere retains authorship credit and the right to list the work in their portfolio. All other rights transfer to the buyer upon confirmed payment.
                        </p>
                        <p className="text-neutral-500 text-sm">
                            Exclusive licenses are final. No refunds once the file has been delivered.
                        </p>
                    </div>
                </section>

                {/* GENERAL NOTE */}
                <section className="border-t border-neutral-800 pt-8">
                    <p className="text-neutral-500 text-sm">
                        These descriptions are summaries for informational purposes only. Full legal terms are outlined in the KashmereSamples Terms of Use. If you have specific licensing questions, please contact us directly.
                    </p>
                </section>

            </div>
        </main>
    )
}