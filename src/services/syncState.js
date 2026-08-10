// Estado compartido en memoria del proceso: cuándo fue la última sync y si
// hay una corriendo. Lo consultan /api/ping, /api/stats y las propias
// rutas de sync. (Nota: en Vercel serverless cada invocación puede caer en
// una instancia distinta, así que esto no es un contador 100% confiable en
// ese entorno — ver recomendaciones en el informe final.)
let ultimaActualizacion = null;
let sincronizando = false;

module.exports = {
  getUltimaActualizacion: () => ultimaActualizacion,
  setUltimaActualizacion: (fecha) => {
    ultimaActualizacion = fecha;
  },
  isSincronizando: () => sincronizando,
  setSincronizando: (valor) => {
    sincronizando = valor;
  },
};
