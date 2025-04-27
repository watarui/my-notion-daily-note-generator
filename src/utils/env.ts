export const getEnv = (key: string, defaultValue = ""): string => {
	return process.env[key] ?? defaultValue;
};

export const validateEnv = (requiredVars: string[]): void => {
	for (const key of requiredVars) {
		if (!process.env[key]) {
			throw new Error(`Missing environment variable: ${key}`);
		}
	}
};
