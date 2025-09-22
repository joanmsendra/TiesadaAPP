import axios from 'axios';

// Asegúrate de que esta IP sea la de tu máquina si pruebas en un dispositivo físico.
// Para el emulador de Android, '10.0.2.2' suele funcionar.
// Para el emulador de iOS y pruebas en web, 'localhost' debería ser suficiente.
// --- ¡IMPORTANTE! ---
// REEMPLAZA '10.0.2.2' CON LA IP DE TU ORDENADOR SI USAS UN MÓVIL FÍSICO.
// Puedes encontrar tu IP ejecutando 'ipconfig' en la terminal de Windows.
const API_BASE_URL = 'https://server-enj6ntt0d-jmedinasendra-9103s-projects.vercel.app';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default client;
