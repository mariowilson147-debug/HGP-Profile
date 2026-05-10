"use client";

import { useChat } from "@/components/ChatProvider";

export default function FAQPage() {
  const { openChat } = useChat();
  const faqs = [
    {
      q: "How do I request a quote for wholesale orders?",
      a: "You can request a quote directly from any product page by clicking the 'Contact Sales' button. This will connect you with our sales team via WhatsApp, where you can discuss wholesale pricing and bulk order requirements."
    },
    {
      q: "What is your return and exchange policy?",
      a: "We offer a 30-day return policy for unused items in their original packaging. For defective products, please contact our support team within 7 days of delivery for a replacement or refund."
    },
    {
      q: "Do you offer international shipping?",
      a: "Currently, we focus on domestic distribution. However, for large wholesale orders, we can arrange international shipping on a case-by-case basis. Please contact our sales team to discuss logistics."
    },
    {
      q: "How often is the product catalog updated?",
      a: "Our digital catalog is updated in real-time. Whenever a new product is added or stock levels change, the updates are instantly reflected on the platform to ensure you have the most accurate information."
    },
    {
      q: "Can I get a physical sample before placing a bulk order?",
      a: "Yes, we provide sample units for businesses interested in large wholesale orders. Samples are billed at retail price but the cost is credited towards your final bulk purchase."
    }
  ];

  return (
    <div className="w-full max-w-3xl mx-auto px-6 py-16 font-sans">
      <h1 className="text-4xl font-display font-bold text-slate-900 mb-4">Help Center & FAQ</h1>
      <p className="text-slate-500 mb-12 text-lg">Find answers to common questions about our products, ordering process, and policies.</p>
      
      <div className="space-y-6">
        {faqs.map((faq, index) => (
          <div key={index} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">{faq.q}</h3>
            <p className="text-slate-600 leading-relaxed">{faq.a}</p>
          </div>
        ))}
      </div>
      
      <div className="mt-16 bg-slate-900 rounded-2xl p-8 text-center">
        <h3 className="text-xl font-bold text-white mb-3">Still have questions?</h3>
        <p className="text-slate-300 mb-6">Our support team is always ready to help you with any inquiries.</p>
        <button onClick={() => openChat("Hi Support Team, I have a question regarding:")} className="inline-flex px-6 py-3 bg-white text-slate-900 font-medium rounded-lg hover:bg-slate-100 transition-colors">
          Contact Support
        </button>
      </div>
    </div>
  );
}
