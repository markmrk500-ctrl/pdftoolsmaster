import { StaticPage } from "@/components/StaticPage";

const Terms = () => (
  <StaticPage
    title="Terms of Service — PDFMaster Tools"
    description="Terms of service for using PDFMaster Tools' free online PDF utilities."
  >
    <h1>Terms of Service</h1>
    <p><em>Last updated: {new Date().toLocaleDateString()}</em></p>

    <h2>Acceptance of Terms</h2>
    <p>
      By accessing and using PDFMaster Tools ("the service"), you agree to be bound by
      these Terms of Service. If you do not agree, please do not use the service.
    </p>

    <h2>Use of the Service</h2>
    <p>
      PDFMaster Tools is provided free of charge for personal and commercial use. You
      agree to use the service only for lawful purposes and not to upload content that
      is illegal, infringes intellectual property rights, or violates the rights of
      others.
    </p>

    <h2>No Warranty</h2>
    <p>
      The service is provided "as is" without warranty of any kind, express or implied.
      We do not guarantee that the service will be uninterrupted, error-free, or that
      processed files will be free of defects. Always keep backups of important
      documents.
    </p>

    <h2>Limitation of Liability</h2>
    <p>
      In no event shall PDFMaster Tools, its operators, or contributors be liable for
      any direct, indirect, incidental, consequential, or special damages arising from
      your use of the service, including but not limited to data loss, file corruption,
      or business interruption.
    </p>

    <h2>Intellectual Property</h2>
    <p>
      The PDFMaster Tools name, logo, design, and code are the property of their
      respective owners. You retain all rights to the files you process through the
      service.
    </p>

    <h2>Changes to Terms</h2>
    <p>
      We may update these terms periodically. Continued use of the service after changes
      are posted constitutes acceptance of the new terms.
    </p>

    <h2>Contact</h2>
    <p>
      For questions about these terms, please use our <a href="/contact">contact page</a>.
    </p>
  </StaticPage>
);

export default Terms;
