import { NODE_ENV } from "../config/env";

const isProduction = NODE_ENV === "production";

const formatMeta = (meta: unknown): string => {
  if (meta === undefined) return "";
  try {
    return typeof meta === "string" ? ` ${meta}` : ` ${JSON.stringify(meta)}`;
  } catch {
    return ` ${String(meta)}`;
  }
};

export const logInfo = (message: string, meta?: unknown): void => {
  console.info(`[info] ${message}${formatMeta(meta)}`);
};

export const logWarn = (message: string, meta?: unknown): void => {
  console.warn(`[warn] ${message}${formatMeta(meta)}`);
};

export const logError = (message: string, error?: unknown): void => {
  if (error instanceof Error) {
    console.error(
      `[error] ${message} - ${error.message}${error.stack ? `\n${error.stack}` : ""}`,
    );
  } else {
    console.error(`[error] ${message}${formatMeta(error)}`);
  }
  if (!isProduction && error && !(error instanceof Error)) {
    console.error(error);
  }
};
