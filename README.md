# Jenkins + Next.js CI/CD Demo

Esta es una demo simple de CI/CD usando Jenkins, Docker y una pagina Next.js.
La idea es mostrar el flujo completo:

1. Jenkins toma el codigo del proyecto.
2. Instala dependencias de Node.js.
3. Ejecuta una validacion con ESLint.
4. Construye la aplicacion Next.js.
5. Crea una imagen Docker.
6. Despliega la app localmente en un contenedor.

Al final, la aplicacion queda disponible en:

```text
http://localhost:3000
```

Y Jenkins queda disponible en:

```text
http://localhost:8080
```

## Herramientas Necesarias

Antes de empezar necesitas tener instalado:

- Docker Desktop o Docker Engine.
- Docker Compose.
- Git.
- Node.js, solo si quieres probar la app fuera de Docker.
- Un navegador para entrar a Jenkins.

En Windows, lo mas practico es usar Docker Desktop con el backend de Linux
habilitado.

## Estructura Del Proyecto

```text
jenkins-demo/
|-- app/
|   |-- globals.css
|   |-- layout.js
|   `-- page.js
|-- jenkins/
|   |-- Dockerfile
|   `-- plugins.txt
|-- public/
|   `-- .gitkeep
|-- Dockerfile
|-- Jenkinsfile
|-- docker-compose.yml
|-- eslint.config.mjs
|-- next.config.js
|-- package.json
|-- package-lock.json
`-- README.md
```

## Que Es Cada Archivo

### `app/page.js`

Es la pagina principal de Next.js. En esta demo solo muestra una pantalla
sencilla indicando que la app fue desplegada con Jenkins.

### `app/layout.js`

Define el layout base de la aplicacion Next.js. Aqui se configura el idioma de
la pagina y se cargan los estilos globales.

### `app/globals.css`

Contiene los estilos visuales de la pagina.

### `package.json`

Define el proyecto Node.js:

- Dependencias principales: `next`, `react`, `react-dom`.
- Scripts del proyecto:

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint ."
}
```

El pipeline de Jenkins usa principalmente:

```powershell
npm ci
npm run lint
npm run build
```

### `package-lock.json`

Guarda las versiones exactas de las dependencias. Es importante porque Jenkins
usa `npm ci`, y ese comando necesita este archivo para instalar de forma
reproducible.

### `next.config.js`

Configura Next.js con:

```js
output: "standalone"
```

Esto hace que la build de produccion sea mas facil de copiar dentro de una
imagen Docker liviana.

### `eslint.config.mjs`

Configura ESLint para validar el codigo. Jenkins lo ejecuta en la etapa
`Validar codigo`.

### `Dockerfile`

Este archivo crea la imagen Docker de la aplicacion Next.js.

Usa tres etapas:

1. `deps`: instala dependencias con `npm ci`.
2. `builder`: construye la app con `npm run build`.
3. `runner`: crea una imagen final mas limpia para ejecutar la app.

La imagen final expone el puerto `3000`.

### `Jenkinsfile`

Es el archivo mas importante del pipeline. Jenkins lo lee para saber que pasos
debe ejecutar.

Las etapas son:

```text
Instalar dependencias
Validar codigo
Construir Next.js
Crear imagen Docker
Desplegar demo local
```

En la ultima etapa Jenkins elimina cualquier contenedor anterior llamado
`nextjs-demo-app` y levanta uno nuevo:

```sh
docker rm -f nextjs-demo-app || true
docker run -d --name nextjs-demo-app -p 3000:3000 jenkins-nextjs-demo:${BUILD_NUMBER}
```

### `docker-compose.yml`

Levanta Jenkins dentro de Docker.

Este servicio:

- Construye una imagen personalizada desde `jenkins/Dockerfile`.
- Publica Jenkins en `http://localhost:8080`.
- Guarda el estado de Jenkins en `./jenkins_home`.
- Monta `/var/run/docker.sock` para que Jenkins pueda usar Docker.

La parte importante es:

```yaml
volumes:
  - ./jenkins_home:/var/jenkins_home
  - /var/run/docker.sock:/var/run/docker.sock
```

El primer volumen conserva la configuracion de Jenkins.
El segundo permite que Jenkins construya y ejecute contenedores en tu Docker
local.

### `jenkins/Dockerfile`

Crea una imagen personalizada de Jenkins.

Parte de:

```dockerfile
jenkins/jenkins:lts-jdk21
```

Luego instala:

- Docker CLI, para poder ejecutar comandos `docker` desde Jenkins.
- Plugins definidos en `jenkins/plugins.txt`.

### `jenkins/plugins.txt`

Lista los plugins que Jenkins instala al construir su imagen:

```text
blueocean
docker-workflow
git
workflow-aggregator
```

Estos plugins permiten usar pipelines, Git y pasos relacionados con Docker.

## Como Levantar Jenkins

Desde la carpeta del proyecto ejecuta:

```powershell
docker compose up -d --build
```

Esto construye la imagen personalizada de Jenkins y levanta el contenedor.

Puedes ver si esta corriendo con:

```powershell
docker ps
```

Jenkins deberia aparecer con el nombre:

```text
jenkins-server-nextjs-demo
```

## Entrar A Jenkins Por Primera Vez

Abre:

```text
http://localhost:8080
```

