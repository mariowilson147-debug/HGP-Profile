import React from "react";
import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm p-8 md:p-16 border border-slate-100 text-slate-700">
        
        <div className="mb-12 border-b border-slate-200 pb-8">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900 mb-4">
            Privacy Policy for Prutam Enterprise Ltd
          </h1>
          <div className="text-sm text-slate-500 flex flex-col gap-1">
            <span><strong>Effective Date:</strong> May 10, 2026</span>
            <span><strong>Last Updated:</strong> May 10, 2026</span>
          </div>
        </div>

        <div className="space-y-10 leading-relaxed">
          <section>
            <p className="mb-4">
              This Privacy Policy explains how <strong>Prutam Enterprise Ltd</strong>, owned and operated by MADEE HUB (“Prutam,” “MADEE HUB,” “we,” “our,” or “us”), collects, processes, stores, protects, discloses, and uses information obtained through our catalogue website, digital platforms, communication systems, software, applications, and related services (collectively, the “Platform”).
            </p>
            <p>
              By accessing or using the Platform, you acknowledge that you have read, understood, and agreed to this Privacy Policy and consent to the practices described herein. If you do not agree with this Policy, you must immediately discontinue use of the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">1. INFORMATION WE COLLECT</h2>
            <p className="mb-4">We may collect and process the following categories of information:</p>

            <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-3">a. Personal Information</h3>
            <p className="mb-2">Including but not limited to:</p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>Full names</li>
              <li>Email addresses</li>
              <li>Phone numbers</li>
              <li>Business details</li>
              <li>Delivery addresses</li>
              <li>Billing information</li>
              <li>Communication records</li>
              <li>Account credentials</li>
              <li>Inquiry submissions</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-800 mt-8 mb-3">b. Technical & Device Information</h3>
            <p className="mb-2">Automatically collected information may include:</p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>IP addresses</li>
              <li>Device identifiers</li>
              <li>Browser type</li>
              <li>Operating system</li>
              <li>Device configuration</li>
              <li>Session information</li>
              <li>Access timestamps</li>
              <li>Clickstream activity</li>
              <li>Referral URLs</li>
              <li>Network information</li>
              <li>Diagnostic logs</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-800 mt-8 mb-3">c. Commercial & Catalogue Activity</h3>
            <p className="mb-2">We may collect information relating to:</p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>Product searches</li>
              <li>Catalogue interactions</li>
              <li>Saved items</li>
              <li>Purchase interests</li>
              <li>Viewing patterns</li>
              <li>Inventory inquiries</li>
              <li>User preferences</li>
              <li>Commercial interactions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">2. HOW WE COLLECT INFORMATION</h2>
            <p className="mb-2">Information may be collected through:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Website forms</li>
              <li>User submissions</li>
              <li>Cookies</li>
              <li>Analytics tools</li>
              <li>Tracking technologies</li>
              <li>Communication channels</li>
              <li>Third-party integrations</li>
              <li>Automated systems</li>
              <li>Security monitoring systems</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">3. HOW WE USE INFORMATION</h2>
            <p className="mb-2">We may use collected information for purposes including:</p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>Operating and maintaining the Platform;</li>
              <li>Managing catalogue systems;</li>
              <li>Processing inquiries and transactions;</li>
              <li>Customer support;</li>
              <li>Security monitoring;</li>
              <li>Fraud detection and prevention;</li>
              <li>Analytics and business intelligence;</li>
              <li>Service optimization;</li>
              <li>Legal compliance;</li>
              <li>Marketing communications;</li>
              <li>Platform personalization;</li>
              <li>Internal operational purposes;</li>
              <li>Enforcement of our Terms of Service.</li>
            </ul>
            <p>
              We reserve the right to aggregate and anonymize non-identifiable data for lawful commercial, statistical, analytical, and operational purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">4. COOKIES & TRACKING TECHNOLOGIES</h2>
            <p className="mb-2">The Platform may use:</p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>Cookies</li>
              <li>Pixels</li>
              <li>Local storage</li>
              <li>Session identifiers</li>
              <li>Analytics technologies</li>
              <li>Tracking scripts</li>
              <li>Security monitoring tools</li>
            </ul>
            <p className="mb-2">These technologies help us:</p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>Improve user experience;</li>
              <li>Analyze traffic;</li>
              <li>Maintain security;</li>
              <li>Personalize content;</li>
              <li>Monitor performance.</li>
            </ul>
            <p>
              Users may disable cookies through browser settings, though portions of the Platform may become limited or unavailable.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">5. SHARING & DISCLOSURE OF INFORMATION</h2>
            <p className="mb-2">We do not unlawfully sell personal information. However, we may disclose information:</p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>To service providers;</li>
              <li>To cloud hosting partners;</li>
              <li>To analytics providers;</li>
              <li>To payment processors;</li>
              <li>To logistics or operational partners;</li>
              <li>To legal authorities;</li>
              <li>To regulators;</li>
              <li>To law enforcement agencies;</li>
              <li>To cybersecurity investigators;</li>
              <li>During mergers, acquisitions, restructuring, or asset transfers.</li>
            </ul>
            <p className="mb-2">Disclosure may occur where:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Required by law;</li>
              <li>Necessary for security;</li>
              <li>Necessary to enforce our rights;</li>
              <li>Necessary to protect users or operations.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">6. DATA RETENTION</h2>
            <p className="mb-2">We retain information for as long as reasonably necessary to:</p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>Operate the Platform;</li>
              <li>Fulfill contractual obligations;</li>
              <li>Resolve disputes;</li>
              <li>Enforce agreements;</li>
              <li>Maintain security logs;</li>
              <li>Comply with legal obligations;</li>
              <li>Conduct audits and investigations.</li>
            </ul>
            <p>Archived or backup copies may remain for additional periods where legally or operationally necessary.</p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">7. SECURITY MEASURES</h2>
            <p className="mb-2">We implement commercially reasonable technical, administrative, and organizational safeguards designed to protect information against:</p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>Unauthorized access;</li>
              <li>Loss;</li>
              <li>Theft;</li>
              <li>Disclosure;</li>
              <li>Misuse;</li>
              <li>Alteration;</li>
              <li>Destruction.</li>
            </ul>
            <p className="mb-4">However, no digital transmission or storage system is completely secure.</p>
            <p>Users acknowledge and accept all risks associated with internet-based communications and electronic storage systems.</p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">8. USER RESPONSIBILITIES</h2>
            <p className="mb-2">Users are responsible for:</p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>Maintaining account confidentiality;</li>
              <li>Protecting passwords and credentials;</li>
              <li>Preventing unauthorized access;</li>
              <li>Providing accurate information;</li>
              <li>Using the Platform lawfully.</li>
            </ul>
            <p>Any misuse of the Platform may result in suspension, restriction, or legal action.</p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">9. THIRD-PARTY SERVICES</h2>
            <p className="mb-4">The Platform may contain links or integrations to third-party websites, tools, or services.</p>
            <p className="mb-2">We are not responsible for:</p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>Third-party privacy practices;</li>
              <li>External content;</li>
              <li>External security standards;</li>
              <li>Third-party data handling practices.</li>
            </ul>
            <p>Users access third-party services entirely at their own risk.</p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">10. CHILDREN’S PRIVACY</h2>
            <p className="mb-4">The Platform is not intended for individuals below the age permitted under applicable law to lawfully consent to digital services.</p>
            <p className="mb-4">We do not knowingly collect personal information from minors without lawful authorization.</p>
            <p>If unauthorized minor information is discovered, we reserve the right to remove it immediately.</p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">11. INTELLECTUAL PROPERTY & DATABASE PROTECTION</h2>
            <p className="mb-4">All Platform systems, catalogue structures, databases, inventory logic, layouts, designs, business workflows, source code, and proprietary digital assets remain the exclusive intellectual property of Prutam Enterprise Ltd and/or MADEE HUB.</p>
            <p className="mb-2">Unauthorized:</p>
            <ul className="list-disc pl-6 mb-6 space-y-1">
              <li>Scraping,</li>
              <li>Replication,</li>
              <li>Extraction,</li>
              <li>Mirroring,</li>
              <li>Resale,</li>
              <li>Redistribution,</li>
              <li>Reverse engineering,</li>
              <li>Commercial exploitation</li>
            </ul>
            <p className="mb-6">of any Platform data or systems is strictly prohibited.</p>
            <div className="bg-blue-50 text-blue-800 p-4 rounded-lg flex gap-3 items-start border border-blue-100">
              <span className="text-xl">⚙️</span>
              <p className="mt-0.5">The visible catalogue is only the storefront. The architecture underneath is protected property.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">12. USER RIGHTS</h2>
            <p className="mb-2">Subject to applicable law, users may request:</p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>Access to their information;</li>
              <li>Correction of inaccurate information;</li>
              <li>Deletion of eligible information;</li>
              <li>Restriction of certain processing activities;</li>
              <li>Withdrawal of consent where applicable.</li>
            </ul>
            <p>We reserve the right to verify identity before processing requests.</p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">13. LIMITATION OF LIABILITY</h2>
            <p className="mb-2">To the fullest extent permitted by law:</p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>The Platform is provided “AS IS” and “AS AVAILABLE.”</li>
              <li>We disclaim all warranties, express or implied.</li>
              <li>We do not guarantee uninterrupted or error-free service.</li>
              <li>We are not liable for indirect, incidental, consequential, punitive, or special damages arising from Platform usage.</li>
            </ul>
            <p>Users access and use the Platform entirely at their own risk.</p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">14. GOVERNING LAW</h2>
            <p className="mb-4">This Privacy Policy shall be governed by the laws of the Republic of Kenya.</p>
            <p className="mb-4">Any disputes relating to privacy matters shall fall under the jurisdiction of Kenyan courts.</p>
            <p>This Policy is intended to align with the framework of the Office of the Data Protection Commissioner and applicable Kenyan data protection laws.</p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">15. CHANGES TO THIS PRIVACY POLICY</h2>
            <p className="mb-2">We reserve the unrestricted right to:</p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>Modify,</li>
              <li>Amend,</li>
              <li>Expand,</li>
              <li>Replace,</li>
              <li>Remove,</li>
              <li>Update</li>
            </ul>
            <p className="mb-4">this Privacy Policy at any time.</p>
            <p className="mb-4">Updated versions become effective immediately upon publication unless otherwise stated.</p>
            <p>Continued use of the Platform constitutes acceptance of revised policies.</p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">16. CONTACT INFORMATION</h2>
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <p className="font-semibold text-slate-900 mb-2">Prutam Enterprise Ltd</p>
              <p className="mb-4">Owned & Operated by MADEE HUB</p>
              <div className="flex flex-col gap-2">
                <p><strong>Email:</strong> <a href="mailto:madeeprojects@gmail.com" className="text-blue-600 hover:underline">madeeprojects@gmail.com</a></p>
              </div>
            </div>
          </section>

          <section className="pt-8">
            <h2 className="text-2xl font-display font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">17. FINAL ACKNOWLEDGMENT</h2>
            <p className="mb-2">By accessing or using the Platform, you acknowledge that you:</p>
            <ul className="list-disc pl-6 mb-8 space-y-1">
              <li>Have read this Privacy Policy;</li>
              <li>Understand its contents;</li>
              <li>Consent to its terms;</li>
              <li>Agree to be legally bound by it to the fullest extent permitted under applicable law.</li>
            </ul>
            
            <div className="bg-slate-900 text-white p-6 rounded-xl text-center shadow-lg">
              <span className="text-2xl mb-3 block">🛡️</span>
              <p className="font-medium">Data is currency in the digital world. This Policy is the vault door, the alarm system, and the guard tower rolled into one.</p>
            </div>
          </section>
        </div>
        
        <div className="mt-12 text-center">
          <Link href="/" className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors">
            Return to Catalogue
          </Link>
        </div>

      </div>
    </div>
  );
}
