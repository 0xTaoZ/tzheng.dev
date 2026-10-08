// The single schema.org identity referenced by every page. Keep these facts in
// line with the visible profile on the homepage and the About page.
export const person = {
  "@type": "Person",
  "@id": "https://tzheng.dev/#person",
  name: "Haitao Zheng",
  givenName: "Haitao",
  familyName: "Zheng",
  alternateName: ["郑海涛", "鄭海濤", "Tao Zheng", "0xTaoZ"],
  url: "https://tzheng.dev/",
  image: {
    "@type": "ImageObject",
    url: "https://tzheng.dev/img/portrait-720.jpg",
    width: 720,
    height: 900,
  },
  email: "mailto:h@tzheng.dev",
  description:
    "Cyber Security & Privacy student at Hochschule Bonn-Rhein-Sieg who builds small security tools and contributes fixes to open-source security and infrastructure projects.",
  jobTitle: "Cyber Security & Privacy student",
  affiliation: {
    "@type": "CollegeOrUniversity",
    name: "Hochschule Bonn-Rhein-Sieg",
    alternateName: "H-BRS",
    url: "https://www.h-brs.de/",
  },
  homeLocation: {
    "@type": "Place",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Bonn",
      addressCountry: "DE",
    },
  },
  knowsAbout: [
    "Cloud security",
    "AWS CloudTrail",
    "AWS CloudFormation",
    "Kubernetes security",
    "Linux",
    "SSH",
    "Infrastructure as code",
    "Log analysis",
    "Python",
    "Java",
    "C",
    "TypeScript",
  ],
  knowsLanguage: ["en", "de", "zh", "nan", "ja"],
  sameAs: [
    "https://github.com/0xTaoZ",
    "https://www.linkedin.com/in/haitaozheng/",
  ],
};
