pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '20', artifactNumToKeepStr: '20'))
    }

    triggers {
        // Poll repository changes every 2 minutes (use Jenkins UI if you prefer a different schedule).
        pollSCM('H/2 * * * *')
    }

    parameters {
        string(
            name: 'REPO_URL',
                defaultValue: ' https://github.com/JaisonJecinthVincent/SimpleWebTerminal.git',
                description: 'Git repository URL.'
        )
        string(
            name: 'BRANCH_SPEC',
            defaultValue: '*/master',
            description: 'Branch spec used for checkout (for example */master or */main).'
        )
        string(
                name: 'GIT_CREDENTIALS_ID',
                defaultValue: 'github-token',
                description: 'Jenkins credentials ID for GitHub authentication.'
        )
        string(
            name: 'DOCKER_IMAGE_NAME',
            defaultValue: 'info-web-terminal',
            description: 'Docker image name used for build and run.'
        )
        string(
            name: 'DOCKER_CONTAINER_NAME',
            defaultValue: 'info-web-terminal',
            description: 'Container name used during deployment.'
        )
        string(
            name: 'DOCKER_HOST_PORT',
            defaultValue: '8080',
            description: 'Host port mapped to container port 80.'
        )
    }

    stages {
        stage('Checkout') {
            steps {
                script {
                    def checkoutCompleted = false

                    try {
                        checkout scm
                        checkoutCompleted = true
                        echo 'Checkout complete using SCM context.'
                    } catch (Exception ex) {
                        echo 'checkout scm is unavailable for this job type. Using explicit Git checkout fallback.'
                    }

                    if (!checkoutCompleted) {
                        def repoUrl = params.REPO_URL?.trim()
                        def branchSpec = params.BRANCH_SPEC?.trim() ? params.BRANCH_SPEC.trim() : '*/master'
                        def credentialsId = params.GIT_CREDENTIALS_ID?.trim() ?: 'github-token'

                        if (!repoUrl) {
                            error('REPO_URL is required when this job runs as inline Pipeline script.')
                        }

                        echo "Checking out repository: ${repoUrl} (branch: ${branchSpec}) with credentials: ${credentialsId}"
                        
                        
                        withCredentials([usernamePassword(credentialsId: credentialsId, usernameVariable: 'GIT_USER', passwordVariable: 'GIT_PASS')]) {
                            // Inject credentials into git URL for authentication
                            def authUrl = repoUrl.replaceFirst('https://', "https://${GIT_USER}:${GIT_PASS}@")
                            
                            checkout([
                                $class: 'GitSCM',
                                branches: [[name: branchSpec]],
                                doGenerateSubmoduleConfigurations: false,
                                extensions: [[$class: 'CloneOption', noTags: false, reference: '', shallow: false]],
                                userRemoteConfigs: [[url: authUrl]]
                            ])
                        }

                        echo "Checkout complete from ${repoUrl} (${branchSpec})."
                    }
                }
            }
        }

        stage('Validate static files') {
            steps {
                script {
                    def requiredFiles = [
                        'index.html',
                        'assets/css/style.css',
                        'assets/js/script.js'
                    ]

                    def missingFiles = requiredFiles.findAll { !fileExists(it) }
                    if (!missingFiles.isEmpty()) {
                        error("Missing required files: ${missingFiles.join(', ')}")
                    }
                }
            }
        }

        stage('Generate build metadata') {
            steps {
                script {
                    def builtAt = new Date().format("yyyy-MM-dd'T'HH:mm:ss'Z'", TimeZone.getTimeZone('UTC'))
                    def version = env.BUILD_NUMBER ?: 'dev'

                    writeFile(
                        file: 'version.json',
                        text: "{\n  \"version\": \"${version}\",\n  \"builtAt\": \"${builtAt}\"\n}\n"
                    )

                    echo "Build metadata generated. version=${version}, builtAt=${builtAt}"
                }
            }
        }

        stage('Archive artifacts') {
            steps {
                archiveArtifacts artifacts: 'index.html,assets/**,README.md,version.json,Dockerfile,.dockerignore,nginx.conf', fingerprint: true
            }
        }

        stage('Build Docker image') {
            steps {
                script {
                    def imageName = params.DOCKER_IMAGE_NAME?.trim() ?: 'info-web-terminal'

                    if (isUnix()) {
                        sh 'docker --version'
                        sh "docker build --pull --no-cache -t ${imageName}:latest ."
                    } else {
                        withEnv(["IMAGE_NAME=${imageName}"]) {
                            powershell '''
                                $ErrorActionPreference = "Stop"
                                if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
                                    throw "Docker CLI not found on Jenkins agent."
                                }

                                $imageTag = "$($env:IMAGE_NAME):latest"
                                docker version
                                docker build --pull --no-cache -t $imageTag .
                            '''
                        }
                    }
                }
            }
        }

        stage('Deploy Docker container') {
            steps {
                script {
                    def imageName = params.DOCKER_IMAGE_NAME?.trim() ?: 'info-web-terminal'
                    def containerName = params.DOCKER_CONTAINER_NAME?.trim() ?: 'info-web-terminal'
                    def hostPort = params.DOCKER_HOST_PORT?.trim() ?: '8080'

                    if (!(hostPort ==~ /^[0-9]{2,5}$/)) {
                        error('DOCKER_HOST_PORT must be a numeric port value (for example 8081).')
                    }

                    if (isUnix()) {
                        withEnv([
                            "IMAGE_NAME=${imageName}",
                            "CONTAINER_NAME=${containerName}",
                            "HOST_PORT=${hostPort}"
                        ]) {
                            sh '''
                                set -eu

                                if ! command -v docker >/dev/null 2>&1; then
                                    echo "Docker CLI not found on Jenkins agent."
                                    exit 1
                                fi

                                existing_container=$(docker ps -a --filter "name=^/${CONTAINER_NAME}$" --format "{{.Names}}")
                                if [ -n "$existing_container" ]; then
                                    docker rm -f "$CONTAINER_NAME"
                                fi

                                docker run -d \
                                    --name "$CONTAINER_NAME" \
                                    -p "$HOST_PORT:80" \
                                    --restart unless-stopped \
                                    "$IMAGE_NAME:latest"
                            '''
                        }
                    } else {
                        withEnv([
                            "IMAGE_NAME=${imageName}",
                            "CONTAINER_NAME=${containerName}",
                            "HOST_PORT=${hostPort}"
                        ]) {
                            powershell '''
                                $ErrorActionPreference = "Stop"

                                if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
                                    throw "Docker CLI not found on Jenkins agent."
                                }

                                $existingContainer = docker ps -a --filter "name=^/$env:CONTAINER_NAME$" --format "{{.Names}}"
                                if ($existingContainer) {
                                    docker rm -f $env:CONTAINER_NAME | Out-Null
                                }

                                $imageTag = "$($env:IMAGE_NAME):latest"
                                $portMapping = "$($env:HOST_PORT):80"
                                docker run -d --name $env:CONTAINER_NAME -p $portMapping --restart unless-stopped $imageTag | Out-Null
                                Write-Host "Container deployed at http://localhost:$env:HOST_PORT"
                            '''
                        }
                    }
                }
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully.'
        }
        failure {
            echo 'Pipeline failed. Check stage logs for details.'
        }
        always {
            cleanWs(deleteDirs: true, disableDeferredWipeout: true)
        }
    }
}
