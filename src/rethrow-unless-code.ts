export default function rethrowUnlessCode(maybeError: unknown, ...codes: Array<string>) {
  if (maybeError !== null && typeof maybeError === 'object') {
    const code = (maybeError as { code: any }).code;
    for (const allowed of codes) {
      if (code === allowed) {
        return;
      }
    }
  }

  throw maybeError;
}
