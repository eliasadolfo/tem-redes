import { useStore } from "../store";
import Connections from "../components/Connections";
import { supabase } from "../lib/supabase";
import { changePassword } from "../auth/changePassword";

/** Perfil y redes. Misma pantalla en escritorio y teléfono. */
export default function Profile() {
  const { actions } = useStore();
  return (
    <div className="pagina pagina--angosta">
      <div className="cabecera">
        <div className="cabecera__texto">
          <h1 className="tem-h1">Perfil</h1>
          <p className="tem-caption">Elías Adolfo · TEM</p>
        </div>
        <div className="fila">
          <button className="tem-btn tem-btn--secundario" onClick={() => void changePassword(actions.flash)}>Cambiar contraseña</button>
          <button className="tem-btn tem-btn--texto" onClick={() => void supabase?.auth.signOut()}>Salir</button>
        </div>
      </div>
      <Connections />
    </div>
  );
}
