export default async function handler(request, response) {
  // Configura os cabeçalhos para evitar problemas de CORS
  response.setHeader('Access-Control-Allow-Credentials', true)
  response.setHeader('Access-Control-Allow-Origin', '*')
  
  if (request.method === 'POST') {
    const { email, password } = request.body;

    // 1. AQUI você fará a conexão com o seu banco de dados na nuvem
    // 2. AQUI você valida se o utilizador existe
    
    // Exemplo de resposta de sucesso:
    if (email === "teste@email.com" && password === "123456") {
      return response.status(200).json({ success: true, message: "Login feito com sucesso!" });
    } else {
      return response.status(401).json({ success: false, message: "Credenciais inválidas." });
    }
  }

  return response.status(405).json({ message: "Método não permitido" });
}