import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

/**
 * Genera el hash bcrypt de un PIN de staff.
 *
 * @param pin - PIN en claro (p. ej. 4 dígitos).
 * @returns Hash listo para guardar en `Staff.pinHash`.
 */
export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, SALT_ROUNDS);
}

/**
 * Compara un PIN en claro con el hash almacenado.
 *
 * @param pin - PIN introducido en el login.
 * @param pinHash - Hash de `Staff.pinHash`.
 * @returns `true` si coinciden.
 */
export async function verifyPin(
  pin: string,
  pinHash: string,
): Promise<boolean> {
  return bcrypt.compare(pin, pinHash);
}
