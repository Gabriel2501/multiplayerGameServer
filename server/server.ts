import server from "./app";
const port = 8080;

server.listen(port, () => {
  console.log(`Servidor iniciado na porta ${port}`);
});

