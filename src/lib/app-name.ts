import { env } from "cloudflare:workers";

export function getAppName(): string {
	return env.APP_NAME || "Glint";
}
