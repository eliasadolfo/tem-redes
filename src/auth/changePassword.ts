import { supabase } from "../lib/supabase";

/** Pide una contraseña nueva y la guarda en Supabase Auth. */
export async function changePassword(flash: (msg: string) => void): Promise<void> {
  if (!supabase) return;
  const pw = window.prompt("Nueva contraseña (mínimo 8 caracteres):");
  if (pw === null) return;
  if (pw.length < 8) {
    flash("Mínimo 8 caracteres");
    return;
  }
  const { error } = await supabase.auth.updateUser({ password: pw });
  flash(error ? "No pude cambiar la contraseña" : "Contraseña actualizada");
}
