try {
  const ProductAdvertisingAPIv1 = require('paapi5-nodejs-sdk');
  console.log("SDK Importado com sucesso!");
  
  const client = ProductAdvertisingAPIv1.ApiClient.instance;
  console.log("ApiClient instanciado.");
  
  const api = new ProductAdvertisingAPIv1.DefaultApi();
  console.log("DefaultApi instanciada.");
  
  // Verifica se searchItems retorna uma Promise ou aceita callbacks
  console.log("searchItems é do tipo:", typeof api.searchItems);
  
  // Inspecionamos a função convertendo para string se possível ou vendo os argumentos esperados
  console.log("searchItems toString:", api.searchItems.toString().slice(0, 200));

} catch (e) {
  console.error("Erro ao inspecionar:", e);
}
