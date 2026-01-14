'use client';

interface Testimonial {
  id: string;
  text: string;
  author: string;
  role?: string;
}

interface TestimonialsSectionProps {
  testimonials?: Testimonial[];
}

export default function TestimonialsSection({ testimonials = [] }: TestimonialsSectionProps) {
  // Component structure ready for testimonials
  // Pass an array of testimonials via props when ready

  if (testimonials.length === 0) {
    // Show placeholder or nothing when no testimonials are provided
    return null;
  }

  return (
    <div className="w-full space-y-6">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-light text-gray-900 mb-2">
          What others are saying
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testimonials.map((testimonial) => (
          <div
            key={testimonial.id}
            className="card space-y-4"
          >
            <p className="text-gray-700 leading-relaxed">
              &ldquo;{testimonial.text}&rdquo;
            </p>
            <div className="pt-2 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-900">
                {testimonial.author}
              </p>
              {testimonial.role && (
                <p className="text-xs text-gray-500 mt-1">
                  {testimonial.role}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
