export const USER_SITE = {
  website: "https://kang-log.org/",
  author: "Jeonghoon",
  profile: "https://kang-log.org/about/",
  desc: "홈서버, Docker, 웹호스팅, 개발 기록을 모아두는 개인 기술 블로그",
  title: "Kang Log",
  postPerIndex: 4,
  postPerPage: 4,

  home: {
    title: "Kang Log",
    description: [
      "홈서버, Docker, 웹호스팅, 개발 기록을 모아두는 개인 기술 블로그입니다.",
      "공부 노트와 프로젝트 기록을 카테고리별로 정리합니다.",
    ],
    readMore: {
      text: "Read the blog posts or check",
      linkText: "README",
      href: "https://github.com/satnaing/astro-paper#readme",
    },
    socialLabel: "Social Links:",
    allPostsText: "All Posts",
  },
} as const;

export const USER_SOCIALS = [
  {
    name: "GitHub",
    enabled: true,
    href: "https://github.com/leokang123/",
  },
  {
    name: "X",
    enabled: false,
    href: "https://x.com/username",
  },
  {
    name: "LinkedIn",
    enabled: true,
    href: "https://www.linkedin.com/in/kang-jeonghoon-a625911bb/",
  },
  {
    name: "Mail",
    enabled: true,
    href: "mailto:leokang321@gmail.com",
  },
] as const;
