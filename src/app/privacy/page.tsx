export default function PrivacyPage() {
  return (
    <div className="w-full max-w-3xl mx-auto px-6 py-16 font-sans">
      <h1 className="text-4xl font-display font-bold text-slate-900 mb-8">Privacy Policy</h1>
      
      <div className="space-y-8 text-slate-600 leading-relaxed">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-3">1. Information We Collect</h2>
          <p>We collect information that you provide directly to us, such as when you create or modify your account, request support, or communicate with us. This may include your name, email address, phone number, and business details.</p>
        </div>
        
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-3">2. How We Use Your Information</h2>
          <p>We use the information we collect to provide, maintain, and improve our services, to process transactions, and to send you related information, including confirmations and invoices.</p>
        </div>
        
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-3">3. Information Sharing</h2>
          <p>We do not share your personal information with third parties except as described in this privacy policy, such as with vendors, consultants, and other service providers who need access to such information to carry out work on our behalf.</p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-3">4. Security</h2>
          <p>We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction.</p>
        </div>
      </div>
    </div>
  );
}
