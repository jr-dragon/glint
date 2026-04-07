import { env } from "cloudflare:workers";
import { PrismaD1 } from "@prisma/adapter-d1";
import { PrismaClient } from "#/generated/prisma/client";

export function createPrismaClient() {
	const adapter = new PrismaD1(env.DB);
	return new PrismaClient({ adapter });
}
