import type { Props } from "astro";
import IconMail from "@/assets/icons/IconMail.svg";
import IconGitHub from "@/assets/icons/IconGitHub.svg";
import IconBrandX from "@/assets/icons/IconBrandX.svg";
import IconLinkedin from "@/assets/icons/IconLinkedin.svg";
import IconWhatsapp from "@/assets/icons/IconWhatsapp.svg";
import IconFacebook from "@/assets/icons/IconFacebook.svg";
import IconTelegram from "@/assets/icons/IconTelegram.svg";
import IconPinterest from "@/assets/icons/IconPinterest.svg";
import { SITE } from "@/config";
import settings from "./user-settings.json";

interface Social {
  name: string;
  href: string;
  linkTitle: string;
  icon: (_props: Props) => Element;
}

const SOCIAL_ICONS = {
  GitHub: IconGitHub,
  X: IconBrandX,
  LinkedIn: IconLinkedin,
  Mail: IconMail,
} as const;

type SocialIconName = keyof typeof SOCIAL_ICONS;
type UserSocial = {
  name: SocialIconName;
  enabled: boolean;
  href: string;
};

const USER_SOCIALS = settings.USER_SOCIALS as UserSocial[];

const getSocialLinkTitle = (name: SocialIconName) =>
  name === "Mail" ? `Send an email to ${SITE.title}` : `${SITE.title} on ${name}`;

export const SOCIALS: Social[] = USER_SOCIALS.filter(
  social => social.enabled
).map(social => ({
  name: social.name,
  href: social.href,
  linkTitle: getSocialLinkTitle(social.name),
  icon: SOCIAL_ICONS[social.name],
}));

export const SHARE_LINKS: Social[] = [
  {
    name: "WhatsApp",
    href: "https://wa.me/?text=",
    linkTitle: `Share this post via WhatsApp`,
    icon: IconWhatsapp,
  },
  {
    name: "Facebook",
    href: "https://www.facebook.com/sharer.php?u=",
    linkTitle: `Share this post on Facebook`,
    icon: IconFacebook,
  },
  {
    name: "X",
    href: "https://x.com/intent/post?url=",
    linkTitle: `Share this post on X`,
    icon: IconBrandX,
  },
  {
    name: "Telegram",
    href: "https://t.me/share/url?url=",
    linkTitle: `Share this post via Telegram`,
    icon: IconTelegram,
  },
  {
    name: "Pinterest",
    href: "https://pinterest.com/pin/create/button/?url=",
    linkTitle: `Share this post on Pinterest`,
    icon: IconPinterest,
  },
  {
    name: "Mail",
    href: "mailto:?subject=See%20this%20post&body=",
    linkTitle: `Share this post via email`,
    icon: IconMail,
  },
] as const;
