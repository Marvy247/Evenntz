export default function Testimonials() {
  const testimonials = [
    {
      id: 1,
      name: "Sarah Johnson",
      role: "Event Organizer",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
      rating: 5,
      quote: "Evenntz revolutionized how I manage events. The blockchain integration ensures every ticket is secure and verifiable. My attendees love the seamless experience!",
    },
    {
      id: 2,
      name: "Michael Chen",
      role: "Music Festival Attendee",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      rating: 5,
      quote: "As someone who travels for concerts, Evenntz makes buying tickets so much easier. No more worrying about counterfeit tickets or scalpers. Highly recommend!",
    },
    {
      id: 3,
      name: "Emma Rodriguez",
      role: "Conference Speaker",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      rating: 5,
      quote: "The NFT tickets are a game-changer for networking events. I can easily verify attendees and create exclusive experiences. Evenntz is the future of event ticketing.",
    },
    {
      id: 4,
      name: "David Kim",
      role: "Event Organizer",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      rating: 5,
      quote: "As an event organizer, Evenntz has transformed how I host events. The blockchain features make ticket management secure and transparent. My attendees love the NFT tickets!",
    },
  ];

  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex gap-1">
      {[...Array(5)].map((_, i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
          viewBox="0 0 24 24"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );

  return (
    <section className="py-16 sm:py-20 lg:py-24" data-aos="fade-up">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16 fade-in" data-aos="fade-down">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 sm:mb-6">
            What Our Users Say
          </h2>
          <p className="text-lg sm:text-xl text-foreground/70 max-w-2xl mx-auto px-4">
            Join thousands of satisfied users who trust Evenntz for their event experiences
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.id}
              className="card p-6 sm:p-8 group hover:scale-105 transition-all duration-300 slide-in"
              data-aos="fade-up"
              data-aos-delay={index * 200}
            >
              <div className="flex items-start gap-4">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <StarRating rating={testimonial.rating} />
                  </div>
                  <blockquote className="text-sm sm:text-base text-foreground/80 leading-relaxed mb-4 italic">
                    "{testimonial.quote}"
                  </blockquote>
                  <div>
                    <div className="font-semibold text-foreground">{testimonial.name}</div>
                    <div className="text-sm text-foreground/60">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
