export const APP_NAME = 'The Scene'

/**
 * Where "Report a problem" notes go by email, in addition to the reports table
 * when accounts are on. Leave empty to skip email.
 */
export const SUPPORT_EMAIL = (import.meta.env.VITE_SUPPORT_EMAIL as string | undefined) ?? ''
