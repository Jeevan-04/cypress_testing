pipeline {
  agent any

  // Runs once weekly (Sunday). Adjust cron expression as needed.
  triggers { cron('H H * * 1') }

  environment {
    CI = 'true'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Run Cypress Tests') {
      steps {
        script {
          // Use Cypress official included image to ensure Cypress and browsers are present.
          docker.image('cypress/included:15.15.0').inside {
            sh 'npm ci'
            sh 'npx cypress run --spec "cypress/e2e/spec.cy.js"'
          }
        }
      }
    }
  }

  post {
    always {
      // Archive screenshots and videos produced by Cypress
      archiveArtifacts artifacts: 'cypress/screenshots/**, cypress/videos/**', allowEmptyArchive: true
    }
    failure {
      echo 'Cypress tests failed'
    }
  }
}
