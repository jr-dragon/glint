import { env } from "cloudflare:workers";
import {
	createStartHandler,
	defaultStreamHandler,
} from "@tanstack/react-start/server";
import { createServerEntry } from "@tanstack/react-start/server-entry";
import { verifyAccessJwt } from "#/lib/cf-access";

const startFetch = createStartHandler(defaultStreamHandler);

function isDev() {
	return import.meta.env.DEV;
}

export default createServerEntry({
	async fetch(...args) {
		const [request] = args;
		const url = new URL(request.url);

		if (url.pathname.startsWith("/api/files/")) {
			const key = url.pathname.slice("/api/files/".length);
			if (!key) return new Response("Not Found", { status: 404 });

			const object = await env.STORAGE.get(key);
			if (!object) return new Response("Not Found", { status: 404 });

			return new Response(object.body, {
				headers: {
					"Content-Type":
						object.httpMetadata?.contentType || "application/octet-stream",
					"Cache-Control": "public, max-age=31536000, immutable",
				},
			});
		}

		if (url.pathname.startsWith("/admin") && !isDev()) {
			const token = request.headers.get("Cf-Access-Jwt-Assertion");
			if (!token || !(await verifyAccessJwt(token))) {
				return new Response("Unauthorized", { status: 403 });
			}
		}

		return startFetch(...args);
	},
});
