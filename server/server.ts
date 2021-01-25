import App from "./app";
const port = 8080;

App.server.listen(port, () => {
  console.log(`Servidor iniciado na porta ${port}`);
});

