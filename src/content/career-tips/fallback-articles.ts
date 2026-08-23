import { Article } from "@/types/chat";

/** Shown when Firestore articles are unavailable or the collection is empty. */
export const FALLBACK_CAREER_ARTICLES: Article[] = [
  {
    id: "craft-a-resume",
    title: "Craft a Resume That Gets Interviews",
    subtitle: "Make your first impression count with a clean, targeted resume.",
    image: "https://images.unsplash.com/photo-1584697964356-fbd6efecde37?auto=format&fit=crop&w=1200&q=80",
    author: "Signet Employment Hub",
    tags: ["resume", "career", "advice"],
    featured: true,
    content:
      "A great resume is concise and tailored. Focus on measurable impact, use a strong summary, and remove irrelevant experience.\n\nLead with outcomes, not duties. Hiring managers scan quickly — use clear headings, consistent formatting, and keywords from the job description.\n\nKeep it to one or two pages, proofread carefully, and save as PDF before applying through Signet.",
  },
  {
    id: "ace-your-interview",
    title: "Ace Your Next Interview",
    subtitle: "Preparation techniques hiring managers actually notice.",
    image: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=1200&q=80",
    author: "Signet Employment Hub",
    tags: ["interview", "preparation"],
    featured: true,
    content:
      "Interviews are your chance to show how you think and collaborate. Research the company, prepare STAR-format stories, and practice answers out loud.\n\nPrepare thoughtful questions for the interviewer and follow up with a brief thank-you note within 24 hours.\n\nConfidence comes from preparation — map your experience to the role before you walk in.",
  },
  {
    id: "negotiate-salary",
    title: "Negotiate Salary with Confidence",
    subtitle: "Get the compensation you deserve — without awkwardness.",
    image: "https://images.unsplash.com/photo-1542744173-05336fcc7ad4?auto=format&fit=crop&w=1200&q=80",
    author: "Signet Employment Hub",
    tags: ["salary", "negotiation"],
    featured: false,
    content:
      "Negotiation is a normal part of hiring. Research market rates for your role and location, then anchor your request with evidence from your experience.\n\nDiscuss total compensation — base, bonuses, leave, and flexibility — not just headline salary.\n\nStay professional and collaborative; the goal is a package that works for both sides.",
  },
  {
    id: "remote-productivity",
    title: "Remote Work: Staying Productive & Connected",
    subtitle: "Best practices for high-output remote teams.",
    image: "https://images.unsplash.com/photo-1593642634315-48f5414c3ad9?auto=format&fit=crop&w=1200&q=80",
    author: "Signet Employment Hub",
    tags: ["remote", "productivity"],
    featured: false,
    content:
      "Remote work rewards structure. Set a dedicated workspace, block focus time, and over-communicate progress with your team.\n\nUse async updates for status and reserve meetings for decisions that need real-time discussion.\n\nProtect boundaries — clear start and end times help you stay productive without burning out.",
  },
  {
    id: "networking-for-jobs",
    title: "Networking That Leads to Jobs",
    subtitle: "Build real connections without awkwardness.",
    image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&q=80",
    author: "Signet Employment Hub",
    tags: ["networking", "jobs"],
    featured: false,
    content:
      "Networking is about genuine curiosity, not asking for favours on day one. Start with people in roles or companies you admire.\n\nShare what you are learning, offer help where you can, and follow up when someone gives you time.\n\nMany opportunities come through warm introductions — keep your Signet profile up to date so contacts know what you are looking for.",
  },
  {
    id: "tech-skills-2025",
    title: "Tech Skills That Matter in 2025",
    subtitle: "Focus on skills employers actually ask for this year.",
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80",
    author: "Signet Employment Hub",
    tags: ["skills", "tech"],
    featured: true,
    content:
      "Employers continue to value cloud fundamentals, data literacy, and the ability to work with modern AI-assisted workflows.\n\nPick one primary stack to go deep on, then broaden with adjacent skills that appear repeatedly in job posts you save on Signet.\n\nBuild small portfolio projects that show problem-solving, not just tutorial completion.",
  },
];

export function getFallbackArticleById(id: string): Article | null {
  return FALLBACK_CAREER_ARTICLES.find((a) => a.id === id) || null;
}
