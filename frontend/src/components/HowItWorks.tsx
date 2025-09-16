export default function HowItWorks() {
  const steps = [
    {
      id: 1,
      title: "Connect Your Wallet",
      description: "Link your Web3 wallet to access decentralized event ticketing features securely.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    },
    {
      id: 2,
      title: "Browse Events",
      description: "Explore a wide range of events from concerts to conferences, all powered by blockchain.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      id: 3,
      title: "Create Events",
      description: "Host your own events easily with our intuitive tools and blockchain-powered features.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
    },
    {
      id: 4,
      title: "Purchase Tickets",
      description: "Buy NFT-based tickets instantly with cryptocurrency or traditional payments.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
    {
      id: 5,
      title: "Attend Events",
      description: "Use your digital ticket to gain entry and enjoy seamless event experiences.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-muted/30" data-aos="fade-up">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16 fade-in" data-aos="fade-down">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 sm:mb-6">
            How It Works
          </h2>
          <p className="text-lg sm:text-xl text-foreground/70 max-w-2xl mx-auto px-4">
            Get started with Evenntz in four simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className="card p-6 sm:p-8 text-center group hover:scale-105 transition-all duration-300 slide-in"
              data-aos="fade-up"
              data-aos-delay={index * 200}
            >
              <div className="relative mb-4 sm:mb-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 glass rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <div className="text-foreground">{step.icon}</div>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                  {step.id}
                </div>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4">
                {step.title}
              </h3>
              <p className="text-sm sm:text-base text-foreground/70 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
