export const structuredLog = (
	level: "info" | "error" | "warn",
	message: string,
	additionalInfo?: Record<string, unknown>,
	traceId?: string,
) => {
	console.log(
		JSON.stringify({
			traceId,
			timestamp: new Date().toISOString(),
			level,
			message,
			...(additionalInfo && { additionalInfo }),
		}),
	);
};
