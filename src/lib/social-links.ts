import { env } from "cloudflare:workers";

export interface SocialLinks {
	facebook?: string;
	x?: string;
	github?: string;
}

export function getSocialLinks(): SocialLinks {
	const links: SocialLinks = {};
	if (env.LINKS_FACEBOOK) links.facebook = env.LINKS_FACEBOOK;
	if (env.LINKS_X) links.x = env.LINKS_X;
	if (env.LINKS_GITHUB) links.github = env.LINKS_GITHUB;
	return links;
}
