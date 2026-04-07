import { env } from "cloudflare:workers";
import { createRemoteJWKSet, jwtVerify } from "jose";

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJWKS() {
	if (!jwks) {
		const certsUrl = new URL(
			`https://${env.CF_ACCESS_TEAM_DOMAIN}.cloudflareaccess.com/cdn-cgi/access/certs`,
		);
		jwks = createRemoteJWKSet(certsUrl);
	}
	return jwks;
}

export async function verifyAccessJwt(token: string): Promise<boolean> {
	try {
		const issuer = `https://${env.CF_ACCESS_TEAM_DOMAIN}.cloudflareaccess.com`;
		const audience = env.CF_ACCESS_POLICY_AUD;
		await jwtVerify(token, getJWKS(), { issuer, audience });
		return true;
	} catch {
		return false;
	}
}
