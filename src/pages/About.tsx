import { StaticPage } from "@/components/StaticPage";

const About = () => (
  <StaticPage
    title="About PDFMaster Tools — Free Browser-Based PDF Utilities"
    description="Learn about PDFMaster Tools, a free privacy-first PDF toolkit that runs entirely in your browser."
  >
    <h1>About PDFMaster Tools</h1>
    <p>
      PDFMaster Tools is a free, privacy-first suite of online PDF utilities. Our mission
      is to make working with PDFs effortless without forcing you to install software,
      create accounts, or upload sensitive documents to remote servers.
    </p>
    <h2>Our Philosophy</h2>
    <p>
      We believe powerful tools should be accessible to everyone. Every feature on
      PDFMaster is 100% free — no premium tiers, no watermarks, no usage limits hidden
      behind paywalls. We're funded entirely through unobtrusive advertising so we can
      keep the tools free for students, freelancers, small businesses, and anyone else
      who needs them.
    </p>
    <h2>Privacy by Design</h2>
    <p>
      Unlike most online PDF tools, PDFMaster processes your files entirely in your
      browser using JavaScript and WebAssembly. Your PDFs never travel over the
      internet, never touch our servers, and disappear from memory the moment you close
      the tab. This isn't just a privacy promise — it's a technical guarantee enforced
      by the architecture itself.
    </p>
    <h2>What's Next</h2>
    <p>
      We're actively expanding the toolkit. Planned tools include rotate PDF, watermark
      PDF, PDF to JPG, JPG to PDF, sign PDF, and many more. If you have a feature
      request, head over to our <a href="/contact">contact page</a> and let us know.
    </p>
  </StaticPage>
);

export default About;
