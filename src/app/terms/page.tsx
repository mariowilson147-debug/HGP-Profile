export default function TermsPage() {
  return (
    <div className="w-full max-w-3xl mx-auto px-6 py-16 font-sans">
      <h1 className="text-4xl font-display font-bold text-slate-900 mb-8">Terms of Service</h1>
      
      <div className="space-y-8 text-slate-600 leading-relaxed">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-3">1. Acceptance of Terms</h2>
          <p>By accessing and using our catalog and services, you accept and agree to be bound by the terms and provision of this agreement.</p>
        </div>
        
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-3">2. Wholesale and Retail Pricing</h2>
          <p>Wholesale prices are strictly for approved business accounts. Retail pricing applies to all standard purchases. We reserve the right to modify prices at any time without prior notice.</p>
        </div>
        
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-3">3. Product Information</h2>
          <p>While we strive to provide accurate product information, we do not warrant that product descriptions or other content are accurate, complete, reliable, current, or error-free.</p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-3">4. Limitation of Liability</h2>
          <p>We shall not be liable for any direct, indirect, incidental, consequential or exemplary damages resulting from your use or inability to use the service.</p>
        </div>
      </div>
    </div>
  );
}
