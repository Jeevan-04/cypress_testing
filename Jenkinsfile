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
        sh 'npm ci'
        sh 'npx cypress run --spec "cypress/e2e/spec.cy.js"'
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