La primera vez Jenkins pedira una clave inicial. La obtienes con:

```powershell
docker exec jenkins-server-nextjs-demo cat /var/jenkins_home/secrets/initialAdminPassword
```

Luego:

1. Pega la clave en Jenkins.
2. Crea el usuario administrador.
3. Cuando pregunte por plugins, puedes continuar con los plugins sugeridos.
4. Finaliza la configuracion inicial.

Nota: el primer arranque puede tardar uno o dos minutos.

## Subir El Proyecto A Git

Para que Jenkins pueda leer el `Jenkinsfile`, lo normal es subir este proyecto a
un repositorio Git, por ejemplo GitHub.

Si todavia no inicializaste Git:

```powershell
git init
git add .
git commit -m "Add Jenkins Next.js demo"
```

Luego crea un repositorio en GitHub y conecta el remoto:

```powershell
git remote add origin https://github.com/TU_USUARIO/jenkins-demo.git
git branch -M main
git push -u origin main
```

Cambia `TU_USUARIO` por tu usuario real de GitHub.

## Crear El Pipeline En Jenkins

Dentro de Jenkins:

1. Haz clic en `New Item`.
2. Escribe un nombre, por ejemplo `nextjs-demo-pipeline`.
3. Selecciona `Pipeline`.
4. Haz clic en `OK`.
5. Baja hasta la seccion `Pipeline`.
6. En `Definition`, selecciona `Pipeline script from SCM`.
7. En `SCM`, selecciona `Git`.
8. En `Repository URL`, pega la URL de tu repositorio.
9. En `Branch Specifier`, usa:

```text
*/main
```

10. En `Script Path`, deja:

```text
Jenkinsfile
```

11. Guarda.
12. Haz clic en `Build Now`.

## Que Pasa Cuando Ejecutas El Pipeline

Cuando presionas `Build Now`, Jenkins ejecuta el `Jenkinsfile`.

### 1. Instalar Dependencias

Jenkins usa una imagen Docker de Node.js:

```text
node:20-alpine
```

Y ejecuta:

```sh
npm ci
```

Esto instala dependencias usando `package-lock.json`.

### 2. Validar Codigo

Ejecuta:

```sh
npm run lint
```

Esto corre ESLint para revisar errores o problemas de estilo.

### 3. Construir Next.js

Ejecuta:

```sh
npm run build
```

Esto genera la build de produccion de Next.js.

### 4. Crear Imagen Docker

Ejecuta:

```sh
docker build -t jenkins-nextjs-demo:${BUILD_NUMBER} .
```

`BUILD_NUMBER` es un numero que Jenkins asigna automaticamente a cada ejecucion.

### 5. Desplegar Demo Local

Jenkins levanta la app con:

```sh
docker run -d --name nextjs-demo-app -p 3000:3000 jenkins-nextjs-demo:${BUILD_NUMBER}
```

Luego puedes abrir:

```text
http://localhost:3000
```

## Probar La App Sin Jenkins

Si quieres probar la aplicacion directamente en tu maquina:

```powershell
npm install
npm run dev
```

Luego abre:

```text
http://localhost:3000
```

Tambien puedes probar la build de produccion:

```powershell
npm run build
npm start
```

## Probar La Imagen Docker De La App

Puedes construir la imagen manualmente:

```powershell
docker build -t jenkins-nextjs-demo:local .
```

Y correrla:

```powershell
docker run -d --name nextjs-demo-app -p 3000:3000 jenkins-nextjs-demo:local
```

Para detenerla:

```powershell
docker rm -f nextjs-demo-app
```

## Comandos Utiles

Ver logs de Jenkins:

```powershell
docker logs -f jenkins-server-nextjs-demo
```

Reiniciar Jenkins:

```powershell
docker compose restart
```

Detener Jenkins:

```powershell
docker compose down
```

Detener la app desplegada:

```powershell
docker rm -f nextjs-demo-app
```

Ver imagenes Docker creadas:

```powershell
docker images
```

Ver contenedores activos:

```powershell
docker ps
```

## Limpiar Todo

Para detener Jenkins:

```powershell
docker compose down
```

Para borrar tambien el estado local de Jenkins:

```powershell
Remove-Item -Recurse -Force .\jenkins_home
```

Para borrar la app desplegada:

```powershell
docker rm -f nextjs-demo-app
```

## Nota Importante Sobre Seguridad

Esta demo monta el Docker socket dentro del contenedor de Jenkins:

```yaml
- /var/run/docker.sock:/var/run/docker.sock
```

Eso es practico para aprender porque Jenkins puede crear imagenes y levantar
contenedores usando el Docker de tu maquina.

Pero en produccion no se recomienda hacerlo sin controles adicionales, porque
dar acceso al Docker socket equivale a dar permisos muy altos sobre el host.
Para un entorno real conviene usar agentes dedicados, credenciales administradas
y permisos mas restringidos.

## Resumen Rapido

Levantar Jenkins:

```powershell
docker compose up -d --build
```

Entrar a Jenkins:

```text
http://localhost:8080
```

Obtener la clave inicial:

```powershell
docker exec jenkins-server-nextjs-demo cat /var/jenkins_home/secrets/initialAdminPassword
```

Ejecutar el pipeline desde Jenkins con `Build Now`.

Ver la app desplegada:

```text
http://localhost:3000
```
