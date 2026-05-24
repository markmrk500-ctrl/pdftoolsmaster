import { StaticPage } from "@/components/StaticPage";

const Privacy = () => (
  <StaticPage
    title="Privacy Policy — PDFMaster Tools"
    description="PDFMaster Tools privacy policy. Learn how we handle your data, files, and analytics."
  >
    <h1>Privacy Policy</h1>
    <p><em>Last updated: {new Date().toLocaleDateString()}</em></p>

    <h2>Files You Process</h2>
    <p>
      All PDF processing on PDFMaster Tools happens locally in your web browser. Your
      files are <strong>never uploaded to our servers</strong>, never logged, and never
      stored. They exist only in your browser's memory and are discarded when you close
      the tab or navigate away.
    </p>

    <h2>Information We Collect</h2>
    <p>
      We use Google Analytics to understand which tools are popular and how visitors
      navigate the site. This collects anonymized data including pages visited,
      approximate location (country level), browser type, and referring sites. We do not
      collect personally identifiable information.
    </p>

    <h2>Cookies</h2>
    <p>
      PDFMaster Tools uses cookies for analytics and to remember your preferences (e.g.,
      dark mode). Third-party services like Google AdSense may set additional cookies
      for advertising purposes.
    </p>

    <h2>Advertising</h2>
    <p>
      We display advertisements through Google AdSense to keep PDFMaster Tools free.
      Google may use cookies to serve ads based on your prior visits to this and other
      websites. You can opt out of personalized advertising by visiting{" "}
      <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">
        Google Ads Settings
      </a>.
    </p>

    <h2>Third-Party Services</h2>
    <ul>
      <li>Google Analytics — anonymous usage statistics</li>
      <li>Google AdSense — advertising</li>
    </ul>

    <h2>Your Rights</h2>
    <p>
      Since we don't collect personal data, there's nothing for us to delete on request.
      For analytics opt-out, install the{" "}
      <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">
        Google Analytics Opt-out Browser Add-on
      </a>.
    </p>

    <h2>Contact</h2>
    <p>
      Questions about this policy? Reach us via the <a href="/contact">contact page</a>.
    </p>
  </StaticPage>
);

export default Privacy;
