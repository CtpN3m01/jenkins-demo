pipeline {
  agent any

  environment {
    APP_NAME = "jenkins-nextjs-demo"
    IMAGE_NAME = "jenkins-nextjs-demo:${BUILD_NUMBER}"
    CONTAINER_NAME = "nextjs-demo-app"
    APP_PORT = "3000"
  }

  stages {
    stage("Instalar dependencias") {
      agent {
        docker {
          image "node:20-alpine"
          reuseNode true
        }
      }
      steps {
        sh "npm ci"
      }
    }

    stage("Validar codigo") {
      agent {
        docker {
          image "node:20-alpine"
          reuseNode true
        }
      }
      steps {
        sh "npm run lint"
      }
    }

    stage("Construir Next.js") {
      agent {
        docker {
          image "node:20-alpine"
          reuseNode true
        }
      }
      steps {
        sh "npm run build"
      }
    }

    stage("Crear imagen Docker") {
      steps {
        sh "docker build -t ${IMAGE_NAME} ."
      }
    }

    stage("Desplegar demo local") {
      steps {
        sh "docker rm -f ${CONTAINER_NAME} || true"
        sh "docker run -d --name ${CONTAINER_NAME} -p ${APP_PORT}:3000 ${IMAGE_NAME}"
      }
    }
  }

  post {
    success {
      echo "Demo desplegada en http://localhost:${APP_PORT}"
    }
    always {
      sh "docker image prune -f || true"
    }
  }
}
